<?php

namespace Database\Factories;

use App\Models\Merchant;
use App\Models\MerchantBookingSlot;
use Illuminate\Database\Eloquent\Factories\Factory;

class MerchantBookingSlotFactory extends Factory
{
    protected $model = MerchantBookingSlot::class;

    public function definition(): array
    {
        $hour = $this->faker->numberBetween(8, 16);

        return [
            'merchant_id' => Merchant::factory(),
            'day_of_week' => $this->faker->numberBetween(0, 6),
            'start_time' => sprintf('%02d:00', $hour),
            'end_time' => sprintf('%02d:00', $hour + 1),
            'max_capacity' => $this->faker->optional()->numberBetween(1, 20),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
