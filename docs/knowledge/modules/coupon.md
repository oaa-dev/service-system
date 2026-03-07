# Module: Coupon

## Model

- **File:** `backend/app/Models/Coupon.php`
- **Table:** `coupons`
- **Fillable:** `merchant_id`, `target_merchant_id`, `code`, `name`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `max_uses`, `max_uses_per_customer`, `used_count`, `reset_period`, `applicable_to`, `starts_at`, `expires_at`, `is_active`, `is_public`, `is_claimable`, `claim_validity_hours`, `valid_schedule`, `created_by`
- **Defaults:** `is_active=true`, `is_public=false`, `is_claimable=false`, `used_count=0`, `discount_type=percentage`
- **Relationships:**
  - `merchant()` — BelongsTo Merchant (owner/creator org)
  - `targetMerchant()` — BelongsTo Merchant (specific branch target, nullable)
  - `creator()` — BelongsTo User (`created_by`)
  - `usages()` — HasMany CouponUsage
  - `claims()` — HasMany CouponClaim
- **Casts:** `discount_value` decimal:2, `min_order_amount` decimal:2, `max_uses` integer, `max_uses_per_customer` integer, `used_count` integer, `applicable_to` array, `starts_at` datetime, `expires_at` datetime, `is_active` boolean, `is_public` boolean, `is_claimable` boolean, `claim_validity_hours` integer, `valid_schedule` array
- **Scopes:** `active`, `valid` (active + within date range), `public` (public + valid), `visibleToBranch` (org-level + branch-targeted)

## Key Model Methods

- `isWithinSchedule()` — Checks `valid_schedule` JSON (days array + start_time/end_time) against current time
- `isApplicableTo(string $transactionType)` — Checks `applicable_to` array (null = all types)
- `isValidForMerchant(int $merchantId)` — Checks merchant ownership, target merchant, or parent-child relationship

## Repository

- **File:** `backend/app/Repositories/CouponRepository.php`
- **Interface:** `backend/app/Repositories/Contracts/CouponRepositoryInterface.php`
- **Custom methods:** `findByCode()`, `getUsageCountForCustomer()` (with reset_period support)

## Service

- **File:** `backend/app/Services/CouponService.php`
- **Interface:** `backend/app/Services/Contracts/CouponServiceInterface.php`
- **Key methods:**
  - `getMerchantCoupons()` — Paginated list for merchant owner
  - `getBranchInheritedCoupons()` — Coupons visible to a branch (from parent org)
  - `getPlatformCoupons()` — Coupons where `merchant_id IS NULL`
  - `getAllCoupons()` — Admin view of all coupons
  - `getPublicCouponsForMerchant()` — Public storefront coupons (own + parent org + platform)
  - `createCoupon()` — Auto-generates 8-char code if not provided, validates target_merchant is branch of org
  - `updateCoupon()` — Codes uppercased, validates target_merchant
  - `validateCoupon()` — Full validation chain (active, dates, schedule, merchant, transaction type, usage limits, claim checks)
  - `applyCoupon()` — Atomic `used_count` increment + creates CouponUsage
  - `calculateDiscount()` — Supports percentage, fixed, free_product types
  - `claimCoupon()` — Idempotent claim (returns existing if active, replaces if expired/used)
  - `getClaimedCoupons()` — Active unexpired claims for user
  - `getMyCoupons()` — Combined claims + usages sorted by urgency

## Controller

- **File:** `backend/app/Http/Controllers/Api/V1/CouponController.php` (admin)
- **Also:** `backend/app/Http/Controllers/Api/V1/MerchantCouponController.php` (merchant self-service)
- **Endpoints:**
  - `GET /coupons` — Admin list all (permission: `coupons.view`)
  - `GET /coupons/{id}` — Admin show (permission: `coupons.view`)
  - `POST /coupons` — Admin create (permission: `coupons.create`)
  - `PUT /coupons/{id}` — Admin update (permission: `coupons.update`)
  - `DELETE /coupons/{id}` — Admin delete (permission: `coupons.delete`)
  - `POST /coupons/validate` — Public coupon validation (no auth)
  - `GET /auth/merchant/coupons` — Merchant self-service list
  - `POST /auth/merchant/coupons` — Merchant self-service create
  - `GET /auth/merchant/coupons/{id}` — Merchant self-service show
  - `PUT /auth/merchant/coupons/{id}` — Merchant self-service update
  - `DELETE /auth/merchant/coupons/{id}` — Merchant self-service delete
  - `GET /storefront/merchants/{slug}/coupons` — Public storefront coupons

## Form Requests

- `StoreCouponRequest` — name required, code optional (auto-generated), discount_type in:percentage,fixed,free_product, discount_value required, dates, schedule, merchant/target validation
- `UpdateCouponRequest` — Same fields, all optional
- `ValidateCouponRequest` — code required, merchant_slug required, transaction_type required, subtotal required numeric

## Resource

- **File:** `backend/app/Http/Resources/Api/V1/CouponResource.php`
- **Computed fields:** `is_valid` (active + within dates + under max_uses), `is_inherited`
- **Conditional relations:** merchant, targetMerchant, creator, claims (first claim for current user)

## DTO

- **File:** `backend/app/Data/CouponData.php`
- **Fields:** All use `string|Optional` pattern, includes `merchant_id` and `target_merchant_id`

## Permissions

- `coupons.view`, `coupons.create`, `coupons.update`, `coupons.delete`
- Assigned to: super-admin, admin, manager, merchant

## Gotchas / Notes

- **Dual ownership:** `merchant_id` = org that created it, `target_merchant_id` = specific branch it applies to (nullable = all branches)
- **Platform coupons:** `merchant_id IS NULL` — created by admins, valid everywhere
- **Branch inheritance:** Branches see parent org coupons via `visibleToBranch` scope
- **Claimable coupons:** `is_claimable=true` requires user to claim first; claim has its own expiry (`claim_validity_hours`)
- **Reset periods:** `daily`, `weekly`, `monthly`, `yearly` — resets per-customer usage count
- **Valid schedule:** JSON with `days` (0-6 array) and optional `start_time`/`end_time` for time-of-day restrictions
- **Race condition handling:** `applyCoupon()` uses atomic `increment()` for `used_count`
- **Code auto-generation:** 8-char uppercase random, max 5 attempts before failing
