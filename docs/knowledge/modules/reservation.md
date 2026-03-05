# Reservation Module

## Model
- **Path**: `backend/app/Models/Reservation.php`
- **Table**: `reservations`
- **Fillable**: merchant_id, service_id, customer_id, check_in, check_out, guest_count, nights, price_per_night, total_price, fee_rate, fee_amount, total_amount, status, notes, special_requests, confirmed_at, cancelled_at, checked_in_at, checked_out_at
- **Casts**: check_in/check_out→date, guest_count/nights→integer, price_per_night/total_price/fee_rate/fee_amount/total_amount→decimal:2, all timestamp fields→datetime
- **Defaults** (`$attributes`): guest_count=1, status='pending', all fee fields=0
- **Relationships**: merchant() BelongsTo Merchant, service() BelongsTo Service, customer() BelongsTo User (via customer_id FK)
- **Traits**: HasFactory

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | `backend/app/Http/Controllers/Api/V1/ReservationController.php` | index, show, store, updateStatus (admin/merchant) |
| Controller | `backend/app/Http/Controllers/Api/V1/MyMerchantController.php` | reservationsCalendar() — self-service calendar aggregation |
| Controller | `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php` | createReservation, myReservations, myReservation, cancelMyReservation |
| Service | `backend/app/Services/ReservationService.php` | getMerchantReservations, getMerchantReservationById, createReservation, updateReservationStatus, getReservationCalendar |
| Service Interface | `backend/app/Services/Contracts/ReservationServiceInterface.php` | — |
| Service (customer) | `backend/app/Services/CustomerPortalService.php` | delegates to ReservationService |
| Repository | `backend/app/Repositories/ReservationRepository.php` | extends BaseRepository |
| FormRequest | `backend/app/Http/Requests/Api/V1/Reservation/CreateReservationRequest.php` | validation for reservation creation |
| FormRequest | `backend/app/Http/Requests/Api/V1/Reservation/UpdateReservationStatusRequest.php` | status transition validation |
| Resource | `backend/app/Http/Resources/Api/V1/ReservationResource.php` | API response shape |
| StorefrontService | `backend/app/Services/StorefrontService.php` | reservationAvailability() — overlap detection |
| AppServiceProvider | `backend/app/Providers/AppServiceProvider.php` | morph map: 'reservation' → Reservation::class |
| ReviewService | `backend/app/Services/ReviewService.php` | references Reservation for review eligibility |
| ConversationController | `backend/app/Http/Controllers/Api/V1/ConversationController.php` | conversation context via morph map |

## Routes
| Method | URI | Action | Middleware |
|--------|-----|--------|------------|
| GET | `/api/v1/auth/merchant/reservations/calendar` | MyMerchantController@reservationsCalendar | auth:api, ensure.verified, onboarding |
| GET | `/api/v1/merchants/{merchant}/reservations` | ReservationController@index | auth + reservations.view |
| GET | `/api/v1/merchants/{merchant}/reservations/{reservation}` | ReservationController@show | auth + reservations.view |
| POST | `/api/v1/merchants/{merchant}/reservations` | ReservationController@store | auth + reservations.create |
| PATCH | `/api/v1/merchants/{merchant}/reservations/{reservation}/status` | ReservationController@updateStatus | auth + reservations.update_status |
| GET | `/api/v1/storefront/merchants/{slug}/services/{service}/reservation-availability` | StorefrontController@reservationAvailability | public |
| POST | `/api/v1/customer/merchants/{slug}/reservations` | CustomerPortalController@createReservation | auth + customer_portal.reserve |
| GET | `/api/v1/customer/my/reservations` | CustomerPortalController@myReservations | auth + customer_portal.view_own |
| GET | `/api/v1/customer/my/reservations/{reservation}` | CustomerPortalController@myReservation | auth + customer_portal.view_own |
| PATCH | `/api/v1/customer/my/reservations/{reservation}/cancel` | CustomerPortalController@cancelMyReservation | auth + customer_portal.cancel_own |

## Calendar Endpoint Details
`GET /api/v1/auth/merchant/reservations/calendar?month=YYYY-MM`
- Returns array of daily summaries for the given month
- Each day: `{ date, reservation_count, total_units, available_units, is_closed }`
- Active statuses counted: pending, confirmed, checked_in
- **Overlap detection**: reservation overlaps day if `check_in <= date AND check_out > date`
- `total_units` = count of active `service_type='reservation'` Services for the merchant
- `is_closed` = true when no MerchantBusinessHour record for that day_of_week
- **Note**: No Unit model — reservations are at the Service level (one service = one "unit type")

## Status Workflow
```
pending → confirmed | cancelled
confirmed → checked_in | cancelled
checked_in → checked_out
```
Validated in `ReservationService::VALID_TRANSITIONS`. Status is a **VARCHAR** (not ENUM) — safe for factory with any string.

## Overlap Detection Pattern
```php
// Used in createReservation validation (preventing double-booking):
->where('check_in', '<', $checkOut)->where('check_out', '>', $checkIn)
->whereIn('status', ['confirmed', 'checked_in'])

// Used in calendar for counting active reservations per day:
->where('check_in', '<=', $date)->where('check_out', '>', $date)
->whereIn('status', ['pending', 'confirmed', 'checked_in'])
```

## Database
| Type | File |
|------|------|
| Migration | `backend/database/migrations/2026_02_10_200013_create_reservations_table.php` |
| Migration (capability) | `backend/database/migrations/2026_02_10_200008_add_capability_fields_to_services_table.php` |
| Migration (fee cols) | `backend/database/migrations/2026_02_11_200002_add_fee_columns_to_transaction_tables.php` |
| Factory | `backend/database/factories/ReservationFactory.php` |
| Demo Seeder | `backend/database/seeders/DemoTransactionSeeder.php` |
| Demo Seeder | `backend/database/seeders/DemoMerchantSeeder.php` |
| Platform Fee Seeder | `backend/database/seeders/PlatformFeeSeeder.php` |

## Frontend (Admin)
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/reservationService.ts` | getAll(merchantId, params), getCalendar(month), create, updateStatus |
| Hook | `frontend/hooks/useReservations.ts` | useReservations, useReservationCalendar, useReservation, useCreateReservation, useUpdateReservationStatus |
| Types | `frontend/types/api.ts` | Reservation, ReservationQueryParams, ReservationCalendarDay interfaces |
| My-Store Page | `frontend/app/(system)/(my-store)/my-store/reservations/page.tsx` | List/Calendar toggle, status actions, create dialog |
| Calendar Component | `frontend/app/(system)/(my-store)/my-store/reservations/reservations-calendar-view.tsx` | Month grid by available_units/total_units ratio, click-to-filter |
| Admin Page | `frontend/app/(system)/(merchants)/merchants/[id]/reservations/page.tsx` | Admin merchant reservations list |
| Create Dialog | `frontend/app/(system)/(merchants)/merchants/[id]/reservations/create-reservation-dialog.tsx` | Reused by my-store page |

## Tests
| Type | File |
|------|------|
| Feature (admin) | `backend/tests/Feature/Api/V1/ReservationControllerTest.php` |
| Feature (calendar) | `backend/tests/Feature/Api/V1/MyMerchantCalendarTest.php` |
| Feature (customer) | `backend/tests/Feature/Api/V1/CustomerPortalControllerTest.php` |
| Feature (storefront avail.) | `backend/tests/Feature/Api/V1/StorefrontAvailabilityTest.php` |
