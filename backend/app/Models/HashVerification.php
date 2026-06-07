<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HashVerification extends Model
{
    protected $fillable = [
        'transaction_id',
        'hash_sha256',
        'previous_hash',
        'status',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}