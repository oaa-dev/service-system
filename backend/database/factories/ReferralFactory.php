<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Referral;
use App\Models\ReferralCode;
use App\Models\ReferralProgram;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReferralFactory extends Factory
{
    protected $model = Referral::class;

    public function definition(): array
    {
        return [
            'referral_code_id' => ReferralCode::factory(),
            'referral_program_id' => ReferralProgram::factory(),
            'referrer_customer_id' => Customer::factory(),
            'referee_customer_id' => Customer::factory(),
            'status' => 'pending',
            'completed_at' => null,
            'qualifying_type' => null,
            'qualifying_id' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(['status' => 'expired']);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => 'cancelled']);
    }
}
