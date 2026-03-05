# Brainstorm: Coupon Module

**Date:** 2026-03-04
**Status:** Draft

## Knowledge Context

- Existing **LoyaltyReward** and **ReferralReward** models are untouched — this is a separate module
- Draft plan exists for **reward redemption at checkout** — adds `discount_amount` column to transactions, calculates discount BEFORE platform fee
- Platform fee calculation MUST happen after discount: validate coupon → calculate discount → calculate fee on discounted amount
- Project uses Service-Repository pattern, dual-controller (admin + self-service), Spatie QueryBuilder for lists

## Problem / Goal

Build a coupon/promo code system where:
1. **Merchants** create coupons for their own store
2. **Platform admin** creates platform-wide coupons valid at any merchant
3. **Customers** enter a coupon code at checkout to receive a discount

## Decisions

### Database Schema

```
coupons table:
  id, merchant_id (nullable — null = platform-wide),
  code (unique), name, description,
  discount_type: percentage|fixed|free_product,
  discount_value (decimal 10,2),
  min_order_amount (nullable, decimal 10,2),
  max_uses (nullable — null = unlimited),
  max_uses_per_customer (nullable),
  used_count (default 0),
  applicable_to: all|booking|reservation|sell_product (JSON array or enum),
  starts_at (datetime), expires_at (datetime nullable),
  is_active (boolean, default true),
  created_by (FK users — admin or merchant user),
  timestamps
```

```
coupon_usages table (tracks who used what):
  id, coupon_id, customer_id,
  used_on_type, used_on_id (polymorphic — booking/reservation/service_order),
  discount_amount (decimal 10,2),
  used_at (datetime),
  timestamps
```

### Coupon Scope: Merchant + Platform
- `merchant_id = null` → platform-wide (valid at any merchant checkout)
- `merchant_id = N` → specific merchant only
- Admin creates platform coupons via admin CRUD; merchants create their own via self-service
- Validation at checkout: check scope, active status, date range, usage limits, min order amount, applicable transaction type

### Discount Types
- `percentage` — reduce subtotal by X% (e.g., 10% off)
- `fixed` — reduce subtotal by fixed amount (e.g., ₱100 off)
- `free_product` — free service/product (discount = full price)

### Checkout Integration

At checkout (booking/reservation/order), customer enters a coupon code:

1. **Validate coupon**: exists, is_active, within date range, not exceeded max_uses, not exceeded max_uses_per_customer for this customer, applicable_to matches transaction type, min_order_amount met, merchant scope matches
2. **Calculate discount**: based on discount_type and discount_value
3. **Calculate platform fee** on discounted subtotal (fee AFTER discount)
4. **Create transaction** with `discount_amount` and `coupon_id`
5. **Record usage** in `coupon_usages`, increment `used_count`

### Validation Endpoint
- `POST /api/v1/coupons/validate` — public endpoint for customers to check a code before submitting checkout
  - Request: `{ code, merchant_id (or slug), transaction_type, subtotal }`
  - Response: coupon details + calculated discount amount, or error (expired, invalid, usage exceeded, etc.)

## Backend Architecture

### Models
- `Coupon` — fillable fields, casts (discount_value→decimal, is_active→boolean, starts_at/expires_at→datetime, applicable_to→array)
- `CouponUsage` — tracks each redemption with polymorphic `used_on`

### Service: CouponService
- `getMerchantCoupons(merchantId, params)` — Spatie QueryBuilder with filters (search, status, active)
- `getPlatformCoupons(params)` — admin: where merchant_id is null
- `getCouponById(id)`
- `createCoupon(data)` — auto-generate code if not provided
- `updateCoupon(id, data)`
- `deleteCoupon(id)`
- `validateCoupon(code, merchantId, transactionType, subtotal, customerId)` — full validation, returns discount amount
- `applyCoupon(couponId, customerId, usedOnType, usedOnId, discountAmount)` — record usage, increment used_count
- `calculateDiscount(coupon, subtotal)` — returns discount amount based on type

### Controllers
- `CouponController` — admin CRUD for platform-wide coupons (`/coupons/*`)
- Merchant self-service coupon routes via `MyMerchantController` or dedicated `MerchantCouponController` (`/auth/merchant/coupons/*`)
- Public validation: `POST /coupons/validate`

### Permissions
- `coupons.view`, `coupons.create`, `coupons.update`, `coupons.delete` — admin manages platform coupons
- Merchant self-service: no permission middleware (uses auth + merchant context, like loyalty/referral)

## Frontend

### Merchant Dashboard (admin frontend)
- **My Coupons page** (`/my-store/coupons`): List with search/filter, create/edit dialog
  - Fields: code (auto-generate option), name, discount type/value, min order, max uses, date range, applicable_to checkboxes, active toggle
  - Usage stats per coupon (used_count / max_uses)
- **Admin Coupons page** (`/coupons`): Platform-wide coupon management (same UI pattern)

### Customer Portal
- **Checkout pages** (booking/reservation/order): Coupon code input field
  - Enter code → validate → show discount preview → submit with coupon
  - Error states: invalid, expired, usage limit reached, min order not met
- **Transaction detail sheets**: Show applied coupon and discount amount

## Open Questions

- Should platform-wide coupons have merchant opt-out? — TBD
- Should coupon codes be case-sensitive? — Recommend: no, uppercase-normalize on validation
- Auto-generate code format? — Suggest: 8-char alphanumeric uppercase (e.g., `SAVE20AB`)
- Should there be a public coupon listing page? — Probably not (codes are meant to be distributed)

## Next Steps

- [ ] `/plan` to create step-by-step implementation plan
