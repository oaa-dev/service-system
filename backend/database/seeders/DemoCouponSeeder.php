<?php

namespace Database\Seeders;

use App\Models\Coupon;
use App\Models\Merchant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoCouponSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('super-admin')->first();

        if (! $admin) {
            $this->command->warn('No super-admin found. Skipping coupon seeding.');

            return;
        }

        $merchants = Merchant::where('status', 'active')->get();

        // Platform-wide coupons (no merchant)
        $platformCoupons = [
            [
                'code' => 'WELCOME10',
                'name' => 'Welcome 10% Off',
                'description' => 'Get 10% off your first booking or order. Valid for all merchants.',
                'discount_type' => 'percentage',
                'discount_value' => 10.00,
                'min_order_amount' => 500.00,
                'max_uses' => 1000,
                'max_uses_per_customer' => 1,
                'is_active' => true,
                'is_public' => true,
                'starts_at' => now(),
                'expires_at' => now()->addMonths(3),
            ],
            [
                'code' => 'FLAT100',
                'name' => 'Flat ₱100 Off',
                'description' => 'Save ₱100 on any transaction over ₱1,000.',
                'discount_type' => 'fixed',
                'discount_value' => 100.00,
                'min_order_amount' => 1000.00,
                'max_uses' => 500,
                'max_uses_per_customer' => 2,
                'reset_period' => 'monthly',
                'is_active' => true,
                'is_public' => true,
                'starts_at' => now(),
                'expires_at' => now()->addMonths(6),
            ],
            [
                'code' => 'WEEKEND25',
                'name' => 'Weekend Special 25% Off',
                'description' => 'Enjoy 25% off on weekends! Valid Saturday and Sunday only.',
                'discount_type' => 'percentage',
                'discount_value' => 25.00,
                'min_order_amount' => 300.00,
                'max_uses' => null,
                'max_uses_per_customer' => 1,
                'reset_period' => 'weekly',
                'is_active' => true,
                'is_public' => true,
                'starts_at' => now(),
                'expires_at' => now()->addMonths(2),
                'valid_schedule' => ['days' => [0, 6], 'start_time' => '00:00', 'end_time' => '23:59'],
            ],
            [
                'code' => 'SUMMER50',
                'name' => 'Summer Sale ₱50 Off',
                'description' => 'Beat the heat with ₱50 off any service.',
                'discount_type' => 'fixed',
                'discount_value' => 50.00,
                'min_order_amount' => null,
                'max_uses' => 2000,
                'max_uses_per_customer' => 3,
                'is_active' => true,
                'is_public' => true,
                'starts_at' => now(),
                'expires_at' => now()->addMonths(4),
            ],
            [
                'code' => 'EXPIRED01',
                'name' => 'Expired Promo',
                'description' => 'This promo has already ended.',
                'discount_type' => 'percentage',
                'discount_value' => 15.00,
                'is_active' => true,
                'is_public' => true,
                'starts_at' => now()->subMonths(3),
                'expires_at' => now()->subWeek(),
            ],
        ];

        $platformCount = 0;
        foreach ($platformCoupons as $data) {
            Coupon::create(array_merge($data, [
                'merchant_id' => null,
                'created_by' => $admin->id,
            ]));
            $platformCount++;
        }

        // Merchant-specific coupons
        $merchantCouponTemplates = [
            [
                'name' => '15% Loyalty Discount',
                'description' => 'Thank you for being a loyal customer! Enjoy 15% off.',
                'discount_type' => 'percentage',
                'discount_value' => 15.00,
                'max_uses_per_customer' => 1,
                'reset_period' => 'monthly',
                'is_public' => true,
                'applicable_to' => ['booking'],
            ],
            [
                'name' => 'First Visit ₱200 Off',
                'description' => 'New customer? Get ₱200 off your first visit!',
                'discount_type' => 'fixed',
                'discount_value' => 200.00,
                'min_order_amount' => 800.00,
                'max_uses_per_customer' => 1,
                'is_public' => true,
            ],
            [
                'name' => 'Private VIP Code',
                'description' => 'Exclusive discount for VIP members only.',
                'discount_type' => 'percentage',
                'discount_value' => 20.00,
                'max_uses' => 50,
                'max_uses_per_customer' => 1,
                'is_public' => false,
                'is_claimable' => true,
                'claim_validity_hours' => 48,
            ],
        ];

        $merchantCount = 0;
        foreach ($merchants->take(5) as $merchant) {
            foreach ($merchantCouponTemplates as $i => $template) {
                $code = strtoupper(substr($merchant->slug, 0, 4)) . ($i + 1) . rand(10, 99);
                Coupon::create(array_merge($template, [
                    'code' => $code,
                    'merchant_id' => $merchant->id,
                    'created_by' => $admin->id,
                    'is_active' => true,
                    'starts_at' => now(),
                    'expires_at' => now()->addMonths(3),
                ]));
                $merchantCount++;
            }
        }

        $this->command->info("Seeded {$platformCount} platform coupons, {$merchantCount} merchant coupons.");
    }
}
