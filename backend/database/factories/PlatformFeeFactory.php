<?php

namespace Database\Factories;

use App\Models\PlatformFee;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PlatformFeeFactory extends Factory
{
    protected $model = PlatformFee::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'transaction_type' => fake()->randomElement(['booking', 'reservation', 'sell_product']),
            'rate_percentage' => fake()->randomFloat(2, 1, 15),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function booking(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'booking',
        ]);
    }

    public function reservation(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'reservation',
        ]);
    }

    public function sellProduct(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'sell_product',
        ]);
    }
}
