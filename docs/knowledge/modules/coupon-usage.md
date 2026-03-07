# Module: CouponUsage

## Model

- **File:** `backend/app/Models/CouponUsage.php`
- **Table:** `coupon_usages`
- **Fillable:** `coupon_id`, `customer_id`, `used_on_type`, `used_on_id`, `discount_amount`, `used_at`
- **Relationships:**
  - `coupon()` — BelongsTo Coupon
  - `customer()` — BelongsTo Customer
  - `usedOn()` — MorphTo (polymorphic: booking, reservation, service_order)
- **Casts:** `discount_amount` decimal:2, `used_at` datetime

## Purpose

Records each time a coupon is applied to a transaction. Used for:
- Tracking per-customer usage counts (for `max_uses_per_customer` enforcement)
- Recording discount amounts applied
- Linking coupon usage to specific transactions via polymorphic `usedOn` relation

## How It's Created

Created by `CouponService::applyCoupon()` which:
1. Atomically increments coupon's `used_count`
2. Creates CouponUsage record with discount amount and transaction reference

## Gotchas / Notes

- **FK is `customer_id`** (Customer model) not `user_id` — different from CouponClaim which uses `user_id`
- **Polymorphic `used_on`:** Uses morph map aliases (`booking`, `reservation`, `service_order`)
- **Reset period support:** CouponRepository's `getUsageCountForCustomer()` filters by reset_period (daily/weekly/monthly/yearly) when checking per-customer limits
- No dedicated controller/service/repository — managed through CouponService and created during transaction processing
