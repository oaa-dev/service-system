<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\ReferralCode;
use App\Models\ReferralProgram;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ReferralCodeFactory extends Factory
{
    protected $model = ReferralCode::class;

    public function definition(): array
    {
        return [
            'referral_program_id' => ReferralProgram::factory(),
            'customer_id' => Customer::factory(),
            'code' => strtoupper(Str::random(8)),
            'uses_count' => 0,
            'max_uses' => null,
            'expires_at' => null,
            'is_active' => true,
        ];
    }

    public function expired(): static
    {
        return $this->state(['expires_at' => now()->subDay()]);
    }

    public function maxedOut(): static
    {
        return $this->state([
            'max_uses' => 5,
            'uses_count' => 5,
        ]);
    }
}
