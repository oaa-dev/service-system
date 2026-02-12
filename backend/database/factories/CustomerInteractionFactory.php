<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\CustomerInteraction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerInteractionFactory extends Factory
{
    protected $model = CustomerInteraction::class;

    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'type' => fake()->randomElement(['note', 'call', 'complaint', 'inquiry']),
            'description' => fake()->paragraph(),
            'logged_by' => User::factory(),
        ];
    }
}
