<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyProgram extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'name',
        'description',
        'required_stamps',
        'stamp_expiry_days',
        'reward_expiry_days',
        'is_active',
    ];

    protected $attributes = [
        'is_active' => true,
    ];

    protected function casts(): array
    {
        return [
            'required_stamps' => 'integer',
            'stamp_expiry_days' => 'integer',
            'reward_expiry_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function tiers(): HasMany
    {
        return $this->hasMany(LoyaltyProgramTier::class)->orderBy('required_stamps');
    }

    public function loyaltyCards(): HasMany
    {
        return $this->hasMany(LoyaltyCard::class);
    }

    public function qrCodes(): HasMany
    {
        return $this->hasMany(LoyaltyStampQrCode::class);
    }
}
