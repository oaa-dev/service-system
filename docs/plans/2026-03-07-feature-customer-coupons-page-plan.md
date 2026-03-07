# Plan: Customer Portal Coupons Page

**Date:** 2026-03-07
**Type:** feature
**Status:** Draft
**Brainstorm:** [../brainstorms/2026-03-07-customer-portal-coupons-page.md](../brainstorms/2026-03-07-customer-portal-coupons-page.md)

## Knowledge Context

### Known Gotchas
- **Customer FK distinction**: `coupon_usages.customer_id` → `customers` table (resolve via `Customer::where('user_id', auth()->id())`), while `coupon_claims.user_id` → `users` table (use `auth()->id()` directly)
- **Query key convention**: Customer portal uses `['customer', 'section']` pattern (e.g., `['customer', 'coupons']`)
- **Portal page pattern**: max-w-2xl centered, icon header, loading skeletons, empty state with CTA

### Critical Patterns Applied
- Two data sources (claims + usages) merged in service layer, not at DB level
- Tab filter via client-side state (not query params) — consistent with loyalty/referral pages
- CouponService already owns coupon business logic — add the new method there, not CustomerPortalService

## Overview

Add a "My Coupons" page to the customer portal at `/coupons` that shows claimed (active + expired) and used coupons in a tab-filtered layout. Reuses the voucher/ticket card design from the storefront.

## Implementation Steps

### Step 1: Backend — Add `getMyCoupons()` to CouponService
- **Files:** `backend/app/Services/CouponService.php`, `backend/app/Services/Contracts/CouponServiceInterface.php`
- **Details:**
  - Add `getMyCoupons(int $userId, ?string $status): array` method
  - Query `coupon_claims` where `user_id = $userId`, eager-load `coupon.merchant`
  - Query `coupon_usages` where `customer_id = Customer::where('user_id', $userId)->first()?->id`, eager-load `coupon.merchant`
  - Merge into unified collection with shape: `{ id, type: 'claim'|'usage', status: 'active'|'used'|'expired', coupon: {...}, ...context }`
  - Derive status: claim with `used_at` set → skip (covered by usage), claim with `expires_at >= now()` → active, claim with `expires_at < now()` → expired, usage → used
  - Filter by `$status` param if provided
  - Sort by most recent first (active by expires_at asc, used/expired by used_at/expires_at desc)
  - Return as simple array (not paginated — unlikely to have hundreds of coupons per customer)

### Step 2: Backend — Add route + controller method
- **Files:** `backend/routes/api.php`, `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php`
- **Details:**
  - Add route: `Route::get('customer/my/coupons', [CustomerPortalController::class, 'myCoupons'])->middleware('permission:customer_portal.view_own')`
  - Controller: call `CouponService::getMyCoupons(auth()->id(), $request->status)`, return via `successResponse()`
  - CouponServiceInterface already injected in CustomerPortalController (added during claimable feature)

### Step 3: Backend — Tests
- **Files:** `backend/tests/Feature/Api/V1/CouponTest.php`
- **Details:**
  - Add describe block "My Coupons Page"
  - Test: returns active claims
  - Test: returns used coupons with transaction reference
  - Test: returns expired claims
  - Test: filters by status param
  - Test: excludes other users' claims/usages
  - Test: returns empty array for customer with no coupons

### Step 4: Frontend — Types + Service + Hook
- **Files:** `frontend-customer-portal/types/api.ts`, `frontend-customer-portal/services/customerActionService.ts`, `frontend-customer-portal/hooks/useStorefront.ts`
- **Details:**
  - Add `MyCouponItem` interface: `{ id, type: 'claim'|'usage', status: 'active'|'used'|'expired', coupon: Coupon, claimed_at?, expires_at?, used_at?, used_on_type?, used_on_id?, discount_amount? }`
  - Add service: `getMyCoupons(status?: string): Promise<ApiResponse<MyCouponItem[]>>`
  - Add hook: `useMyCoupons(status?: string)` with queryKey `['customer', 'coupons', status]`

### Step 5: Frontend — Coupons page
- **Files:** `frontend-customer-portal/app/(customer)/coupons/page.tsx`
- **Details:**
  - Page header: Ticket icon + "My Coupons" title (same pattern as loyalty page)
  - Tab buttons: All | Active | Used | Expired (client-side filter state)
  - Fetch ALL coupons once (no server-side filtering — small dataset), filter client-side per tab
  - Card component per status:
    - **Active**: voucher design with gradient accent, code in dashed box + copy, countdown timer, merchant name
    - **Used**: same voucher but with emerald "Used" badge, shows "Applied to {type} #{id}" link, discount amount, used_at date
    - **Expired**: dimmed voucher with amber "Expired" badge, "Claim Again" button (links to merchant storefront page)
  - Empty state: Ticket icon + "No coupons yet" + "Browse merchants" CTA
  - Loading state: 3 skeleton cards
  - Reuse `useCountdown` and `CopyButton` from storefront coupons-section (extract to shared utils or inline)

### Step 6: Frontend — Add nav item
- **Files:** `frontend-customer-portal/app/(customer)/layout.tsx`
- **Details:**
  - Import `Ticket` from lucide-react
  - Add `{ href: '/coupons', label: 'Coupons', icon: Ticket }` to navItems array — between Reviews and Profile

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Customer record not found for user | Low | Guard with `?->id` and return empty usages if no Customer record |
| Duplicate entries (claim + usage for same coupon) | Medium | Skip claims where `used_at` is set — the usage record covers it |
| Large coupon list perf | Low | Unlikely per-customer, but if needed add pagination later |

## Testing Strategy

- [ ] Backend: 6 tests covering active/used/expired claims, status filter, user isolation, empty state
- [ ] Frontend: TypeScript compilation, visual check of all 4 tab states
- [ ] Integration: Claim on storefront → see active on /coupons → use at checkout → see used on /coupons

## Open Questions

None — all decisions made in brainstorm.
