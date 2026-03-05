<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'merchant_id',
        'loyalty_program_id',
        'current_stamps',
        'total_stamps_earned',
        'total_rewards_earned',
        'total_rewards_redeemed',
        'cycle_number',
        'last_stamp_at',
    ];

    protected $attributes = [
        'current_stamps' => 0,
        'total_stamps_earned' => 0,
        'total_rewards_earned' => 0,
        'total_rewards_redeemed' => 0,
        'cycle_number' => 1,
    ];

    protected function casts(): array
    {
        return [
            'current_stamps' => 'integer',
            'total_stamps_earned' => 'integer',
            'total_rewards_earned' => 'integer',
            'total_rewards_redeemed' => 'integer',
            'cycle_number' => 'integer',
            'last_stamp_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function loyaltyProgram(): BelongsTo
    {
        return $this->belongsTo(LoyaltyProgram::class);
    }

    public function stamps(): HasMany
    {
        return $this->hasMany(LoyaltyStamp::class);
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(LoyaltyReward::class);
    }
}
