<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\CouponData;
use App\Exceptions\ApiException;
use App\Models\Coupon;
use App\Models\CouponClaim;
use App\Models\CouponUsage;
use App\Models\Customer;
use App\Models\Merchant;
use App\Repositories\Contracts\CouponRepositoryInterface;
use App\Services\Contracts\CouponServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CouponService implements CouponServiceInterface
{
    public function __construct(
        protected CouponRepositoryInterface $couponRepository
    ) {}

    public function getMerchantCoupons(int $merchantId, Request $request): LengthAwarePaginator
    {
        return QueryBuilder::for(Coupon::where('merchant_id', $merchantId))
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::partial('code'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('discount_type'),
            ])
            ->defaultSort('-created_at')
            ->with(['targetMerchant'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getBranchInheritedCoupons(int $parentMerchantId, int $branchMerchantId, Request $request): LengthAwarePaginator
    {
        return QueryBuilder::for(
            Coupon::visibleToBranch($parentMerchantId, $branchMerchantId)
        )
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::partial('code'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('discount_type'),
            ])
            ->defaultSort('-created_at')
            ->with(['targetMerchant'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getPlatformCoupons(Request $request): LengthAwarePaginator
    {
        return QueryBuilder::for(Coupon::whereNull('merchant_id'))
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::partial('code'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('discount_type'),
            ])
            ->defaultSort('-created_at')
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getAllCoupons(Request $request): LengthAwarePaginator
    {
        return QueryBuilder::for(Coupon::class)
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::partial('code'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('discount_type'),
                AllowedFilter::exact('merchant_id'),
            ])
            ->defaultSort('-created_at')
            ->with(['merchant', 'targetMerchant'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getPublicCouponsForMerchant(int $merchantId, ?int $userId = null): Collection
    {
        $merchant = Merchant::find($merchantId);

        $query = Coupon::where('is_public', true)
            ->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now());
            })
            ->where(function ($q) use ($merchantId, $merchant) {
                $q->where('merchant_id', $merchantId)
                    ->orWhereNull('merchant_id');

                if ($merchant && $merchant->parent_id) {
                    $q->orWhere(function ($sub) use ($merchantId, $merchant) {
                        $sub->where('merchant_id', $merchant->parent_id)
                            ->where(fn ($s) => $s->whereNull('target_merchant_id')
                                ->orWhere('target_merchant_id', $merchantId));
                    });
                }
            })
            ->orderBy('created_at', 'desc');

        if ($userId !== null) {
            $query->with(['claims' => function ($q) use ($userId) {
                $q->where('user_id', $userId);
            }]);
        }

        return $query->get();
    }

    public function getCouponById(int $id): Coupon
    {
        return $this->couponRepository->findOrFail($id)->load(['merchant', 'creator', 'targetMerchant']);
    }

    public function createCoupon(CouponData $data, ?int $merchantId, int $createdBy, ?int $targetMerchantId = null): Coupon
    {
        $attributes = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        // Auto-generate code if not provided
        if (empty($attributes['code'])) {
            $attributes['code'] = $this->generateUniqueCode();
        } else {
            $attributes['code'] = strtoupper($attributes['code']);
        }

        if ($targetMerchantId !== null && $merchantId !== null) {
            $targetMerchant = Merchant::find($targetMerchantId);
            if (! $targetMerchant || $targetMerchant->parent_id !== $merchantId) {
                throw new ApiException('Target merchant must be a branch of your organization', 422);
            }
        }

        $attributes['merchant_id'] = $merchantId;
        $attributes['target_merchant_id'] = $targetMerchantId;
        $attributes['created_by'] = $createdBy;

        return $this->couponRepository->create($attributes);
    }

    public function updateCoupon(int $id, CouponData $data): Coupon
    {
        $attributes = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        if (isset($attributes['code'])) {
            $attributes['code'] = strtoupper($attributes['code']);
        }

        return $this->couponRepository->update($id, $attributes);
    }

    public function deleteCoupon(int $id): void
    {
        $this->couponRepository->delete($id);
    }

    public function validateCoupon(string $code, int $merchantId, string $transactionType, float $subtotal, ?int $customerId): array
    {
        $coupon = $this->couponRepository->findByCode($code);

        if (! $coupon) {
            throw new ApiException('Coupon not found', 404);
        }

        if (! $coupon->is_active) {
            throw new ApiException('Coupon is not active', 422);
        }

        if ($coupon->starts_at > now()) {
            throw new ApiException('Coupon is not yet valid', 422);
        }

        if ($coupon->expires_at !== null && $coupon->expires_at < now()) {
            throw new ApiException('Coupon has expired', 422);
        }

        if (! $coupon->isWithinSchedule()) {
            $schedule = $coupon->valid_schedule;
            $dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            $days = implode(', ', array_map(fn ($d) => $dayNames[$d] ?? $d, $schedule['days'] ?? []));
            $message = "This coupon is only valid on {$days}";
            if (isset($schedule['start_time'], $schedule['end_time'])) {
                $message .= " between {$schedule['start_time']} and {$schedule['end_time']}";
            }
            throw new ApiException($message, 422);
        }

        if (! $coupon->isValidForMerchant($merchantId)) {
            throw new ApiException('Coupon is not valid for this merchant', 422);
        }

        if (! $coupon->isApplicableTo($transactionType)) {
            throw new ApiException('Coupon is not applicable to this transaction type', 422);
        }

        if ($coupon->max_uses !== null && $coupon->used_count >= $coupon->max_uses) {
            throw new ApiException('Coupon usage limit reached', 422);
        }

        if ($customerId !== null && $coupon->max_uses_per_customer !== null) {
            $usageCount = $this->couponRepository->getUsageCountForCustomer($coupon->id, $customerId, $coupon->reset_period);
            if ($usageCount >= $coupon->max_uses_per_customer) {
                if ($coupon->reset_period) {
                    $periodLabels = ['daily' => 'today', 'weekly' => 'this week', 'monthly' => 'this month', 'yearly' => 'this year'];
                    throw new ApiException('You have already used this coupon the maximum number of times '.$periodLabels[$coupon->reset_period], 422);
                }
                throw new ApiException('You have already used this coupon the maximum number of times', 422);
            }
        }

        // Check claimable coupons require an active claim
        if ($coupon->is_claimable) {
            $userId = auth()->id();
            if (! $userId) {
                throw new ApiException('You must be logged in to use this coupon', 401);
            }

            $claim = CouponClaim::where('coupon_id', $coupon->id)
                ->where('user_id', $userId)
                ->first();

            if (! $claim) {
                throw new ApiException('You must claim this coupon first', 422);
            }

            if ($claim->used_at !== null) {
                throw new ApiException('You have already used this claimed coupon', 422);
            }

            if ($claim->isExpired()) {
                throw new ApiException('Your claimed coupon has expired', 422);
            }
        }

        $discountAmount = $this->calculateDiscount($coupon, $subtotal);

        if ($coupon->min_order_amount !== null && $subtotal < (float) $coupon->min_order_amount) {
            throw new ApiException('Minimum order amount of '.number_format((float) $coupon->min_order_amount, 2).' not met', 422);
        }

        return [
            'coupon' => $coupon,
            'discount_amount' => $discountAmount,
        ];
    }

    public function applyCoupon(int $couponId, int $customerId, string $usedOnType, int $usedOnId, float $discountAmount): CouponUsage
    {
        // Atomic increment to handle race conditions
        Coupon::where('id', $couponId)->increment('used_count');

        return CouponUsage::create([
            'coupon_id' => $couponId,
            'customer_id' => $customerId,
            'used_on_type' => $usedOnType,
            'used_on_id' => $usedOnId,
            'discount_amount' => $discountAmount,
            'used_at' => now(),
        ]);
    }

    public function calculateDiscount(Coupon $coupon, float $subtotal): float
    {
        return match ($coupon->discount_type) {
            'percentage' => min($subtotal, round($subtotal * (float) $coupon->discount_value / 100, 2)),
            'fixed' => min($subtotal, (float) $coupon->discount_value),
            'free_product' => $subtotal,
            default => 0,
        };
    }

    public function claimCoupon(int $couponId, int $userId): CouponClaim
    {
        $coupon = $this->couponRepository->findOrFail($couponId);

        if (! $coupon->is_active) {
            throw new ApiException('Coupon is not active', 422);
        }

        if ($coupon->starts_at > now()) {
            throw new ApiException('Coupon is not yet valid', 422);
        }

        if ($coupon->expires_at !== null && $coupon->expires_at < now()) {
            throw new ApiException('Coupon has expired', 422);
        }

        if ($coupon->max_uses !== null && $coupon->used_count >= $coupon->max_uses) {
            throw new ApiException('Coupon usage limit reached', 422);
        }

        $existingClaim = CouponClaim::where('coupon_id', $couponId)
            ->where('user_id', $userId)
            ->first();

        if ($existingClaim) {
            // If claim is still active (not expired, not used), return it
            if (! $existingClaim->isExpired() && $existingClaim->used_at === null) {
                return $existingClaim;
            }

            // If expired or used, delete and create new
            $existingClaim->delete();
        }

        // Claimable coupons use claim_validity_hours; others use coupon's own expires_at or 1 year
        $expiresAt = $coupon->claim_validity_hours
            ? now()->addHours($coupon->claim_validity_hours)
            : ($coupon->expires_at ?? now()->addYear());

        return CouponClaim::create([
            'coupon_id' => $couponId,
            'user_id' => $userId,
            'claimed_at' => now(),
            'expires_at' => $expiresAt,
        ]);
    }

    public function getClaimedCoupons(int $userId): Collection
    {
        return CouponClaim::where('user_id', $userId)
            ->where('expires_at', '>=', now())
            ->whereNull('used_at')
            ->with('coupon')
            ->orderBy('expires_at', 'asc')
            ->get();
    }

    public function getMyCoupons(int $userId, ?string $status = null): array
    {
        $items = collect();

        // 1. Get coupon claims for this user
        $claims = CouponClaim::where('user_id', $userId)
            ->with('coupon.merchant')
            ->orderBy('claimed_at', 'desc')
            ->get();

        foreach ($claims as $claim) {
            if ($claim->used_at !== null) {
                continue; // Skip used claims — the usage record covers it
            }

            $isExpired = $claim->expires_at < now();
            $claimStatus = $isExpired ? 'expired' : 'active';

            if ($status !== null && $status !== $claimStatus) {
                continue;
            }

            $items->push([
                'id' => $claim->id,
                'type' => 'claim',
                'status' => $claimStatus,
                'coupon' => $claim->coupon,
                'claimed_at' => $claim->claimed_at->toISOString(),
                'expires_at' => $claim->expires_at->toISOString(),
                'used_at' => null,
                'used_on_type' => null,
                'used_on_id' => null,
                'discount_amount' => null,
            ]);
        }

        // 2. Get coupon usages for this customer
        $customerId = Customer::where('user_id', $userId)->first()?->id;

        if ($customerId) {
            $usages = CouponUsage::where('customer_id', $customerId)
                ->with('coupon.merchant')
                ->orderBy('used_at', 'desc')
                ->get();

            foreach ($usages as $usage) {
                if ($status !== null && $status !== 'used') {
                    continue;
                }

                $items->push([
                    'id' => $usage->id,
                    'type' => 'usage',
                    'status' => 'used',
                    'coupon' => $usage->coupon,
                    'claimed_at' => null,
                    'expires_at' => null,
                    'used_at' => $usage->used_at->toISOString(),
                    'used_on_type' => $usage->used_on_type,
                    'used_on_id' => $usage->used_on_id,
                    'discount_amount' => $usage->discount_amount,
                ]);
            }
        }

        // Sort: active claims by expires_at ASC (urgency), then everything else by most recent
        return $items->sortBy(function ($item) {
            if ($item['status'] === 'active') {
                return '0_' . $item['expires_at']; // Active first, sorted by soonest expiry
            }
            return '1_' . ($item['used_at'] ?? $item['expires_at'] ?? ''); // Then by recency desc
        })->values()->toArray();
    }

    protected function generateUniqueCode(): string
    {
        $maxAttempts = 5;
        for ($i = 0; $i < $maxAttempts; $i++) {
            $code = Str::upper(Str::random(8));
            if (! $this->couponRepository->findByCode($code)) {
                return $code;
            }
        }

        throw new ApiException('Failed to generate unique coupon code', 500);
    }
}
