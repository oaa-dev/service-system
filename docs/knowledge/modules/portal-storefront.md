# Portal Storefront Module

## Overview
Public-facing merchant browsing in the customer portal at `frontend-customer-portal/app/(storefront)/`. Shows merchant listings, merchant detail pages, booking/reservation/order forms, and the branch selection flow. Layout: sticky `StorefrontNav` + footer.

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend-customer-portal/app/(storefront)/layout.tsx` | Layout | Sticky nav + footer wrapper |
| `frontend-customer-portal/app/(storefront)/merchants/page.tsx` | Page | Merchant listing with search, filters, map/list toggle |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx` | Page | Merchant detail with gallery, services, CTAs; organization gate |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/branches/page.tsx` | Page | Branch selection for organization merchants |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/page.tsx` | Page | Booking form (AuthGate wrapped) — integrates MerchantSlotPicker + TimeSlotPicker |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/booking-calendar.tsx` | Client Component | Date picker calendar for booking flow |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/merchant-slot-picker.tsx` | Client Component | Slot-based picker — shown when merchant has active booking slots for selected date |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/time-slot-picker.tsx` | Client Component | Legacy time-slot grid — generated from service schedule/duration; shown when no merchant slots |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/page.tsx` | Page | Reservation form (AuthGate wrapped) |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/order/page.tsx` | Page | Order form (AuthGate wrapped) |

## Storefront Components
| Category | File | Notes |
|----------|------|-------|
| Component | `frontend-customer-portal/components/storefront/merchant-card.tsx` | Card with org badge + branch count, capability badges, favorite button, star rating |
| Component | `frontend-customer-portal/components/storefront/merchant-header.tsx` | Hero image, name, rating, address |
| Component | `frontend-customer-portal/components/storefront/merchant-gallery.tsx` | Feature image + photo gallery |
| Component | `frontend-customer-portal/components/storefront/merchant-sidebar.tsx` | Booking/reserve/order CTAs, business hours, payment methods, social links |
| Component | `frontend-customer-portal/components/storefront/merchant-map-view.tsx` | Google Maps merchant pins with InfoWindow |
| Component | `frontend-customer-portal/components/storefront/merchant-mini-map.tsx` | Small map on merchant detail page |
| Component | `frontend-customer-portal/components/storefront/service-card.tsx` | Service card in merchant detail |
| Component | `frontend-customer-portal/components/storefront/search-filters.tsx` | Filter bar for merchant listing |
| Component | `frontend-customer-portal/components/storefront/storefront-nav.tsx` | Top navigation bar |
| Component | `frontend-customer-portal/components/storefront/favorite-button.tsx` | Heart toggle for favoriting merchants |

## Booking Flow — Slot Picker Integration

The booking page (`/merchants/[slug]/book`) uses a two-tier time selection strategy:

### Tier 1 — Merchant Slot Picker (`merchant-slot-picker.tsx`)
Activated when the merchant has defined booking slots for the selected day:
- Calls `useBookingSlotAvailability(slug, serviceId, date)` → `GET /storefront/merchants/{slug}/services/{service}/booking-availability?date=YYYY-MM-DD`
- Response (`BookingDayAvailability`): `{ date, has_slots: true, slots: BookingSlotAvailability[] }`
- Each slot: `{ slot_id, start_time, end_time, available, max_capacity, status: 'available'|'full' }`
- Displays slots as clickable buttons with availability badges (Full / "N left" amber / Available green)
- Full slots are disabled; selecting a slot stores `selectedSlotId` + `selectedSlotStartTime` in booking page state
- When submitted: `booking_slot_id` is included in the POST body to `CustomerPortalController@createBooking`

### Tier 2 — Time Slot Picker (`time-slot-picker.tsx`)
Fallback for merchants without booking slots (or when `has_slots=false`):
- Uses availability data already fetched by `useBookingAvailability` (month-based)
- Generates slots by dividing service schedule window into `service.duration`-minute intervals
- Shows a 2-3 column grid of time buttons with remaining capacity info
- When submitted: only `start_time` is sent (no `booking_slot_id`)

### How the booking page orchestrates both:
1. Always fetch month availability via `useBookingAvailability(slug, serviceId, monthStr)` → for calendar disabled dates
2. When a date is selected, additionally fetch `useBookingSlotAvailability(slug, serviceId, dateStr)` → for slot picker
3. Render `<MerchantSlotPicker>` first; it returns `null` when `has_slots=false` or no date selected
4. Below it render `<TimeSlotPicker>` which shows the legacy grid from availability data

## Organization + Branch Flow

### Merchant Card — Organization Display
- `merchant.type === 'organization'` → violet "Organization" badge + "{children_count} branches" indicator + "View Branches" text (replaces capability badges)
- `merchant.type === 'individual'` → renders unchanged with capability badges
- Card `<Link>` always points to `/merchants/${merchant.slug}` — detail page handles gating

### Merchant Detail — Organization Gate
- If `merchant.type === 'organization'`: hides mobile CTA bar, hides sidebar column, shows violet info callout: "This is an organization with N branches. Select a branch to book or reserve." + "View Branches" button → `/merchants/{slug}/branches`
- If individual/branch: renders as before

### Branch Selection Page (`/merchants/[slug]/branches`)
- Organization header: name, logo, badge, branch count
- Responsive 3-column grid of branch cards
- Each card: name, address (city/province), open/closed badge (`isOpenNow()`), capability icons, "View Branch" link
- Branch logo fallback: `branch.logo?.thumb ?? parentMerchant.logo?.thumb`
- Loading: 3 skeleton cards; Empty: "No branches available at this time."

## Connected Files (Services + Hooks)
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend-customer-portal/services/storefrontService.ts` | getMerchants, getMerchantBySlug, getMerchantBranches, getMerchantServices, getBookingAvailability (month), getReservationAvailability, getBookingSlotAvailability (date) |
| Service | `frontend-customer-portal/services/reviewService.ts` | getPublicReviews(slug, params) — calls `storefront/merchants/{slug}/reviews` |
| Hook | `frontend-customer-portal/hooks/useStorefront.ts` | useMerchants, useMerchantBySlug, useMerchantBranches, useMerchantServices, useBookingAvailability, useReservationAvailability, useBookingSlotAvailability(slug, serviceId, date) |
| Hook | `frontend-customer-portal/hooks/useReviews.ts` | usePublicReviews(slug, params) — query key: ['storefront', 'merchants', slug, 'reviews'] |
| Types | `frontend-customer-portal/types/api.ts` | Merchant (type, parent_id, children?, children_count?, average_rating?, review_count?), Service, PaginatedResponse, BookingSlotAvailability (slot_id, start_time, end_time, available, max_capacity, status), BookingDayAvailability (date, has_slots, slots[]) |
| Utilities | `frontend-customer-portal/lib/storefront-utils.ts` | isOpenNow(), formatTime(), formatFullAddress(), formatPrice() (PHP peso) |
| Utilities | `frontend-customer-portal/lib/geo-utils.ts` | haversineDistance(), filterByRadius() |

## Backend API Endpoints
| Method | URI | Notes |
|--------|-----|-------|
| GET | `/api/v1/storefront/merchants` | Paginated listing; includes `children_count` per merchant |
| GET | `/api/v1/storefront/merchants/{slug}` | Single merchant detail |
| GET | `/api/v1/storefront/merchants/{slug}/branches` | Active child merchants; 404 if not organization |
| GET | `/api/v1/storefront/merchants/{slug}/services` | Services list |
| GET | `/api/v1/storefront/merchants/{slug}/services/{service}/booking-availability?month=YYYY-MM` | Monthly availability (schedule-based); response: `{ service, schedule[], booked_slots }` |
| GET | `/api/v1/storefront/merchants/{slug}/services/{service}/booking-availability?date=YYYY-MM-DD` | Day slot availability; response: `{ date, has_slots, slots[] }` — falls back to monthly format if no slots |
| GET | `/api/v1/storefront/merchants/{slug}/services/{service}/reservation-availability` | Monthly availability |
| GET | `/api/v1/storefront/business-types` | Reference data |
| GET | `/api/v1/storefront/payment-methods` | Reference data |
| GET | `/api/v1/storefront/merchants/map` | Map view data |
| GET | `/api/v1/storefront/merchants/{slug}/reviews` | Public review list (published only, paginated) |

## Key Patterns

### Auth Gate Pattern
Book/reserve/order pages use `AuthGate` component — unauthenticated users see login/register prompt inline instead of the form. No route-level auth required.

### `children_count` in Listing
`StorefrontService::getActiveMerchants()` uses `->withCount('children')`. `MerchantResource` outputs it via `$this->when($this->children_count !== null, $this->children_count)`. No Resource change needed when adding `withCount` — it uses `when()` not `whenLoaded()`.

### Merchant Types
- `merchant.type`: `'individual' | 'organization'`
- `merchant.parent_id`: null for root merchants, set for branches
- `merchant.children_count`: populated via `withCount('children')` — only on listing, not detail page
- Organizations cannot be booked/reserved directly

### Booking Slot Availability API behavior
`StorefrontController@bookingAvailability` dispatches on query param:
- `?date=YYYY-MM-DD` → `StorefrontService::getBookingSlotAvailability()` — queries `MerchantBookingSlot` for that day_of_week, counts bookings per slot; falls back to `getBookingAvailability()` (monthly format) if no active slots
- `?month=YYYY-MM` → `StorefrontService::getBookingAvailability()` — schedule-based aggregation

## Tests (Backend)
| Type | File |
|------|------|
| Feature (branches) | `backend/tests/Feature/Api/V1/StorefrontBranchTest.php` |
| Feature (availability) | `backend/tests/Feature/Api/V1/StorefrontAvailabilityTest.php` |
| Feature (customer portal) | `backend/tests/Feature/Api/V1/CustomerPortalControllerTest.php` |
