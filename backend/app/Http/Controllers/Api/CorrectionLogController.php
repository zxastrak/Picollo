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

    // POST buat koreksi baru (Edit atau Void)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id'  => 'required|integer|exists:transactions,id',
            'alasan'          => 'required|string',
            'correction_type' => 'required|in:edit,void,edit_items',
            'new_data'        => 'required_if:correction_type,edit|array',
            'removed_item_ids'=> 'required_if:correction_type,edit_items|array',
            'removed_item_ids.*' => 'integer|exists:transaction_items,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request) {
            $user      = $request->user();
            $outletIds = $user->outlets()->pluck('outlets.id');

            /** @var Transaction $transaction */
            $transaction = Transaction::whereIn('outlet_id', $outletIds)
                ->with('hashVerification')
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

            if ($request->correction_type === 'void') {
                // FIX: Kembalikan stok produk ke tabel outlet_product
                $items = $transaction->items()->get();
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
                    // FIX: Gunakan status yang valid di DB enum
                    // Perlu ALTER TABLE atau gunakan 'fraud_detected' sebagai penanda,
                    // atau tambahkan 'voided' ke enum (lihat migration fix).
                    // Solusi: update status ke 'fraud_detected' dengan catatan di DB,
                    // atau jalankan migration untuk tambah enum 'voided'.
                    // Kode ini mengasumsikan migration sudah dijalankan (lihat file migration fix).
                    $hashVerification->update(['status' => 'voided']);
                }

                // FIX CRITICAL: Perbarui previous_hash di transaksi berikutnya dalam chain
                // agar chain yang tersisa tetap valid
                $this->repairChainAfterVoid($transaction, $hashVerification);

            } elseif ($request->correction_type === 'edit_items') {
                $removedIds = $request->removed_item_ids ?? [];
                $itemsToRemove = $transaction->items()->whereIn('id', $removedIds)->get();

                if ($itemsToRemove->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tidak ada item yang valid untuk dihapus.',
                    ], 422);
                }

                $totalItemsCount = $transaction->items()->count();
                $isRemovingAll = ($itemsToRemove->count() === $totalItemsCount);

                // Kembalikan stok
                foreach ($itemsToRemove as $item) {
                    if ($item->product_id) {
                        DB::table('outlet_product')
                            ->where('outlet_id', $transaction->outlet_id)
                            ->where('product_id', $item->product_id)
                            ->increment('stok', $item->qty);
                    }
                    $item->delete(); // Hapus item dari transaksi
                }

                if ($isRemovingAll) {
                    $transaction->update(['status' => 'voided', 'total_amount' => 0]);
                    $hashSesudah = $hashSebelum;
                    if ($hashVerification) {
                        $hashVerification->update(['status' => 'voided']);
                    }
                    $this->repairChainAfterVoid($transaction, $hashVerification);
                } else {
                    $newTotal = $transaction->items()->sum('subtotal');
                    $transaction->update(['total_amount' => $newTotal]);
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
                        $this->repairChainAfterEdit($transaction, $hashSesudah);
                    }
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
                    // karena hash transaksi ini sudah berubah
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
                'old_data'        => $oldData,  // kolom ini harus ada di DB — lihat migration fix
                'new_data'        => $transaction->fresh()->toArray(),
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