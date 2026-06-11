<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HashVerification;
use App\Models\Transaction;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HashVerificationController extends Controller
{
    // GET semua hash verifikasi milik outlet user
    public function index(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $query = HashVerification::whereHas('transaction', fn($q) =>
            $q->whereIn('outlet_id', $outletIds)
        );

        // Filter tanggal
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
        } elseif ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $verifications = $query->with([
            'transaction:id,transaction_code,outlet_id,total_amount,created_at',
            'verifiedBy:id,name',
        ])
        ->orderByDesc('created_at')
        ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $verifications,
        ]);
    }

    // GET detail hash verifikasi
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $verification = HashVerification::whereHas('transaction', fn($q) =>
            $q->whereIn('outlet_id', $outletIds)
        )
        ->with([
            'transaction:id,transaction_code,outlet_id,total_amount,created_at',
            'verifiedBy:id,name',
        ])
        ->find($id);

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Data verifikasi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $verification,
        ]);
    }

    // POST verifikasi hash satu transaksi
    public function verify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|integer|exists:transactions,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $outletIds   = $request->user()->outlets()->pluck('outlets.id');
        $transaction = Transaction::whereIn('outlet_id', $outletIds)
            ->with('hashVerification')
            ->find($request->transaction_id);

        if (!$transaction || !$transaction->hashVerification) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        $prevHash  = $transaction->hashVerification->previous_hash ?? '';
        $signature = implode('|', [
            $transaction->transaction_code,
            $transaction->outlet_id,
            $transaction->total_amount,
            $transaction->metode_pembayaran,
            $transaction->created_at->timestamp,
            $prevHash,
        ]);

        $recomputed = hash_hmac('sha256', $signature, config('app.key'));
        $storedHash = $transaction->hashVerification->hash_sha256;
        $isValid    = hash_equals($storedHash, $recomputed);
        $status     = $isValid ? 'verified' : 'fraud_detected';

        $transaction->hashVerification->update([
            'status'      => $status,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        AuditLog::create([
            'user_id'     => $request->user()->id,
            'action'      => 'verify_hash',
            'entity_type' => 'Transaction',
            'entity_id'   => $transaction->id,
            'new_value'   => ['status' => $status],
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $isValid ? 'Hash valid!' : '⚠️ FRAUD DETECTED!',
            'data'    => ['is_valid' => $isValid, 'status' => $status],
        ]);
    }

    // POST verifikasi integritas seluruh chain (Audit Masal Harian)
    public function verifyChain(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id' => 'required|integer|exists:outlets,id',
            'tanggal'   => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Pastikan user punya akses ke outlet ini
        $userOutletIds = $request->user()->outlets()->pluck('outlets.id');
        if (!$userOutletIds->contains($request->outlet_id)) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        // Hanya transaksi success yang masuk chain — voided dilewati
        $transactions = Transaction::where('outlet_id', $request->outlet_id)
            ->where('status', 'success')
            ->whereDate('created_at', $request->tanggal)
            ->with('hashVerification')
            ->orderBy('id', 'asc')
            ->get();

        if ($transactions->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Tidak ada transaksi.'], 404);
        }

        $chainValid       = true;
        $chainResult      = [];
        $expectedPrevHash = null;

        foreach ($transactions as $index => $trx) {
            $verification = $trx->hashVerification;

            // Null-safe: jika verifikasi tidak ada, langsung tandai invalid
            if (!$verification) {
                $chainValid    = false;
                $chainResult[] = [
                    'transaction_code' => $trx->transaction_code,
                    'data_integrity'   => false,
                    'chain_integrity'  => false,
                    'is_valid'         => false,
                    'note'             => 'Hash verification record tidak ditemukan.',
                ];
                // expectedPrevHash tetap null — chain putus di sini
                continue;
            }

            $storedHash  = $verification->hash_sha256 ?? '';
            $currentPrev = $verification->previous_hash ?? '';

            // Recompute hash dari snapshot data transaksi
            $signature  = implode('|', [
                $trx->transaction_code,
                $trx->outlet_id,
                $trx->total_amount,
                $trx->metode_pembayaran,
                $trx->created_at->timestamp,
                $currentPrev,
            ]);
            $recomputed = hash_hmac('sha256', $signature, config('app.key'));

            // 1. Cek integritas data (hash cocok dengan snapshot)
            $isDataValid = !empty($storedHash) && hash_equals($storedHash, $recomputed);

            // 2. Cek integritas chain (previous_hash cocok dengan hash transaksi sebelumnya)
            $isChainLinked = ($index === 0)
                ? true
                : (!empty($currentPrev) && hash_equals($currentPrev, $expectedPrevHash ?? ''));

            $currentTrxValid = $isDataValid && $isChainLinked;
            if (!$currentTrxValid) {
                $chainValid = false;
            }

            $chainResult[] = [
                'transaction_code' => $trx->transaction_code,
                'data_integrity'   => $isDataValid,
                'chain_integrity'  => $isChainLinked,
                'is_valid'         => $currentTrxValid,
            ];

            $expectedPrevHash = $storedHash;
        }

        return response()->json([
            'success' => true,
            'message' => $chainValid ? 'Seluruh chain valid!' : '⚠️ Chain rusak!',
            'data'    => [
                'chain_valid'  => $chainValid,
                'chain_detail' => $chainResult,
            ],
        ]);
    }

    // POST verifikasi hash satu transaksi dengan raw hash string
    public function verifyByHash(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'hash' => 'required|string|size:64',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $outletIds = $request->user()->outlets()->pluck('outlets.id');
        
        $verification = HashVerification::where('hash_sha256', $request->hash)
            ->whereHas('transaction', fn($q) => $q->whereIn('outlet_id', $outletIds))
            ->with(['transaction.outlet', 'transaction.kasir', 'transaction.items'])
            ->first();

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Hash tidak ditemukan di database. Data kemungkinan tidak valid.',
            ], 404);
        }

        $transaction = $verification->transaction;
        $prevHash = $verification->previous_hash ?? '';
        
        $signature = implode('|', [
            $transaction->transaction_code,
            $transaction->outlet_id,
            $transaction->total_amount,
            $transaction->metode_pembayaran,
            $transaction->created_at->timestamp,
            $prevHash,
        ]);

        $recomputed = hash_hmac('sha256', $signature, config('app.key'));
        $isValid = hash_equals($verification->hash_sha256, $recomputed);
        $status = $isValid ? 'verified' : 'fraud_detected';

        $verification->update([
            'status' => $status,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        \App\Models\AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'verify_hash',
            'entity_type' => 'Transaction',
            'entity_id' => $transaction->id,
            'new_value' => ['status' => $status, 'hash' => $request->hash],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $isValid ? 'valid' : 'fraud',
                'transaksi' => [
                    'id' => $transaction->transaction_code,
                    'nominal' => 'Rp ' . number_format($transaction->total_amount, 0, ',', '.'),
                    'kasir' => $transaction->kasir->name,
                    'outlet' => $transaction->outlet->nama,
                    'waktu' => $transaction->created_at->isoFormat('D MMMM YYYY, HH:mm'),
                    'produk' => $transaction->items->map(fn($item) => $item->nama_produk . ' x' . $item->qty)->join(', '),
                    'hash_blockchain' => $verification->hash_sha256,
                ]
            ]
        ]);
    }
}
