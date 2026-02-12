<?php

namespace Database\Factories;

use App\Models\Merchant;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReservationFactory extends Factory
{
    public function definition(): array
    {
        $checkIn = $this->faker->dateTimeBetween('+1 day', '+30 days');
        $nights = $this->faker->numberBetween(1, 7);
        $checkOut = (clone $checkIn)->modify("+{$nights} days");
        $pricePerNight = $this->faker->randomFloat(2, 1000, 10000);

        return [
            'merchant_id' => Merchant::factory(),
            'service_id' => Service::factory()->reservation(),
            'customer_id' => User::factory(),
            'check_in' => $checkIn->format('Y-m-d'),
            'check_out' => $checkOut->format('Y-m-d'),
            'guest_count' => $this->faker->numberBetween(1, 4),
            'nights' => $nights,
            'price_per_night' => $pricePerNight,
            'total_price' => $nights * $pricePerNight,
            'fee_rate' => 0,
            'fee_amount' => 0,
            'total_amount' => $nights * $pricePerNight,
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

    public function confirmed(): static
    {
        return $this->state(fn () => [
            'status' => 'confirmed',
            'confirmed_at' => now(),
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
