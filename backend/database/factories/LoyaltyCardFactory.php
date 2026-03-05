<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\LoyaltyCard;
use App\Models\LoyaltyProgram;
use App\Models\Merchant;
use Illuminate\Database\Eloquent\Factories\Factory;

class LoyaltyCardFactory extends Factory
{
    protected $model = LoyaltyCard::class;

    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'merchant_id' => Merchant::factory(),
            'loyalty_program_id' => LoyaltyProgram::factory(),
            'current_stamps' => 0,
            'total_stamps_earned' => 0,
            'total_rewards_earned' => 0,
            'total_rewards_redeemed' => 0,
            'last_stamp_at' => null,
        ];
    }

    public function withProgress(int $stamps = 5): static
    {
        return $this->state(fn () => [
            'current_stamps' => $stamps,
            'total_stamps_earned' => $stamps,
            'last_stamp_at' => now(),
        ]);
    }

    public function withRewards(int $earned = 1, int $redeemed = 0): static
    {
        return $this->state(fn () => [
            'total_rewards_earned' => $earned,
            'total_rewards_redeemed' => $redeemed,
        ]);
    }
}
