<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    // GET semua produk
    public function index(Request $request)
    {
        // Jika admin, kembalikan semua produk. Jika kasir, kembalikan produk outletnya saja.
        if ($request->user()->hasRole('admin')) {
            $products = Product::with('outlets:id,nama')
                ->orderByDesc('created_at')
                ->get();
        } else {
            $outletIds = $request->user()->outlets()->pluck('outlets.id');
            $products = Product::whereHas('outlets', function($q) use ($outletIds) {
                $q->whereIn('outlets.id', $outletIds);
            })
                ->with(['outlets' => function($q) use ($outletIds) {
                    $q->whereIn('outlets.id', $outletIds);
                }])
                ->orderByDesc('created_at')
                ->get();

            // Override harga and modal with pivot values if available
            foreach ($products as $product) {
                if ($product->outlets->isNotEmpty()) {
                    $pivot = $product->outlets->first()->pivot;
                    if ($pivot->harga !== null) {
                        $product->harga = $pivot->harga;
                    }
                    if ($pivot->modal !== null) {
                        $product->modal = $pivot->modal;
                    }
                }
                // Sembunyikan field modal jika user adalah kasir
                if ($request->user()->hasRole('kasir')) {
                    $product->makeHidden(['modal']);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $products,
        ]);
    }

    // GET detail produk
    public function show(Request $request, $id)
    {
        if ($request->user()->hasRole('admin')) {
            $product = Product::with('outlets:id,nama')->find($id);
        } else {
            $outletIds = $request->user()->outlets()->pluck('outlets.id');
            $product = Product::whereHas('outlets', function($q) use ($outletIds) {
                $q->whereIn('outlets.id', $outletIds);
            })
                ->with(['outlets' => function($q) use ($outletIds) {
                    $q->whereIn('outlets.id', $outletIds);
                }])
                ->find($id);

            // Override harga and modal with pivot values if available
            if ($product && $product->outlets->isNotEmpty()) {
                $pivot = $product->outlets->first()->pivot;
                if ($pivot->harga !== null) {
                    $product->harga = $pivot->harga;
                }
                if ($pivot->modal !== null) {
                    $product->modal = $pivot->modal;
                }
            }
            if ($product && $request->user()->hasRole('kasir')) {
                $product->makeHidden(['modal']);
            }
        }

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $product,
        ]);
    }

    // POST buat produk baru
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama'         => 'required|string|max:255',
            'kategori'     => 'nullable|string|max:255',
            'harga'        => 'required|numeric|min:0',
            'satuan'       => 'nullable|string|max:255',
            'modal'        => 'nullable|numeric|min:0',
            'stok'         => 'nullable|integer|min:0', // Legacy stok (optional)
            'gambar_url'   => 'nullable|string',
        ], [
            'nama.required'       => 'Nama produk wajib diisi.',
            'harga.required'      => 'Harga wajib diisi.',
            'harga.numeric'       => 'Harga harus berupa angka.',
            'harga.min'           => 'Harga tidak boleh minus.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $gambarUrl = null;
        if ($request->gambar_url && preg_match('/^data:image\/(\w+);base64,/', $request->gambar_url, $type)) {
            $data = substr($request->gambar_url, strpos($request->gambar_url, ',') + 1);
            $type = strtolower($type[1]);
            $data = base64_decode($data);
            $fileName = 'products/' . uniqid() . '.' . $type;
            \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $data);
            $gambarUrl = asset('storage/' . $fileName);
        } else {
            $gambarUrl = $request->gambar_url;
        }

        $product = Product::create([
            'nama'       => $request->nama,
            'kategori'   => $request->kategori,
            'harga'      => $request->harga,
            'satuan'     => $request->satuan ?? 'pcs',
            'modal'      => $request->modal,
            'stok'       => $request->stok ?? 0,
            'gambar_url' => $gambarUrl,
            'is_active'  => true,
        ]);

        // Tidak ada lagi sinkronisasi otomatis ke outlet_ids saat create master katalog
        
        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke katalog master.',
            'data'    => $product->load('outlets:id,nama'),
        ], 201);
    }

    // PUT update produk
    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama'       => 'sometimes|required|string|max:255',
            'kategori'   => 'nullable|string|max:255',
            'harga'      => 'sometimes|required|numeric|min:0',
            'satuan'     => 'nullable|string|max:255',
            'modal'      => 'nullable|numeric|min:0',
            'stok'       => 'nullable|integer|min:0',
            'gambar_url' => 'nullable|string',
            'is_active'  => 'sometimes|boolean',
        ], [
            'nama.required'  => 'Nama produk wajib diisi.',
            'harga.required' => 'Harga wajib diisi.',
            'harga.numeric'  => 'Harga harus berupa angka.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $dataToUpdate = $request->only('nama', 'kategori', 'harga', 'modal', 'satuan', 'stok', 'is_active');

        if ($request->has('gambar_url')) {
            if ($request->gambar_url && preg_match('/^data:image\/(\w+);base64,/', $request->gambar_url, $type)) {
                $data = substr($request->gambar_url, strpos($request->gambar_url, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                $fileName = 'products/' . uniqid() . '.' . $type;
                \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $data);
                $dataToUpdate['gambar_url'] = asset('storage/' . $fileName);
            } else {
                $dataToUpdate['gambar_url'] = $request->gambar_url;
            }
        }

        $product->update($dataToUpdate);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diupdate.',
            'data'    => $product->fresh()->load('outlets:id,nama'),
        ]);
    }

    // DELETE produk
    public function destroy(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.',
        ]);
    }
}