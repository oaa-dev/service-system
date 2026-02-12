<?php

namespace Database\Seeders;

use App\Models\PlatformFee;
use Illuminate\Database\Seeder;

class PlatformFeeSeeder extends Seeder
{
    public function run(): void
    {
        $fees = [
            [
                'name' => 'Booking Convenience Fee',
                'slug' => 'booking-convenience-fee',
                'description' => 'Platform fee applied to booking transactions',
                'transaction_type' => 'booking',
                'rate_percentage' => 5.00,
                'sort_order' => 1,
            ],
            [
                'name' => 'Reservation Convenience Fee',
                'slug' => 'reservation-convenience-fee',
                'description' => 'Platform fee applied to reservation transactions',
                'transaction_type' => 'reservation',
                'rate_percentage' => 5.00,
                'sort_order' => 2,
            ],
            [
                'name' => 'Sell Product Convenience Fee',
                'slug' => 'sell-product-convenience-fee',
                'description' => 'Platform fee applied to product sale transactions',
                'transaction_type' => 'sell_product',
                'rate_percentage' => 5.00,
                'sort_order' => 3,
            ],
        ];

        foreach ($fees as $fee) {
            PlatformFee::firstOrCreate(
                ['slug' => $fee['slug']],
                $fee
            );
        }
    }
}
