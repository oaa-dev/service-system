<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyStamp extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'loyalty_card_id',
        'qr_code_id',
        'source',
        'notes',
        'awarded_by',
        'earned_at',
        'expires_at',
        'expired',
    ];

    protected $attributes = [
        'expired' => false,
    ];

    protected function casts(): array
    {
        return [
            'earned_at' => 'datetime',
            'expires_at' => 'datetime',
            'expired' => 'boolean',
        ];
    }

    public function loyaltyCard(): BelongsTo
    {
        return $this->belongsTo(LoyaltyCard::class);
    }

    public function qrCode(): BelongsTo
    {
        return $this->belongsTo(LoyaltyStampQrCode::class, 'qr_code_id');
    }

    public function awardedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'awarded_by');
    }
}
