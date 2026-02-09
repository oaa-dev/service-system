<?php

namespace Database\Seeders;

use App\Models\BusinessType;
use Illuminate\Database\Seeder;

class BusinessTypeSeeder extends Seeder
{
    public function run(): void
    {
        $businessTypes = [
            ['name' => 'Restaurant', 'slug' => 'restaurant', 'sort_order' => 1],
            ['name' => 'Retail', 'slug' => 'retail', 'sort_order' => 2],
            ['name' => 'Services', 'slug' => 'services', 'sort_order' => 3],
            ['name' => 'Wholesale', 'slug' => 'wholesale', 'sort_order' => 4],
            ['name' => 'Manufacturing', 'slug' => 'manufacturing', 'sort_order' => 5],
            ['name' => 'Food & Beverage', 'slug' => 'food-beverage', 'sort_order' => 6],
            ['name' => 'Health & Beauty', 'slug' => 'health-beauty', 'sort_order' => 7],
            ['name' => 'Technology', 'slug' => 'technology', 'sort_order' => 8],
        ];

        foreach ($businessTypes as $businessType) {
            BusinessType::firstOrCreate(
                ['slug' => $businessType['slug']],
                $businessType
            );
        }
    }
}
