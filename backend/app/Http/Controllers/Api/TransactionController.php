<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\HashVerification;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Database\UniqueConstraintViolationException;

class TransactionController extends Controller
{
    // GET semua transaksi
    public function index(Request $request)
    {
        $user      = $request->user();
        $outletIds = $user->outlets()->pluck('outlets.id');

        $query = Transaction::whereIn('outlet_id', $outletIds)
            ->with(['outlet:id,nama', 'kasir:id,name', 'items', 'hashVerification'])
            ->orderByDesc('created_at');

        // Filter outlet spesifik jika ada
        if ($request->filled('outlet_id') && $outletIds->contains($request->outlet_id)) {
            $query->where('outlet_id', $request->outlet_id);
        }

        // Filter kasir spesifik jika ada
        if ($request->filled('kasir_id')) {
            $query->where('user_id', $request->kasir_id);
        }

        // Filter tanggal
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
        } elseif ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        // Kasir hanya lihat transaksi milik sendiri
        if ($user->hasRole('kasir')) {
            $query->where('user_id', $user->id);
        }

        if ($request->query('all') === 'true') {
            return response()->json([
                'success' => true,
                'data'    => $query->get(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->paginate(15),
        ]);
    }

    // GET detail transaksi
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $transaction = Transaction::whereIn('outlet_id', $outletIds)
            ->with(['outlet:id,nama', 'kasir:id,name', 'items', 'hashVerification'])
            ->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $transaction,
        ]);
    }

    // POST buat transaksi baru
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id'          => 'required|integer|exists:outlets,id',
            'metode_pembayaran'  => 'required|in:qris,tunai,transfer',
            'payment_reference'  => 'nullable|string|max:255',
            'catatan'            => 'nullable|string',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty'        => 'required|integer|min:1',
        ], [
            'outlet_id.required'         => 'Outlet wajib dipilih.',
            'metode_pembayaran.required' => 'Metode pembayaran wajib dipilih.',
            'metode_pembayaran.in'       => 'Metode pembayaran harus qris, tunai, atau transfer.',
            'items.required'             => 'Item transaksi wajib diisi.',
            'items.min'                  => 'Minimal 1 item transaksi.',
            'items.*.product_id.required'=> 'Product ID wajib diisi.',
            'items.*.qty.required'       => 'Qty wajib diisi.',
            'items.*.qty.min'            => 'Qty minimal 1.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Pastikan user punya akses ke outlet
        $outletIds = $request->user()->outlets()->pluck('outlets.id');
        if (!$outletIds->contains($request->outlet_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
            ], 403);
        }

        DB::beginTransaction();
        try {
            $totalAmount = 0;
            $itemsData   = [];

            foreach ($request->items as $item) {
                $product = Product::where('id', $item['product_id'])
                    ->whereHas('outlets', function($q) use ($request) {
                        $q->where('outlets.id', $request->outlet_id);
                    })
                    ->with(['outlets' => function($q) use ($request) {
                        $q->where('outlets.id', $request->outlet_id);
                    }])
                    ->where('is_active', true)
                    ->lockForUpdate() // Cegah race condition stok (lock produk master)
                    ->first();

                if (!$product) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Produk ID {$item['product_id']} tidak ditemukan atau tidak aktif di outlet ini.",
                    ], 422);
                }

                $pivot = $product->outlets->first()->pivot;
                $force = filter_var($request->input('force', false), FILTER_VALIDATE_BOOLEAN);
                
                if (!$force && $pivot->stok < $item['qty']) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Stok produk {$product->nama} tidak mencukupi (Sisa: {$pivot->stok}).",
                    ], 422);
                }

                // Kurangi stok di pivot table (jika force, stok bisa minus)
                $product->outlets()->updateExistingPivot($request->outlet_id, [
                    'stok' => $pivot->stok - $item['qty']
                ]);

                // Gunakan harga dan modal dari pivot outlet (jika ada)
                $hargaAkhir = $pivot->harga !== null ? $pivot->harga : $product->harga;
                $modalAkhir = $pivot->modal !== null ? $pivot->modal : ($product->modal ?? 0);

                $subtotal     = $hargaAkhir * $item['qty'];
                $totalAmount += $subtotal;

                $itemsData[] = [
                    'product_id'   => $product->id,
                    'nama_produk'  => $product->nama,
                    'harga_satuan' => $hargaAkhir,
                    'modal_satuan' => $modalAkhir,
                    'qty'          => $item['qty'],
                    'subtotal'     => $subtotal,
                ];
            }

            // Generate transaction_code unik dengan loop + DB unique constraint sebagai safety net
            $code = null;
            do {
                $candidate = 'TRX-' . strtoupper(Str::random(8));
                if (!Transaction::where('transaction_code', $candidate)->exists()) {
                    $code = $candidate;
                }
            } while ($code === null);

            $transaction = Transaction::create([
                'transaction_code'  => $code,
                'outlet_id'         => $request->outlet_id,
                'user_id'           => $request->user()->id,
                'total_amount'      => $totalAmount,
                'metode_pembayaran' => $request->metode_pembayaran,
                'payment_reference' => $request->payment_reference,
                'status'            => 'success',
                'catatan'           => $request->catatan,
            ]);

            foreach ($itemsData as $item) {
                TransactionItem::create(array_merge($item, [
                    'transaction_id' => $transaction->id,
                ]));
            }

            // Ambil previous_hash dari transaksi sukses terakhir di outlet yang sama
            $previousHash = HashVerification::whereHas('transaction', function ($q) use ($request) {
                $q->where('transactions.outlet_id', $request->outlet_id)
                  ->where('transactions.status', 'success');
            })
                ->orderByDesc('id')
                ->value('hash_sha256');

            // Susun signature: Code|Outlet|Total|Metode|Timestamp|PrevHash
            $signature = implode('|', [
                $transaction->transaction_code,
                $transaction->outlet_id,
                $transaction->total_amount,
                $transaction->metode_pembayaran,
                $transaction->created_at->timestamp,
                $previousHash ?? '',
            ]);

            $hash = hash('sha256', $signature);

            HashVerification::create([
                'transaction_id' => $transaction->id,
                'hash_sha256'    => $hash,
                'previous_hash'  => $previousHash,
                'status'         => 'verified',
            ]);

            $snapToken = null;
            $qrisUrl = null;

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibuat.',
                'data'    => $transaction->load(['items', 'hashVerification']),
                'snap_token' => $snapToken,
                'qris_url' => $qrisUrl, // Kirim direct QRIS image URL ke frontend
            ], 201);

        } catch (UniqueConstraintViolationException $e) {
            // Safety net: jika transaction_code collision lolos ke DB
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Terjadi konflik kode transaksi, silakan coba lagi.',
            ], 409);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }
}
