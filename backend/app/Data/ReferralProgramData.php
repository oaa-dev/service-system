<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class ReferralProgramData extends Data
{
    public function __construct(
        public string|Optional $name = new Optional(),
        public string|null|Optional $description = new Optional(),
        public string|Optional $referrer_reward_type = new Optional(),
        public string|Optional $referrer_reward_value = new Optional(),
        public string|Optional $referee_reward_type = new Optional(),
        public string|Optional $referee_reward_value = new Optional(),
        public string|null|Optional $max_referrals_per_customer = new Optional(),
        public string|Optional $code_expiry_days = new Optional(),
        public string|null|Optional $reward_expiry_days = new Optional(),
        public string|Optional $is_active = new Optional(),
        public string|null|Optional $starts_at = new Optional(),
        public string|null|Optional $ends_at = new Optional(),
    ) {}
}
