<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class ServiceOrderData extends Data
{
    public function __construct(
        public int|Optional $service_id = new Optional,
        public float|Optional $quantity = new Optional,
        public string|Optional $unit_label = new Optional,
        public string|null|Optional $notes = new Optional,
        public int|null|Optional $loyalty_reward_id = new Optional,
        public string|null|Optional $coupon_code = new Optional,
    ) {}
}
