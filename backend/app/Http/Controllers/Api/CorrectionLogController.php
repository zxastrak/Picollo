<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CorrectionLog;
use App\Models\Transaction;
use App\Models\HashVerification;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CorrectionLogController extends Controller
{
    // Field yang boleh diubah lewat koreksi edit
    private const ALLOWED_EDIT_FIELDS = ['catatan', 'metode_pembayaran', 'payment_reference'];

    // GET semua log koreksi
    public function index(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $query = CorrectionLog::whereHas('transaction', fn($q) =>
            $q->whereIn('outlet_id', $outletIds)
        )
        ->with(['transaction:id,transaction_code', 'correctedBy:id,name', 'outlet:id,nama'])
        ->orderByDesc('created_at');

        // Filter tanggal
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
        } elseif ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->query('all') === 'true') {
            return response()->json(['success' => true, 'data' => $query->get()]);
        }

        return response()->json(['success' => true, 'data' => $query->paginate(15)]);
    }

    // POST buat koreksi baru (Edit atau Void atau Edit Items)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id'    => 'required|integer|exists:transactions,id',
            'alasan'            => 'required|string',
            'correction_type'   => 'required|in:edit,void,edit_items',
            'metode_pembayaran' => 'nullable|string|in:qris,tunai,transfer',
            'new_data'          => 'required_if:correction_type,edit|array',
            'items'             => 'required_if:correction_type,edit_items|array',
            'items.*.product_id'=> 'required_with:items|integer|exists:products,id',
            'items.*.qty'       => 'required_with:items|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $user      = $request->user();
                $outletIds = $user->outlets()->pluck('outlets.id');

                /** @var Transaction $transaction */
                $transaction = Transaction::whereIn('outlet_id', $outletIds)
                    ->with(['hashVerification', 'items'])
                    ->lockForUpdate()
                    ->find($request->transaction_id);

                if (!$transaction) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Transaksi tidak ditemukan.',
                    ], 404);
                }

                // FIX: Kasir hanya bisa koreksi transaksi milik sendiri
                if ($user->hasRole('kasir') && $transaction->user_id !== $user->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda hanya bisa melakukan koreksi pada transaksi milik Anda sendiri.',
                    ], 403);
                }

                // Maksimal koreksi adalah 1 kali per transaksi
                $hasCorrection = CorrectionLog::where('transaction_id', $transaction->id)->exists();
                if ($hasCorrection) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Transaksi ini sudah pernah dikoreksi sebelumnya. Maksimal koreksi adalah 1 kali.',
                    ], 422);
                }

                // Cegah koreksi transaksi yang sudah voided
                if ($transaction->status === 'voided') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Transaksi ini sudah dalam status voided dan tidak bisa dikoreksi lagi.',
                    ], 422);
                }

                $oldData          = $transaction->toArray();
                $hashVerification = $transaction->hashVerification;
                $hashSebelum      = $hashVerification?->hash_sha256;
                $hashSesudah      = $hashSebelum;

                if ($request->correction_type === 'void') {
                    // FIX: Kembalikan stok produk ke tabel outlet_product
                    $items = $transaction->items;
                    foreach ($items as $item) {
                        if ($item->product_id) {
                            DB::table('outlet_product')
                                ->where('outlet_id', $transaction->outlet_id)
                                ->where('product_id', $item->product_id)
                                ->increment('stok', $item->qty);
                        }
                    }

                    // Void: ubah status transaksi
                    $transaction->update(['status' => 'voided']);
                    $hashSesudah = $hashSebelum;

                    if ($hashVerification) {
                        $hashVerification->update(['status' => 'voided']);
                    }

                    // FIX CRITICAL: Perbarui previous_hash di transaksi berikutnya dalam chain
                    $this->repairChainAfterVoid($transaction, $hashVerification);

                } elseif ($request->correction_type === 'edit_items') {
                    // Update metode pembayaran jika dikirim
                    if ($request->filled('metode_pembayaran')) {
                        $transaction->update(['metode_pembayaran' => $request->metode_pembayaran]);
                    }

                    $oldItems = $transaction->items; // Collection
                    $newItems = $request->items ?? [];
                    $newProductIds = collect($newItems)->pluck('product_id')->toArray();

                    // 1. Kembalikan stok untuk item yang dihapus sepenuhnya dari list baru
                    foreach ($oldItems as $oldItem) {
                        if (!in_array($oldItem->product_id, $newProductIds)) {
                            if ($oldItem->product_id) {
                                DB::table('outlet_product')
                                    ->where('outlet_id', $transaction->outlet_id)
                                    ->where('product_id', $oldItem->product_id)
                                    ->increment('stok', $oldItem->qty);
                            }
                            $oldItem->delete();
                        }
                    }

                    // 2. Proses item baru atau update qty
                    foreach ($newItems as $item) {
                        $oldItem = $oldItems->firstWhere('product_id', $item['product_id']);
                        
                        if ($oldItem) {
                            // Update qty & subtotal
                            $diff = $item['qty'] - $oldItem->qty;
                            if ($diff !== 0) {
                                // Cek stok jika qty bertambah
                                if ($diff > 0) {
                                    $outletProduct = DB::table('outlet_product')
                                        ->where('outlet_id', $transaction->outlet_id)
                                        ->where('product_id', $item['product_id'])
                                        ->first();
                                    if ($outletProduct && $outletProduct->stok < $diff) {
                                        throw new \Exception("Stok produk {$oldItem->nama_produk} tidak mencukupi (Sisa stok outlet: {$outletProduct->stok}, tambahan yang diminta: {$diff}).", 422);
                                    }
                                }
                                
                                // Sesuaikan stok
                                DB::table('outlet_product')
                                    ->where('outlet_id', $transaction->outlet_id)
                                    ->where('product_id', $item['product_id'])
                                    ->decrement('stok', $diff);

                                $oldItem->update([
                                    'qty' => $item['qty'],
                                    'subtotal' => $item['qty'] * $oldItem->harga_satuan
                                ]);
                            }
                        } else {
                            // Tambah item baru
                            $product = Product::where('id', $item['product_id'])
                                ->whereHas('outlets', fn($q) => $q->where('outlets.id', $transaction->outlet_id))
                                ->with(['outlets' => fn($q) => $q->where('outlets.id', $transaction->outlet_id)])
                                ->first();
                            
                            if (!$product) {
                                throw new \Exception("Produk ID {$item['product_id']} tidak ditemukan di outlet ini.", 422);
                            }

                            $pivot = $product->outlets->first()->pivot;
                            if ($pivot->stok < $item['qty']) {
                                throw new \Exception("Stok produk {$product->nama} tidak mencukupi (Sisa: {$pivot->stok}).", 422);
                            }

                            // Kurangi stok
                            DB::table('outlet_product')
                                ->where('outlet_id', $transaction->outlet_id)
                                ->where('product_id', $product->id)
                                ->decrement('stok', $item['qty']);

                            $hargaAkhir = $pivot->harga !== null ? $pivot->harga : $product->harga;
                            $modalAkhir = $pivot->modal !== null ? $pivot->modal : ($product->modal ?? 0);
                            $subtotal = $hargaAkhir * $item['qty'];

                            \App\Models\TransactionItem::create([
                                'transaction_id' => $transaction->id,
                                'product_id'     => $product->id,
                                'nama_produk'    => $product->nama,
                                'harga_satuan'   => $hargaAkhir,
                                'modal_satuan'   => $modalAkhir,
                                'qty'            => $item['qty'],
                                'subtotal'       => $subtotal,
                            ]);
                        }
                    }

                    // 3. Recalculate total_amount
                    $transaction->refresh();
                    $newTotal = $transaction->items()->sum('subtotal');
                    $transaction->update(['total_amount' => $newTotal]);
                    $transaction->refresh();

                    // 4. Update blockchain hash
                    $prevHash = $hashVerification?->previous_hash ?? '';
                    $signature = implode('|', [
                        $transaction->transaction_code,
                        $transaction->outlet_id,
                        $transaction->total_amount,
                        $transaction->metode_pembayaran,
                        $transaction->created_at->timestamp,
                        $prevHash,
                    ]);
                    $hashSesudah = hash('sha256', $signature);

                    if ($hashVerification) {
                        $hashVerification->update([
                            'hash_sha256' => $hashSesudah,
                            'status'      => 'verified',
                        ]);
                        $this->repairChainAfterEdit($transaction, $hashSesudah);
                    }
                } else {
                    // Edit: hanya field yang diizinkan yang boleh diubah
                    $safeData = array_intersect_key(
                        $request->new_data,
                        array_flip(self::ALLOWED_EDIT_FIELDS)
                    );

                    if (empty($safeData)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Tidak ada field yang valid untuk diubah. Field yang diizinkan: ' . implode(', ', self::ALLOWED_EDIT_FIELDS),
                        ], 422);
                    }

                    $transaction->update($safeData);
                    $transaction->refresh();

                    $prevHash = $hashVerification?->previous_hash ?? '';

                    $signature = implode('|', [
                        $transaction->transaction_code,
                        $transaction->outlet_id,
                        $transaction->total_amount,
                        $transaction->metode_pembayaran,
                        $transaction->created_at->timestamp,
                        $prevHash,
                    ]);
                    $hashSesudah = hash('sha256', $signature);

                    if ($hashVerification) {
                        $hashVerification->update([
                            'hash_sha256' => $hashSesudah,
                            'status'      => 'verified',
                        ]);

                        // FIX CRITICAL: Perbarui previous_hash di transaksi berikutnya dalam chain
                        $this->repairChainAfterEdit($transaction, $hashSesudah);
                    }
                }

                $fraudService = app(\App\Services\FraudDetectionService::class);
                $fraudIndicators = $fraudService->analyzeCorrection($transaction, $user->id);
                $isSuspicious = !empty($fraudIndicators);

                $log = CorrectionLog::create([
                    'transaction_id'  => $transaction->id,
                    'corrected_by'    => $user->id,
                    'outlet_id'       => $transaction->outlet_id,
                    'alasan'          => $request->alasan,
                    'old_data'        => $oldData,
                    'new_data'        => $transaction->fresh(['items'])->toArray(),
                    'correction_type' => $request->correction_type,
                    'hash_sebelum'    => $hashSebelum,
                    'hash_sesudah'    => $hashSesudah,
                    'status'          => 'flagged',
                    'is_suspicious'   => $isSuspicious,
                    'fraud_indicators'=> $isSuspicious ? $fraudIndicators : null,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Koreksi berhasil dicatat.',
                    'data'    => $log->load(['transaction:id,transaction_code', 'correctedBy:id,name']),
                ], 201);
            });
        } catch (\Exception $e) {
            DB::rollBack();
            $code = $e->getCode() === 422 ? 422 : 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }

    /**
     * FIX CRITICAL: Setelah edit, perbarui previous_hash di transaksi berikutnya
     * agar blockchain chain tidak rusak.
     */
    private function repairChainAfterEdit(Transaction $editedTransaction, string $newHash): void
    {
        // Cari transaksi sukses berikutnya berdasarkan ID (urutan dalam chain)
        $nextVerification = HashVerification::whereHas('transaction', function ($q) use ($editedTransaction) {
            $q->where('outlet_id', $editedTransaction->outlet_id)
              ->where('status', 'success')
              ->where('id', '>', $editedTransaction->id);
        })
        ->orderBy('id', 'asc')
        ->first();

        if (!$nextVerification) {
            return; // Tidak ada transaksi berikutnya, chain sudah benar
        }

        // Ambil data transaksi berikutnya untuk re-generate hashnya
        $nextTransaction = $nextVerification->transaction;

        // Update previous_hash di transaksi berikutnya
        $newSignature = implode('|', [
            $nextTransaction->transaction_code,
            $nextTransaction->outlet_id,
            $nextTransaction->total_amount,
            $nextTransaction->metode_pembayaran,
            $nextTransaction->created_at->timestamp,
            $newHash, // previous_hash baru = hash yang baru dari transaksi yang diedit
        ]);
        $newNextHash = hash('sha256', $newSignature);

        $nextVerification->update([
            'previous_hash' => $newHash,
            'hash_sha256'   => $newNextHash,
        ]);

        // Rekursif: perbaiki sisa chain setelah transaksi berikutnya
        $this->repairChainAfterEdit($nextTransaction, $newNextHash);
    }

    /**
     * FIX CRITICAL: Setelah void, transaksi berikutnya harus link ke transaksi sebelum yang di-void
     * agar chain bisa di-skip dengan benar.
     */
    private function repairChainAfterVoid(Transaction $voidedTransaction, ?object $hashVerification): void
    {
        // Hash yang harusnya jadi "previous" untuk transaksi setelah yang di-void
        // adalah hash dari transaksi SEBELUM yang di-void
        $prevHashOfVoided = $hashVerification?->previous_hash ?? '';

        $nextVerification = HashVerification::whereHas('transaction', function ($q) use ($voidedTransaction) {
            $q->where('outlet_id', $voidedTransaction->outlet_id)
              ->where('status', 'success')
              ->where('id', '>', $voidedTransaction->id);
        })
        ->orderBy('id', 'asc')
        ->first();

        if (!$nextVerification) {
            return;
        }

        $nextTransaction = $nextVerification->transaction;

        $newSignature = implode('|', [
            $nextTransaction->transaction_code,
            $nextTransaction->outlet_id,
            $nextTransaction->total_amount,
            $nextTransaction->metode_pembayaran,
            $nextTransaction->created_at->timestamp,
            $prevHashOfVoided,
        ]);
        $newNextHash = hash('sha256', $newSignature);

        $nextVerification->update([
            'previous_hash' => $prevHashOfVoided,
            'hash_sha256'   => $newNextHash,
        ]);

        // Lanjutkan rekursif
        $this->repairChainAfterEdit($nextTransaction, $newNextHash);
    }

    // PATCH approve koreksi — hanya admin
    public function approve(Request $request, $id)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Admin yang bisa approve koreksi.',
            ], 403);
        }

        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $log = CorrectionLog::whereHas('transaction', fn($q) =>
            $q->whereIn('outlet_id', $outletIds)
        )->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Log koreksi tidak ditemukan.',
            ], 404);
        }

        if ($log->status !== 'flagged') {
            return response()->json([
                'success' => false,
                'message' => 'Log tidak bisa diapprove. Status saat ini: ' . $log->status . '.',
            ], 422);
        }

        $log->update(['status' => 'approved']);

        return response()->json([
            'success' => true,
            'message' => 'Koreksi berhasil diapprove.',
            'data'    => $log->fresh()->load(['transaction:id,transaction_code', 'correctedBy:id,name']),
        ]);
    }
}