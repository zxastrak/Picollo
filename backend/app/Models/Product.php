<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'nama',
        'kategori',
        'harga',
        'modal',
        'satuan',
        'stok',
        'gambar_url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'harga'     => 'decimal:2',
        'modal'     => 'decimal:2',
    ];

    public function outlets()
    {
        return $this->belongsToMany(Outlet::class)->withPivot('stok', 'harga', 'modal');
    }

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class);
    }

    // Hitung estimasi keuntungan dari stok yang ada
    public function getEstimasiKeuntunganAttribute()
    {
        if ($this->modal === null || $this->stok === null) return null;
        return ($this->harga - $this->modal) * $this->stok;
    }
}
