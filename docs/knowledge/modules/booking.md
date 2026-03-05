# Booking Module

## Model
- **Path**: `backend/app/Models/Booking.php`
- **Table**: `bookings`
- **Fillable**: merchant_id, service_id, booking_slot_id, customer_id, booking_date, start_time, end_time, party_size, service_price, fee_rate, fee_amount, total_amount, status, notes, confirmed_at, cancelled_at
- **Casts**: booking_date→date, party_size→integer, service_price/fee_rate/fee_amount/total_amount→decimal:2, confirmed_at/cancelled_at→datetime
- **Defaults** (`$attributes`): party_size=1, status='pending', all money fields=0
- **Relationships**:
  - `merchant()` BelongsTo Merchant
  - `service()` BelongsTo Service
  - `customer()` BelongsTo User (via customer_id FK)
  - `bookingSlot()` BelongsTo MerchantBookingSlot (via booking_slot_id, nullable)
- **Traits**: HasFactory

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | `backend/app/Http/Controllers/Api/V1/BookingController.php` | index, show, store, updateStatus (admin/merchant) |
| Controller | `backend/app/Http/Controllers/Api/V1/MyMerchantController.php` | bookingsCalendar() — self-service calendar aggregation |
| Controller | `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php` | createBooking, myBookings, myBooking, cancelMyBooking |
| Service | `backend/app/Services/BookingService.php` | getMerchantBookings, getMerchantBookingById, createBooking, updateBookingStatus, getBookingCalendar |
| Service Interface | `backend/app/Services/Contracts/BookingServiceInterface.php` | — |
| Service (customer) | `backend/app/Services/CustomerPortalService.php` | delegates to BookingService |
| Repository | `backend/app/Repositories/BookingRepository.php` | extends BaseRepository |
| DTO | `backend/app/Data/BookingData.php` | service_id, booking_date, start_time, booking_slot_id (nullable), party_size, notes |
| FormRequest | `backend/app/Http/Requests/Api/V1/Booking/CreateBookingRequest.php` | validation for booking creation |
| FormRequest | `backend/app/Http/Requests/Api/V1/Booking/UpdateBookingStatusRequest.php` | status transition validation |
| Resource | `backend/app/Http/Resources/Api/V1/BookingResource.php` | API response shape |
| StorefrontService | `backend/app/Services/StorefrontService.php` | bookingAvailability() (month-based), getBookingSlotAvailability() (date-based) |
| AppServiceProvider | `backend/app/Providers/AppServiceProvider.php` | morph map: 'booking' → Booking::class |
| ReviewService | `backend/app/Services/ReviewService.php` | references Booking for review eligibility |
| ConversationController | `backend/app/Http/Controllers/Api/V1/ConversationController.php` | conversation context via morph map |

## Routes
| Method | URI | Action | Middleware |
|--------|-----|--------|------------|
| GET | `/api/v1/auth/merchant/bookings/calendar` | MyMerchantController@bookingsCalendar | auth:api, ensure.verified, onboarding |
| GET | `/api/v1/merchants/{merchant}/bookings` | BookingController@index | auth + bookings.view |
| GET | `/api/v1/merchants/{merchant}/bookings/{booking}` | BookingController@show | auth + bookings.view |
| POST | `/api/v1/merchants/{merchant}/bookings` | BookingController@store | auth + bookings.create |
| PATCH | `/api/v1/merchants/{merchant}/bookings/{booking}/status` | BookingController@updateStatus | auth + bookings.update_status |
| GET | `/api/v1/storefront/merchants/{slug}/services/{service}/booking-availability` | StorefrontController@bookingAvailability | public |
| POST | `/api/v1/customer/merchants/{slug}/bookings` | CustomerPortalController@createBooking | auth + customer_portal.book |
| GET | `/api/v1/customer/my/bookings` | CustomerPortalController@myBookings | auth + customer_portal.view_own |
| GET | `/api/v1/customer/my/bookings/{booking}` | CustomerPortalController@myBooking | auth + customer_portal.view_own |
| PATCH | `/api/v1/customer/my/bookings/{booking}/cancel` | CustomerPortalController@cancelMyBooking | auth + customer_portal.cancel_own |

## Calendar Endpoint Details
`GET /api/v1/auth/merchant/bookings/calendar?month=YYYY-MM`
- Returns array of daily summaries for the given month
- Each day: `{ date, booking_count, total_booked, total_capacity, is_closed, has_slots, slots[] }`
- Excludes `cancelled` and `no_show` statuses from counts
- `is_closed` = true when no MerchantBusinessHour record for that day_of_week
- **When merchant has active booking slots:**
  - `has_slots` = true for that day_of_week
  - `slots` = array of `{ slot_id, start_time, end_time, booked, max_capacity, is_full }`
  - `total_capacity` = sum of `max_capacity` from active slots (null if all slots are unlimited)
- **When merchant has no slots:**
  - `has_slots` = false, `slots` = []
  - `total_capacity` = sum of `max_capacity` from Services with active ServiceSchedule for that day_of_week

## Booking Availability vs Slot Availability

The storefront `GET .../booking-availability` endpoint dispatches based on query param:
- `?month=YYYY-MM` → `StorefrontService::getBookingAvailability()` — returns service schedule + booked_slots aggregated by date/time
- `?date=YYYY-MM-DD` → `StorefrontService::getBookingSlotAvailability()` — returns merchant booking slots with per-slot booking counts for that date; falls back to legacy availability response if merchant has no active slots for that day

## Status Workflow
```
pending → confirmed | cancelled
confirmed → completed | cancelled | no_show
```
Validated in `BookingService::VALID_TRANSITIONS`. Status is a **VARCHAR** (not ENUM) — safe for factory with any string.

## Booking Slot Integration in createBooking
When `booking_slot_id` is provided in the create request:
1. Slot is looked up and validated: must belong to merchant, must be `is_active=true`
2. Slot's `start_time`/`end_time` override the times from the DTO
3. Slot capacity is checked: counts pending + confirmed bookings on that date for that slot_id
4. Full slot throws 422 ValidationException

## Database
| Type | File |
|------|------|
| Migration | `backend/database/migrations/2026_02_10_200010_create_bookings_table.php` |
| Migration (fee cols) | `backend/database/migrations/2026_02_11_200002_add_fee_columns_to_transaction_tables.php` |
| Migration (booking_slot_id) | `backend/database/migrations/2026_03_02_200001_add_booking_slot_id_to_bookings_table.php` |
| Factory | `backend/database/factories/BookingFactory.php` |
| Demo Seeder | `backend/database/seeders/DemoTransactionSeeder.php` |
| Platform Fee Seeder | `backend/database/seeders/PlatformFeeSeeder.php` |

## Frontend (Admin)
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/bookingService.ts` | getAll(merchantId, params), getCalendar(month), create, updateStatus |
| Hook | `frontend/hooks/useBookings.ts` | useBookings, useBookingCalendar, useBooking, useCreateBooking, useUpdateBookingStatus |
| Types | `frontend/types/api.ts` | Booking, BookingQueryParams, BookingCalendarDay (has_slots, slots[]), BookingCalendarSlot, MerchantBookingSlot interfaces |
| My-Store Page | `frontend/app/(system)/(my-store)/my-store/bookings/page.tsx` | List/Calendar toggle, status actions, create dialog |
| Calendar Component | `frontend/app/(system)/(my-store)/my-store/bookings/bookings-calendar-view.tsx` | Month grid, color-coded by total_booked/total_capacity ratio; shows slot breakdown when has_slots=true |
| Admin Page | `frontend/app/(system)/(merchants)/merchants/[id]/bookings/page.tsx` | Admin merchant bookings list |
| Create Dialog | `frontend/app/(system)/(merchants)/merchants/[id]/bookings/create-booking-dialog.tsx` | Reused by my-store page |

## Tests
| Type | File |
|------|------|
| Feature (admin) | `backend/tests/Feature/Api/V1/BookingControllerTest.php` |
| Feature (booking slots) | `backend/tests/Feature/Api/V1/MerchantBookingSlotTest.php` |
| Feature (calendar) | `backend/tests/Feature/Api/V1/MyMerchantCalendarTest.php` |
| Feature (customer) | `backend/tests/Feature/Api/V1/CustomerPortalControllerTest.php` |
| Feature (storefront avail.) | `backend/tests/Feature/Api/V1/StorefrontAvailabilityTest.php` |
