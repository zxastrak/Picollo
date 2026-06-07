<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function adminDashboard(Request $request)
    {
        $user      = $request->user();
        $outletIds = $user->outlets()->pluck('outlets.id');

        // Total omzet keseluruhan (transaksi success)
        $totalOmzet = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->sum('total_amount');

        // Hitung HPP keseluruhan
        $totalHpp = 0;
        $transactionIds = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->pluck('id');
            
        if ($transactionIds->isNotEmpty()) {
            $totalHpp = DB::table('transaction_items')
                ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                ->leftJoin('outlet_product', function ($join) {
                    $join->on('outlet_product.outlet_id', '=', 'transactions.outlet_id')
                         ->on('outlet_product.product_id', '=', 'transaction_items.product_id');
                })
                ->leftJoin('products', 'products.id', '=', 'transaction_items.product_id')
                ->whereIn('transactions.id', $transactionIds)
                ->selectRaw('SUM(transaction_items.qty * COALESCE(outlet_product.modal, products.modal, 0)) as total_hpp')
                ->value('total_hpp') ?? 0;
        }
        $totalPendapatan = $totalOmzet - $totalHpp;

        // Timezone-aware local day boundaries (Asia/Jakarta)
        $startOfDay = now('Asia/Jakarta')->startOfDay()->utc();
        $endOfDay = now('Asia/Jakarta')->endOfDay()->utc();

        // FIX: Total transaksi hari ini — hanya status success agar konsisten dengan pendapatan
        $transaksiHariIni = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
            ->count();

        // Total produk aktif
        $totalProdukAktif = Product::whereHas('outlets', function ($q) use ($outletIds) {
            $q->whereIn('outlets.id', $outletIds);
        })->where('is_active', true)->count();

        // Total outlet aktif milik admin
        $totalOutletAktif = Outlet::whereIn('id', $outletIds)
            ->where('status', 'aktif')
            ->count();

        // Omzet hari ini
        $omzetHariIni = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
            ->sum('total_amount');

        // Hitung HPP hari ini
        $todayTransactionIds = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
            ->pluck('id');

        $todayHpp = 0;
        if ($todayTransactionIds->isNotEmpty()) {
            $todayHpp = DB::table('transaction_items')
                ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                ->leftJoin('outlet_product', function ($join) {
                    $join->on('outlet_product.outlet_id', '=', 'transactions.outlet_id')
                         ->on('outlet_product.product_id', '=', 'transaction_items.product_id');
                })
                ->leftJoin('products', 'products.id', '=', 'transaction_items.product_id')
                ->whereIn('transactions.id', $todayTransactionIds)
                ->selectRaw('SUM(transaction_items.qty * COALESCE(outlet_product.modal, products.modal, 0)) as total_hpp')
                ->value('total_hpp') ?? 0;
        }
        $pendapatanHariIni = $omzetHariIni - $todayHpp;

        // Estimasi pendapatan dari stok yang ada
        $estimasiPendapatan = DB::table('outlet_product')
            ->join('products', 'outlet_product.product_id', '=', 'products.id')
            ->whereIn('outlet_product.outlet_id', $outletIds)
            ->where('products.is_active', true)
            ->whereNotNull('outlet_product.stok')
            ->select(DB::raw('SUM(products.harga * outlet_product.stok) as estimasi'))
            ->value('estimasi') ?? 0;

        $period = $request->query('period', 'bulan_ini');
        $startDate = now('Asia/Jakarta')->startOfMonth()->utc();
        $endDate = now('Asia/Jakarta')->endOfDay()->utc();
        
        if ($period === 'hari_ini') {
            $startDate = now('Asia/Jakarta')->startOfDay()->utc();
            $endDate = now('Asia/Jakarta')->endOfDay()->utc();
        } elseif ($period === 'minggu_ini') {
            $startDate = now('Asia/Jakarta')->startOfWeek()->utc();
            $endDate = now('Asia/Jakarta')->endOfWeek()->utc();
        } elseif ($period === 'bulan_ini') {
            $startDate = now('Asia/Jakarta')->startOfMonth()->utc();
            $endDate = now('Asia/Jakarta')->endOfMonth()->utc();
        } elseif ($period === 'tahun') {
            $startDate = now('Asia/Jakarta')->startOfYear()->utc();
            $endDate = now('Asia/Jakarta')->endOfYear()->utc();
        }

        // Grafik berdasarkan periode
        $grafikQuery = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($period === 'hari_ini') {
            $grafikPendapatan = $grafikQuery->select(
                DB::raw('DATE_FORMAT(created_at, "%H:00") as tanggal'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as jumlah_transaksi')
            )
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();
        } elseif ($period === 'tahun') {
            $grafikPendapatan = $grafikQuery->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as tanggal'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as jumlah_transaksi')
            )
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();
        } else {
            $grafikPendapatan = $grafikQuery->select(
                DB::raw('DATE(created_at) as tanggal'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as jumlah_transaksi')
            )
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();
        }

        // Transaksi terbaru (semua status, bukan hanya success — agar kasir tahu ada void)
        $transaksiTerbaru = Transaction::whereIn('outlet_id', $outletIds)
            ->with(['outlet:id,nama', 'kasir:id,name'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($t) => [
                'id'                => $t->id,
                'transaction_code'  => $t->transaction_code,
                'outlet'            => $t->outlet?->nama,
                'kasir'             => $t->kasir?->name,
                'total_amount'      => $t->total_amount,
                'metode_pembayaran' => $t->metode_pembayaran,
                'status'            => $t->status,
                'created_at'        => $t->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'stat_cards' => [
                    'total_omzet'         => $totalOmzet,
                    'omzet_hari_ini'      => $omzetHariIni,
                    'total_pendapatan'    => $totalPendapatan,
                    'pendapatan_hari_ini' => $pendapatanHariIni,
                    'transaksi_hari_ini'  => $transaksiHariIni,
                    'total_produk_aktif'  => $totalProdukAktif,
                    'total_outlet_aktif'  => $totalOutletAktif,
                    'estimasi_pendapatan' => $estimasiPendapatan,
                ],
                'grafik_pendapatan' => $grafikPendapatan,
                'transaksi_terbaru' => $transaksiTerbaru,
            ]
        ]);
    }

    public function notifications(Request $request)
    {
        $user      = $request->user();
        $outletIds = $user->outlets()->pluck('outlets.id');

        $suspiciousCorrections = \App\Models\CorrectionLog::whereIn('outlet_id', $outletIds)
            ->where('is_suspicious', true)
            ->where('status', 'flagged')
            ->with(['transaction:id,transaction_code', 'correctedBy:id,name', 'outlet:id,nama'])
            ->orderByDesc('created_at')
            ->get();

        $fraudHashes = \App\Models\HashVerification::whereHas('transaction', function ($q) use ($outletIds) {
            $q->whereIn('outlet_id', $outletIds);
        })
            ->where('status', 'fraud_detected')
            ->with(['transaction:id,transaction_code', 'transaction.outlet:id,nama'])
            ->orderByDesc('created_at')
            ->get();

        $notifications = [];

        foreach ($suspiciousCorrections as $c) {
            $notifications[] = [
                'id' => 'correction-' . $c->id,
                'type' => 'warning',
                'title' => 'Koreksi Mencurigakan',
                'message' => 'Transaksi ' . $c->transaction->transaction_code . ' dikoreksi oleh ' . $c->correctedBy->name . ' (' . implode(', ', $c->fraud_indicators ?? []) . ')',
                'outlet' => $c->outlet?->nama,
                'created_at' => $c->created_at,
            ];
        }

        foreach ($fraudHashes as $fh) {
            $notifications[] = [
                'id' => 'hash-' . $fh->id,
                'type' => 'danger',
                'title' => 'Blockchain Fraud',
                'message' => 'Hash transaksi ' . $fh->transaction->transaction_code . ' tidak valid!',
                'outlet' => $fh->transaction->outlet?->nama,
                'created_at' => $fh->created_at,
            ];
        }

        // Sort by created_at descending
        usort($notifications, function ($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        return response()->json([
            'success' => true,
            'data'    => $notifications,
        ]);
    }
}