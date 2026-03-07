# Module: CouponClaim

## Model

- **File:** `backend/app/Models/CouponClaim.php`
- **Table:** `coupon_claims`
- **Fillable:** `coupon_id`, `user_id`, `claimed_at`, `expires_at`, `used_at`
- **Relationships:**
  - `coupon()` — BelongsTo Coupon
  - `user()` — BelongsTo User
- **Casts:** `claimed_at` datetime, `expires_at` datetime, `used_at` datetime

## Key Model Methods

- `isExpired()` — Returns true if `expires_at < now()` and `used_at === null`

## Purpose

Tracks when a user claims a claimable coupon (`is_claimable=true`). Claims have their own expiry window separate from the coupon's global expiry. A user must claim first, then use the coupon before the claim expires.

## Lifecycle

1. User calls `POST /customer/coupons/{coupon}/claim`
2. CouponClaim created with `claimed_at=now()`, `expires_at` based on `claim_validity_hours` or coupon expiry
3. During coupon validation, claim is checked (exists, not expired, not used)
4. When coupon is applied, claim's `used_at` is set

## Routes

- `POST /customer/coupons/{coupon}/claim` — Claim a coupon (permission: `customer_portal.browse`)
- `GET /customer/coupons/claimed` — List active claims (permission: `customer_portal.browse`)

## Gotchas / Notes

- **FK is `user_id`** not `customer_id` — claims reference User model directly
- **Idempotent claiming:** If an active claim exists, it's returned as-is. If expired/used, old claim is deleted and new one created
- **Expiry calculation:** Uses `claim_validity_hours` if set on coupon, otherwise falls back to coupon's `expires_at`, or 1 year default
- No dedicated controller/service/repository — managed through CouponService methods (`claimCoupon`, `getClaimedCoupons`) and CustomerPortalController
