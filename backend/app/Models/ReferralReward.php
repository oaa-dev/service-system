<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ReferralReward extends Model
{
    use HasFactory;

    protected $fillable = [
        'referral_id',
        'customer_id',
        'reward_type',
        'reward_value',
        'role',
        'status',
        'redeemed_at',
        'redeemed_on_type',
        'redeemed_on_id',
        'expires_at',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    protected function casts(): array
    {
        return [
            'reward_value' => 'decimal:2',
            'redeemed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function redeemedOn(): MorphTo
    {
        return $this->morphTo('redeemed_on');
    }

    public function isAvailable(): bool
    {
        if ($this->status !== 'available') {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}
