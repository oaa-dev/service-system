<?php

namespace Database\Factories;

use App\Models\Merchant;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceOrderFactory extends Factory
{
    public function definition(): array
    {
        $quantity = $this->faker->randomFloat(2, 1, 20);
        $unitPrice = $this->faker->randomFloat(2, 50, 500);

        return [
            'merchant_id' => Merchant::factory(),
            'service_id' => Service::factory(),
            'customer_id' => User::factory(),
            'order_number' => 'ORD-' . now()->format('Ymd') . '-' . str_pad($this->faker->unique()->numberBetween(1, 9999), 3, '0', STR_PAD_LEFT),
            'quantity' => $quantity,
            'unit_label' => $this->faker->randomElement(['kg', 'pcs', 'gal', 'load']),
            'unit_price' => $unitPrice,
            'total_price' => round($quantity * $unitPrice, 2),
            'fee_rate' => 0,
            'fee_amount' => 0,
            'total_amount' => round($quantity * $unitPrice, 2),
            'status' => 'pending',
        ];
    }

    public function withFee(float $feeRate = 5.00): static
    {
        return $this->state(function (array $attributes) use ($feeRate) {
            $totalPrice = $attributes['total_price'];
            $feeAmount = round($totalPrice * ($feeRate / 100), 2);

            return [
                'fee_rate' => $feeRate,
                'fee_amount' => $feeAmount,
                'total_amount' => round($totalPrice + $feeAmount, 2),
            ];
        });
    }

    public function received(): static
    {
        return $this->state(fn () => [
            'status' => 'received',
            'received_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }
}
