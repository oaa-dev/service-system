<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        return [
            'merchant_id' => Merchant::factory(),
            'customer_id' => Customer::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'title' => fake()->optional(0.7)->sentence(4),
            'comment' => fake()->optional(0.8)->paragraph(),
            'is_verified' => true,
            'is_published' => true,
            'merchant_reply' => null,
            'merchant_replied_at' => null,
            'admin_notes' => null,
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn () => [
            'is_published' => false,
        ]);
    }

    public function withReply(): static
    {
        return $this->state(fn () => [
            'merchant_reply' => fake()->paragraph(),
            'merchant_replied_at' => now(),
        ]);
    }

    public function withAdminNotes(): static
    {
        return $this->state(fn () => [
            'admin_notes' => fake()->sentence(),
        ]);
    }

    public function rating(int $stars): static
    {
        return $this->state(fn () => [
            'rating' => $stars,
        ]);
    }
}
