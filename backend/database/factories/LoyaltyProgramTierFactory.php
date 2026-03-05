<?php

namespace Database\Factories;

use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramTier;
use Illuminate\Database\Eloquent\Factories\Factory;

class LoyaltyProgramTierFactory extends Factory
{
    protected $model = LoyaltyProgramTier::class;

    public function definition(): array
    {
        return [
            'loyalty_program_id' => LoyaltyProgram::factory(),
            'required_stamps' => fake()->numberBetween(3, 10),
            'reward_type' => fake()->randomElement(['free_product', 'discount_percentage', 'discount_fixed']),
            'reward_value' => fake()->randomFloat(2, 5, 50),
            'reward_product_id' => null,
            'reward_description' => fake()->sentence(),
            'sort_order' => 0,
        ];
    }

    public function freeProduct(): static
    {
        return $this->state(fn () => [
            'reward_type' => 'free_product',
            'reward_value' => null,
        ]);
    }

    public function discountPercentage(float $percentage = 10): static
    {
        return $this->state(fn () => [
            'reward_type' => 'discount_percentage',
            'reward_value' => $percentage,
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
