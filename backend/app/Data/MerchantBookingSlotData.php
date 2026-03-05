<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class MerchantBookingSlotData extends Data
{
    public function __construct(
        public int|Optional $day_of_week = new Optional(),
        public string|Optional $start_time = new Optional(),
        public string|null|Optional $end_time = new Optional(),
        public int|null|Optional $max_capacity = new Optional(),
        public bool|Optional $is_active = new Optional(),
        public int|Optional $sort_order = new Optional(),
    ) {}
}
