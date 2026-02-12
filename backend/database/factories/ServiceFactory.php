<?php

namespace Database\Factories;

use App\Models\Merchant;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'merchant_id' => Merchant::factory(),
            'service_category_id' => ServiceCategory::factory(),
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 5, 500),
            'is_active' => true,
            'service_type' => 'sellable',
            'sku' => null,
            'stock_quantity' => null,
            'track_stock' => false,
            'duration' => null,
            'max_capacity' => 1,
            'requires_confirmation' => false,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function sellable(): static
    {
        return $this->state(fn (array $attributes) => [
            'service_type' => 'sellable',
        ]);
    }

    public function bookable(int $duration = 60): static
    {
        return $this->state(fn (array $attributes) => [
            'service_type' => 'bookable',
            'duration' => $duration,
        ]);
    }

    public function reservation(float $pricePerNight = 2500.00): static
    {
        return $this->state(fn (array $attributes) => [
            'service_type' => 'reservation',
            'price_per_night' => $pricePerNight,
            'floor' => fake()->randomElement(['1st', '2nd', '3rd', 'Ground']),
            'unit_status' => 'available',
            'amenities' => fake()->randomElements(['WiFi', 'Parking', 'Pool', 'AC', 'TV', 'Mini Bar'], 3),
        ]);
    }
}
