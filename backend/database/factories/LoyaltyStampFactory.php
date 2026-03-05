<?php

namespace Database\Factories;

use App\Models\LoyaltyCard;
use App\Models\LoyaltyStamp;
use Illuminate\Database\Eloquent\Factories\Factory;

class LoyaltyStampFactory extends Factory
{
    protected $model = LoyaltyStamp::class;

    public function definition(): array
    {
        return [
            'loyalty_card_id' => LoyaltyCard::factory(),
            'qr_code_id' => null,
            'source' => 'qr_scan',
            'notes' => null,
            'awarded_by' => null,
            'earned_at' => now(),
            'expires_at' => null,
            'expired' => false,
        ];
    }

    public function bonus(?string $notes = null): static
    {
        return $this->state(fn () => [
            'source' => 'bonus',
            'notes' => $notes ?? fake()->sentence(),
        ]);
    }

    public function expiredStamp(): static
    {
        return $this->state(fn () => [
            'expires_at' => now()->subDay(),
            'expired' => true,
        ]);
    }
}
