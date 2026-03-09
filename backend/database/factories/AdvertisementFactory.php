<?php

namespace Database\Factories;

use App\Models\Advertisement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AdvertisementFactory extends Factory
{
    protected $model = Advertisement::class;

    public function definition(): array
    {
        return [
            'merchant_id' => null,
            'title' => fake()->sentence(3),
            'description' => fake()->optional(0.7)->paragraph(),
            'type' => 'banner',
            'placement' => 'homepage_hero',
            'target_audience' => 'all',
            'link_url' => fake()->optional(0.5)->url(),
            'link_text' => fake()->optional(0.5)->words(2, true),
            'is_active' => true,
            'starts_at' => now(),
            'expires_at' => null,
            'sort_order' => 0,
            'impressions' => 0,
            'clicks' => 0,
            'created_by' => User::factory(),
        ];
    }

    public function banner(): static
    {
        return $this->state(fn () => [
            'type' => 'banner',
            'placement' => 'homepage_hero',
        ]);
    }

    public function promotionalCard(): static
    {
        return $this->state(fn () => [
            'type' => 'promotional_card',
            'placement' => 'homepage_sidebar',
        ]);
    }

    public function popup(): static
    {
        return $this->state(fn () => [
            'type' => 'popup',
            'placement' => 'storefront_banner',
        ]);
    }

    public function featuredMerchant(): static
    {
        return $this->state(fn () => [
            'type' => 'featured_merchant',
            'placement' => 'merchant_listing',
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'starts_at' => now()->subDays(30),
            'expires_at' => now()->subDay(),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'is_active' => false,
        ]);
    }
}
