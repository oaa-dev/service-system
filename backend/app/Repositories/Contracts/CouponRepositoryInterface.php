<?php

namespace App\Repositories\Contracts;

use App\Models\Coupon;

interface CouponRepositoryInterface extends BaseRepositoryInterface
{
    public function findByCode(string $code): ?Coupon;

    public function getUsageCountForCustomer(int $couponId, int $customerId, ?string $resetPeriod = null): int;
}
