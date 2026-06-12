<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\CorrectionLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Helper: Bangun base query transaksi berdasarkan akses outlet user & rentang tanggal.
     * Dipakai bersama oleh index() dan exportPdf().
     */
    private function getBaseTransactionQuery(Request $request)
    {
        $user = $request->user();
        $outletIds = $user->outlets()->pluck('outlets.id');

        // Filter ke outlet spesifik jika diminta dan user punya akses
        if ($request->outlet_id && $outletIds->contains($request->outlet_id)) {
            $outletIds = collect([$request->outlet_id]);
        }

        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Restriksi untuk Kasir: hanya melihat transaksi buatannya sendiri dan hari ini saja
        if ($user->hasRole('kasir')) {
            $startDate = Carbon::today()->format('Y-m-d');
            $endDate = Carbon::today()->format('Y-m-d');
        }

        $query = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->whereBetween('created_at', [
                $startDate . ' 00:00:00',
                $endDate   . ' 23:59:59',
            ]);

        // Restriksi untuk Kasir: hanya melihat transaksi buatannya sendiri
        if ($user->hasRole('kasir')) {
            $query->where('user_id', $user->id);
        }

        return $query->with(['outlet:id,nama', 'kasir:id,name'])
            ->orderBy('created_at');
    }

    // GET laporan keuangan (JSON untuk Dashboard)
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id'  => 'nullable|integer|exists:outlets,id',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $transaksi = $this->getBaseTransactionQuery($request)->get();

        $totalHpp = 0;
        $transactionIds = $transaksi->pluck('id');
        if ($transactionIds->isNotEmpty()) {
            $totalHpp = \Illuminate\Support\Facades\DB::table('transaction_items')
                ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                ->whereIn('transactions.id', $transactionIds)
                ->selectRaw('SUM(transaction_items.qty * transaction_items.modal_satuan) as total_hpp')
                ->value('total_hpp') ?? 0;
        }

        $totalOmzet = $transaksi->sum('total_amount');
        $totalPendapatan = $totalOmzet - $totalHpp;

        $ringkasan = [
            'total_pendapatan' => $totalPendapatan,
            'total_omzet'      => $totalOmzet,
            'total_transaksi'  => $transaksi->count(),
            'total_qris'       => $transaksi->where('metode_pembayaran', 'qris')->sum('total_amount'),
            'total_tunai'      => $transaksi->where('metode_pembayaran', 'tunai')->sum('total_amount'),
            'total_transfer'   => $transaksi->where('metode_pembayaran', 'transfer')->sum('total_amount'),
        ];

        $perOutlet = $transaksi->groupBy('outlet_id')->map(fn($items) => [
            'outlet_id'   => $items->first()->outlet_id,
            'outlet_nama' => $items->first()->outlet?->nama,
            'total'       => $items->sum('total_amount'),
            'jumlah'      => $items->count(),
        ])->values();

        $perHari = $transaksi->groupBy(fn($t) => $t->created_at->format('Y-m-d'))
            ->map(fn($items, $tanggal) => [
                'tanggal' => $tanggal,
                'total'   => $items->sum('total_amount'),
                'jumlah'  => $items->count(),
            ])->values();

        $transactionIds = $transaksi->pluck('id');
        
        $topProducts = TransactionItem::join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->join('outlets', 'transactions.outlet_id', '=', 'outlets.id')
            ->whereIn('transactions.id', $transactionIds)
            ->selectRaw('transaction_items.product_id, MAX(transaction_items.nama_produk) as nama, outlets.nama as outlet, SUM(transaction_items.qty) as terjual, SUM(transaction_items.subtotal) as omzet')
            ->groupBy('transaction_items.product_id', 'transactions.outlet_id', 'outlets.nama')
            ->orderByDesc('terjual')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'nama' => $item->nama,
                    'outlet' => $item->outlet,
                    'terjual' => (int) $item->terjual,
                    'omzet' => (float) $item->omzet,
                ];
            });

        // Hitung Transaksi & Koreksi per jam (00:00 - 23:59)
        $aktivitasPerJam = [];
        for ($i = 0; $i < 24; $i++) {
            $hourString = str_pad($i, 2, '0', STR_PAD_LEFT) . ':00';
            $aktivitasPerJam[$hourString] = [
                'jam'       => $hourString,
                'transaksi' => 0,
                'koreksi'   => 0
            ];
        }

        // Hitung total transaksi di setiap jam
        foreach ($transaksi as $tx) {
            $hour = $tx->created_at->format('H:00');
            if (isset($aktivitasPerJam[$hour])) {
                $aktivitasPerJam[$hour]['transaksi']++;
            }
        }

        // Ambil Correction Logs di rentang waktu yang sama untuk outlet tsb
        $user = $request->user();
        $outletIds = $user->outlets()->pluck('outlets.id');
        if ($request->outlet_id && $outletIds->contains($request->outlet_id)) {
            $outletIds = collect([$request->outlet_id]);
        }

        $startDate = $request->start_date;
        $endDate = $request->end_date;

        if ($user->hasRole('kasir')) {
            $startDate = Carbon::today()->format('Y-m-d');
            $endDate = Carbon::today()->format('Y-m-d');
        }
        
        $koreksiQuery = CorrectionLog::whereIn('outlet_id', $outletIds)
            ->whereBetween('created_at', [
                $startDate . ' 00:00:00',
                $endDate   . ' 23:59:59',
            ]);
            
        if ($user->hasRole('kasir')) {
            $koreksiQuery->where('corrected_by', $user->id);
        }

        $logs = $koreksiQuery->get();
        foreach ($logs as $log) {
            $hour = $log->created_at->format('H:00');
            if (isset($aktivitasPerJam[$hour])) {
                $aktivitasPerJam[$hour]['koreksi']++;
            }
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'periode'    => ['start_date' => $request->start_date, 'end_date' => $request->end_date],
                'ringkasan'  => $ringkasan,
                'per_outlet' => $perOutlet,
                'per_hari'   => $perHari,
                'produk_terlaris' => $topProducts,
                'aktivitas_per_jam' => array_values($aktivitasPerJam),
            ],
        ]);
    }

    // GET export PDF laporan transaksi
    public function exportPdf(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id'  => 'nullable|integer|exists:outlets,id',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Batasi maksimal 366 hari agar PDF tidak terlalu besar
        $start = Carbon::parse($request->start_date);
        $end   = Carbon::parse($request->end_date);

        if ($start->diffInDays($end) > 366) {
            return response()->json([
                'success' => false,
                'message' => 'Maksimal rentang waktu untuk export PDF adalah 366 hari.',
            ], 422);
        }

        $transaksi = $this->getBaseTransactionQuery($request)->get();

        $pdf = Pdf::loadView('reports.laporan-pdf', [
            'transaksi'  => $transaksi,
            'start_date' => $request->start_date,
            'end_date'   => $request->end_date,
            'total'      => $transaksi->sum('total_amount'),
            'user'       => $request->user(),
        ]);

        return $pdf->download("laporan-{$request->start_date}-ke-{$request->end_date}.pdf");
    }

    // GET export Excel (CSV format) laporan transaksi
    public function exportExcel(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id'  => 'nullable|integer|exists:outlets,id',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Batasi maksimal 366 hari
        $start = Carbon::parse($request->start_date);
        $end   = Carbon::parse($request->end_date);

        if ($start->diffInDays($end) > 366) {
            return response()->json([
                'success' => false,
                'message' => 'Maksimal rentang waktu untuk export Excel adalah 366 hari.',
            ], 422);
        }

        $transaksi = $this->getBaseTransactionQuery($request)->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=laporan-{$request->start_date}-ke-{$request->end_date}.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['No', 'Kode Transaksi', 'Outlet', 'Kasir', 'Metode Pembayaran', 'Total', 'Tanggal'];

        $callback = function() use($transaksi, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($transaksi as $i => $t) {
                fputcsv($file, [
                    $i + 1,
                    $t->transaction_code,
                    $t->outlet?->nama,
                    $t->kasir?->name,
                    strtoupper($t->metode_pembayaran),
                    (float) $t->total_amount,
                    $t->created_at->format('d/m/Y H:i')
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
