<?php

namespace Database\Seeders;

use App\Models\CustomerTag;
use Illuminate\Database\Seeder;

class CustomerTagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['name' => 'VIP', 'slug' => 'vip', 'color' => '#FFD700', 'sort_order' => 1],
            ['name' => 'Wholesale', 'slug' => 'wholesale', 'color' => '#4CAF50', 'sort_order' => 2],
            ['name' => 'Frequent Buyer', 'slug' => 'frequent-buyer', 'color' => '#2196F3', 'sort_order' => 3],
            ['name' => 'New Customer', 'slug' => 'new-customer', 'color' => '#9C27B0', 'sort_order' => 4],
            ['name' => 'Corporate', 'slug' => 'corporate', 'color' => '#FF5722', 'sort_order' => 5],
        ];

        foreach ($tags as $tag) {
            CustomerTag::firstOrCreate(
                ['slug' => $tag['slug']],
                $tag
            );
        }
    }
}
