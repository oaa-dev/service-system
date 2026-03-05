# Plan: Coupon Module

**Date:** 2026-03-04
**Type:** feature
**Status:** Draft
**Brainstorm:** `docs/brainstorms/2026-03-04-coupon-discount-reward-system.md`

## Knowledge Context

### Relevant Learnings
- All three transaction tables (`bookings`, `reservations`, `service_orders`) already have `discount_amount` decimal(10,2) columns
- Loyalty reward discount pattern already established: validate reward → calculate discount → fee on discounted subtotal → create transaction
- DTOs accept `loyalty_reward_id` as `int|null|Optional` — coupon_code follows same pattern
- Dual-controller pattern (admin CRUD + self-service) used by loyalty/referral modules
- `Str::random(8)` + `strtoupper()` for auto-generated codes
- Model defaults use `$attributes` array (not DB defaults)

### Known Gotchas
- Platform fee MUST be calculated on discounted subtotal (already handled in existing code)
- Customer FK distinction: `coupon_usages.customer_id` should use `Customer.id` (customers table), resolved via `Customer::where('user_id', auth()->id())->firstOrFail()`
- FormRequests always return `authorize(): true` — permission checks in route middleware
- `destroy()` in controllers uses try-catch with 422 on error

### Critical Patterns Applied
- Service-Repository pattern with interface bindings in `RepositoryServiceProvider`
- Spatie QueryBuilder for list endpoints with filtering/sorting
- Spatie Laravel Data DTOs with `string|Optional` pattern
- Pest tests with describe/it BDD syntax

## Overview

Add a Coupon module supporting merchant-specific and platform-wide promo codes. Merchants create coupons for their store; admins create platform-wide coupons valid at any merchant. Customers enter a coupon code at checkout to receive a discount (percentage, fixed, or free product). Coupon validation happens before fee calculation. Usage is tracked per customer with limits enforced.

## Implementation Steps

### Step 1: Migration — `coupons` and `coupon_usages` tables
- **Files:** `backend/database/migrations/2026_03_05_100000_create_coupons_table.php`
- **Details:**
  ```
  coupons:
    id, merchant_id (nullable FK, nullOnDelete), code (string 20, unique),
    name (string 255), description (text nullable),
    discount_type (enum: percentage, fixed, free_product),
    discount_value (decimal 10,2, default 0),
    min_order_amount (decimal 10,2, nullable),
    max_uses (integer nullable), max_uses_per_customer (integer nullable),
    used_count (integer, default 0),
    applicable_to (JSON nullable — ['booking','reservation','sell_product'] or null=all),
    starts_at (datetime), expires_at (datetime nullable),
    is_active (boolean, default true),
    created_by (FK users, nullOnDelete),
    timestamps
  Indexes: [merchant_id], [code], [is_active, starts_at, expires_at]
  ```
  ```
  coupon_usages:
    id, coupon_id (FK, cascade), customer_id (FK customers, cascade),
    used_on_type (string), used_on_id (unsignedBigInteger),
    discount_amount (decimal 10,2),
    used_at (datetime),
    timestamps
  Indexes: [coupon_id, customer_id], morphs index on [used_on_type, used_on_id]
  ```

### Step 2: Coupon Model
- **Files:** `backend/app/Models/Coupon.php`
- **Details:**
  - Fillable: all columns except id/timestamps
  - Casts: discount_value→decimal:2, min_order_amount→decimal:2, is_active→boolean, starts_at→datetime, expires_at→datetime, applicable_to→array
  - Defaults ($attributes): is_active=true, used_count=0, discount_type='percentage'
  - Relationships: merchant() BelongsTo Merchant (nullable), creator() BelongsTo User (via created_by), usages() HasMany CouponUsage
  - Scope helpers: `scopeActive()`, `scopeValid()` (active + within date range)
  - Method: `isApplicableTo(string $transactionType): bool` — checks applicable_to array (null = all)

### Step 3: CouponUsage Model
- **Files:** `backend/app/Models/CouponUsage.php`
- **Details:**
  - Fillable: coupon_id, customer_id, used_on_type, used_on_id, discount_amount, used_at
  - Casts: discount_amount→decimal:2, used_at→datetime
  - Relationships: coupon() BelongsTo, customer() BelongsTo Customer, usedOn() MorphTo

### Step 4: Factories
- **Files:** `backend/database/factories/CouponFactory.php`
- **Details:**
  - Default: percentage discount, random code, active, starts_at=now, no expiry
  - States: `inactive()`, `expired()`, `platformWide()`, `fixedDiscount($amount)`, `percentageDiscount($pct)`, `freeProduct()`, `withUsageLimit($max)`, `forMerchant($merchantId)`

### Step 5: Repository + Interface
- **Files:**
  - `backend/app/Repositories/Contracts/CouponRepositoryInterface.php`
  - `backend/app/Repositories/CouponRepository.php`
- **Details:** Extends BaseRepository. Additional methods:
  - `findByCode(string $code): ?Coupon`
  - `getUsageCountForCustomer(int $couponId, int $customerId): int`

### Step 6: CouponData DTO
- **Files:** `backend/app/Data/CouponData.php`
- **Details:**
  ```php
  public string|Optional $code,
  public string|Optional $name,
  public string|null|Optional $description,
  public string|Optional $discount_type,
  public float|Optional $discount_value,
  public float|null|Optional $min_order_amount,
  public int|null|Optional $max_uses,
  public int|null|Optional $max_uses_per_customer,
  public array|null|Optional $applicable_to,
  public string|Optional $starts_at,
  public string|null|Optional $expires_at,
  public bool|Optional $is_active,
  ```

### Step 7: Form Requests
- **Files:**
  - `backend/app/Http/Requests/Api/V1/Coupon/StoreCouponRequest.php`
  - `backend/app/Http/Requests/Api/V1/Coupon/UpdateCouponRequest.php`
  - `backend/app/Http/Requests/Api/V1/Coupon/ValidateCouponRequest.php`
- **Details:**
  - Store: code (nullable, unique, max:20, alpha_num), name (required, max:255), discount_type (required, in:percentage,fixed,free_product), discount_value (required_unless discount_type=free_product, numeric, min:0), min_order_amount (nullable, numeric, min:0), max_uses (nullable, integer, min:1), max_uses_per_customer (nullable, integer, min:1), applicable_to (nullable, array, each in:booking,reservation,sell_product), starts_at (required, date), expires_at (nullable, date, after:starts_at), is_active (boolean)
  - Update: all fields `sometimes`
  - Validate: code (required, string), merchant_slug (required, string), transaction_type (required, in:booking,reservation,sell_product), subtotal (required, numeric, min:0)

### Step 8: CouponResource
- **Files:** `backend/app/Http/Resources/Api/V1/CouponResource.php`
- **Details:** All fields + whenLoaded for merchant (id, name, slug), creator (id, name). Include `usage_count` and `is_valid` (computed: active + within date range + not exceeded max_uses).

### Step 9: CouponService + Interface
- **Files:**
  - `backend/app/Services/Contracts/CouponServiceInterface.php`
  - `backend/app/Services/CouponService.php`
- **Details:**
  - `getMerchantCoupons(int $merchantId, Request $request)` — QueryBuilder with filters: partial name/code, exact is_active, exact discount_type. Default sort: -created_at
  - `getPlatformCoupons(Request $request)` — same but where merchant_id is null
  - `getAllCoupons(Request $request)` — admin: all coupons with merchant filter
  - `getCouponById(int $id): Coupon`
  - `createCoupon(CouponData $data, ?int $merchantId, int $createdBy): Coupon` — auto-generate code if empty (8-char uppercase alphanumeric, retry on collision)
  - `updateCoupon(int $id, CouponData $data): Coupon`
  - `deleteCoupon(int $id): void`
  - `validateCoupon(string $code, int $merchantId, string $transactionType, float $subtotal, ?int $customerId): array` — returns `['coupon' => Coupon, 'discount_amount' => float]` or throws ApiException with specific error message
  - `applyCoupon(int $couponId, int $customerId, string $usedOnType, int $usedOnId, float $discountAmount): CouponUsage` — creates usage record, increments used_count
  - `calculateDiscount(Coupon $coupon, float $subtotal): float` — percentage: min(subtotal, subtotal * value/100), fixed: min(subtotal, value), free_product: subtotal

  **Validation logic in `validateCoupon()`:**
  1. Find coupon by code (case-insensitive: `strtoupper()`) — 404 if not found
  2. Check `is_active` — 422 "Coupon is not active"
  3. Check `starts_at <= now` — 422 "Coupon is not yet valid"
  4. Check `expires_at` is null or `>= now` — 422 "Coupon has expired"
  5. Check merchant scope: `merchant_id` is null (platform) OR matches `$merchantId` — 422 "Coupon is not valid for this merchant"
  6. Check `applicable_to`: null (all) OR contains `$transactionType` — 422 "Coupon is not applicable to this transaction type"
  7. Check `max_uses`: null OR `used_count < max_uses` — 422 "Coupon usage limit reached"
  8. If `$customerId` and `max_uses_per_customer`: count usages for this customer < limit — 422 "You have already used this coupon the maximum number of times"
  9. Check `min_order_amount`: null OR `$subtotal >= min_order_amount` — 422 "Minimum order amount of ₱X not met"
  10. Calculate discount and return

### Step 10: Provider Bindings
- **Files:** `backend/app/Providers/RepositoryServiceProvider.php`
- **Details:** Bind CouponRepositoryInterface → CouponRepository, CouponServiceInterface → CouponService

### Step 11: Permissions
- **Files:** `backend/database/seeders/RolePermissionSeeder.php`
- **Details:**
  - Add permissions: `coupons.view`, `coupons.create`, `coupons.update`, `coupons.delete`
  - Assign to roles: super-admin/admin → all, manager → view, merchant → all (for own coupons)

### Step 12: CouponController (Admin — platform coupons)
- **Files:** `backend/app/Http/Controllers/Api/V1/CouponController.php`
- **Details:**
  - `index(Request)` — getPlatformCoupons or getAllCoupons with paginatedResponse
  - `store(StoreCouponRequest)` — createCoupon with merchant_id=null
  - `show(int $id)` — getCouponById with successResponse
  - `update(UpdateCouponRequest, int $id)` — updateCoupon
  - `destroy(int $id)` — deleteCoupon (try-catch 422 pattern)
  - `validate(ValidateCouponRequest)` — validateCoupon, returns discount preview

### Step 13: Merchant Self-Service Coupon Controller
- **Files:** `backend/app/Http/Controllers/Api/V1/MerchantCouponController.php`
- **Details:**
  - Resolves merchant from `$request->user()->merchant` (self-service pattern)
  - `index(Request)` — getMerchantCoupons
  - `store(StoreCouponRequest)` — createCoupon with merchant_id from auth user
  - `show(int $id)` — getCouponById (verify ownership)
  - `update(UpdateCouponRequest, int $id)` — updateCoupon (verify ownership)
  - `destroy(int $id)` — deleteCoupon (verify ownership)

### Step 14: Routes
- **Files:** `backend/routes/api.php`
- **Details:**
  ```
  // Public coupon validation
  POST /coupons/validate → CouponController@validate

  // Admin coupon management (auth + verified + onboarded + permission)
  GET    /coupons             → CouponController@index     (coupons.view)
  POST   /coupons             → CouponController@store     (coupons.create)
  GET    /coupons/{id}        → CouponController@show      (coupons.view)
  PUT    /coupons/{id}        → CouponController@update    (coupons.update)
  DELETE /coupons/{id}        → CouponController@destroy   (coupons.delete)

  // Merchant self-service (auth + verified + onboarded)
  GET    /auth/merchant/coupons           → MerchantCouponController@index
  POST   /auth/merchant/coupons           → MerchantCouponController@store
  GET    /auth/merchant/coupons/{id}      → MerchantCouponController@show
  PUT    /auth/merchant/coupons/{id}      → MerchantCouponController@update
  DELETE /auth/merchant/coupons/{id}      → MerchantCouponController@destroy
  ```

### Step 15: Checkout Integration — Add `coupon_code` to DTOs and Requests
- **Files:**
  - `backend/app/Data/BookingData.php` — add `public string|null|Optional $coupon_code`
  - `backend/app/Data/ReservationData.php` — same
  - `backend/app/Data/ServiceOrderData.php` — same
  - `backend/app/Http/Requests/Api/V1/CustomerPortal/CreateCustomerBookingRequest.php` — add `'coupon_code' => ['nullable', 'string', 'max:20']`
  - `backend/app/Http/Requests/Api/V1/CustomerPortal/CreateCustomerReservationRequest.php` — same
  - `backend/app/Http/Requests/Api/V1/CustomerPortal/CreateCustomerOrderRequest.php` — same
  - `backend/app/Http/Requests/Api/V1/Booking/CreateBookingRequest.php` — same (admin-created bookings)
  - `backend/app/Http/Requests/Api/V1/Reservation/CreateReservationRequest.php` — same
  - `backend/app/Http/Requests/Api/V1/ServiceOrder/CreateServiceOrderRequest.php` — same

### Step 16: Checkout Integration — Service layer discount logic
- **Files:**
  - `backend/app/Services/BookingService.php`
  - `backend/app/Services/ReservationService.php`
  - `backend/app/Services/ServiceOrderService.php`
- **Details:** In each `createX()` method, after existing loyalty reward logic, add coupon logic:
  ```php
  // Existing loyalty reward discount...
  $discountAmount = 0;
  if ($loyaltyRewardId !== null) { ... existing logic ... }

  // NEW: Coupon discount (only if no loyalty reward applied)
  $couponCode = ($data->coupon_code instanceof Optional) ? null : $data->coupon_code;
  $couponId = null;
  if ($couponCode !== null && $discountAmount === 0) {
      $result = $this->couponService->validateCoupon(
          $couponCode, $merchantId, 'booking', $subtotal, auth()->id()
      );
      $discountAmount = $result['discount_amount'];
      $couponId = $result['coupon']->id;
  }

  // ... existing fee calculation on discounted subtotal ...

  // After transaction created:
  if ($couponId) {
      $customer = Customer::where('user_id', auth()->id())->firstOrFail();
      $this->couponService->applyCoupon($couponId, $customer->id, 'booking', $booking->id, $discountAmount);
  }
  ```
  - Inject `CouponServiceInterface` in constructor of all three services
  - Rule: coupon OR loyalty reward, not both. If loyalty_reward_id is provided, coupon_code is ignored.

### Step 17: Add `coupon_id` to transaction tables (optional FK for tracking)
- **Files:** `backend/database/migrations/2026_03_05_100100_add_coupon_id_to_transaction_tables.php`
- **Details:** Add nullable `coupon_id` FK to bookings, reservations, service_orders (nullOnDelete). Store in Model::create() when coupon applied. Expose in Resources.

### Step 18: Tests
- **Files:** `backend/tests/Feature/Api/V1/CouponTest.php`
- **Details:** Pest describe/it syntax covering:
  - Admin CRUD: list/create/show/update/delete platform coupons
  - Merchant self-service: list/create/show/update/delete own coupons
  - Merchant cannot see/edit other merchant's coupons
  - Coupon validation: valid code, expired, inactive, wrong merchant, wrong type, usage limit, per-customer limit, min order not met
  - Auto-generate code when code field omitted
  - Platform coupon valid at any merchant
  - Checkout integration: booking with coupon, reservation with coupon, order with coupon
  - Coupon + loyalty reward mutual exclusion (loyalty takes priority)
  - Usage tracking: used_count increments, coupon_usages record created

### Step 19: Frontend Admin — Types, Service, Hooks
- **Files:**
  - `frontend/types/api.ts` — Add Coupon, CouponUsage, CouponQueryParams, CreateCouponRequest, UpdateCouponRequest, ValidateCouponRequest, ValidateCouponResponse interfaces
  - `frontend/services/couponService.ts` — CRUD + validate API calls
  - `frontend/hooks/useCoupons.ts` — React Query hooks wrapping service

### Step 20: Frontend Admin — Zod Validations
- **Files:** `frontend/lib/validations.ts`
- **Details:** Add `createCouponSchema` and `updateCouponSchema` with fields matching backend validation

### Step 21: Frontend Admin — My Coupons Page
- **Files:** `frontend/app/(system)/(my-store)/my-store/coupons/page.tsx`
- **Details:**
  - Paginated list with search/filter by status
  - Create/edit dialog with all coupon fields
  - Auto-generate code button
  - Usage stats badge (used_count / max_uses)
  - Active/inactive toggle
  - Delete with confirmation

### Step 22: Frontend Admin — Platform Coupons Page (Admin)
- **Files:** `frontend/app/(system)/(settings)/coupons/page.tsx`
- **Details:** Same UI pattern as merchant coupons but for platform-wide coupons. Permission-gated to `coupons.view`/`coupons.create`.

### Step 23: Frontend Admin — Sidebar Entries
- **Files:** `frontend/components/layout/app-sidebar.tsx`
- **Details:**
  - Add "Coupons" to merchant nav items (requiresActiveMerchant: true)
  - Add "Coupons" to admin/settings nav items (permission: 'coupons.view')

### Step 24: Customer Portal — Coupon Input on Checkout Pages
- **Files:**
  - `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/page.tsx`
  - `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/page.tsx`
  - `frontend-customer-portal/app/(storefront)/merchants/[slug]/order/page.tsx`
- **Details:**
  - Add coupon code input field with "Apply" button
  - On apply: call validate endpoint → show discount preview (green text: "₱X off" or "X% off")
  - On error: show error message inline (red text)
  - Include `coupon_code` in form submission payload
  - Show discount breakdown in order summary

### Step 25: Customer Portal — Types
- **Files:** `frontend-customer-portal/types/api.ts`
- **Details:** Add Coupon, ValidateCouponRequest, ValidateCouponResponse interfaces. Update CreateBookingRequest, CreateReservationRequest, CreateOrderRequest with optional `coupon_code` field.

### Step 26: Customer Portal — Transaction Detail Sheets
- **Files:**
  - `frontend-customer-portal/app/(customer)/bookings/booking-detail-sheet.tsx`
  - `frontend-customer-portal/app/(customer)/reservations/reservation-detail-sheet.tsx`
  - `frontend-customer-portal/app/(customer)/orders/order-detail-sheet.tsx`
- **Details:** Show coupon code and discount amount in the price breakdown if applied.

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Race condition on usage count | Medium | Use atomic increment: `Coupon::where('id', $id)->increment('used_count')` and re-validate after |
| Code collision on auto-generate | Low | Retry loop (max 5 attempts) with unique constraint as safety net |
| Coupon + loyalty reward stacking | Low | Explicit mutual exclusion in service layer: loyalty_reward_id takes priority |
| Case sensitivity in codes | Low | Normalize to uppercase on both create and validate |

## Testing Strategy

- [ ] Admin CRUD: create, read, update, delete platform coupons (5 tests)
- [ ] Merchant CRUD: create, read, update, delete own coupons (5 tests)
- [ ] Ownership isolation: merchant cannot access other's coupons (2 tests)
- [ ] Validation: 9+ test cases (valid, expired, inactive, wrong merchant, wrong type, usage limit, per-customer limit, min order, not found)
- [ ] Auto-generate code (1 test)
- [ ] Checkout with coupon: booking, reservation, order (3 tests)
- [ ] Coupon + loyalty mutual exclusion (1 test)
- [ ] Usage tracking: count increment + usage record (1 test)
- [ ] Platform coupon at merchant checkout (1 test)
- [ ] Frontend builds pass TypeScript checks

## Open Questions

- Should coupon codes be case-sensitive? → No, uppercase-normalize
- Auto-generate code format? → 8-char uppercase alphanumeric (Str::upper(Str::random(8)))
- Should validate endpoint require auth? → No, public so customers can check codes before logging in. But `customer_id` checks (per-customer limit) only apply when authenticated.
