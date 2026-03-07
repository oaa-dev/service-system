<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'target_merchant_id',
        'code',
        'name',
        'description',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_uses',
        'max_uses_per_customer',
        'used_count',
        'reset_period',
        'applicable_to',
        'starts_at',
        'expires_at',
        'is_active',
        'is_public',
        'is_claimable',
        'claim_validity_hours',
        'valid_schedule',
        'created_by',
    ];

    protected $attributes = [
        'is_active' => true,
        'is_public' => false,
        'is_claimable' => false,
        'used_count' => 0,
        'discount_type' => 'percentage',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'min_order_amount' => 'decimal:2',
            'max_uses' => 'integer',
            'max_uses_per_customer' => 'integer',
            'used_count' => 'integer',
            'applicable_to' => 'array',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'is_claimable' => 'boolean',
            'claim_validity_hours' => 'integer',
            'valid_schedule' => 'array',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function targetMerchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class, 'target_merchant_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(CouponClaim::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeValid(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where(function (Builder $q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now());
            });
    }

    public function scopePublic(Builder $query): Builder
    {
        return $query->where('is_public', true)->valid();
    }

    public function isWithinSchedule(): bool
    {
        if ($this->valid_schedule === null) {
            return true;
        }

        $now = now();
        $schedule = $this->valid_schedule;

        if (! in_array($now->dayOfWeek, $schedule['days'] ?? [])) {
            return false;
        }

        if (isset($schedule['start_time'], $schedule['end_time'])) {
            $currentTime = $now->format('H:i');
            if ($currentTime < $schedule['start_time'] || $currentTime > $schedule['end_time']) {
                return false;
            }
        }

        return true;
    }

    public function isApplicableTo(string $transactionType): bool
    {
        if ($this->applicable_to === null) {
            return true;
        }

        return in_array($transactionType, $this->applicable_to);
    }

    public function isValidForMerchant(int $merchantId): bool
    {
        if ($this->merchant_id === null) {
            return true;
        }

        if ($this->target_merchant_id !== null) {
            return $this->target_merchant_id === $merchantId;
        }

        if ($this->merchant_id === $merchantId) {
            return true;
        }

        $merchant = Merchant::find($merchantId);

        return $merchant && $merchant->parent_id === $this->merchant_id;
    }

    public function scopeVisibleToBranch(Builder $query, int $parentMerchantId, int $branchMerchantId): Builder
    {
        return $query->where('merchant_id', $parentMerchantId)
            ->where(function (Builder $q) use ($branchMerchantId) {
                $q->whereNull('target_merchant_id')
                    ->orWhere('target_merchant_id', $branchMerchantId);
            });
    }
}
