# Brainstorm: Reservation Calendar Day Labels + Booking Time Slot Management

**Date:** 2026-03-02
**Status:** Decided

---

## Knowledge Context

From existing brainstorms and plans (2026-02-28, 2026-03-01, 2026-03-02):

- **Reservation calendar endpoint** already exists: `GET /auth/merchant/reservations/calendar?month=YYYY-MM`
  - Returns per-day: `{ date, reservation_count, total_units, available_units, is_closed }`
  - Overlap detection: `check_in <= date AND check_out > date`
  - Active statuses: `pending`, `confirmed`, `checked_in`

- **Booking calendar endpoint** already exists: `GET /auth/merchant/bookings/calendar?month=YYYY-MM`
  - Returns per-day: `{ date, booking_count, total_booked, total_capacity, is_closed }`
  - `BookingsCalendarView` and `ReservationsCalendarView` components already scaffolded with List/Calendar toggle

- **ServiceSchedule** (current state): one row per `[service_id, day_of_week]` with `start_time`, `end_time`, `is_available`
  - Defines open/close window per day, NOT discrete time slots
  - Bookings currently reference free-form `start_time`/`end_time` within that window

- **Booking model** currently has: `booking_date`, `start_time`, `end_time`, `party_size` — no slot FK

---

## Problem / Goal

### Feature 1: Reservation Calendar — Per-Day Status Overlays
The reservation calendar should visually tag each day with a status overlay showing whether reservations exist. Per-day, no slots — just tag each day:
- **No reservations** → clean / Open
- **Has reservations, some units still available** → "Partial" overlay
- **All units booked (0 available)** → "Full" overlay
- Clicking a day filters the list view below

### Feature 2: Merchant-Level Booking Slot Management
Merchants define **global time slots** for their entire store (not per service). All bookable services share the same merchant time slots. Merchants can:
1. Create time slots (day of week + start time + optional end time)
2. Set a max capacity per slot, or leave it unlimited
3. See the calendar reflect slot-level fill rates per day
4. Customers pick from available slots (not free-form time entry)

**Confirmed design decisions:**
- Slots are **merchant-level** (global), not per-service
- **Pending + confirmed** bookings both count against slot capacity
- Unlimited slots show **"Available"** on storefront (no number shown)

---

## Feature 1: Reservation Calendar Overlays

### Overlay Design (3-state badge)

| State | Condition | Badge | Color |
|-------|-----------|-------|-------|
| Open | `reservation_count === 0` | OPEN (or no badge) | Green |
| Partial | `reservation_count > 0 && available_units > 0` | PARTIAL + count | Amber |
| Full | `available_units === 0` | FULL | Red |
| Closed | `is_closed === true` | Closed | Gray |

Example calendar day cell:
```
┌─────────┐    ┌─────────┐    ┌─────────┐
│   15    │    │   16    │    │   17    │
│  FULL   │    │ PARTIAL │    │  OPEN   │
│         │    │ 2 res   │    │         │
└─────────┘    └─────────┘    └─────────┘
  (red bg)      (amber bg)     (green bg)
```

### No Backend Changes Needed
The existing calendar endpoint already returns all data needed (`reservation_count`, `available_units`, `total_units`). This is a **frontend-only** change to `ReservationsCalendarView`.

---

## Feature 2: Merchant-Level Booking Slots

### Data Model: `merchant_booking_slots`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| merchant_id | FK | references merchants |
| day_of_week | tinyint | 0=Sunday … 6=Saturday |
| start_time | time | e.g. 09:00 |
| end_time | time nullable | optional, for display duration |
| max_capacity | int nullable | null = unlimited |
| is_active | boolean | default true |
| sort_order | int | default 0 |

- Unique constraint: `[merchant_id, day_of_week, start_time]`
- `max_capacity: null` → unlimited (any number of bookings accepted)
- `max_capacity: 3` → capped at 3 bookings for this slot on any given date

### Relationship
```
Merchant → hasMany → MerchantBookingSlot
Booking → belongsTo → MerchantBookingSlot (nullable FK: booking_slot_id)
```

The `bookings` table gets a new nullable column `booking_slot_id` (FK → `merchant_booking_slots.id`, nullOnDelete).

### Capacity Check Logic
```php
// Slot is full when max_capacity is set AND:
COUNT(bookings
  WHERE merchant_id = $merchantId
  AND booking_slot_id = $slotId
  AND booking_date = $date
  AND status IN ('pending', 'confirmed')
) >= max_capacity

// If max_capacity is null: slot is always available (unlimited)
```

Note: count scoped to `merchant_id` + `booking_slot_id` + `booking_date` — captures all services on that merchant at that slot/date.

### Backward Compatibility
- `booking_slot_id` is nullable — existing bookings without a slot are unaffected
- When a merchant has no slots defined → booking form stays as free-form time picker (current behavior)
- When a merchant has slots defined → booking form shows slot picker instead

---

## Calendar Endpoint Changes (Booking)

The booking calendar endpoint `GET /auth/merchant/bookings/calendar?month=YYYY-MM` is enhanced to include slot-level detail per day:

```json
{
  "date": "2026-03-15",
  "booking_count": 5,
  "total_booked": 5,
  "total_capacity": 8,
  "is_closed": false,
  "has_slots": true,
  "slots": [
    {
      "slot_id": 1,
      "start_time": "09:00",
      "end_time": "10:00",
      "booked": 3,
      "max_capacity": 3,
      "is_full": true
    },
    {
      "slot_id": 2,
      "start_time": "10:00",
      "end_time": "11:00",
      "booked": 2,
      "max_capacity": 5,
      "is_full": false
    },
    {
      "slot_id": 3,
      "start_time": "14:00",
      "end_time": "15:00",
      "booked": 0,
      "max_capacity": null,
      "is_full": false
    }
  ]
}
```

- `has_slots: true` when merchant has active slots for that day_of_week
- `slots[]` only present when `has_slots: true`
- `total_capacity` = SUM of `max_capacity` for slots where `max_capacity IS NOT NULL`; unlimited slots contribute 0 to capacity sum (to avoid infinity)

---

## Storefront Availability Changes

`GET /storefront/merchants/{slug}/services/{service}/booking-availability?date=2026-03-15`

When merchant has slots, returns slot list instead of generic availability:

```json
{
  "date": "2026-03-15",
  "has_slots": true,
  "slots": [
    {
      "slot_id": 1,
      "start_time": "09:00",
      "end_time": "10:00",
      "available": 0,
      "max_capacity": 3,
      "status": "full"
    },
    {
      "slot_id": 2,
      "start_time": "10:00",
      "end_time": "11:00",
      "available": 3,
      "max_capacity": 5,
      "status": "available"
    },
    {
      "slot_id": 3,
      "start_time": "14:00",
      "end_time": "15:00",
      "available": null,
      "max_capacity": null,
      "status": "available"
    }
  ]
}
```

- `available: null` + `status: "available"` = unlimited → frontend shows "Available" (no number)
- `available: 0` + `status: "full"` → slot is hidden or grayed out, cannot be selected
- Customer selects a slot → `booking_slot_id` included in booking creation request

---

## Where to Manage Slots (UI)

Since slots are **merchant-level** (not per-service), the management UI belongs in merchant settings:

**Location:** `my-store/settings` → new "Booking Slots" tab

```
Settings tabs:
  Details | Business Hours | Payment Methods | Social Links | Documents | Booking Slots (new)
```

The Booking Slots tab shows a 7-day grid where the merchant creates/edits/deletes slots per day:

```
Booking Slots
─────────────────────────────────────────────
Monday
  09:00 - 10:00  |  max: 3 pax    [edit] [×]
  10:00 - 11:00  |  max: 5 pax    [edit] [×]
  14:00 - 15:00  |  unlimited     [edit] [×]
  [ + Add slot ]

Tuesday
  09:00 - 10:00  |  max: 3 pax    [edit] [×]
  [ + Add slot ]

Wednesday
  (no slots)
  [ + Add slot ]
...
```

---

## Routes

### Backend (self-service)
```
GET    /auth/merchant/booking-slots              → index (all slots for merchant)
POST   /auth/merchant/booking-slots              → store
PUT    /auth/merchant/booking-slots/{slot}       → update
DELETE /auth/merchant/booking-slots/{slot}       → destroy
```

### Admin panel
```
GET    /merchants/{merchant}/booking-slots       → index
POST   /merchants/{merchant}/booking-slots       → store
PUT    /merchants/{merchant}/booking-slots/{slot} → update
DELETE /merchants/{merchant}/booking-slots/{slot} → destroy
```

No new permissions needed — use `services.update` (or `merchants.update`) since it's store configuration.

---

## Decision

**Feature 1 (Reservation Calendar):** Frontend-only, 3-state badge overlay. No backend changes.

**Feature 2 (Booking Slots):** New `merchant_booking_slots` table at merchant level. Slots are global to the merchant, not per-service. Pending + confirmed bookings both count against capacity. Unlimited slots show "Available" on storefront.

---

## Open Questions

- [ ] Should the admin panel expose slot management under `merchants/{id}` detail page? (Yes, likely mirrors my-store structure)
- [ ] When a booking is created without a slot (legacy or no-slots merchant), should `start_time`/`end_time` remain required, or become optional?
- [ ] What happens when a merchant creates slots after they already have bookings — do old bookings appear in the "no slot" bucket in the calendar?
- [ ] Should slots have a `label` field (e.g., "Morning", "Afternoon") for display in UI, or just use time?

---

## Backend Implementation Plan

### New Files
| File | Purpose |
|------|---------|
| `database/migrations/YYYY_create_merchant_booking_slots_table.php` | New table |
| `database/migrations/YYYY_add_booking_slot_id_to_bookings_table.php` | Nullable FK on bookings |
| `app/Models/MerchantBookingSlot.php` | Model |
| `app/Repositories/Contracts/MerchantBookingSlotRepositoryInterface.php` | Repo interface |
| `app/Repositories/MerchantBookingSlotRepository.php` | Repo impl |
| `app/Services/Contracts/MerchantBookingSlotServiceInterface.php` | Service interface |
| `app/Services/MerchantBookingSlotService.php` | Service impl |
| `app/Http/Controllers/Api/V1/MerchantBookingSlotController.php` | CRUD controller |
| `app/Http/Requests/Api/V1/BookingSlot/StoreBookingSlotRequest.php` | Validation |
| `app/Http/Requests/Api/V1/BookingSlot/UpdateBookingSlotRequest.php` | Validation |
| `app/Http/Resources/Api/V1/MerchantBookingSlotResource.php` | JSON transform |
| `tests/Feature/Api/V1/MerchantBookingSlotTest.php` | Feature tests |

### Modified Files
| File | Change |
|------|--------|
| `app/Models/Merchant.php` | Add `bookingSlots()` HasMany |
| `app/Models/Booking.php` | Add `bookingSlot()` BelongsTo (nullable) |
| `app/Services/BookingService.php` | Slot capacity validation in `createBooking()`; slot-aware `getBookingCalendar()` |
| `app/Services/StorefrontService.php` | Slot-aware `bookingAvailability()` |
| `app/Providers/RepositoryServiceProvider.php` | Register new bindings |
| `routes/api.php` | New booking slot routes |

---

## Frontend Implementation Plan

### Feature 1: Reservation Calendar Labels (UI only)
| File | Change |
|------|--------|
| `frontend/app/(system)/(my-store)/my-store/reservations/reservations-calendar-view.tsx` | Add 3-state badge overlay (OPEN/PARTIAL/FULL) per day cell |
| `frontend/types/api.ts` | No changes — `ReservationCalendarDay` already has needed fields |

### Feature 2: Booking Slot Management
| File | Purpose |
|------|---------|
| `frontend/services/bookingSlotService.ts` | CRUD for merchant booking slots |
| `frontend/hooks/useBookingSlots.ts` | useBookingSlots, useCreateBookingSlot, useUpdateBookingSlot, useDeleteBookingSlot |
| `frontend/types/api.ts` | Add `MerchantBookingSlot` interface |
| `frontend/lib/validations.ts` | Add `createBookingSlotSchema`, `updateBookingSlotSchema` |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-booking-slots-tab.tsx` | New settings tab — slot list by day with create/edit/delete |
| `frontend/app/(system)/(my-store)/my-store/settings/page.tsx` | Add "Booking Slots" tab |

### Feature 2: Booking Calendar (slot-aware)
| File | Change |
|------|--------|
| `frontend/app/(system)/(my-store)/my-store/bookings/bookings-calendar-view.tsx` | When `has_slots`, show slot fill panel on day click |
| `frontend/types/api.ts` | Extend `BookingCalendarDay` with `has_slots`, `slots[]` |

### Feature 2: Booking Creation (slot picker)
| File | Change |
|------|--------|
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/page.tsx` | When slots available, show slot picker instead of time input |
| `frontend-customer-portal/services/storefrontService.ts` | Pass `booking_slot_id` in booking payload |
| `frontend-customer-portal/types/api.ts` | Add `BookingSlot` interface |
| Create dialog in admin/my-store bookings | Add slot dropdown when merchant has slots |

---

## Next Steps

- [x] Confirmed: slots are merchant-level (global, not per-service)
- [x] Confirmed: pending + confirmed count against capacity
- [x] Confirmed: unlimited slots show "Available" on storefront
- [ ] Run `/knowledge-garden:plan` to create full implementation plan
- [ ] Backend Wave 1: migration + model + repo + service + controller + routes for booking slots
- [ ] Backend Wave 2: update `BookingService.createBooking()` with slot capacity validation
- [ ] Backend Wave 3: update `BookingService.getBookingCalendar()` for slot-aware response
- [ ] Backend Wave 4: update `StorefrontService.bookingAvailability()` for slot list
- [ ] Frontend Wave 1: `ReservationsCalendarView` 3-state badge overlay (quickest win)
- [ ] Frontend Wave 2: Booking slots settings tab (`my-store/settings`)
- [ ] Frontend Wave 3: Slot-aware calendar day panel in `BookingsCalendarView`
- [ ] Frontend Wave 4: Slot picker in customer portal booking form
