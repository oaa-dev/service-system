# Plan: Loyalty Reward Redemption at Checkout

**Date:** 2026-03-04
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-03-04-reward-redemption-at-checkout.md](../brainstorms/2026-03-04-reward-redemption-at-checkout.md)

## Knowledge Context

### Relevant Learnings
- Backend validate-then-create-then-mark pattern is already in production for loyalty rewards in all 3 services
- `redeemReward()` returns `LoyaltyReward` but return value is discarded — the core gap
- `RewardSelector` component exists at `frontend-customer-portal/components/loyalty/reward-selector.tsx` — production-ready, untouched
- FK mismatch: `LoyaltyCard.customer_id` = `customers.id` (not `users.id`) — `redeemReward()` already handles this correctly

### Known Gotchas
- **Platform fee must be calculated on discounted subtotal**, not the original — fee order matters
- **Current code calculates fee BEFORE reward validation** — need to reorder: validate reward → calculate discount → calculate fee → create record
- **`free_product` reward type**: Plan treats it as no-discount (no-op) for now to avoid ambiguity
- **Model `$attributes` defaults**: Booking/Reservation/ServiceOrder set `discount_amount => 0` in `$attributes` array (not DB default)

### Critical Patterns Applied
- Service-Repository pattern: all discount logic stays in services, not controllers
- DTO `Optional` rejection: services already use `($data->field instanceof Optional) ? null : $data->field`
- Model `$fillable` + `$attributes` + `$casts` must all include new `discount_amount` column

## Overview

Wire up loyalty reward discount math end-to-end. When a customer selects a loyalty reward at checkout, the discount is calculated from the reward's `reward_type` and `reward_value`, subtracted from the subtotal, and the platform fee is computed on the discounted amount. The discount is stored on the transaction record for display/reporting.

**Scope:** Loyalty rewards only. `discount_percentage` and `discount_fixed` types. `free_product` is a no-op (redeemed but no discount). Referral rewards deferred.

## Implementation Steps

### Step 1: Migration — Add `discount_amount` to bookings, reservations, service_orders
- **Files:** `backend/database/migrations/2026_03_04_200000_add_discount_amount_to_transactions.php`
- **Details:**
  - Single migration adds `discount_amount` decimal(10,2) default 0 after the appropriate price column in each table:
    - `bookings`: after `total_amount`
    - `reservations`: after `total_amount`
    - `service_orders`: after `total_amount`
  - `down()` drops the column from all three tables

### Step 2: Update Models — Add `discount_amount` to fillable, attributes, casts
- **Files:**
  - `backend/app/Models/Booking.php`
  - `backend/app/Models/Reservation.php`
  - `backend/app/Models/ServiceOrder.php`
- **Details:** Add `'discount_amount'` to `$fillable`, `$attributes` (default `0`), and `$casts` (`'decimal:2'`)

### Step 3: Backend — Add discount calculation helper to LoyaltyService
- **Files:**
  - `backend/app/Services/LoyaltyService.php`
  - `backend/app/Services/Contracts/LoyaltyServiceInterface.php`
- **Details:**
  - Add method `calculateRewardDiscount(LoyaltyReward $reward, float $subtotal): float`
  - Logic:
    ```php
    return match ($reward->reward_type) {
        'discount_percentage' => round($subtotal * ($reward->reward_value / 100), 2),
        'discount_fixed' => round(min((float) $reward->reward_value, $subtotal), 2),
        default => 0.0, // free_product and unknown types — no price discount
    };
    ```
  - This keeps discount logic centralized and testable

### Step 4: Backend — Wire discount into BookingService::createBooking()
- **Files:** `backend/app/Services/BookingService.php`
- **Details:** Reorder the existing code block (lines ~163–195):
  1. Calculate raw subtotal: `$subtotal = $servicePrice * $partySize` (no change)
  2. Move reward validation BEFORE fee calculation:
     ```php
     $loyaltyRewardId = ($data->loyalty_reward_id instanceof Optional) ? null : $data->loyalty_reward_id;
     $discountAmount = 0;
     if ($loyaltyRewardId !== null) {
         $reward = $this->loyaltyService->redeemReward($loyaltyRewardId, auth()->id());
         $discountAmount = $this->loyaltyService->calculateRewardDiscount($reward, $subtotal);
     }
     $discountedSubtotal = max(0, $subtotal - $discountAmount);
     ```
  3. Calculate fee on discounted amount: `$feeData = $this->platformFeeService->calculateFee('booking', $discountedSubtotal);`
  4. Add `'discount_amount' => $discountAmount` to `Booking::create([...])` array
  5. Keep `markRewardRedeemed()` call after create (unchanged)
- **Knowledge note:** Reorder is critical — current code calculates fee before reward validation

### Step 5: Backend — Wire discount into ReservationService::createReservation()
- **Files:** `backend/app/Services/ReservationService.php`
- **Details:** Same pattern as Step 4:
  1. Calculate raw total: `$totalPrice = $nights * $pricePerNight` (no change)
  2. Move reward validation before fee calc, capture `$discountAmount`
  3. Fee on discounted amount: `calculateFee('reservation', max(0, $totalPrice - $discountAmount))`
  4. Add `'discount_amount' => $discountAmount` to create array
  5. Keep `markRewardRedeemed()` after create

### Step 6: Backend — Wire discount into ServiceOrderService::createServiceOrder()
- **Files:** `backend/app/Services/ServiceOrderService.php`
- **Details:** Same pattern as Steps 4-5:
  1. Calculate raw total: `$totalPrice = round($quantity * $unitPrice, 2)` (no change)
  2. Move reward validation before fee calc, capture `$discountAmount`
  3. Fee on discounted amount: `calculateFee('sell_product', max(0, $totalPrice - $discountAmount))`
  4. Add `'discount_amount' => $discountAmount` to create array
  5. Keep `markRewardRedeemed()` after create

### Step 7: Backend — Update Resources to expose discount_amount
- **Files:**
  - `backend/app/Http/Resources/Api/V1/BookingResource.php`
  - `backend/app/Http/Resources/Api/V1/ReservationResource.php`
  - `backend/app/Http/Resources/Api/V1/ServiceOrderResource.php`
- **Details:** Add `'discount_amount' => $this->discount_amount` to the `toArray()` return

### Step 8: Backend — Update Factories for test support
- **Files:**
  - `backend/database/factories/BookingFactory.php`
  - `backend/database/factories/ReservationFactory.php`
  - `backend/database/factories/ServiceOrderFactory.php`
- **Details:** Add `'discount_amount' => 0` to factory `definition()` (keeps tests stable; non-zero values set explicitly in reward-specific tests)

### Step 9: Backend — Tests for reward redemption discount
- **Files:** `backend/tests/Feature/Api/V1/RewardRedemptionTest.php`
- **Details:** Dedicated test file covering all three transaction types:
  - **Setup:** Create merchant, customer (with loyalty card + available rewards), service, platform fee
  - `it('applies percentage discount on booking and reduces total_amount')`
    - Create reward with `discount_percentage` type, `reward_value = 20`
    - Book with `loyalty_reward_id`
    - Assert `discount_amount` = 20% of subtotal
    - Assert `total_amount` = discounted subtotal + fee on discounted subtotal
    - Assert reward status = `redeemed`
  - `it('applies fixed discount on reservation and reduces total_amount')`
    - Create reward with `discount_fixed` type, `reward_value = 500`
    - Reserve with `loyalty_reward_id`
    - Assert `discount_amount` = 500 (or subtotal if less)
    - Assert `total_amount` reflects discount
  - `it('applies fixed discount capped at subtotal when reward exceeds price')`
    - Reward value = 10000, service price = 100
    - Assert `discount_amount` = 100 (capped), `total_amount` = 0 + fee on 0
  - `it('applies no discount for free_product reward type')`
    - Create `free_product` reward, book with it
    - Assert `discount_amount` = 0, total unchanged
    - Assert reward still marked as redeemed
  - `it('creates booking without discount when no reward provided')`
    - No `loyalty_reward_id` → `discount_amount` = 0
  - `it('rejects invalid reward with 409')`
    - Already-redeemed reward → 409
  - `it('applies percentage discount on service order')`
    - Same as booking test but for orders
  - **Auth:** `Passport::actingAs($user)` with customer role + `customer_portal.book/reserve/order` permissions

### Step 10: Frontend — Add `loyalty_reward_id` to payload types
- **Files:** `frontend-customer-portal/services/customerActionService.ts`
- **Details:** Add `loyalty_reward_id?: number` to:
  - `CreateBookingPayload`
  - `CreateReservationPayload`
  - `CreateOrderPayload`

### Step 11: Frontend — Add `discount_amount` to API types
- **Files:** `frontend-customer-portal/types/api.ts`
- **Details:** Add `discount_amount: string` to `Booking`, `Reservation`, and `ServiceOrder` interfaces (decimal comes as string from API)

### Step 12: Frontend — Mount RewardSelector on booking page
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/page.tsx`
- **Details:**
  - Import `RewardSelector` from `@/components/loyalty/reward-selector`
  - Add state: `const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null)`
  - Mount `<RewardSelector merchantId={merchant?.id} selectedRewardId={selectedRewardId} onApply={setSelectedRewardId} />` before the submit button
  - Pass `loyalty_reward_id: selectedRewardId ?? undefined` in the `createBooking.mutateAsync()` payload
  - Only render `RewardSelector` when user is authenticated (customer logged in)

### Step 13: Frontend — Mount RewardSelector on reservation page
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/page.tsx`
- **Details:** Same pattern as Step 12:
  - Add state, mount component, pass `loyalty_reward_id` in payload
  - Only render when authenticated

### Step 14: Frontend — Mount RewardSelector on order page
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/order/page.tsx`
- **Details:** Same pattern as Steps 12-13

### Step 15: Frontend — Show discount in transaction detail sheets
- **Files:**
  - `frontend-customer-portal/app/(customer)/bookings/booking-detail-sheet.tsx`
  - `frontend-customer-portal/app/(customer)/reservations/reservation-detail-sheet.tsx`
  - `frontend-customer-portal/app/(customer)/orders/order-detail-sheet.tsx`
- **Details:** If `discount_amount > 0`, show a "Discount" line in the price breakdown (between subtotal and fees)

### Step 16: Run migrations, tests, and build
- **Commands:**
  ```bash
  cd backend && docker compose exec app php artisan migrate
  cd backend && docker compose exec app php artisan test tests/Feature/Api/V1/RewardRedemptionTest.php
  cd backend && docker compose exec app php artisan test  # full suite
  cd frontend-customer-portal && docker compose exec nextjs-customer npm run build
  ```

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Fee reorder breaks existing non-reward bookings | Low | Discount defaults to 0 → `max(0, subtotal - 0)` = subtotal → no change in behavior |
| Reward redeemed but booking create fails (partial state) | Low | `redeemReward()` only validates availability, doesn't mutate. `markRewardRedeemed()` runs after create. If create throws, reward stays `available` |
| Percentage discount produces fractional cents | Low | `round(..., 2)` in `calculateRewardDiscount()` |
| Customer portal builds break with new type fields | Low | `discount_amount` is additive to existing interfaces — no breaking change |
| free_product rewards still get "redeemed" with no discount | Intentional | Acceptable MVP behavior — reward tracks redemption, discount is 0. Future enhancement can add product-level logic |

## Testing Strategy

- [ ] Percentage discount reduces booking total correctly
- [ ] Fixed discount reduces reservation total correctly
- [ ] Fixed discount capped at subtotal (never negative)
- [ ] free_product reward: redeemed but discount = 0
- [ ] No reward: discount_amount = 0, totals unchanged
- [ ] Invalid/redeemed reward returns 409
- [ ] Platform fee calculated on discounted subtotal (not original)
- [ ] All three transaction types (booking, reservation, service order)
- [ ] Frontend build passes with new types
- [ ] RewardSelector renders on checkout pages when logged in
- [ ] Discount line shows in detail sheets when discount_amount > 0

## Open Questions

- Should the checkout page show a live price preview with discount applied before submission? (Requires a preview/calculate endpoint or client-side math)
- Should `discount_amount` appear in admin-side booking/reservation/order lists and detail views?
- Future: Combined loyalty + referral reward selector component
