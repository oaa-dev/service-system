<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'customer_type' => fake()->randomElement(['individual', 'corporate']),
            'company_name' => fake()->optional()->company(),
            'customer_notes' => fake()->optional()->sentence(),
            'loyalty_points' => fake()->numberBetween(0, 1000),
            'customer_tier' => fake()->randomElement(['regular', 'silver', 'gold', 'platinum']),
            'preferred_payment_method' => fake()->optional()->randomElement(['cash', 'e-wallet', 'card']),
            'communication_preference' => fake()->randomElement(['sms', 'email', 'both']),
            'status' => 'active',
        ];
    }

    public function corporate(): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_type' => 'corporate',
            'company_name' => fake()->company(),
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }

    public function banned(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'banned',
        ]);
    }
}
