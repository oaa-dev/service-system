<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Data\CouponData;
use App\Models\Coupon;
use App\Models\CouponClaim;
use App\Models\CouponUsage;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface CouponServiceInterface
{
    public function getMerchantCoupons(int $merchantId, Request $request): LengthAwarePaginator;

    public function getBranchInheritedCoupons(int $parentMerchantId, int $branchMerchantId, Request $request): LengthAwarePaginator;

    public function getPlatformCoupons(Request $request): LengthAwarePaginator;

    public function getAllCoupons(Request $request): LengthAwarePaginator;

    public function getPublicCouponsForMerchant(int $merchantId, ?int $userId = null): Collection;

    public function getCouponById(int $id): Coupon;

    public function createCoupon(CouponData $data, ?int $merchantId, int $createdBy, ?int $targetMerchantId = null): Coupon;

    public function updateCoupon(int $id, CouponData $data): Coupon;

    public function deleteCoupon(int $id): void;

    public function validateCoupon(string $code, int $merchantId, string $transactionType, float $subtotal, ?int $customerId): array;

    public function applyCoupon(int $couponId, int $customerId, string $usedOnType, int $usedOnId, float $discountAmount): CouponUsage;

    public function calculateDiscount(Coupon $coupon, float $subtotal): float;

    public function claimCoupon(int $couponId, int $userId): CouponClaim;

    public function getClaimedCoupons(int $userId): Collection;

    public function getMyCoupons(int $userId, ?string $status = null): array;
}
