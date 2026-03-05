<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'payable_type' => 'booking',
            'payable_id' => Booking::factory(),
            'payment_method' => null,
            'amount' => fake()->randomFloat(2, 100, 10000),
            'currency' => 'PHP',
            'status' => 'unpaid',
            'gateway' => 'paymongo',
            'refund_status' => 'none',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => 'paid',
            'payment_method' => fake()->randomElement(['card', 'gcash', 'grab_pay', 'maya']),
            'paid_at' => now(),
            'gateway_payment_id' => 'cs_test_' . fake()->uuid(),
            'gateway_reference' => fake()->uuid(),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
            'payment_method' => fake()->randomElement(['card', 'gcash', 'grab_pay', 'maya']),
            'gateway_payment_id' => 'cs_test_' . fake()->uuid(),
            'checkout_url' => 'https://checkout.paymongo.com/test/' . fake()->uuid(),
            'expires_at' => now()->addHours(24),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => 'failed',
            'payment_method' => 'card',
            'gateway_payment_id' => 'cs_test_' . fake()->uuid(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => 'expired',
            'gateway_payment_id' => 'cs_test_' . fake()->uuid(),
            'expires_at' => now()->subHour(),
        ]);
    }

    public function cash(): static
    {
        return $this->state(fn () => [
            'payment_method' => 'cash',
            'gateway' => 'paymongo',
        ]);
    }

    public function online(): static
    {
        return $this->state(fn () => [
            'payment_method' => fake()->randomElement(['card', 'gcash', 'grab_pay', 'maya']),
        ]);
    }
}
