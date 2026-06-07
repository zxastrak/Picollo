<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password as PasswordRule;
use App\Models\AuditLog;
use App\Models\CorrectionLog;

class KasirController extends Controller
{
    // GET semua kasir milik outlet admin
    public function index(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasirList = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->with('outlets:id,nama,kode_outlet')
            ->get()
            ->map(fn($k) => [
                'id'            => $k->id,
                'name'          => $k->name,
                'email'         => $k->email,
                'no_telepon'    => $k->no_telepon,
                'is_active'     => $k->is_active,
                'last_login_at' => $k->last_login_at,
                'outlets'       => $k->outlets,
                'created_at'    => $k->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $kasirList,
        ]);
    }

    // GET detail satu kasir
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasir = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->with('outlets:id,nama,kode_outlet')
            ->find($id);

        if (!$kasir) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $kasir,
        ]);
    }

    // POST buat akun kasir baru
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users',
            'password'   => [
                'required',
                'confirmed',
                PasswordRule::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
            'no_telepon' => 'nullable|string|max:20',
            'outlet_id'  => 'required|integer|exists:outlets,id',
        ], [
            'name.required'      => 'Nama kasir wajib diisi.',
            'email.required'     => 'Email wajib diisi.',
            'email.unique'       => 'Email sudah terdaftar.',
            'password.required'  => 'Password wajib diisi.',
            'password.min'       => 'Password minimal 8 karakter.',
            'password.letters'   => 'Password harus mengandung huruf.',
            'password.mixed'     => 'Password harus mengandung huruf besar dan kecil.',
            'password.numbers'   => 'Password harus mengandung angka.',
            'password.symbols'   => 'Password harus mengandung simbol.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'outlet_id.required' => 'Outlet wajib dipilih.',
            'outlet_id.exists'   => 'Outlet tidak ditemukan.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $outletIds = $request->user()->outlets()->pluck('outlets.id');
        if (!$outletIds->contains($request->outlet_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
            ], 403);
        }

        $kasir = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'no_telepon' => $request->no_telepon,
            'is_active'  => true,
            'email_verified_at' => now(),
        ]);

        $kasir->assignRole('kasir');
        $kasir->outlets()->attach($request->outlet_id);

        try {
            $loginUrl = url('http://localhost:5173/login');
            \Illuminate\Support\Facades\Mail::to($kasir->email)->send(new \App\Mail\AccountCreatedMail($request->email, $request->password, 'Kasir', $loginUrl));
        } catch (\Exception $e) {
            \Log::error('Failed to send account created email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Akun kasir berhasil dibuat.',
            'data'    => [
                'id'         => $kasir->id,
                'name'       => $kasir->name,
                'email'      => $kasir->email,
                'no_telepon' => $kasir->no_telepon,
                'outlet_id'  => $request->outlet_id,
            ],
        ], 201);
    }

    // PUT update kasir
    public function update(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasir = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$kasir) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'       => 'sometimes|required|string|max:255',
            'no_telepon' => 'nullable|string|max:20',
            'is_active'  => 'sometimes|boolean',
            'outlet_id'  => 'sometimes|integer|exists:outlets,id',
            'avatar'     => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'password'   => [
                'sometimes',
                'confirmed',
                PasswordRule::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
        ], [
            'name.required'      => 'Nama kasir wajib diisi.',
            'password.min'       => 'Password minimal 8 karakter.',
            'password.letters'   => 'Password harus mengandung huruf.',
            'password.mixed'     => 'Password harus mengandung huruf besar dan kecil.',
            'password.numbers'   => 'Password harus mengandung angka.',
            'password.symbols'   => 'Password harus mengandung simbol.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // FIX: Gunakan array_filter dengan fn yang juga loloskan boolean false dan integer 0
        $updateData = [];
        if ($request->has('name'))       $updateData['name']       = $request->name;
        if ($request->has('no_telepon')) $updateData['no_telepon'] = $request->no_telepon;
        if ($request->has('is_active'))  $updateData['is_active']  = $request->boolean('is_active');
        if ($request->password)          $updateData['password']   = Hash::make($request->password);

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . $kasir->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('avatars'), $filename);
            
            if ($kasir->avatar_url) {
                $oldPath = public_path(parse_url($kasir->avatar_url, PHP_URL_PATH));
                if (file_exists($oldPath) && is_file($oldPath)) {
                    @unlink($oldPath);
                }
            }
            $updateData['avatar_url'] = url('avatars/' . $filename);
        }

        if (!empty($updateData)) {
            $kasir->update($updateData);
        }

        if ($request->has('outlet_id') && $request->outlet_id) {
            if (!$outletIds->contains($request->outlet_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
                ], 403);
            }
            $kasir->outlets()->sync([$request->outlet_id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data kasir berhasil diupdate.',
            'data'    => $kasir->fresh()->load('outlets:id,nama'),
        ]);
    }

    // DELETE kasir
    public function destroy(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasir = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$kasir) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir tidak ditemukan.',
            ], 404);
        }

        $kasir->outlets()->detach();
        $kasir->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun kasir berhasil dihapus.',
        ]);
    }

    // GET aktivitas kasir (login, logout, koreksi)
    public function getActivities(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasir = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$kasir) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir tidak ditemukan.',
            ], 404);
        }

        // Ambil aktivitas login & logout
        $auditLogs = AuditLog::where('user_id', $id)
            ->whereIn('action', ['login', 'logout'])
            ->get()
            ->map(function ($log) {
                return [
                    'type' => $log->action, // 'login' or 'logout'
                    'title' => ucfirst($log->action),
                    'subtitle' => 'Sistem Kasir',
                    'timestamp' => $log->created_at,
                ];
            });

        // Ambil riwayat koreksi
        $correctionLogs = CorrectionLog::with('transaction:id,transaction_code')
            ->where('corrected_by', $id)
            ->get()
            ->map(function ($log) {
                $trxCode = $log->transaction ? $log->transaction->transaction_code : 'Unknown';
                return [
                    'type' => 'koreksi',
                    'title' => 'Koreksi Transaksi ' . $trxCode,
                    'subtitle' => $log->alasan ?: 'Tanpa alasan',
                    'timestamp' => $log->created_at,
                    'status' => $log->status // pending, approved, rejected
                ];
            });

        // Gabungkan dan urutkan
        $activities = $auditLogs->concat($correctionLogs)
            ->sortByDesc('timestamp')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }
}