<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReferralProgram extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'name',
        'description',
        'referrer_reward_type',
        'referrer_reward_value',
        'referee_reward_type',
        'referee_reward_value',
        'max_referrals_per_customer',
        'code_expiry_days',
        'reward_expiry_days',
        'is_active',
        'starts_at',
        'ends_at',
    ];

    protected $attributes = [
        'is_active' => true,
        'code_expiry_days' => 30,
    ];

    protected function casts(): array
    {
        return [
            'referrer_reward_value' => 'decimal:2',
            'referee_reward_value' => 'decimal:2',
            'max_referrals_per_customer' => 'integer',
            'code_expiry_days' => 'integer',
            'reward_expiry_days' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function referralCodes(): HasMany
    {
        return $this->hasMany(ReferralCode::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }
}
