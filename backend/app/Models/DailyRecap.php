<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyRecap extends Model
{
    protected $fillable = [
        'outlet_id',
        'user_id',
        'tanggal',
        'total_transaksi',
        'total_amount',
        'total_qris',
        'total_tunai',
        'hash_rekap',
        'status',
        'approved_by',
        'submitted_at',
        'catatan',
    ];

    protected $casts = [
        'tanggal'      => 'date',
        'submitted_at' => 'datetime',
        'total_amount' => 'decimal:2',
        'total_qris'   => 'decimal:2',
        'total_tunai'  => 'decimal:2',
    ];

    public function outlet()
    {
        return $this->belongsTo(Outlet::class);
    }

    public function kasir()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}