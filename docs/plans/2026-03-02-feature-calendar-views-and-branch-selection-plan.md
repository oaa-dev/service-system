# Plan: Calendar Views for My-Store + Organization Branch Selection

**Date:** 2026-03-02
**Type:** feature
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- [Eager-loaded relation missing from API response](../knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md): Always pair eager-load `->with()` with `whenLoaded()` in Resource. MerchantResource already has `children` and `children_count` handled — just need the service to call `withCount('children')`.
- Booking module uses `date_from`/`date_to` callback filters, `booking_date` exact filter, `status` filter. Default sort: `-booking_date`.
- Reservation module uses `date_from`/`date_to` on `check_in`/`check_out`, overlap detection: `where('check_in', '<', $checkOut)->where('check_out', '>', $checkIn)`.

### Known Gotchas
- **Eager load + Resource = atomic pair**: MerchantResource already has `whenLoaded('children')` and `when($this->children_count !== null, ...)` — no Resource changes needed for branch count. Just add `withCount('children')` in StorefrontService.
- **My-store pages reuse admin hooks**: My-store bookings/reservations pages call `useBookings(merchantId, ...)` and `useReservations(merchantId, ...)` — the same admin hooks, just passing `user.merchant.id`. Calendar hooks will follow the same pattern.
- **Branch merchants use parent's services**: `$serviceMerchantId = $merchant->parent_id ?? $merchantId` — already implemented in BookingService and ReservationService.

### Critical Patterns Applied
- Calendar aggregation endpoints follow existing `auth/merchant/` self-service route pattern (auto-resolve merchant from auth user)
- Frontend types already include `children?: Merchant[]`, `children_count?: number`, `parent_id`, `type` — no type changes needed for branch features

## Overview

Three connected features:
1. **My-Store Calendar Views** — Backend aggregation endpoints + frontend month grid for bookings and reservations
2. **Customer Portal Organization Display** — Branch count badge on merchant cards, hide action buttons for organizations
3. **Branch Selection Page** — New `/merchants/{slug}/branches` page in customer portal

## User Decisions

- Calendar: Aggregated totals only (click day for per-service detail in list view)
- Reservations: Show both reservation count AND unit availability per day
- Branch logos: Fall back to parent organization's logo if branch has none
- Branch page: List only (no map), map can be added later

## Implementation Steps

### Step 1: Backend — Booking Calendar Aggregation Endpoint

**Files:**
- `backend/app/Services/BookingService.php` — Add `getBookingCalendar(int $merchantId, string $month)` method
- `backend/app/Services/Contracts/BookingServiceInterface.php` — Add interface method
- `backend/app/Http/Controllers/Api/V1/MyMerchantController.php` — Add `bookingsCalendar()` action
- `backend/routes/api.php` — Add `GET /auth/merchant/bookings/calendar` route

**Details:**
- New service method queries bookings for the given month, grouped by `booking_date`
- Uses raw SQL aggregation: `SELECT booking_date, COUNT(*) as booking_count, SUM(party_size) as total_booked, GROUP BY booking_date`
- Cross-reference with ServiceSchedule to get `total_capacity` per day (sum of max_capacity for services with schedule on that day_of_week)
- Also query merchant's business hours to mark closed days
- Return array of `{ date, booking_count, total_booked, total_capacity, is_closed }` for each day in the month
- Route goes under `auth/merchant` prefix (no `merchant.active` middleware needed — same level as existing routes)

**Response structure:**
```json
{
  "success": true,
  "data": [
    { "date": "2026-03-01", "booking_count": 5, "total_booked": 8, "total_capacity": 20, "is_closed": false },
    { "date": "2026-03-02", "booking_count": 0, "total_booked": 0, "total_capacity": 0, "is_closed": true }
  ]
}
```

### Step 2: Backend — Reservation Calendar Aggregation Endpoint

**Files:**
- `backend/app/Services/ReservationService.php` — Add `getReservationCalendar(int $merchantId, string $month)` method
- `backend/app/Services/Contracts/ReservationServiceInterface.php` — Add interface method
- `backend/app/Http/Controllers/Api/V1/MyMerchantController.php` — Add `reservationsCalendar()` action
- `backend/routes/api.php` — Add `GET /auth/merchant/reservations/calendar` route

**Details:**
- Query reservations that overlap with each day in the month: `check_in <= date AND check_out > date` for active statuses (pending, confirmed, checked_in)
- Count total rentable units (Service where `service_type=reservation` and `is_active=true`, SUM of unit count or just count services)
- Return `{ date, reservation_count, total_units, available_units, is_closed }` for each day
- Also check merchant business hours for closed days

**Response structure:**
```json
{
  "success": true,
  "data": [
    { "date": "2026-03-01", "reservation_count": 3, "total_units": 10, "available_units": 7, "is_closed": false }
  ]
}
```

### Step 3: Backend Tests — Calendar Endpoints

**Files:**
- `backend/tests/Feature/Api/V1/MyMerchantCalendarTest.php` — New test file

**Test cases:**
- Booking calendar returns correct daily counts for a month with mixed bookings
- Booking calendar marks closed days (no business hours for that day_of_week)
- Booking calendar excludes cancelled/no_show bookings from counts
- Booking calendar correctly sums capacity from ServiceSchedules
- Reservation calendar returns correct overlap-based counts
- Reservation calendar shows correct available_units
- Reservation calendar excludes cancelled/checked_out from active count
- Calendar requires authentication
- Calendar returns empty array for month with no bookings/reservations
- Month parameter validation (YYYY-MM format)

### Step 4: Frontend — Calendar Services and Hooks

**Files:**
- `frontend/services/bookingService.ts` — Add `getCalendar(month: string)` method
- `frontend/services/reservationService.ts` — Add `getCalendar(month: string)` method
- `frontend/hooks/useBookings.ts` — Add `useBookingCalendar(month: string)` hook
- `frontend/hooks/useReservations.ts` — Add `useReservationCalendar(month: string)` hook
- `frontend/types/api.ts` — Add `BookingCalendarDay` and `ReservationCalendarDay` interfaces

**Details:**
- Service methods call `GET /auth/merchant/bookings/calendar?month=${month}` and similar for reservations (no merchantId needed — self-service endpoint)
- Hook query keys: `['my-merchant', 'bookings', 'calendar', month]` and `['my-merchant', 'reservations', 'calendar', month]`
- `enabled: !!month`

### Step 5: Frontend — BookingsCalendarView Component

**Files:**
- `frontend/app/(system)/(my-store)/my-store/bookings/bookings-calendar-view.tsx` — New component
- `frontend/app/(system)/(my-store)/my-store/bookings/page.tsx` — Add List/Calendar toggle

**Details:**
- Month grid using `react-day-picker` in `month` mode (or custom grid if DayPicker doesn't support count overlays)
- Each day cell shows: booking count (bold), capacity bar or fraction (e.g., "5/20")
- Color coding: green (< 50% booked), amber (50-90% booked), red (> 90% or full), gray (closed day)
- Click a day → sets a `selectedDate` state → switches to list view filtered to that date
- Month navigation: prev/next month buttons updating the `month` query parameter
- Toggle button group at page top: "List" | "Calendar" (persist choice in URL param or local state)
- Page modifications: wrap existing list in a conditional, add the toggle, render calendar when active

### Step 6: Frontend — ReservationsCalendarView Component

**Files:**
- `frontend/app/(system)/(my-store)/my-store/reservations/reservations-calendar-view.tsx` — New component
- `frontend/app/(system)/(my-store)/my-store/reservations/page.tsx` — Add List/Calendar toggle

**Details:**
- Same month grid pattern as bookings calendar
- Each day cell shows: reservation count, "X of Y units" availability
- Color coding: green (> 50% available), amber (< 50% available), red (full), gray (closed)
- Click day → filter list view to that date range (check_in = date)
- Same toggle pattern as bookings page

### Step 7: Backend — Storefront Branch Count

**Files:**
- `backend/app/Services/StorefrontService.php` — Add `withCount('children')` to `getActiveMerchants()`

**Details:**
- Single line addition: chain `->withCount('children')` onto the QueryBuilder in `getActiveMerchants()`
- MerchantResource already has `'children_count' => $this->when($this->children_count !== null, $this->children_count)` — no Resource change needed
- Frontend types already have `children_count?: number` — no type change needed
- **Knowledge note:** This is the eager-load pattern — but `withCount` doesn't need a `whenLoaded()`, it uses `when($this->children_count !== null, ...)` which is already in MerchantResource

### Step 8: Frontend — Merchant Card Organization Display

**Files:**
- `frontend-customer-portal/components/storefront/merchant-card.tsx` — Update card rendering

**Details:**
- Check `merchant.type === 'organization'` to conditionally render:
  - "Organization" badge (small pill next to business type badge)
  - Branch count: "{children_count} branches" text
  - Replace capability badges with single "View Branches →" link/text
- Keep the card's `<Link>` pointing to `/merchants/${merchant.slug}` — the detail page will handle the redirect/gating
- Individual merchants render unchanged

### Step 9: Backend — Storefront Branches Endpoint

**Files:**
- `backend/app/Services/StorefrontService.php` — Add `getMerchantBranches(string $slug)` method
- `backend/app/Http/Controllers/Api/V1/StorefrontController.php` — Add `branches()` action
- `backend/routes/api.php` — Add `GET /storefront/merchants/{slug}/branches` route

**Details:**
- Find parent merchant by slug, verify it's active and `type === 'organization'`
- Query `Merchant::where('parent_id', $parent->id)->where('status', 'active')` with eager loads: `media`, `address.geoCity`, `address.province`, `businessHours`
- Return paginated MerchantResource collection
- If merchant is not an organization, return 404 or empty collection
- Public endpoint (no auth), placed under existing `storefront/` route group

### Step 10: Backend Tests — Storefront Branch Count + Branches Endpoint

**Files:**
- `backend/tests/Feature/Api/V1/StorefrontBranchTest.php` — New test file

**Test cases:**
- Merchant listing includes `children_count` for organization merchants
- Individual merchants have `children_count: 0`
- Branches endpoint returns active child merchants
- Branches endpoint returns 404 for individual merchant slug
- Branches endpoint returns 404 for inactive organization
- Branch merchants inherit parent's logo when they have none (Resource-level)

### Step 11: Frontend — Branch Selection Page

**Files:**
- `frontend-customer-portal/app/(storefront)/merchants/[slug]/branches/page.tsx` — New page
- `frontend-customer-portal/services/storefrontService.ts` — Add `getMerchantBranches(slug)` method
- `frontend-customer-portal/hooks/useStorefront.ts` — Add `useMerchantBranches(slug)` hook

**Details:**
- Page layout: back button to merchant detail, organization header (name, logo, description), grid of branch cards
- Branch cards show: name, address (city, province), open/closed indicator (via `isOpenNow()`), capability badges, "View Branch →" button
- Each card links to `/merchants/${branch.slug}` (the branch's own detail page)
- Branch logo: use `branch.logo?.preview ?? parent.logo?.preview` (parent data available from `useMerchantBySlug()`)
- Loading/empty states: skeleton cards while loading, "No branches available" message if empty

### Step 12: Frontend — Organization Gate on Merchant Detail Page

**Files:**
- `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx` — Add organization gate

**Details:**
- If `merchant.type === 'organization'`:
  - Hide Book/Reserve/Order CTA buttons
  - Show info banner: "This is an organization with {children_count} branches. Please select a branch to book or reserve."
  - Show "View Branches" button linking to `/merchants/${merchant.slug}/branches`
  - Still show merchant info, gallery, services (informational)
- If `merchant.type === 'individual'` (or branch): render as-is (no change)

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Calendar aggregation queries slow for merchants with many bookings | Low | Use raw SQL GROUP BY, index on `booking_date` + `merchant_id` already exists from migration |
| Reservation overlap counting complex for multi-day reservations | Medium | Use `check_in <= date AND check_out > date` — simple and correct. Test edge cases: same-day check-in/check-out, month boundaries |
| react-day-picker may not support custom day cell content | Low | Library supports `components.Day` customization. Fallback: custom CSS grid (7-column) if needed |
| Branch logo fallback adds complexity to card rendering | Low | Simple ternary: `branch.logo ?? parent.logo`. Parent data already available from the branches endpoint response or parent page context |

## Testing Strategy

- [ ] Backend: Booking calendar returns correct counts grouped by date
- [ ] Backend: Booking calendar excludes cancelled/no_show from counts
- [ ] Backend: Booking calendar correctly identifies closed days from business hours
- [ ] Backend: Reservation calendar counts overlap-based active reservations per day
- [ ] Backend: Reservation calendar shows correct available vs total units
- [ ] Backend: Calendar endpoints require auth, return 404 for users without merchant
- [ ] Backend: Month param validation rejects invalid formats
- [ ] Backend: Storefront listing includes children_count
- [ ] Backend: Branches endpoint returns active children only
- [ ] Backend: Branches endpoint 404s for non-organization merchants
- [ ] Frontend: Calendar view renders month grid with correct color coding
- [ ] Frontend: Click day filters list to that date
- [ ] Frontend: List/Calendar toggle preserves filter state
- [ ] Frontend: Organization merchant cards show badge + branch count
- [ ] Frontend: Branch selection page loads and displays branches
- [ ] Frontend: Organization detail page shows gate message with link to branches
- [ ] Frontend: TypeScript compiles, lint passes

## Open Questions

- None remaining (all user decisions captured above)
