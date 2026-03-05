# Brainstorm: Reward Redemption at Checkout

**Date:** 2026-03-04
**Status:** Draft

## Knowledge Context

### What Already Exists
- **Backend loyalty checkout plumbing is complete**: All 3 DTOs (`BookingData`, `ReservationData`, `ServiceOrderData`) accept `loyalty_reward_id`. All 3 customer portal FormRequests validate it. All 3 creation services implement validate-then-create-then-mark pattern via `redeemReward()` + `markRewardRedeemed()`.
- **Frontend RewardSelector component exists**: `frontend-customer-portal/components/loyalty/reward-selector.tsx` — fully built with radio picker, applied state, remove button. But not mounted on any checkout page.
- **Referral rewards have no checkout integration**: No `redeemReferralReward()`, no DTO fields, no FormRequest rules, no frontend selector.

### Key Risks from Knowledge Base
1. **FK mismatch**: `LoyaltyCard.customer_id` references `customers` table, not `users`. Must resolve `Customer` record from `auth()->id()`.
2. **ReferralReward default status is `'pending'`** (not `'available'` like loyalty rewards) — needs lifecycle verification before future referral integration.
3. **`free_product` reward type** has ambiguous semantics (comp booked service vs add bonus line item) — deferred.

## Problem / Goal

Loyalty and referral rewards track `status` (available/redeemed) and `reward_type` (discount_percentage, discount_fixed, free_product) but never actually apply discounts to the transaction total. The `redeemReward()` return value is discarded in all three creation services. Customers can earn rewards but cannot use them.

**Goal**: Enable customers to select an available loyalty reward during checkout (booking, reservation, or order) and have the discount automatically applied to the transaction total before platform fee calculation.

## Approaches Considered

### Approach A: Loyalty Only, discount_percentage + discount_fixed (Selected)
- **Description:** Wire up the existing loyalty reward flow end-to-end. Capture the `LoyaltyReward` returned by `redeemReward()`, calculate discount based on `reward_type` and `reward_value`, subtract from subtotal before platform fee calculation. Mount existing `RewardSelector` on all 3 checkout pages. Pass `loyalty_reward_id` through `customerActionService.ts`.
- **Pros:** Most infrastructure already built. Smallest scope. Delivers real value immediately. No schema changes needed.
- **Cons:** Only loyalty rewards, not referral. free_product type ignored. No combined reward selector.
- **Effort:** ~4-6 hours

### Approach B: Loyalty + Referral Together
- **Description:** Full stack for both reward types. Add `redeemReferralReward()` to ReferralService, add `referral_reward_id` to all DTOs/FormRequests, build combined reward selector.
- **Pros:** Complete feature in one pass. Both reward systems functional at checkout.
- **Cons:** Referral reward lifecycle needs verification (pending→available transition). More code, more test surface. Combined selector UX needs design.
- **Effort:** ~2-3 days

### Approach C: Full Including free_product
- **Description:** Everything from B plus free_product handling (either comp the booked service or add as bonus line item).
- **Pros:** All reward types functional. No deferred work.
- **Cons:** free_product semantics unclear (comp vs bonus item). May need order line items table. Product decision required.
- **Effort:** ~4-5 days

## Decision

**Approach A: Loyalty Only, discount_percentage + discount_fixed**

Rationale:
- 90% of the backend plumbing exists — just need discount math (capture `redeemReward()` return, calculate discount, subtract from subtotal)
- Frontend component exists — just need to mount it and wire the form field
- No schema changes required
- No discount cap (a 50% reward means 50% off, a ₱500 fixed reward means ₱500 off capped at subtotal)
- free_product type silently ignored for now (reward can still be redeemed but applies no discount — acceptable MVP behavior)

## Implementation Summary

### Backend Changes (3 services)
In `BookingService::createBooking()`, `ReservationService::createReservation()`, `ServiceOrderService::createServiceOrder()`:
1. Capture return value: `$reward = $this->loyaltyService->redeemReward($loyaltyRewardId, auth()->id())`
2. Calculate discount:
   - `discount_percentage`: `$subtotal * ($reward->reward_value / 100)`
   - `discount_fixed`: `min($reward->reward_value, $subtotal)`
   - `free_product` / other: `0` (no-op for now)
3. Apply: `$discountedSubtotal = max(0, $subtotal - $discountAmount)`
4. Use `$discountedSubtotal` for platform fee calculation
5. Store discount info on the created model (add `discount_amount` column to bookings/reservations/service_orders, or store on the reward's morph link)

### Frontend Changes (3 checkout pages + service)
1. Mount `<RewardSelector>` on book/reserve/order pages with `merchantId` and `selectedRewardId` state
2. Pass `loyalty_reward_id` in form submission payload
3. Update `customerActionService.ts` to include `loyalty_reward_id` in POST body
4. Show applied discount in price summary (optional enhancement)

### Schema Decision: Where to store discount amount
- **Option 1:** Add `discount_amount` decimal column to bookings, reservations, service_orders tables
- **Option 2:** Store on `loyalty_rewards.redeemed_value` (new column on rewards table)
- **Recommended:** Option 1 — each transaction knows its own discount for display/reporting purposes

## Open Questions

- Should the price summary on checkout pages show the discount breakdown (subtotal, discount, platform fee, total)?
- Should already-redeemed rewards show in the customer's reward history with a link to the transaction?
- When referral rewards are added later, should both loyalty and referral rewards be usable on the same transaction, or one-reward-per-checkout?
- Should merchants be able to disable reward redemption for specific services?

## Next Steps

- [ ] `/plan` to create detailed implementation plan from this brainstorm
- [ ] Verify `redeemReward()` return type and available fields
- [ ] Decide on `discount_amount` column placement (Option 1 recommended)
- [ ] Future: Referral reward checkout (Approach B)
- [ ] Future: free_product handling (Approach C)
