# PlatformFee Module

## Model
- **Path**: app/Models/PlatformFee.php
- **Table**: platform_fees
- **Fillable**: name, slug, description, transaction_type, rate_percentage, is_active, sort_order
- **Defaults** ($attributes): is_active=true, sort_order=0, rate_percentage=0
- **Casts**:
  - rate_percentage -> decimal:2
  - is_active -> boolean
  - sort_order -> integer
- **Relationships**: none
- **Traits**: HasFactory
- **Scopes**: none
- **Model Hooks** (booted):
  - creating: auto-generates slug from name if slug is empty
  - updating: regenerates slug from name when name is dirty and slug is not explicitly changed

## Business Rules
- Only one active fee per `transaction_type` is enforced at the service layer; creating or updating a fee with `is_active = true` deactivates all other active fees of the same transaction_type (`deactivateOthersOfSameType`)
- `transaction_type` enum: booking, reservation, sell_product
- `rate_percentage` must be 0-100
- name and slug must each be unique across the table
- `calculateFee(string $transactionType, float $subtotal)` returns `['fee_rate', 'fee_amount', 'total_amount']`; if no active fee for the type, returns fee_rate=0, fee_amount=0, total_amount=subtotal (passthrough)
- Fee formula: `fee_amount = subtotal * (rate_percentage / 100)`, `total_amount = subtotal + fee_amount`
- Used by BookingService, ReservationService, and ServiceOrderService at transaction creation time

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/PlatformFeeController.php | index, all, active, store, show, update, destroy |
| Service Interface | app/Services/Contracts/PlatformFeeServiceInterface.php | getAllPlatformFees, getAllPlatformFeesWithoutPagination, getActivePlatformFees, getPlatformFeeById, createPlatformFee, updatePlatformFee, deletePlatformFee, calculateFee |
| Service | app/Services/PlatformFeeService.php | Enforces one-active-per-type logic; exposes calculateFee used by other services |
| Repository Interface | app/Repositories/Contracts/PlatformFeeRepositoryInterface.php | findBySlug, getActive, getActiveByTransactionType |
| Repository | app/Repositories/PlatformFeeRepository.php | Extends BaseRepository; adds findBySlug, getActive, getActiveByTransactionType |
| DTO | app/Data/PlatformFeeData.php | name, slug, description, transaction_type, rate_percentage, is_active, sort_order (all Optional) |
| FormRequest (Store) | app/Http/Requests/Api/V1/PlatformFee/StorePlatformFeeRequest.php | name required unique; transaction_type required in:booking,reservation,sell_product; rate_percentage required numeric 0-100 |
| FormRequest (Update) | app/Http/Requests/Api/V1/PlatformFee/UpdatePlatformFeeRequest.php | All fields optional; name/slug use ignore-self uniqueness rule |
| Resource | app/Http/Resources/Api/V1/PlatformFeeResource.php | Returns all fields including timestamps |
| ServiceProvider | app/Providers/RepositoryServiceProvider.php | Binds PlatformFeeRepositoryInterface and PlatformFeeServiceInterface |
| Consumed by | app/Services/BookingService.php | Calls calculateFee('booking', $servicePrice) at booking creation |
| Consumed by | app/Services/ReservationService.php | Calls calculateFee('reservation', $totalPrice) at reservation creation |
| Consumed by | app/Services/ServiceOrderService.php | Calls calculateFee('sell_product', $totalPrice) at order creation |

## Routes
| Method | URI | Action | Permission |
|--------|-----|--------|------------|
| GET | /api/v1/platform-fees/active | PlatformFeeController@active | public (no auth) |
| GET | /api/v1/platform-fees | PlatformFeeController@index | platform_fees.view |
| GET | /api/v1/platform-fees/{platformFee} | PlatformFeeController@show | platform_fees.view |
| GET | /api/v1/platform-fees/all | PlatformFeeController@all | auth:api (no permission guard) |
| POST | /api/v1/platform-fees | PlatformFeeController@store | platform_fees.create |
| PUT | /api/v1/platform-fees/{platformFee} | PlatformFeeController@update | platform_fees.update |
| DELETE | /api/v1/platform-fees/{platformFee} | PlatformFeeController@destroy | platform_fees.delete |

## Query Filters (index endpoint)
Allowed filters via Spatie QueryBuilder:
- `filter[name]` -- partial match
- `filter[is_active]` -- exact match
- `filter[transaction_type]` -- exact match
- `filter[search]` -- name LIKE

Allowed sorts: id, name, transaction_type, rate_percentage, sort_order, is_active, created_at
Default sort: sort_order (ascending)

## Database
| Type | File |
|------|------|
| Migration (create) | database/migrations/2026_02_11_200001_create_platform_fees_table.php |
| Migration (rename enum) | database/migrations/2026_02_12_100002_rename_service_order_to_sell_product_in_platform_fees.php |
| Factory | database/factories/PlatformFeeFactory.php |
| Seeder | database/seeders/PlatformFeeSeeder.php |

### Factory States
- `inactive()` -- is_active=false
- `booking()` -- transaction_type='booking'
- `reservation()` -- transaction_type='reservation'
- `sellProduct()` -- transaction_type='sell_product'

### Seeder
PlatformFeeSeeder seeds three records (one per transaction_type) at 5% each using `firstOrCreate` by slug:
- booking-convenience-fee (booking, 5%)
- reservation-convenience-fee (reservation, 5%)
- sell-product-convenience-fee (sell_product, 5%)

## Tests
| Type | File |
|------|------|
| Feature | tests/Feature/Api/V1/PlatformFeeControllerTest.php |
| Feature (used in bookings) | tests/Feature/Api/V1/BookingControllerTest.php |
| Feature (used in reservations) | tests/Feature/Api/V1/ReservationControllerTest.php |
| Feature (used in service orders) | tests/Feature/Api/V1/ServiceOrderControllerTest.php |

### Test Coverage
- Platform Fee Index: list, filter by name, filter by transaction_type, pagination
- Platform Fee All: unpaginated list
- Platform Fee Active: active-only filter, public access without auth
- Platform Fee Store: success with auto-slug, required field validation, name uniqueness, transaction_type enum, rate_percentage range, deactivates other active fees of same type
- Platform Fee Show: show by ID, 404 for non-existent
- Platform Fee Update: update fields, name uniqueness on update, deactivates others when activating
- Platform Fee Delete: delete, 422 for non-existent
- Platform Fee Calculate: fee calculation with active fee, zero fee when none active

## Notes
- PlatformFee is a standalone global entity (not per-merchant) with no FK relationships to other models. It is looked up by `transaction_type` at fee calculation time via `getActiveByTransactionType()`.
- The `/active` endpoint is public (no auth required) for customer portal fee display.
- The `/all` endpoint is behind `auth:api` but no specific permission (accessible to any authenticated user) for dropdown data.
- The `service_order` transaction type was renamed to `sell_product` via migration `2026_02_12_100002`, reflecting that service orders are gated by the `can_sell_products` merchant capability.
- The `deactivateOthersOfSameType()` method is called after both create and update when the fee is active, ensuring only one active fee per transaction type at any time.
