# Brainstorm: Calendar-Based Booking & Reservation Forms

**Date:** 2026-02-28
**Status:** Decided

## Knowledge Context

- **ServiceSchedule** defines 7-day weekly availability per service (day_of_week, start_time, end_time, is_available)
- **BookingService** validates: schedule availability → time boundary → capacity check (sum of pending+confirmed bookings at same slot)
- **ReservationService** validates: date range → overlap check (no confirmed/checked_in reservations with overlapping dates)
- **Storefront API** already loads schedules with service detail, but does NOT expose existing bookings/reservations
- **Critical pattern**: Eager load + Resource = atomic pair — any new relations loaded must have matching `whenLoaded()` in Resource

## Problem / Goal

Redesign the customer portal booking (`/merchants/[slug]/book`) and reservation (`/merchants/[slug]/reserve`) pages from plain form inputs to a **calendar-based UI**. Currently, availability is only validated on submit (backend 422 error). Users need to visually see which time slots and dates are already taken before attempting to book.

### Requirements
- Booking page: Month calendar with day-level availability indicators + time slot picker when day is selected
- Reservation page: Month calendar with reserved date ranges visually blocked + click-to-select date range
- Unavailable slots/dates should be tagged as "Reserved"
- New backend endpoints to provide availability data per month

## Approaches Considered

### Approach A: Month Calendar + Time Picker (Booking) — SELECTED
- **Description:** Month calendar view where each day is color-coded (green=slots available, yellow=few slots, red=fully booked, gray=closed). Clicking a day reveals the time slots for that day with available/reserved status.
- **Pros:** Familiar month-view UX, compact overview, progressive disclosure (pick day → see slots), works well on mobile
- **Cons:** Requires fetching availability data for entire month upfront, two-step interaction (pick day then time)

### Approach B: Month Calendar with Range Selection (Reservation) — SELECTED
- **Description:** Month view where reserved date ranges are visually blocked (filled/colored). User clicks check-in date then check-out date. Reserved dates are unclickable. Shows price calculation inline.
- **Pros:** Airbnb-like familiar UX, prevents selecting reserved dates, visual date range highlighting, inline price preview
- **Cons:** Needs new endpoint to fetch reserved date ranges, cross-month ranges need careful handling

### Approach C: New Backend Availability Endpoint — SELECTED
- **Description:** Add public storefront endpoints that return occupied slots (bookings) or reserved date ranges (reservations) for a specific service and month.
- **Pros:** Accurate real-time availability display, prevents wasted form submissions, enables rich calendar indicators
- **Cons:** New endpoint to build and maintain, potential for stale data if not refreshed

## Decision

**All three approaches selected.** Full implementation plan:

### Backend (New Endpoints)

Two new public storefront endpoints:

**1. Booking Availability**
```
GET /api/v1/storefront/merchants/{slug}/services/{service}/booking-availability?month=2026-03
```
Response:
```json
{
  "schedule": [ServiceSchedule[]],
  "booked_slots": {
    "2026-03-03": [
      {"time": "10:00", "capacity": 3, "booked": 3},
      {"time": "13:00", "capacity": 3, "booked": 2}
    ]
  }
}
```
Logic: Query `Booking::where('service_id', id)->whereIn('status', ['pending', 'confirmed'])->whereBetween('booking_date', [monthStart, monthEnd])->select('booking_date', 'start_time')->selectRaw('SUM(party_size) as booked')->groupBy('booking_date', 'start_time')`

**2. Reservation Availability**
```
GET /api/v1/storefront/merchants/{slug}/services/{service}/reservation-availability?month=2026-03
```
Response:
```json
{
  "reserved_dates": [
    {"check_in": "2026-03-03", "check_out": "2026-03-06"},
    {"check_in": "2026-03-17", "check_out": "2026-03-20"}
  ]
}
```
Logic: Query `Reservation::where('service_id', id)->whereIn('status', ['pending', 'confirmed', 'checked_in'])->where('check_out', '>=', monthStart)->where('check_in', '<=', monthEnd)->select('check_in', 'check_out')`

### Frontend (Customer Portal)

**Booking Page Redesign:**
1. Service selector dropdown (bookable services only)
2. Month calendar grid with day indicators:
   - Green dot: slots available
   - Yellow dot: few slots remaining
   - Red dot: fully booked
   - Gray/no dot: closed (schedule `is_available=false`)
   - Past dates: dimmed/unclickable
3. Click day → expand time slot list below calendar:
   - Each slot shows time + "Available" or "Reserved" badge
   - Available slots have "Book Now" button
   - Reserved slots are grayed with "Reserved" tag
4. Party size input + notes
5. Booking confirmation summary → submit

**Reservation Page Redesign:**
1. Unit/service selector dropdown (reservation services only)
2. Month calendar with reserved date ranges visually blocked:
   - Reserved blocks: filled red/dark with "Reserved" label
   - Available dates: white/clickable
   - Past dates: dimmed
3. Click start date → click end date (highlights range in blue)
   - Cannot select into a reserved block
   - Shows nights count + price calculation live
4. Guest count input + notes + special requests
5. Reservation summary → submit

**Calendar Library:** Use a lightweight React calendar component (e.g., `react-day-picker` which is already a shadcn/ui dependency, or custom grid with Tailwind).

## Open Questions

- Should we include `pending` reservations in the blocked dates? (Currently backend only blocks `confirmed`+`checked_in` for overlap validation, but pending could still mean someone else is trying to book)
- Should the calendar fetch automatically when navigating months, or require a "Load" button?
- Should we show partial capacity info on reservation calendar (e.g., "2 of 3 reserved") or just binary available/reserved?

## Next Steps

- [ ] Add `booking-availability` endpoint to StorefrontController + StorefrontService
- [ ] Add `reservation-availability` endpoint to StorefrontController + StorefrontService
- [ ] Add storefront routes (public, no auth)
- [ ] Add frontend types for availability responses
- [ ] Add frontend service + hooks for availability endpoints
- [ ] Redesign booking page with month calendar + time slot picker
- [ ] Redesign reservation page with month calendar + range selection
- [ ] Write backend tests for availability endpoints
- [ ] Test edge cases: cross-month reservations, fully booked days, capacity boundaries
