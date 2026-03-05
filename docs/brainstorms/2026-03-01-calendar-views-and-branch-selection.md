# Brainstorm: Calendar Views for My-Store + Organization Branch Selection

**Date:** 2026-03-01
**Status:** Draft

## Knowledge Context

- Booking availability uses `ServiceSchedule` (7-day weekly) + `max_capacity` per service. Capacity check: `SUM(party_size) for pending/confirmed bookings < max_capacity`.
- Reservation overlap prevention already in backend. Date-range based with `check_in`/`check_out`.
- Merchant model already supports `type: individual|organization` with `parent_id` for branches and `children()` HasMany relationship.
- Customer portal already has `BookingCalendar` and `ReservationCalendar` components using `react-day-picker` (in storefront booking flow).
- Branch merchants inherit parent organization's services.
- Critical pattern: Eager load + Resource = atomic pair (always add `whenLoaded()` in Resource when adding `->with()` in service).

## Problem / Goal

Three connected features:

1. **My-Store Calendar Views:** Merchant owners at `/my-store/bookings` and `/my-store/reservations` need a monthly calendar view showing daily booking/reservation counts and remaining availability. Currently these pages are list-only.

2. **Customer Portal Organization Filtering:** At `/merchants` (customer portal), show individual and organization merchant types distinctly. Organizations display a badge + branch count instead of booking/reserve buttons.

3. **Branch Selection Flow:** When a customer clicks an organization, navigate to a separate branch selection page. Customer must select a branch before booking or reserving. Cannot book/reserve on an organization directly.

## User Decisions

- **Calendar view:** Month view with daily counts. Click a day to see bookings/reservations for that date.
- **View mode:** Toggle between List and Calendar (keep both available).
- **Branch flow:** Separate page — clicking organization navigates to branch selection page.
- **Org display:** Badge + branch count on card. Book/Reserve buttons hidden for organizations.

## Approaches Considered

### Feature 1: My-Store Calendar Views

#### Approach A: New Backend Endpoint + Frontend Calendar Component

- **Description:** Create a new API endpoint `GET /auth/merchant/bookings/calendar?month=YYYY-MM` that returns aggregated daily data (booking count, total capacity, available slots per day). Frontend renders a month grid using `react-day-picker` or custom grid with day cells showing counts. Click a day to filter the existing list view to that date.
- **Pros:** Clean separation, efficient single query for month data, reusable endpoint
- **Cons:** New backend endpoint to build and maintain

#### Approach B: Frontend-Only Aggregation

- **Description:** Fetch all bookings/reservations for the visible month via existing list API (with date range filter), aggregate counts in frontend.
- **Pros:** No backend changes needed
- **Cons:** Potentially large payloads, client-side aggregation is fragile, pagination complicates month-wide fetching

### Decision: Approach A (New Backend Endpoint)

New dedicated calendar endpoints provide efficient aggregation and avoid pagination issues.

**Backend endpoints needed:**

```
GET /auth/merchant/bookings/calendar?month=2026-03
Response: { data: [{ date: "2026-03-01", booking_count: 5, total_capacity: 20, services: [...] }, ...] }

GET /auth/merchant/reservations/calendar?month=2026-03
Response: { data: [{ date: "2026-03-01", reservation_count: 3, total_units: 10, checked_in: 2 }, ...] }
```

**Frontend components:**
- `BookingsCalendarView` — month grid, color-coded days (green=available, amber=some booked, red=full, gray=closed)
- `ReservationsCalendarView` — month grid, color-coded days (green=available, amber=partially reserved, red=fully reserved)
- Toggle button on both pages switching between List and Calendar views
- Click day → filters list view to that specific date

---

### Feature 2: Customer Portal Organization Display

#### Changes to Storefront Merchant Listing

- **Backend:** Storefront merchants API already returns `type` field. Add `children_count` to `StorefrontMerchantResource` (use `withCount('children')` in query).
- **Frontend merchant card:**
  - Individual merchants: Show as-is with Book/Reserve buttons
  - Organization merchants: Show "Organization" badge + "X branches" count. Replace action buttons with "View Branches" link
  - Route: Organization card links to `/merchants/{slug}/branches`

---

### Feature 3: Branch Selection Page

#### New Page: `/merchants/{slug}/branches`

- **Backend:** Existing `GET /storefront/merchants/{slug}` returns merchant detail. Need new endpoint `GET /storefront/merchants/{slug}/branches` returning active child merchants.
- **Frontend page:** Grid/list of branch cards with:
  - Branch name, address, business hours (open/closed indicator)
  - Capability badges (can book, can reserve, can order)
  - "View" button → navigates to branch merchant detail page (`/merchants/{branch-slug}`)
- **Booking gate:** On merchant detail page, if `merchant.type === 'organization'`, hide Book/Reserve forms and show "Please select a branch" message with link to branches page.

## Open Questions

- Should the calendar show aggregated counts across ALL services, or per-service breakdown?
- For reservations calendar, should it show unit-level availability (e.g., "3 of 5 units available") or just reservation count?
- Should branches inherit the parent organization's logo/branding if they don't have their own?
- Map view on branch selection page — show branch locations on map?

## Next Steps

- [ ] Create implementation plan with `/plan`
- [ ] Build backend calendar aggregation endpoints
- [ ] Build frontend calendar components with List/Calendar toggle
- [ ] Update storefront merchant card for organization display
- [ ] Build branch selection page in customer portal
- [ ] Add booking gate on organization merchant detail pages
- [ ] Write tests for new endpoints
