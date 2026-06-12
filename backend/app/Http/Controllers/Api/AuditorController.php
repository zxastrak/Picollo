<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuditorController extends Controller
{
    // GET semua auditor
    public function index(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $auditors = User::role('auditor')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->with('outlets:id,nama,kode_outlet')
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'name'          => $a->name,
                'email'         => $a->email,
                'no_telepon'    => $a->no_telepon,
                'is_active'     => $a->is_active,
                'last_login_at' => $a->last_login_at,
                'outlets'       => $a->outlets,
                'instansi'      => $a->instansi,
                'created_at'    => $a->created_at,
                'avatar_url'    => $a->avatar_url,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $auditors,
        ]);
    }

    // GET detail auditor
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $auditor = User::role('auditor')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->with('outlets:id,nama,kode_outlet')
            ->find($id);

        if (!$auditor) {
            return response()->json([
                'success' => false,
                'message' => 'Auditor tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $auditor,
        ]);
    }

    // POST buat akun auditor
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
            'outlet_ids' => 'required|array|min:1',
            'outlet_ids.*' => 'integer|exists:outlets,id',
            'instansi'   => 'required|string|max:255',
            'avatar'     => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ], [
            'name.required'      => 'Nama auditor wajib diisi.',
            'email.required'     => 'Email wajib diisi.',
            'email.unique'       => 'Email sudah terdaftar.',
            'password.required'  => 'Password wajib diisi.',
            'password.min'       => 'Password minimal 8 karakter.',
            'password.letters'   => 'Password harus mengandung huruf.',
            'password.mixed'     => 'Password harus mengandung huruf besar dan kecil.',
            'password.numbers'   => 'Password harus mengandung angka.',
            'password.symbols'   => 'Password harus mengandung simbol.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'outlet_ids.required'=> 'Outlet wajib dipilih minimal 1.',
            'outlet_ids.array'   => 'Format outlet tidak valid.',
            'outlet_ids.*.exists'=> 'Outlet tidak ditemukan.',
            'instansi.required'  => 'Instansi wajib diisi.',
            'avatar.image'       => 'File harus berupa gambar.',
            'avatar.mimes'       => 'Format gambar harus jpeg, png, atau jpg.',
            'avatar.max'         => 'Ukuran gambar maksimal 2MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $outletIds = $request->user()->outlets()->pluck('outlets.id');
        $invalidOutlets = collect($request->outlet_ids)->diff($outletIds);
        if ($invalidOutlets->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke beberapa outlet yang dipilih.',
            ], 403);
        }

        $avatarUrl = null;
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('avatars'), $filename);
            $avatarUrl = url('avatars/' . $filename);
        }

        $auditor = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'no_telepon' => $request->no_telepon,
            'is_active'  => true,
            'email_verified_at' => now(),
            'instansi'   => $request->instansi,
            'avatar_url' => $avatarUrl,
        ]);

        $auditor->assignRole('auditor');
        $auditor->outlets()->attach($request->outlet_ids);

        try {
            $loginUrl = config('app.frontend_url') . '/login';
            \Illuminate\Support\Facades\Mail::to($auditor->email)->send(new \App\Mail\AccountCreatedMail($request->email, $request->password, 'Auditor', $loginUrl));
        } catch (\Exception $e) {
            \Log::error('Failed to send account created email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Akun auditor berhasil dibuat.',
            'data'    => [
                'id'         => $auditor->id,
                'name'       => $auditor->name,
                'email'      => $auditor->email,
                'no_telepon' => $auditor->no_telepon,
                'outlet_ids' => $request->outlet_ids,
                'instansi'   => $auditor->instansi,
                'avatar_url' => $auditor->avatar_url,
            ],
        ], 201);
    }

    // PUT update auditor
    public function update(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $auditor = User::role('auditor')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$auditor) {
            return response()->json([
                'success' => false,
                'message' => 'Auditor tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'       => 'sometimes|required|string|max:255',
            'no_telepon' => 'nullable|string|max:20',
            'is_active'  => 'sometimes|boolean',
            'outlet_ids' => 'sometimes|array|min:1',
            'outlet_ids.*' => 'integer|exists:outlets,id',
            'instansi'   => 'sometimes|required|string|max:255',
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
            'name.required'      => 'Nama auditor wajib diisi.',
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

        // FIX: Tangani is_active = false dengan benar (tidak pakai array_filter)
        $updateData = [];
        if ($request->has('name'))       $updateData['name']       = $request->name;
        if ($request->has('no_telepon')) $updateData['no_telepon'] = $request->no_telepon;
        if ($request->has('is_active'))  $updateData['is_active']  = $request->boolean('is_active');
        if ($request->has('instansi'))   $updateData['instansi']   = $request->instansi;
        if ($request->password)          $updateData['password']   = Hash::make($request->password);

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . $auditor->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('avatars'), $filename);
            
            if ($auditor->avatar_url) {
                $oldPath = public_path(parse_url($auditor->avatar_url, PHP_URL_PATH));
                if (file_exists($oldPath) && is_file($oldPath)) {
                    @unlink($oldPath);
                }
            }
            $updateData['avatar_url'] = url('avatars/' . $filename);
        }

        if (!empty($updateData)) {
            $auditor->update($updateData);
        }

        if ($request->has('outlet_ids') && is_array($request->outlet_ids)) {
            $invalidOutlets = collect($request->outlet_ids)->diff($outletIds);
            if ($invalidOutlets->isNotEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke beberapa outlet tersebut.',
                ], 403);
            }
            $auditor->outlets()->sync($request->outlet_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data auditor berhasil diupdate.',
            'data'    => $auditor->fresh()->load('outlets:id,nama'),
        ]);
    }

    // DELETE auditor
    public function destroy(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $auditor = User::role('auditor')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$auditor) {
            return response()->json([
                'success' => false,
                'message' => 'Auditor tidak ditemukan.',
            ], 404);
        }

        $auditor->outlets()->detach();
        $auditor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun auditor berhasil dihapus.',
        ]);
    }
}