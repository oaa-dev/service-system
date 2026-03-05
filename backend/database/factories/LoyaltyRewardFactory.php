<?php

namespace Database\Factories;

use App\Models\LoyaltyCard;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyReward;
use Illuminate\Database\Eloquent\Factories\Factory;

class LoyaltyRewardFactory extends Factory
{
    protected $model = LoyaltyReward::class;

    public function definition(): array
    {
        return [
            'loyalty_card_id' => LoyaltyCard::factory(),
            'loyalty_program_id' => LoyaltyProgram::factory(),
            'reward_type' => 'discount_percentage',
            'reward_value' => 10.00,
            'reward_product_id' => null,
            'reward_description' => fake()->sentence(),
            'status' => 'available',
            'earned_at' => now(),
            'expires_at' => null,
            'redeemed_at' => null,
            'redeemed_on_type' => null,
            'redeemed_on_id' => null,
        ];
    }

    public function available(): static
    {
        return $this->state(fn () => [
            'status' => 'available',
        ]);
    }

    public function redeemed(): static
    {
        return $this->state(fn () => [
            'status' => 'redeemed',
            'redeemed_at' => now(),
        ]);
    }

    public function expiredReward(): static
    {
        return $this->state(fn () => [
            'status' => 'expired',
            'expires_at' => now()->subDay(),
        ]);
    }

    public function freeProduct(): static
    {
        return $this->state(fn () => [
            'reward_type' => 'free_product',
            'reward_value' => null,
        ]);
    }

    public function discountFixed(float $amount = 100): static
    {
        return $this->state(fn () => [
            'reward_type' => 'discount_fixed',
            'reward_value' => $amount,
        ]);
    }
}
