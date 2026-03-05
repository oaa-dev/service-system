<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class LoyaltyProgramData extends Data
{
    public function __construct(
        public string|Optional $name = new Optional(),
        public string|null|Optional $description = new Optional(),
        public int|Optional $required_stamps = new Optional(),
        public int|null|Optional $stamp_expiry_days = new Optional(),
        public int|null|Optional $reward_expiry_days = new Optional(),
        public bool|Optional $is_active = new Optional(),
    ) {}
}
