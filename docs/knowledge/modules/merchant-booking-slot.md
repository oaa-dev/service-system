# Merchant Booking Slot Module

## Model
- **Path**: `backend/app/Models/MerchantBookingSlot.php`
- **Table**: `merchant_booking_slots`
- **Fillable**: merchant_id, day_of_week, start_time, end_time, max_capacity, is_active, sort_order
- **Casts**: day_of_week->integer, max_capacity->integer, is_active->boolean, sort_order->integer
- **Defaults** (`$attributes`): is_active=true, sort_order=0
- **Relationships**:
  - `merchant()` BelongsTo Merchant
  - `bookings()` HasMany Booking (via booking_slot_id FK on bookings table)
- **Traits**: HasFactory
- **Inverse relationship**: `Booking.bookingSlot()` BelongsTo MerchantBookingSlot (nullable)

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | `backend/app/Http/Controllers/Api/V1/MerchantBookingSlotController.php` | Dual-mode: self-service (merchant) + admin (via merchant param). Uses `resolveMerchantId()` pattern |
| Service | `backend/app/Services/MerchantBookingSlotService.php` | CRUD, unique slot enforcement, active slot queries |
| Service Interface | `backend/app/Services/Contracts/MerchantBookingSlotServiceInterface.php` | -- |
| Repository | `backend/app/Repositories/MerchantBookingSlotRepository.php` | extends BaseRepository; merchant-scoped queries |
| Repository Interface | `backend/app/Repositories/Contracts/MerchantBookingSlotRepositoryInterface.php` | -- |
| DTO | `backend/app/Data/MerchantBookingSlotData.php` | day_of_week, start_time, end_time (nullable), max_capacity (nullable), is_active, sort_order |
| FormRequest (store) | `backend/app/Http/Requests/Api/V1/BookingSlot/StoreMerchantBookingSlotRequest.php` | day_of_week required int 0-6, start_time required H:i format |
| FormRequest (update) | `backend/app/Http/Requests/Api/V1/BookingSlot/UpdateMerchantBookingSlotRequest.php` | All fields `sometimes` |
| Resource | `backend/app/Http/Resources/Api/V1/MerchantBookingSlotResource.php` | id, merchant_id, day_of_week, start_time, end_time, max_capacity, is_active, sort_order, timestamps |
| Provider | `backend/app/Providers/RepositoryServiceProvider.php` | Binds repo + service interfaces |
| BookingService | `backend/app/Services/BookingService.php` | Uses slot for capacity checks and time override in createBooking |
| StorefrontService | `backend/app/Services/StorefrontService.php` | getBookingSlotAvailability() returns per-slot booking counts |

## Routes

### Self-service (merchant)
| Method | URI | Action | Middleware |
|--------|-----|--------|------------|
| GET | `/api/v1/auth/merchant/booking-slots` | MerchantBookingSlotController@index | auth:api, ensure.verified, onboarding |
| POST | `/api/v1/auth/merchant/booking-slots` | MerchantBookingSlotController@store | auth:api, ensure.verified, onboarding |
| GET | `/api/v1/auth/merchant/booking-slots/{slot}` | MerchantBookingSlotController@show | auth:api, ensure.verified, onboarding |
| PUT | `/api/v1/auth/merchant/booking-slots/{slot}` | MerchantBookingSlotController@update | auth:api, ensure.verified, onboarding |
| DELETE | `/api/v1/auth/merchant/booking-slots/{slot}` | MerchantBookingSlotController@destroy | auth:api, ensure.verified, onboarding |

### Admin
| Method | URI | Action | Middleware |
|--------|-----|--------|------------|
| GET | `/api/v1/merchants/{merchant}/booking-slots` | MerchantBookingSlotController@index | auth + merchants.update |
| POST | `/api/v1/merchants/{merchant}/booking-slots` | MerchantBookingSlotController@store | auth + merchants.update |
| PUT | `/api/v1/merchants/{merchant}/booking-slots/{slot}` | MerchantBookingSlotController@update | auth + merchants.update |
| DELETE | `/api/v1/merchants/{merchant}/booking-slots/{slot}` | MerchantBookingSlotController@destroy | auth + merchants.update |

No dedicated booking slot permissions -- admin routes reuse `merchants.update` permission. Self-service routes are available to any authenticated merchant with verified email and completed onboarding.

## Business Rules

### Slot Creation and Uniqueness
- **Unique constraint**: `[merchant_id, day_of_week, start_time]` -- enforced at both DB level (composite unique index) and service level (`assertUniqueSlot()`)
- Duplicate day_of_week + start_time for the same merchant throws 422 `ValidationException` on `start_time` field
- Same day_of_week + start_time is allowed across different merchants
- On update, uniqueness check excludes the current slot ID

### Capacity
- `max_capacity` is nullable -- null means unlimited capacity
- When set, must be >= 1 (validated in FormRequest)
- Capacity checking happens in `BookingService::createBooking()`, not in the slot module itself

### Day of Week
- Integer 0-6 where 0=Sunday, 6=Saturday
- Validated in FormRequest: `min:0, max:6`

### Time Format
- `start_time` is required, format `H:i` (24-hour, e.g. "09:00", "14:30")
- `end_time` is optional/nullable, same format
- MySQL stores TIME columns which may serialize with or without seconds (e.g. "09:00" or "09:00:00")

### Sort Order
- Default 0, used for display ordering within a day
- Repository orders by `day_of_week`, then `sort_order`, then `start_time`

### Integration with Bookings
- `bookings` table has `booking_slot_id` FK (nullable, nullOnDelete) pointing to `merchant_booking_slots`
- When `booking_slot_id` is provided during booking creation:
  1. Slot is validated: must belong to the merchant and be `is_active=true`
  2. Slot's `start_time`/`end_time` override the booking's time fields
  3. Capacity is checked: counts pending + confirmed bookings on that date for that slot
  4. If slot is full, throws 422 ValidationException
- Deleting a slot sets `booking_slot_id` to null on associated bookings (nullOnDelete)

### Storefront Availability
- `StorefrontService::getBookingSlotAvailability()` returns slot data with per-slot booking counts for a given date
- Response includes: `slot_id`, `start_time`, `end_time`, `booked`, `max_capacity`, `available`, `is_full`
- Calendar endpoint (`BookingService::getBookingCalendar()`) includes slot breakdown when merchant `has_slots=true`

### Controller Pattern
- Uses `resolveMerchantId()` private method to handle dual-mode routing
- When `$merchant` route parameter is present (admin routes), uses `$merchant->id`
- When null (self-service routes), resolves from `$request->user()->merchant->id`
- `destroy()` wraps in try-catch for `ModelNotFoundException` and returns 422

### Data Isolation
- All repository queries scope by `merchant_id`
- Self-service routes auto-scope to the authenticated merchant's ID
- A merchant cannot view, update, or delete another merchant's slots (returns 404)

## Database
| Type | File | Notes |
|------|------|-------|
| Migration | `backend/database/migrations/2026_03_02_200000_create_merchant_booking_slots_table.php` | Creates table with composite unique + index |
| Migration | `backend/database/migrations/2026_03_02_200001_add_booking_slot_id_to_bookings_table.php` | Adds nullable FK on bookings table |
| Factory | `backend/database/factories/MerchantBookingSlotFactory.php` | Random hour 8-16, day 0-6, optional max_capacity |

### Table Schema
```
id                 BIGINT (PK)
merchant_id        BIGINT FK → merchants (cascadeOnDelete)
day_of_week        TINYINT (0=Sun, 6=Sat)
start_time         TIME
end_time           TIME (nullable)
max_capacity       UNSIGNED INT (nullable, null=unlimited)
is_active          BOOLEAN (default true)
sort_order         UNSIGNED INT (default 0)
created_at         TIMESTAMP
updated_at         TIMESTAMP

UNIQUE(merchant_id, day_of_week, start_time)
INDEX(merchant_id, day_of_week, is_active)
```

## Frontend (Admin)
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/bookingSlotService.ts` | Dual-mode: optional `merchantId` param switches between self-service (`/auth/merchant/booking-slots`) and admin (`/merchants/{id}/booking-slots`) |
| Hook | `frontend/hooks/useBookingSlots.ts` | `useBookingSlots(merchantId?)`, `useCreateBookingSlot(merchantId?)`, `useUpdateBookingSlot(merchantId?)`, `useDeleteBookingSlot(merchantId?)` |
| Types | `frontend/types/api.ts` | `MerchantBookingSlot` interface: id, merchant_id, day_of_week, start_time, end_time, max_capacity, is_active, sort_order |
| Zod Schema | `frontend/lib/validations.ts` | `createBookingSlotSchema`, `updateBookingSlotSchema` (partial of create), `CreateBookingSlotFormData`, `UpdateBookingSlotFormData` |
| Settings Tab | `frontend/app/(system)/(my-store)/my-store/settings/my-store-booking-slots-tab.tsx` | `MyStoreBookingSlotsTab` component: grouped by day (Mon-Sun order), CRUD via dialog, uses react-hook-form + zodResolver |
| Settings Page | `frontend/app/(system)/(my-store)/my-store/settings/store-settings-tabs.tsx` | "Booking Slots" tab conditionally rendered when `merchant.can_take_bookings` is true |

### Query Keys
- `['booking-slots', merchantId ?? 'my']` -- all CRUD operations invalidate this key

### UI Details
- Slots are grouped by day of week in Monday-first order (1,2,3,4,5,6,0)
- Only days with slots are displayed
- Each slot shows: time range (12-hour AM/PM format), capacity text, active/inactive badge
- Create/edit uses a `SlotFormDialog` component with day selector, time inputs, capacity, sort order, and active toggle
- Delete uses `AlertDialog` confirmation

## Customer Portal Frontend
| Category | File | Notes |
|----------|------|-------|
| Slot Picker | `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/merchant-slot-picker.tsx` | `MerchantSlotPicker` component: date-driven slot list with availability badges |
| Hook | `frontend-customer-portal/hooks/useStorefront.ts` | `useBookingSlotAvailability(slug, serviceId, date)` -- queries storefront availability endpoint |
| Service | `frontend-customer-portal/services/storefrontService.ts` | `getBookingSlotAvailability(slug, serviceId, date)` -- `GET /storefront/merchants/{slug}/services/{service}/booking-availability?date=YYYY-MM-DD` |
| Types | `frontend-customer-portal/types/api.ts` | `BookingSlotAvailability` (slot_id, start_time, end_time, booked, available, max_capacity, is_full), `BookingDayAvailability` (date, has_slots, slots[]) |

### Customer Portal UI
- `MerchantSlotPicker` renders when a date is selected on the booking page
- Each slot shows time range (12-hour format), capacity info, and status badge (Available / "N left" / Full)
- Full slots and slots with insufficient capacity for the party size are disabled
- Visual states: selected (primary border/bg), available (default border, hover effect), full (muted, cursor-not-allowed)

## Tests
| Type | File | Tests |
|------|------|-------|
| Feature | `backend/tests/Feature/Api/V1/MerchantBookingSlotTest.php` | 24 tests across 3 describe blocks |

### Test Coverage
**Self-service (merchant)** -- 14 tests:
- CRUD operations (list, create, view, update, delete)
- Delete non-existent slot returns 422
- Validation: day_of_week required + must be 0-6, start_time must be H:i format, max_capacity >= 1
- Unique constraint: duplicate day+time for same merchant rejected
- Cross-merchant isolation: cannot access another merchant's slot (404)
- Only returns own slots in list
- Optional fields default correctly (end_time=null, max_capacity=null, is_active=true, sort_order=0)
- Same day+time allowed for different merchants

**Admin** -- 7 tests:
- CRUD operations (list, create, update, delete) via `/merchants/{merchant}/booking-slots`
- Delete non-existent returns 422
- Cross-merchant slot update returns 404
- Non-admin user gets 403

**Authentication** -- 3 tests:
- Unauthenticated access to self-service list, create, and admin routes returns 401
