<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Outlet extends Model
{
    protected $fillable = [
        'nama',
        'alamat',
        'kota',
        'kode_outlet',
        'status',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'admin_outlet', 'outlet_id', 'user_id');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class)->withPivot('stok', 'harga', 'modal');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}