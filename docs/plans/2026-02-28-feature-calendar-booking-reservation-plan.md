# Plan: Calendar-Based Booking & Reservation Forms

**Date:** 2026-02-28
**Type:** feature
**Status:** Draft
**Brainstorm:** [../brainstorms/2026-02-28-calendar-booking-reservation-forms.md](../brainstorms/2026-02-28-calendar-booking-reservation-forms.md)

## Knowledge Context

### Relevant Learnings
- [booking.md](../knowledge/modules/booking.md): BookingService validates schedule → time boundary → capacity (sum pending+confirmed at same slot). Service must be `service_type=bookable`.
- [reservation.md](../knowledge/modules/reservation.md): ReservationService validates date range → overlap check (`check_in < $check_out AND check_out > $check_in`). Service must be `service_type=reservation`.
- [service-schedule.md](../knowledge/modules/service-schedule.md): 7-day weekly availability (day_of_week 0-6, start_time, end_time, is_available). Loaded with service detail via StorefrontService.
- [customer-portal-and-storefront-architecture.md](../customer-portal-and-storefront-architecture.md): StorefrontService is read-only, no auth(), queries models directly. Public routes use merchant slugs.

### Known Gotchas
- **Eager load + Resource = atomic pair**: New availability endpoints return raw data (no Resource), so this doesn't apply directly. But if we ever add relations, remember this.
- **Time format precision**: Backend stores `start_time` as `HH:MM:SS` but frontend uses `HH:MM`. Booking capacity check appends `:00` for exact match.
- **Price is string**: API returns decimal prices as strings. Frontend must `parseFloat()` for calculations.
- **Pending inclusion decision**: Include pending in both booking and reservation availability responses (user decision). This means the availability endpoint shows a stricter view than backend validation for reservations.

### Critical Patterns Applied
- StorefrontService pattern: read-only, no auth, direct model queries, public routes
- Storefront routes: nested under `storefront/` prefix, no middleware
- Frontend: React Query hooks with auto-refetch, `enabled` guards, query key namespacing

## Overview

Add two new public storefront API endpoints that return service availability data (booked time slots / reserved date ranges) per month. Redesign the customer portal booking and reservation pages from plain form inputs to calendar-based UIs with visual availability indicators.

## Decisions

| Question | Decision |
|----------|----------|
| Booking UI | Month calendar with day indicators (green/yellow/red/gray) + time slot picker on day click |
| Reservation UI | Month calendar with reserved date ranges blocked + click-to-select range |
| API strategy | New public storefront endpoints per service per month |
| Include pending? | Yes — both booking and reservation availability include pending status |
| Auto-fetch months? | Yes — React Query auto-fetches when month changes, with caching |
| Calendar library | `react-day-picker` (already a shadcn/ui dependency in customer portal) |

## Implementation Steps

### Phase 1: Backend — Availability Endpoints

#### Step 1: Add availability methods to StorefrontService

- **Files:** `backend/app/Services/StorefrontService.php`, `backend/app/Services/Contracts/StorefrontServiceInterface.php`
- **Details:**
  - Add `getBookingAvailability(string $slug, int $serviceId, string $month)` method
    - Resolve merchant by slug (active only)
    - Load service with schedules (verify belongs to merchant, is_active, service_type=bookable)
    - Parse month param to get start/end of month dates
    - Query: `Booking::where('service_id', $serviceId)->whereIn('status', ['pending', 'confirmed'])->whereBetween('booking_date', [$monthStart, $monthEnd])->selectRaw('booking_date, start_time, SUM(party_size) as booked')->groupBy('booking_date', 'start_time')->get()`
    - Return: `['service' => $service, 'schedule' => $service->schedules, 'booked_slots' => $groupedByDate]`
  - Add `getReservationAvailability(string $slug, int $serviceId, string $month)` method
    - Resolve merchant by slug (active only)
    - Load service (verify belongs to merchant, is_active, service_type=reservation)
    - Parse month param; extend range by ±1 month to catch cross-month reservations
    - Query: `Reservation::where('service_id', $serviceId)->whereIn('status', ['pending', 'confirmed', 'checked_in'])->where('check_out', '>=', $monthStart)->where('check_in', '<=', $monthEnd)->select('check_in', 'check_out')->get()`
    - Return: `['service' => $service, 'reserved_dates' => $reservations]`

#### Step 2: Add controller methods to StorefrontController

- **Files:** `backend/app/Http/Controllers/Api/V1/StorefrontController.php`
- **Details:**
  - Add `bookingAvailability(string $slug, int $service, Request $request)` method
    - Validate `month` query param (format: YYYY-MM, required)
    - Call `StorefrontService::getBookingAvailability()`
    - Return `successResponse()` with schedule + booked_slots
  - Add `reservationAvailability(string $slug, int $service, Request $request)` method
    - Validate `month` query param (format: YYYY-MM, required)
    - Call `StorefrontService::getReservationAvailability()`
    - Return `successResponse()` with reserved_dates
  - Response format (booking):
    ```json
    {
      "service": { "id", "name", "duration", "max_capacity", "price" },
      "schedule": [{ "day_of_week", "start_time", "end_time", "is_available" }],
      "booked_slots": {
        "2026-03-03": [{ "time": "10:00", "booked": 3 }]
      }
    }
    ```
  - Response format (reservation):
    ```json
    {
      "service": { "id", "name", "price", "price_per_night", "max_capacity" },
      "reserved_dates": [{ "check_in": "2026-03-03", "check_out": "2026-03-06" }]
    }
    ```

#### Step 3: Add routes

- **Files:** `backend/routes/api.php`
- **Details:**
  - Add inside existing `Route::prefix('storefront')` group:
    ```php
    Route::get('merchants/{slug}/services/{service}/booking-availability', [StorefrontController::class, 'bookingAvailability']);
    Route::get('merchants/{slug}/services/{service}/reservation-availability', [StorefrontController::class, 'reservationAvailability']);
    ```
  - Both are public (no auth), consistent with existing storefront routes

#### Step 4: Backend tests

- **Files:** `backend/tests/Feature/Api/V1/StorefrontAvailabilityTest.php`
- **Details:** Pest describe/it syntax. Test cases:
  - **Booking availability:**
    - Returns schedule + empty booked_slots for month with no bookings
    - Returns correct booked counts per slot when bookings exist
    - Shows fully booked slot (booked = max_capacity)
    - Excludes cancelled/completed/no_show bookings from counts
    - Includes pending bookings in counts
    - Returns 404 for non-existent merchant slug
    - Returns 404 for service not belonging to merchant
    - Returns 422 for missing/invalid month param
    - Closed days (is_available=false) included in schedule response
  - **Reservation availability:**
    - Returns empty reserved_dates for month with no reservations
    - Returns correct date ranges for existing reservations
    - Includes pending and confirmed and checked_in reservations
    - Excludes cancelled/checked_out reservations
    - Handles cross-month reservations (reservation spanning Feb→Mar shown in both months)
    - Returns 404 for non-existent service/merchant

### Phase 2: Frontend — Types, Services, Hooks

#### Step 5: Add TypeScript types

- **Files:** `frontend-customer-portal/types/api.ts`
- **Details:**
  ```typescript
  interface BookedSlot {
    time: string;       // "HH:MM"
    booked: number;
  }

  interface BookingAvailabilityResponse {
    service: {
      id: number;
      name: string;
      duration: number;
      max_capacity: number;
      price: string;
    };
    schedule: ServiceSchedule[];
    booked_slots: Record<string, BookedSlot[]>;  // keyed by "YYYY-MM-DD"
  }

  interface ReservedDateRange {
    check_in: string;   // "YYYY-MM-DD"
    check_out: string;  // "YYYY-MM-DD"
  }

  interface ReservationAvailabilityResponse {
    service: {
      id: number;
      name: string;
      price: string;
      price_per_night: string | null;
      max_capacity: number;
    };
    reserved_dates: ReservedDateRange[];
  }
  ```

#### Step 6: Add service functions

- **Files:** `frontend-customer-portal/services/storefrontService.ts`
- **Details:**
  - Add `getBookingAvailability(slug: string, serviceId: number, month: string): Promise<ApiResponse<BookingAvailabilityResponse>>`
  - Add `getReservationAvailability(slug: string, serviceId: number, month: string): Promise<ApiResponse<ReservationAvailabilityResponse>>`
  - Both call GET with `?month=YYYY-MM` query param

#### Step 7: Add React Query hooks

- **Files:** `frontend-customer-portal/hooks/useStorefront.ts`
- **Details:**
  - Add `useBookingAvailability(slug: string, serviceId: number | null, month: string)`
    - Query key: `['storefront', 'booking-availability', slug, serviceId, month]`
    - `enabled: !!slug && !!serviceId && !!month`
    - `staleTime: 30000` (30s — availability changes frequently)
    - `keepPreviousData: true` (smooth month transitions)
  - Add `useReservationAvailability(slug: string, serviceId: number | null, month: string)`
    - Query key: `['storefront', 'reservation-availability', slug, serviceId, month]`
    - Same config as above

### Phase 3: Frontend — Booking Calendar Page

#### Step 8: Install react-day-picker (if not already installed)

- **Files:** `frontend-customer-portal/package.json`
- **Details:** Check if `react-day-picker` is already in dependencies (it's a shadcn/ui dep). If not: `npm install react-day-picker`

#### Step 9: Create booking calendar component

- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/booking-calendar.tsx` (new)
- **Details:**
  - Props: `schedule: ServiceSchedule[]`, `bookedSlots: Record<string, BookedSlot[]>`, `serviceDuration: number`, `maxCapacity: number`, `selectedDate: Date | null`, `onDateSelect: (date: Date) => void`, `month: Date`, `onMonthChange: (month: Date) => void`
  - Uses `react-day-picker` `<DayPicker>` with `mode="single"` for month calendar
  - Custom `modifiers` to color-code days:
    - `closed`: days where schedule has `is_available=false` for that day_of_week
    - `fullyBooked`: days where ALL generated time slots have `booked >= max_capacity`
    - `fewSlots`: days where SOME slots are booked but not all full
    - `available`: open days with slots available
    - `past`: days before today
  - Custom `modifiersStyles` or `modifiersClassNames` for colors:
    - `closed` → gray, unclickable
    - `fullyBooked` → red dot/badge
    - `fewSlots` → yellow dot/badge
    - `available` → green dot/badge
    - `past` → dimmed, disabled
  - Disable: past dates + closed days + fully booked days
  - Footer legend: colored dots with labels

#### Step 10: Create time slot picker component

- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/time-slot-picker.tsx` (new)
- **Details:**
  - Props: `date: Date`, `schedule: ServiceSchedule[]`, `bookedSlots: BookedSlot[]`, `serviceDuration: number`, `maxCapacity: number`, `selectedTime: string | null`, `onTimeSelect: (time: string) => void`
  - Generates time slots from schedule start_time to end_time using duration increments
  - For each slot, looks up booked count from `bookedSlots` array
  - Renders list of time slot cards:
    - Available: white/green card with time + "Available" badge + click to select
    - Partially booked: white card with time + "X of Y booked" + click to select
    - Fully booked: gray card with time + "Reserved" badge + disabled
  - Selected slot highlighted with primary color border

#### Step 11: Redesign booking page

- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/page.tsx`
- **Details:**
  - Keep: AuthGate wrapper, service selector dropdown, merchant header
  - Replace: date input + time dropdown → BookingCalendar + TimeSlotPicker components
  - New state: `currentMonth` (Date), managed alongside existing `selectedServiceId`, `bookingDate`, `startTime`
  - Flow:
    1. Select service → triggers availability fetch for current month
    2. Calendar shows month view with availability indicators
    3. Click available day → TimeSlotPicker expands below calendar
    4. Click available time slot → slot selected, form fields populated
    5. Enter party size + notes
    6. Submit button enabled when service + date + time selected
  - Month navigation: `onMonthChange` updates `currentMonth` state → React Query auto-fetches new month
  - Keep existing submission logic (createBooking mutation)

### Phase 4: Frontend — Reservation Calendar Page

#### Step 12: Create reservation calendar component

- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/reservation-calendar.tsx` (new)
- **Details:**
  - Props: `reservedDates: ReservedDateRange[]`, `selectedRange: { from: Date; to: Date } | null`, `onRangeSelect: (range: { from: Date; to: Date } | null) => void`, `month: Date`, `onMonthChange: (month: Date) => void`
  - Uses `react-day-picker` `<DayPicker>` with `mode="range"` for date range selection
  - Custom `disabled` matcher: function that checks if a date falls within any reserved range
    - For each `ReservedDateRange`, check: `date >= check_in && date < check_out`
    - Also disable past dates
  - Custom modifiers:
    - `reserved`: dates within any reserved range → red/dark background with "Reserved" visual
    - `selected`: user's selected range → blue/primary highlight
  - Range selection validation: if user tries to select a range that spans across a reserved block, prevent it (clear selection and show toast)
  - Show: `numberOfMonths: 1` on mobile, potentially 2 on desktop
  - Footer: price calculation when range selected (`nights × price_per_night`)

#### Step 13: Redesign reservation page

- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/page.tsx`
- **Details:**
  - Keep: AuthGate wrapper, service/unit selector dropdown, merchant header
  - Replace: check_in + check_out date inputs → ReservationCalendar component
  - New state: `currentMonth` (Date), `selectedRange` ({ from: Date, to: Date } | null)
  - Flow:
    1. Select unit/service → triggers availability fetch for current month
    2. Calendar shows month view with reserved ranges blocked
    3. Click start date → start of range selected
    4. Click end date → range completed, nights + price calculated inline
    5. Enter guest count + notes + special requests
    6. Submit button enabled when service + valid range selected
  - Month navigation auto-fetches new availability
  - Derive check_in/check_out from selectedRange for form submission
  - Keep existing submission logic (createReservation mutation)

### Phase 5: Polish & Testing

#### Step 14: Mobile responsiveness

- **Files:** Both calendar components
- **Details:**
  - Calendar cells: min-width for touch targets (44px per WCAG)
  - Time slot picker: full-width cards on mobile
  - Reservation calendar: single month on small screens
  - Summary card: sticky bottom on mobile

#### Step 15: Loading & error states

- **Files:** Both page files
- **Details:**
  - Skeleton placeholders while availability loads
  - Error state if availability fetch fails (retry button)
  - "No bookable services" / "No rentable units" empty states
  - Invalidate availability query after successful booking/reservation submission

## API Endpoint Summary

| Method | URI | Auth | Description |
|--------|-----|------|-------------|
| GET | `/storefront/merchants/{slug}/services/{service}/booking-availability?month=YYYY-MM` | Public | Booking time slot availability |
| GET | `/storefront/merchants/{slug}/services/{service}/reservation-availability?month=YYYY-MM` | Public | Reservation date range availability |

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Stale availability data (someone books while user is viewing) | Medium | 30s staleTime on React Query; re-fetch on month change; backend still validates on submit (final guard) |
| Performance on services with many bookings per month | Low | GroupBy query is efficient; indexed on service_id + booking_date. Response is per-service, not all services |
| Cross-month reservation edge case | Medium | Extend query range by ±1 day from month boundaries to catch reservations that span months |
| react-day-picker version compatibility | Low | Already a shadcn/ui dependency; verify version supports `mode="range"` and custom modifiers |
| Time zone issues | Low | All data in Philippines time; dates stored as DATE (no timezone), times as TIME |

## Testing Strategy

### Backend Tests
- [ ] Booking availability: empty month, partial bookings, fully booked slots, status filtering (exclude cancelled)
- [ ] Reservation availability: empty month, single reservation, cross-month reservation, status filtering
- [ ] Validation: missing month param, invalid month format, non-existent service/merchant
- [ ] Edge cases: service not belonging to merchant, wrong service_type

### Frontend Testing (Manual)
- [ ] Select service → calendar loads with correct availability
- [ ] Navigate months → auto-fetches new data
- [ ] Click available day → time slots appear correctly
- [ ] Reserved slots show "Reserved" badge, are not clickable
- [ ] Fully booked days are marked red on calendar
- [ ] Closed days are grayed out
- [ ] Date range selection works, blocks reserved dates
- [ ] Price calculation updates live on range change
- [ ] Submit booking/reservation still works end-to-end
- [ ] Mobile layout works correctly

## File Change Summary

### New Files
| File | Description |
|------|-------------|
| `backend/tests/Feature/Api/V1/StorefrontAvailabilityTest.php` | Backend tests |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/booking-calendar.tsx` | Month calendar with availability indicators |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/time-slot-picker.tsx` | Time slot list with reserved badges |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/reservation-calendar.tsx` | Month calendar with date range selection |

### Modified Files
| File | Changes |
|------|---------|
| `backend/app/Services/Contracts/StorefrontServiceInterface.php` | Add 2 method signatures |
| `backend/app/Services/StorefrontService.php` | Add 2 availability methods |
| `backend/app/Http/Controllers/Api/V1/StorefrontController.php` | Add 2 controller methods |
| `backend/routes/api.php` | Add 2 storefront routes |
| `frontend-customer-portal/types/api.ts` | Add availability response types |
| `frontend-customer-portal/services/storefrontService.ts` | Add 2 service functions |
| `frontend-customer-portal/hooks/useStorefront.ts` | Add 2 React Query hooks |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/page.tsx` | Redesign with calendar components |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/page.tsx` | Redesign with calendar components |
