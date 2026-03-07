<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class CouponData extends Data
{
    public function __construct(
        public string|Optional $code = new Optional,
        public string|Optional $name = new Optional,
        public string|null|Optional $description = new Optional,
        public string|Optional $discount_type = new Optional,
        public float|Optional $discount_value = new Optional,
        public float|null|Optional $min_order_amount = new Optional,
        public int|null|Optional $max_uses = new Optional,
        public int|null|Optional $max_uses_per_customer = new Optional,
        public string|null|Optional $reset_period = new Optional,
        public array|null|Optional $applicable_to = new Optional,
        public string|Optional $starts_at = new Optional,
        public string|null|Optional $expires_at = new Optional,
        public bool|Optional $is_active = new Optional,
        public bool|Optional $is_public = new Optional,
        public bool|Optional $is_claimable = new Optional,
        public int|null|Optional $claim_validity_hours = new Optional,
        public array|null|Optional $valid_schedule = new Optional,
        public int|null|Optional $target_merchant_id = new Optional,
    ) {}
}
