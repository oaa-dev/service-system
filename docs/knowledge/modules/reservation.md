# Reservation Module

## Model
- **Path**: app/Models/Reservation.php
- **Table**: reservations
- **Fillable**: merchant_id, service_id, customer_id, check_in, check_out, guest_count, nights, price_per_night, total_price, fee_rate, fee_amount, total_amount, status, notes, special_requests, confirmed_at, cancelled_at, checked_in_at, checked_out_at
- **Defaults** ($attributes): guest_count=1, status='pending', fee_rate=0, fee_amount=0, total_amount=0
- **Casts**:
  - check_in -> date
  - check_out -> date
  - guest_count -> integer
  - nights -> integer
  - price_per_night -> decimal:2
  - total_price -> decimal:2
  - fee_rate -> decimal:2
  - fee_amount -> decimal:2
  - total_amount -> decimal:2
  - confirmed_at -> datetime
  - cancelled_at -> datetime
  - checked_in_at -> datetime
  - checked_out_at -> datetime
- **Relationships**:
  - merchant -> BelongsTo -> Merchant
  - service -> BelongsTo -> Service
  - customer -> BelongsTo -> User (FK: customer_id)
- **Traits**: HasFactory
- **Scopes**: none

## Status Workflow
```
pending --> confirmed --> checked_in --> checked_out
    |           |
    |           +--> cancelled
    +--> cancelled
```
Valid transitions (enforced in ReservationService::VALID_TRANSITIONS):
- pending -> confirmed, cancelled
- confirmed -> checked_in, cancelled
- checked_in -> checked_out

Timestamps set automatically on transition:
- confirmed -> confirmed_at = now()
- cancelled -> cancelled_at = now()
- checked_in -> checked_in_at = now()
- checked_out -> checked_out_at = now()

## Business Rules
- Merchant must have `can_rent_units = true`
- Service must be of `service_type = 'reservation'`, `is_active = true`, and `unit_status = 'available'`
- check_out must be at least 1 day after check_in
- Overlap check: no existing confirmed or checked_in reservation on the same service may overlap the requested date range
- guest_count must not exceed `service.max_capacity`
- Pricing: price_per_night is taken from `service.price_per_night` (falls back to `service.price`)
- total_price = nights * price_per_night
- nights is auto-calculated as diffInDays(check_in, check_out)
- Platform fee is calculated at creation via `PlatformFeeService::calculateFee('reservation', $totalPrice)`
- Branch merchants (`parent_id` set) use the parent organization's services

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/ReservationController.php | index, store, show, updateStatus |
| Service Interface | app/Services/Contracts/ReservationServiceInterface.php | getMerchantReservations, getMerchantReservationById, createReservation, updateReservationStatus |
| Service | app/Services/ReservationService.php | Business logic; uses QueryBuilder, PlatformFeeService, MerchantRepository |
| Repository Interface | app/Repositories/Contracts/ReservationRepositoryInterface.php | Extends BaseRepositoryInterface (no extra methods) |
| Repository | app/Repositories/ReservationRepository.php | Extends BaseRepository; no custom methods |
| DTO | app/Data/ReservationData.php | service_id, check_in, check_out, guest_count, notes, special_requests (all Optional) |
| FormRequest (Create) | app/Http/Requests/Api/V1/Reservation/CreateReservationRequest.php | service_id required; check_in required after_or_equal:today; check_out required after:check_in; guest_count optional integer min:1; notes/special_requests nullable max:1000 |
| FormRequest (Status) | app/Http/Requests/Api/V1/Reservation/UpdateReservationStatusRequest.php | status required in:confirmed,cancelled,checked_in,checked_out |
| Resource | app/Http/Resources/Api/V1/ReservationResource.php | Includes whenLoaded service (ServiceResource, with serviceCategory), customer (id/name/email) |
| CustomerPortal Controller | app/Http/Controllers/Api/V1/CustomerPortalController.php | createReservation, myReservations, cancelMyReservation |
| CustomerPortal FormRequest | app/Http/Requests/Api/V1/CustomerPortal/CreateCustomerReservationRequest.php | Same rules as CreateReservationRequest plus special_requests max:2000 |
| CustomerPortal Service | app/Services/CustomerPortalService.php | Delegates to ReservationService for creation; handles customer-scoped queries and cancellation |
| CustomerPortal Interface | app/Services/Contracts/CustomerPortalServiceInterface.php | createReservation, getMyReservations, cancelMyReservation |
| ServiceProvider | app/Providers/RepositoryServiceProvider.php | Binds ReservationRepositoryInterface and ReservationServiceInterface |
| Fee dependency | app/Services/PlatformFeeService.php | Injected into ReservationService for calculateFee('reservation', $totalPrice) |

## Routes
| Method | URI | Action | Permission |
|--------|-----|--------|------------|
| GET | /api/v1/merchants/{merchant}/reservations | ReservationController@index | reservations.view |
| GET | /api/v1/merchants/{merchant}/reservations/{reservation} | ReservationController@show | reservations.view |
| POST | /api/v1/merchants/{merchant}/reservations | ReservationController@store | reservations.create |
| PATCH | /api/v1/merchants/{merchant}/reservations/{reservation}/status | ReservationController@updateStatus | reservations.update_status |
| POST | /api/v1/customer/merchants/{slug}/reservations | CustomerPortalController@createReservation | customer_portal.reserve |
| GET | /api/v1/customer/my/reservations | CustomerPortalController@myReservations | customer_portal.view_own |
| PATCH | /api/v1/customer/my/reservations/{reservation}/cancel | CustomerPortalController@cancelMyReservation | customer_portal.cancel_own |

## Query Filters (index endpoint)
Allowed filters via Spatie QueryBuilder:
- `filter[status]` -- exact match
- `filter[service_id]` -- exact match
- `filter[customer_id]` -- exact match
- `filter[date_from]` -- check_in >= value
- `filter[date_to]` -- check_out <= value
- `filter[search]` -- customer name or email LIKE

Allowed sorts: id, check_in, check_out, status, total_price, created_at
Default sort: -check_in (descending)

## Customer Portal Query Filters (myReservations)
- `filter[status]` -- exact match
- `filter[date_from]` -- check_in >= value
- `filter[date_to]` -- check_out <= value

Allowed sorts: check_in, created_at, status
Default sort: -created_at (descending)
Eager loads: service, service.media

## Database
| Type | File |
|------|------|
| Migration (create) | database/migrations/2026_02_10_200013_create_reservations_table.php |
| Factory | database/factories/ReservationFactory.php |
| Seeder | none |

### Factory States
- `withFee(float $feeRate)` -- recalculates fee_amount and total_amount from existing total_price
- `confirmed()` -- status=confirmed, confirmed_at=now()
- `cancelled()` -- status=cancelled, cancelled_at=now()

## Tests
| Type | File |
|------|------|
| Feature | tests/Feature/Api/V1/ReservationControllerTest.php |
| Feature (customer portal) | tests/Feature/Api/V1/CustomerPortalControllerTest.php |

### Test Coverage
- Reservation Index: list, filter by status, merchant scoping
- Reservation Store: success with pricing, validation errors, rejects no-rental merchant, overlapping dates, guest count over capacity, pricing calculation
- Reservation Show: show specific reservation, 404 for cross-merchant
- Reservation Status Update: confirm, cancel, check_in, check_out, invalid transition, cross-merchant 404
- Reservation Platform Fee: fee calculated at creation, zero fee when none active

## Notes
- The `customer_id` references the User model (not a separate Customer model) via `auth()->id()`.
- `ReservationService` injects `MerchantRepositoryInterface` and `PlatformFeeServiceInterface`.
- The `ReservationRepository` is registered in the service provider but not directly used by `ReservationService` -- the service queries the `Reservation` model directly via QueryBuilder and Eloquent.
- Customer portal cancellation (`cancelMyReservation`) scopes to `customer_id = auth()->id()` for data isolation, and allows cancelling only `pending` or `confirmed` reservations.
- Admin status update in `ReservationService` enforces `VALID_TRANSITIONS` constant map.
- List endpoints eager load `service.serviceCategory` and `customer` relationships.
- Overlap detection uses: `where('check_in', '<', $check_out)->where('check_out', '>', $check_in)` on confirmed/checked_in reservations for the same service.
- Reservation is a `conversable` morph target (alias: `'reservation'`) in the Conversation system. Customers can chat with the merchant about a reservation via `GET/POST /api/v1/customer/my/conversations/reservations/{id}/messages`. See `conversation.md`.
