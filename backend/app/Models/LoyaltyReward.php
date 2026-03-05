<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class LoyaltyReward extends Model
{
    use HasFactory;

    protected $fillable = [
        'loyalty_card_id',
        'loyalty_program_id',
        'loyalty_program_tier_id',
        'cycle_number',
        'reward_type',
        'reward_value',
        'reward_product_id',
        'reward_description',
        'status',
        'earned_at',
        'expires_at',
        'redeemed_at',
        'redeemed_on_type',
        'redeemed_on_id',
    ];

    protected $attributes = [
        'status' => 'available',
    ];

    protected function casts(): array
    {
        return [
            'reward_value' => 'decimal:2',
            'earned_at' => 'datetime',
            'expires_at' => 'datetime',
            'redeemed_at' => 'datetime',
        ];
    }

    public function loyaltyCard(): BelongsTo
    {
        return $this->belongsTo(LoyaltyCard::class);
    }

    public function loyaltyProgram(): BelongsTo
    {
        return $this->belongsTo(LoyaltyProgram::class);
    }

    public function loyaltyProgramTier(): BelongsTo
    {
        return $this->belongsTo(LoyaltyProgramTier::class);
    }

    public function rewardProduct(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'reward_product_id');
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
