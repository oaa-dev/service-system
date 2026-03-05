<?php

namespace Database\Factories;

use App\Models\LoyaltyProgram;
use App\Models\Merchant;
use Illuminate\Database\Eloquent\Factories\Factory;

class LoyaltyProgramFactory extends Factory
{
    protected $model = LoyaltyProgram::class;

    public function definition(): array
    {
        return [
            'merchant_id' => Merchant::factory(),
            'name' => fake()->words(3, true).' Rewards',
            'description' => fake()->optional()->sentence(),
            'required_stamps' => fake()->numberBetween(5, 15),
            'stamp_expiry_days' => null,
            'reward_expiry_days' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'is_active' => false,
        ]);
    }

    public function withExpiry(int $stampDays = 30, int $rewardDays = 60): static
    {
        return $this->state(fn () => [
            'stamp_expiry_days' => $stampDays,
            'reward_expiry_days' => $rewardDays,
        ]);
    }
}
