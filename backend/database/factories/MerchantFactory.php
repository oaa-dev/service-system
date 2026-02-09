<?php

namespace Database\Factories;

use App\Models\Merchant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MerchantFactory extends Factory
{
    protected $model = Merchant::class;

    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'user_id' => User::factory(),
            'type' => 'individual',
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'contact_email' => fake()->safeEmail(),
            'contact_phone' => fake()->numerify('09#########'),
            'website' => fake()->optional()->url(),
            'status' => 'pending',
        ];
    }

    public function individual(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'individual',
        ]);
    }

    public function organization(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'organization',
        ]);
    }

    public function withStatus(string $status): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => $status,
            'status_changed_at' => now(),
        ]);
    }

    public function approved(): static
    {
        return $this->withStatus('approved')->state(fn (array $attributes) => [
            'approved_at' => now(),
        ]);
    }

    public function active(): static
    {
        return $this->withStatus('active')->state(fn (array $attributes) => [
            'approved_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->withStatus('rejected')->state(fn (array $attributes) => [
            'status_reason' => fake()->sentence(),
        ]);
    }

    public function suspended(): static
    {
        return $this->withStatus('suspended')->state(fn (array $attributes) => [
            'status_reason' => fake()->sentence(),
        ]);
    }
}
