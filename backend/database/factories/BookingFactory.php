<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Merchant;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        $startHour = $this->faker->numberBetween(8, 16);
        $startTime = sprintf('%02d:00', $startHour);
        $endTime = sprintf('%02d:00', $startHour + 1);

        return [
            'merchant_id' => Merchant::factory(),
            'service_id' => Service::factory(),
            'customer_id' => User::factory(),
            'booking_date' => $this->faker->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'party_size' => 1,
            'service_price' => 0,
            'fee_rate' => 0,
            'fee_amount' => 0,
            'total_amount' => 0,
            'status' => 'pending',
            'notes' => null,
        ];
    }

    public function withFee(float $servicePrice = 500.00, float $feeRate = 5.00): static
    {
        $feeAmount = round($servicePrice * ($feeRate / 100), 2);

        return $this->state(fn () => [
            'service_price' => $servicePrice,
            'fee_rate' => $feeRate,
            'fee_amount' => $feeAmount,
            'total_amount' => round($servicePrice + $feeAmount, 2),
        ]);
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
