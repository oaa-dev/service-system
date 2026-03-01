# Booking Module

## Model
- **Path**: app/Models/Booking.php
- **Table**: bookings
- **Fillable**: merchant_id, service_id, customer_id, booking_date, start_time, end_time, party_size, service_price, fee_rate, fee_amount, total_amount, status, notes, confirmed_at, cancelled_at
- **Defaults** ($attributes): party_size=1, status='pending', service_price=0, fee_rate=0, fee_amount=0, total_amount=0
- **Casts**:
  - booking_date -> date
  - party_size -> integer
  - service_price -> decimal:2
  - fee_rate -> decimal:2
  - fee_amount -> decimal:2
  - total_amount -> decimal:2
  - confirmed_at -> datetime
  - cancelled_at -> datetime
- **Relationships**:
  - merchant -> BelongsTo -> Merchant
  - service -> BelongsTo -> Service
  - customer -> BelongsTo -> User (FK: customer_id)
- **Traits**: HasFactory
- **Scopes**: none

## Status Workflow
```
pending --> confirmed --> completed
    |           |
    |           +--> cancelled
    |           +--> no_show
    +--> cancelled
```
Valid transitions (enforced in BookingService::VALID_TRANSITIONS):
- pending -> confirmed, cancelled
- confirmed -> completed, cancelled, no_show

Timestamps set automatically on transition:
- confirmed -> confirmed_at = now()
- cancelled -> cancelled_at = now()

## Business Rules
- Merchant must have `can_take_bookings = true`
- Service must be of `service_type = 'bookable'`
- Booking date must fall on a day covered by the service's ServiceSchedule with `is_available = true`
- start_time must fall within the schedule's start_time-end_time window
- end_time is auto-calculated from service `duration` (minutes)
- Capacity check: sum of party_size for pending/confirmed bookings on the same slot must not exceed `service.max_capacity`
- If `service.requires_confirmation = true`, initial status = 'pending'; otherwise auto-confirmed
- Platform fee is calculated at creation via `PlatformFeeService::calculateFee('booking', $servicePrice)`
- Branch merchants (`parent_id` set) use the parent organization's services

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/BookingController.php | index, store, show, updateStatus |
| Service Interface | app/Services/Contracts/BookingServiceInterface.php | getMerchantBookings, getMerchantBookingById, createBooking, updateBookingStatus |
| Service | app/Services/BookingService.php | Business logic; uses QueryBuilder, PlatformFeeService, MerchantRepository |
| Repository Interface | app/Repositories/Contracts/BookingRepositoryInterface.php | Extends BaseRepositoryInterface (no extra methods) |
| Repository | app/Repositories/BookingRepository.php | Extends BaseRepository; no custom methods |
| DTO | app/Data/BookingData.php | service_id, booking_date, start_time, party_size, notes (all Optional) |
| FormRequest (Create) | app/Http/Requests/Api/V1/Booking/CreateBookingRequest.php | service_id required exists:services,id; booking_date required after_or_equal:today; start_time required date_format:H:i; party_size optional integer min:1; notes nullable max:1000 |
| FormRequest (Status) | app/Http/Requests/Api/V1/Booking/UpdateBookingStatusRequest.php | status required in:confirmed,cancelled,completed,no_show |
| Resource | app/Http/Resources/Api/V1/BookingResource.php | Includes whenLoaded service (ServiceResource) and customer (id/name/email) |
| CustomerPortal Controller | app/Http/Controllers/Api/V1/CustomerPortalController.php | createBooking, myBookings, myBooking, cancelMyBooking |
| CustomerPortal FormRequest | app/Http/Requests/Api/V1/CustomerPortal/CreateCustomerBookingRequest.php | Same rules as CreateBookingRequest |
| CustomerPortal Service | app/Services/CustomerPortalService.php | Delegates to BookingService for creation; handles customer-scoped queries and cancellation |
| CustomerPortal Interface | app/Services/Contracts/CustomerPortalServiceInterface.php | createBooking, getMyBookings, getMyBooking, cancelMyBooking |
| ServiceProvider | app/Providers/RepositoryServiceProvider.php | Binds BookingRepositoryInterface and BookingServiceInterface |
| Fee dependency | app/Services/PlatformFeeService.php | Injected into BookingService for calculateFee('booking', $servicePrice) |

## Routes
| Method | URI | Action | Permission |
|--------|-----|--------|------------|
| GET | /api/v1/merchants/{merchant}/bookings | BookingController@index | bookings.view |
| GET | /api/v1/merchants/{merchant}/bookings/{booking} | BookingController@show | bookings.view |
| POST | /api/v1/merchants/{merchant}/bookings | BookingController@store | bookings.create |
| PATCH | /api/v1/merchants/{merchant}/bookings/{booking}/status | BookingController@updateStatus | bookings.update_status |
| POST | /api/v1/customer/merchants/{slug}/bookings | CustomerPortalController@createBooking | customer_portal.book |
| GET | /api/v1/customer/my/bookings | CustomerPortalController@myBookings | customer_portal.view_own |
| GET | /api/v1/customer/my/bookings/{booking} | CustomerPortalController@myBooking | customer_portal.view_own |
| PATCH | /api/v1/customer/my/bookings/{booking}/cancel | CustomerPortalController@cancelMyBooking | customer_portal.cancel_own |

## Query Filters (index endpoint)
Allowed filters via Spatie QueryBuilder:
- `filter[status]` -- exact match
- `filter[service_id]` -- exact match
- `filter[customer_id]` -- exact match
- `filter[booking_date]` -- exact match
- `filter[date_from]` -- booking_date >= value
- `filter[date_to]` -- booking_date <= value
- `filter[search]` -- customer name or email LIKE

Allowed sorts: id, booking_date, start_time, status, created_at
Default sort: -booking_date (descending)

## Customer Portal Query Filters (myBookings)
- `filter[status]` -- exact match
- `filter[date_from]` -- booking_date >= value
- `filter[date_to]` -- booking_date <= value

Allowed sorts: booking_date, created_at, status
Default sort: -created_at (descending)
Eager loads: service, service.media

## Database
| Type | File |
|------|------|
| Migration (create) | database/migrations/2026_02_10_200010_create_bookings_table.php |
| Factory | database/factories/BookingFactory.php |
| Seeder | none |

### Factory States
- `withFee(float $servicePrice, float $feeRate)` -- sets monetary fields with calculated fee
- `confirmed()` -- status=confirmed, confirmed_at=now()
- `cancelled()` -- status=cancelled, cancelled_at=now()

## Tests
| Type | File |
|------|------|
| Feature | tests/Feature/Api/V1/BookingControllerTest.php |
| Feature (customer portal) | tests/Feature/Api/V1/CustomerPortalControllerTest.php |

### Test Coverage
- Booking Index: list, filter by status, merchant scoping
- Booking Show: show specific booking, 404 for cross-merchant
- Booking Create: success, auto-confirm, rejects no-bookings merchant, unavailable day, outside schedule hours, at-capacity slot, validation errors
- Booking Status Update: confirm, cancel, complete, no_show, invalid transition, cross-merchant 404
- Booking Platform Fee: fee calculated at creation, zero fee when none active

## Notes
- The `customer_id` references the User model (not a separate Customer model) via `auth()->id()`.
- `BookingService` injects `MerchantRepositoryInterface` and `PlatformFeeServiceInterface`.
- The `BookingRepository` is registered in the service provider but not directly used by `BookingService` -- the service queries the `Booking` model directly via QueryBuilder and Eloquent.
- Customer portal cancellation (`cancelMyBooking`) scopes to `customer_id = auth()->id()` for data isolation, and allows cancelling only `pending` or `confirmed` bookings.
- Admin status update in `BookingService` enforces `VALID_TRANSITIONS` constant map.
- Booking is a `conversable` morph target (alias: `'booking'`) in the Conversation system. Customers can chat with the merchant about a booking via `GET/POST /api/v1/customer/my/conversations/bookings/{id}/messages`. See `conversation.md`.
