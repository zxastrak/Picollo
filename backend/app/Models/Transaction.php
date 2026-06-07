<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'transaction_code',
        'outlet_id',
        'user_id',
        'total_amount',
        'metode_pembayaran',
        'payment_reference',
        'status',
        'catatan',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    public function outlet()
    {
        return $this->belongsTo(Outlet::class, 'outlet_id');
    }

    public function kasir()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function hashVerification()
    {
        return $this->hasOne(HashVerification::class);
    }

    public function correctionLogs()
    {
        return $this->hasMany(CorrectionLog::class);
    }
}
