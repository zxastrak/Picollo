<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyRecap;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DailyRecapController extends Controller
{
    // GET semua rekap
    public function index(Request $request)
    {
        $user      = $request->user();
        $outletIds = $user->outlets()->pluck('outlets.id');

        $query = DailyRecap::whereIn('outlet_id', $outletIds)
            ->with(['outlet:id,nama', 'kasir:id,name', 'approvedBy:id,name'])
            ->orderByDesc('tanggal');

        // Filter tanggal
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('tanggal', [
                $request->start_date,
                $request->end_date
            ]);
        } elseif ($request->filled('date')) {
            $query->where('tanggal', $request->date);
        }

        // Kasir hanya lihat rekap milik sendiri
        if ($user->hasRole('kasir')) {
            $query->where('user_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->paginate(15),
        ]);
    }

    // GET detail rekap
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $recap = DailyRecap::whereIn('outlet_id', $outletIds)
            ->with(['outlet:id,nama', 'kasir:id,name', 'approvedBy:id,name'])
            ->find($id);

        if (!$recap) {
            return response()->json([
                'success' => false,
                'message' => 'Rekap tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $recap,
        ]);
    }

    // POST submit rekap harian
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id' => 'required|integer|exists:outlets,id',
            'tanggal'   => 'required|date',
            'catatan'   => 'nullable|string',
        ], [
            'outlet_id.required' => 'Outlet wajib dipilih.',
            'tanggal.required'   => 'Tanggal wajib diisi.',
            'tanggal.date'       => 'Format tanggal tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Cek akses outlet
        $outletIds = $request->user()->outlets()->pluck('outlets.id');
        if (!$outletIds->contains($request->outlet_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
            ], 403);
        }

        // Cek apakah rekap tanggal ini sudah ada untuk user + outlet yang sama
        $existing = DailyRecap::where('outlet_id', $request->outlet_id)
            ->where('user_id', $request->user()->id)
            ->where('tanggal', $request->tanggal)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Rekap untuk tanggal ini sudah ada.',
            ], 422);
        }

        // Hitung otomatis dari transaksi sukses di hari tersebut
        $transaksi      = Transaction::where('outlet_id', $request->outlet_id)
            ->where('status', 'success')
            ->whereDate('created_at', $request->tanggal)
            ->get();

        $totalTransaksi = $transaksi->count();
        $totalAmount    = $transaksi->sum('total_amount');
        $totalQris      = $transaksi->where('metode_pembayaran', 'qris')->sum('total_amount');
        $totalTunai     = $transaksi->where('metode_pembayaran', 'tunai')->sum('total_amount');

        // Ambil hash rekap hari sebelumnya untuk membentuk chain antar hari
        // Gunakan tanggal < tanggal yang disubmit agar tidak ambil rekap hari yang sama
        $previousHash = DailyRecap::where('outlet_id', $request->outlet_id)
            ->where('tanggal', '<', $request->tanggal)
            ->orderByDesc('tanggal')
            ->value('hash_rekap');

        // Susun signature: Outlet|Tanggal|Amount|TotalTrx|PrevHash
        $signature = implode('|', [
            $request->outlet_id,
            $request->tanggal,
            $totalAmount,
            $totalTransaksi,
            $previousHash ?? 'FIRST_RECAP',
        ]);

        $hashRekap = hash('sha256', $signature);

        $recap = DailyRecap::create([
            'outlet_id'       => $request->outlet_id,
            'user_id'         => $request->user()->id,
            'tanggal'         => $request->tanggal,
            'total_transaksi' => $totalTransaksi,
            'total_amount'    => $totalAmount,
            'total_qris'      => $totalQris,
            'total_tunai'     => $totalTunai,
            'hash_rekap'      => $hashRekap,
            'status'          => 'submitted',
            'submitted_at'    => now(),
            'catatan'         => $request->catatan,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rekap harian berhasil disubmit.',
            'data'    => $recap->load(['outlet:id,nama', 'kasir:id,name']),
        ], 201);
    }

    // PATCH approve rekap — hanya admin
    public function approve(Request $request, $id)
    {
        // Cek role menggunakan Spatie HasRoles
        if (!$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Admin yang bisa approve rekap.',
            ], 403);
        }

        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $recap = DailyRecap::whereIn('outlet_id', $outletIds)->find($id);

        if (!$recap) {
            return response()->json([
                'success' => false,
                'message' => 'Rekap tidak ditemukan.',
            ], 404);
        }

        // Hanya rekap berstatus 'submitted' yang bisa di-approve
        if ($recap->status !== 'submitted') {
            return response()->json([
                'success' => false,
                'message' => 'Rekap tidak bisa diapprove. Status saat ini: ' . $recap->status . '.',
            ], 422);
        }

        $recap->update([
            'status'      => 'approved',
            'approved_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rekap berhasil diapprove.',
            'data'    => $recap->fresh()->load(['outlet:id,nama', 'kasir:id,name', 'approvedBy:id,name']),
        ]);
    }
}
