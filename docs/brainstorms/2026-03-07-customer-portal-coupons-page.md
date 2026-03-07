# Brainstorm: Customer Portal Coupons Page

**Date:** 2026-03-07
**Status:** Decided

## Knowledge Context

- Portal customer module uses QueryBuilder with customer_id scoping, `['customer', 'section']` query keys
- Loyalty/Referral pages in customer portal follow the same tab filter pattern
- `coupon_claims` table tracks claim lifecycle (claimed_at, expires_at, used_at)
- `coupon_usages` table tracks actual usage (coupon_id, customer_id, used_on_type, used_on_id, discount_amount)
- Customer FK distinction: customer_id in coupon_usages FKs to `customers` table, while coupon_claims uses `user_id` FK to `users` table

## Already Implemented (from claimable coupons feature)

### Use-window after claim
- `claim_validity_hours` on coupons table sets personal expiry window per claim
- `coupon_claims.expires_at = now() + claim_validity_hours` when claimed
- Customer must use within that window or claim expires

### Re-claimable coupons
- `claimCoupon()` in CouponService (line 272-273): if existing claim is expired OR used, deletes it and creates a fresh claim
- `max_uses_per_customer` via `coupon_usages` count still limits total uses
- Flow: claim → use → claim again (fresh claim, `used_at=null`) → use again (until max_uses_per_customer hit)

## Problem / Goal

Customers who claim coupons on the storefront have no way to see their coupon inventory — active claims, usage history, or expired claims. Need a dedicated "Coupons" page in the authenticated customer portal.

## Data Sources

1. **Claimed coupons** — from `coupon_claims` (active claims with countdown, expired claims)
2. **Used coupons** — from `coupon_usages` (which transaction, discount amount, when)

## Decision: Tab Filters Layout

Page at `/coupons` with horizontal tabs:
- **All** — combined view of claimed + used + expired
- **Active** — claimed and not expired (`expires_at >= now()` and `used_at IS NULL`)
- **Used** — coupon_usages records with transaction reference
- **Expired** — claimed but expired (`expires_at < now()` and `used_at IS NULL`)

Each card reuses the voucher/ticket design from the storefront CouponCard but adds:
- Status badge (Active with timer, Used with check, Expired with warning)
- For "Used": which transaction (e.g., "Applied to Booking #5") + discount amount
- For "Active": countdown timer + copy code button
- For "Expired": dimmed styling + "Claim Again" button (re-claimable)

### Additional decisions:
- Claim only on storefront (no claim input on this page)
- No claim input — claiming stays on merchant detail pages

## Backend Implementation

### New endpoint: `GET /customer/my/coupons`
Returns a unified response combining claims and usages:
- Query `coupon_claims` (where user_id = auth()->id()) + `coupon_usages` (where customer_id = Customer.id)
- Each item has: coupon data + status (active/used/expired) + context (countdown for active, transaction ref for used)
- Filter by status query param: `?status=active|used|expired` (omit for all)

### Response shape:
```json
{
  "data": [
    {
      "id": 1,
      "type": "claim",
      "status": "active",
      "coupon": { ...coupon data... },
      "claimed_at": "...",
      "expires_at": "...",
      "used_at": null
    },
    {
      "id": 5,
      "type": "usage",
      "status": "used",
      "coupon": { ...coupon data... },
      "used_on_type": "booking",
      "used_on_id": 42,
      "discount_amount": "50.00",
      "used_at": "..."
    }
  ]
}
```

## Frontend Implementation

- New page: `frontend-customer-portal/app/(customer)/coupons/page.tsx`
- Nav item: Ticket icon, "Coupons" label, between Reviews and Profile
- Service method + React Query hook
- Card component adapted from storefront CouponCard with status awareness

## Next Steps

- [ ] Backend: Add `GET /customer/my/coupons` endpoint with status filter
- [ ] Frontend: Create coupons page with tab filters
- [ ] Add to customer portal nav
