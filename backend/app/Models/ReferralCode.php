<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReferralCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'referral_program_id',
        'customer_id',
        'code',
        'uses_count',
        'max_uses',
        'expires_at',
        'is_active',
    ];

    protected $attributes = [
        'uses_count' => 0,
        'is_active' => true,
    ];

    protected function casts(): array
    {
        return [
            'uses_count' => 'integer',
            'max_uses' => 'integer',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function referralProgram(): BelongsTo
    {
        return $this->belongsTo(ReferralProgram::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_uses !== null && $this->uses_count >= $this->max_uses) {
            return false;
        }

        return true;
    }
}
