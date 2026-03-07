<?php

namespace App\Repositories;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Repositories\Contracts\CouponRepositoryInterface;

class CouponRepository extends BaseRepository implements CouponRepositoryInterface
{
    public function __construct(Coupon $model)
    {
        parent::__construct($model);
    }

    public function findByCode(string $code): ?Coupon
    {
        return $this->model->where('code', strtoupper($code))->first();
    }

    public function getUsageCountForCustomer(int $couponId, int $customerId, ?string $resetPeriod = null): int
    {
        $query = CouponUsage::where('coupon_id', $couponId)
            ->where('customer_id', $customerId);

        if ($resetPeriod !== null) {
            $since = match ($resetPeriod) {
                'daily' => now()->startOfDay(),
                'weekly' => now()->startOfWeek(),
                'monthly' => now()->startOfMonth(),
                'yearly' => now()->startOfYear(),
                default => null,
            };

            if ($since !== null) {
                $query->where('used_at', '>=', $since);
            }
        }

        return $query->count();
    }
}
