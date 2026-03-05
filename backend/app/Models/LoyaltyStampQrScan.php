<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyStampQrScan extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'qr_code_id',
        'customer_id',
        'scanned_at',
    ];

    protected function casts(): array
    {
        return [
            'scanned_at' => 'datetime',
        ];
    }

    public function qrCode(): BelongsTo
    {
        return $this->belongsTo(LoyaltyStampQrCode::class, 'qr_code_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
