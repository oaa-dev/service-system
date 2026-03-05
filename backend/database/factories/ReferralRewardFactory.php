<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Referral;
use App\Models\ReferralReward;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReferralRewardFactory extends Factory
{
    protected $model = ReferralReward::class;

    public function definition(): array
    {
        return [
            'referral_id' => Referral::factory(),
            'customer_id' => Customer::factory(),
            'reward_type' => 'percentage',
            'reward_value' => 10.00,
            'role' => 'referrer',
            'status' => 'pending',
            'redeemed_at' => null,
            'redeemed_on_type' => null,
            'redeemed_on_id' => null,
            'expires_at' => null,
        ];
    }

    public function available(): static
    {
        return $this->state(['status' => 'available']);
    }

    public function redeemed(): static
    {
        return $this->state([
            'status' => 'redeemed',
            'redeemed_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state([
            'status' => 'expired',
            'expires_at' => now()->subDay(),
        ]);
    }
}
