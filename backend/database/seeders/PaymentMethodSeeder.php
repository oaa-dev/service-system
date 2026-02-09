<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $paymentMethods = [
            ['name' => 'Cash', 'slug' => 'cash', 'sort_order' => 1],
            ['name' => 'Credit Card', 'slug' => 'credit-card', 'sort_order' => 2],
            ['name' => 'Debit Card', 'slug' => 'debit-card', 'sort_order' => 3],
            ['name' => 'GCash', 'slug' => 'gcash', 'sort_order' => 4],
            ['name' => 'Bank Transfer', 'slug' => 'bank-transfer', 'sort_order' => 5],
        ];

        foreach ($paymentMethods as $paymentMethod) {
            PaymentMethod::firstOrCreate(
                ['slug' => $paymentMethod['slug']],
                $paymentMethod
            );
        }
    }
}
