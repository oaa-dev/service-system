<?php

namespace Database\Seeders;

use App\Models\BusinessType;
use Illuminate\Database\Seeder;

class BusinessTypeSeeder extends Seeder
{
    public function run(): void
    {
        $businessTypes = [
            ['name' => 'Resort & Spa', 'slug' => 'resort-spa', 'sort_order' => 1, 'can_sell_products' => true, 'can_take_bookings' => true, 'can_rent_units' => true],
            ['name' => 'Salon & Beauty', 'slug' => 'salon-beauty', 'sort_order' => 2, 'can_sell_products' => true, 'can_take_bookings' => true, 'can_rent_units' => false],
            ['name' => 'Pet Services', 'slug' => 'pet-services', 'sort_order' => 3, 'can_sell_products' => true, 'can_take_bookings' => true, 'can_rent_units' => true],
            ['name' => 'Barbershop', 'slug' => 'barbershop', 'sort_order' => 4, 'can_sell_products' => true, 'can_take_bookings' => true, 'can_rent_units' => false],
            ['name' => 'Flower Shop', 'slug' => 'flower-shop', 'sort_order' => 5, 'can_sell_products' => true, 'can_take_bookings' => false, 'can_rent_units' => false],
            ['name' => 'Camping & Glamping', 'slug' => 'camping-glamping', 'sort_order' => 6, 'can_sell_products' => false, 'can_take_bookings' => true, 'can_rent_units' => true],
            ['name' => 'Restaurant & Cafe', 'slug' => 'restaurant-cafe', 'sort_order' => 7, 'can_sell_products' => true, 'can_take_bookings' => true, 'can_rent_units' => false],
            ['name' => 'Fitness & Gym', 'slug' => 'fitness-gym', 'sort_order' => 8, 'can_sell_products' => false, 'can_take_bookings' => true, 'can_rent_units' => false],
            ['name' => 'Photography Studio', 'slug' => 'photography-studio', 'sort_order' => 9, 'can_sell_products' => true, 'can_take_bookings' => true, 'can_rent_units' => false],
        ];

        foreach ($businessTypes as $businessType) {
            BusinessType::firstOrCreate(
                ['slug' => $businessType['slug']],
                $businessType
            );
        }
    }
}
