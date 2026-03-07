<?php

namespace Database\Factories;

use App\Models\Coupon;
use App\Models\Merchant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        return [
            'merchant_id' => Merchant::factory(),
            'code' => Str::upper(Str::random(8)),
            'name' => fake()->words(3, true).' Promo',
            'description' => fake()->optional()->sentence(),
            'discount_type' => 'percentage',
            'discount_value' => fake()->randomElement([5, 10, 15, 20, 25]),
            'min_order_amount' => null,
            'max_uses' => null,
            'max_uses_per_customer' => null,
            'used_count' => 0,
            'reset_period' => null,
            'applicable_to' => null,
            'starts_at' => now(),
            'expires_at' => null,
            'is_active' => true,
            'is_public' => false,
            'is_claimable' => false,
            'claim_validity_hours' => null,
            'valid_schedule' => null,
            'target_merchant_id' => null,
            'created_by' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'starts_at' => now()->subDays(30),
            'expires_at' => now()->subDay(),
        ]);
    }

    public function platformWide(): static
    {
        return $this->state(fn () => ['merchant_id' => null]);
    }

    public function fixedDiscount(float $amount = 100): static
    {
        return $this->state(fn () => [
            'discount_type' => 'fixed',
            'discount_value' => $amount,
        ]);
    }

    public function percentageDiscount(float $pct = 10): static
    {
        return $this->state(fn () => [
            'discount_type' => 'percentage',
            'discount_value' => $pct,
        ]);
    }

    public function freeProduct(): static
    {
        return $this->state(fn () => [
            'discount_type' => 'free_product',
            'discount_value' => 0,
        ]);
    }

    public function withUsageLimit(int $max = 10): static
    {
        return $this->state(fn () => ['max_uses' => $max]);
    }

    public function forMerchant(int $merchantId): static
    {
        return $this->state(fn () => ['merchant_id' => $merchantId]);
    }

    public function forBranch(int $branchMerchantId): static
    {
        return $this->state(fn () => ['target_merchant_id' => $branchMerchantId]);
    }

    public function orgWide(): static
    {
        return $this->state(fn () => ['target_merchant_id' => null]);
    }

    public function public(): static
    {
        return $this->state(fn () => ['is_public' => true]);
    }

    public function claimable(int $validityHours = 24): static
    {
        return $this->state(fn () => [
            'is_claimable' => true,
            'is_public' => true,
            'claim_validity_hours' => $validityHours,
        ]);
    }

    public function withSchedule(array $days, ?string $startTime = null, ?string $endTime = null): static
    {
        $schedule = ['days' => $days];
        if ($startTime !== null && $endTime !== null) {
            $schedule['start_time'] = $startTime;
            $schedule['end_time'] = $endTime;
        }

        return $this->state(fn () => ['valid_schedule' => $schedule]);
    }
}
