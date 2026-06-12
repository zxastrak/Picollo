<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OutletController extends Controller
{
    // GET semua outlet milik admin
    public function index(Request $request)
    {
        $outlets = $request->user()
            ->outlets()
            ->withCount('products') // jumlah produk per outlet
            ->withCount(['transactions as total_transaksi' => function ($query) {
                $query->where('status', 'success');
            }])
            ->withSum(['transactions as total_omzet' => function ($query) {
                $query->where('status', 'success');
            }], 'total_amount')
            ->withCount(['users as total_kasir' => function ($query) {
                $query->whereHas('roles', function ($q) {
                    $q->where('name', 'kasir');
                });
            }])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $outlets,
        ]);
    }

    // GET detail satu outlet
    public function show(Request $request, $id)
    {
        $outlet = $request->user()
            ->outlets()
            ->withCount('products')
            ->withCount(['users as total_kasir' => function ($query) {
                $query->whereHas('roles', function ($q) {
                    $q->where('name', 'kasir');
                });
            }])
            ->find($id);

        if (!$outlet) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $outlet,
        ]);
    }

    // POST buat outlet baru
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama'   => 'required|string|max:255',
            'alamat' => 'nullable|string|max:255',
            'kota'   => 'nullable|string|max:255',
        ], [
            'nama.required' => 'Nama outlet wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $outlet = Outlet::create([
            'nama'        => $request->nama,
            'alamat'      => $request->alamat,
            'kota'        => $request->kota,
            'kode_outlet' => 'OT-' . strtoupper(Str::random(6)),
            'status'      => 'aktif',
        ]);

        // Hubungkan ke admin
        $request->user()->outlets()->attach($outlet->id);

        return response()->json([
            'success' => true,
            'message' => 'Outlet berhasil dibuat.',
            'data'    => $outlet,
        ], 201);
    }

    // PUT update outlet
    public function update(Request $request, $id)
    {
        $outlet = $request->user()->outlets()->find($id);

        if (!$outlet) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama'   => 'sometimes|required|string|max:255',
            'alamat' => 'nullable|string|max:255',
            'kota'   => 'nullable|string|max:255',
            'status' => 'sometimes|in:aktif,nonaktif',
        ], [
            'nama.required'  => 'Nama outlet wajib diisi.',
            'status.in'      => 'Status harus aktif atau nonaktif.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $outlet->update($request->only('nama', 'alamat', 'kota', 'status'));

        return response()->json([
            'success' => true,
            'message' => 'Outlet berhasil diupdate.',
            'data'    => $outlet,
        ]);
    }

    // DELETE outlet
    public function destroy(Request $request, $id)
    {
        $outlet = $request->user()->outlets()->find($id);

        if (!$outlet) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak ditemukan.',
            ], 404);
        }

        // Cegah hapus kalau masih ada produk
        if ($outlet->products()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak bisa dihapus karena masih memiliki produk.',
            ], 422);
        }

        // Lepas relasi pivot dulu, baru hapus
        $request->user()->outlets()->detach($id);
        $outlet->delete();

        return response()->json([
            'success' => true,
            'message' => 'Outlet berhasil dihapus.',
        ]);
    }

    // GET produk untuk outlet tertentu
    public function getProducts(Request $request, $id)
    {
        $outlet = $request->user()->outlets()->find($id);

        if (!$outlet) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak ditemukan.',
            ], 404);
        }

        $products = $outlet->products()->withPivot('stok', 'harga', 'modal')->get();

        return response()->json([
            'success' => true,
            'data'    => $products,
        ]);
    }

    // POST sinkronisasi produk dan stok untuk outlet
    public function syncProducts(Request $request, $id)
    {
        $outlet = $request->user()->outlets()->find($id);

        if (!$outlet) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'products' => 'present|array',
            'products.*.id' => 'required|integer|exists:products,id',
            'products.*.stok' => 'required|integer',
            'products.*.harga' => 'nullable|numeric|min:0',
            'products.*.modal' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $syncData = [];
        foreach ($request->products as $item) {
            $syncData[$item['id']] = [
                'stok'  => $item['stok'],
                'harga' => $item['harga'] ?? null,
                'modal' => $item['modal'] ?? null,
            ];
        }

        $outlet->products()->sync($syncData);

        return response()->json([
            'success' => true,
            'message' => 'Menu dan stok berhasil diperbarui.',
        ]);
    }
}