<?php

namespace Database\Factories;

use App\Models\Merchant;
use App\Models\ReferralProgram;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReferralProgramFactory extends Factory
{
    protected $model = ReferralProgram::class;

    public function definition(): array
    {
        return [
            'merchant_id' => Merchant::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'referrer_reward_type' => 'percentage',
            'referrer_reward_value' => 10.00,
            'referee_reward_type' => 'percentage',
            'referee_reward_value' => 15.00,
            'max_referrals_per_customer' => null,
            'code_expiry_days' => 30,
            'reward_expiry_days' => 90,
            'is_active' => true,
            'starts_at' => null,
            'ends_at' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    public function withExpiry(int $days): static
    {
        return $this->state(['reward_expiry_days' => $days]);
    }

    public function percentageRewards(float $referrerPct = 10, float $refereePct = 15): static
    {
        return $this->state([
            'referrer_reward_type' => 'percentage',
            'referrer_reward_value' => $referrerPct,
            'referee_reward_type' => 'percentage',
            'referee_reward_value' => $refereePct,
        ]);
    }

    public function fixedRewards(float $referrerAmt = 50, float $refereeAmt = 100): static
    {
        return $this->state([
            'referrer_reward_type' => 'fixed',
            'referrer_reward_value' => $referrerAmt,
            'referee_reward_type' => 'fixed',
            'referee_reward_value' => $refereeAmt,
        ]);
    }
}
