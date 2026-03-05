<?php

namespace Database\Factories;

use App\Models\LoyaltyProgram;
use App\Models\LoyaltyStampQrCode;
use App\Models\Merchant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class LoyaltyStampQrCodeFactory extends Factory
{
    protected $model = LoyaltyStampQrCode::class;

    public function definition(): array
    {
        return [
            'merchant_id' => Merchant::factory(),
            'loyalty_program_id' => LoyaltyProgram::factory(),
            'token' => Str::random(64),
            'mode' => 'single_use',
            'expires_at' => now()->addMinutes(2),
            'is_used' => false,
            'scanned_by' => null,
            'scanned_at' => null,
            'scan_count' => 0,
            'created_by' => User::factory(),
            'created_at' => now(),
        ];
    }

    public function daily(): static
    {
        return $this->state(fn () => [
            'mode' => 'daily',
            'expires_at' => now()->endOfDay(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'expires_at' => now()->subMinute(),
        ]);
    }

    public function used(): static
    {
        return $this->state(fn () => [
            'is_used' => true,
            'scanned_at' => now(),
        ]);
    }
}
