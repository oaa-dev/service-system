# ServiceSchedule Module

## Model
- **Path**: app/Models/ServiceSchedule.php
- **Table**: service_schedules
- **Fillable**: service_id, day_of_week, start_time, end_time, is_available
- **Casts**:
  - day_of_week -> integer
  - is_available -> boolean
- **Relationships**:
  - service -> BelongsTo -> Service
- **Traits**: none (no HasFactory)
- **Scopes**: none

### Key Constraints
- Composite unique index on `[service_id, day_of_week]` -- one schedule row per day per service.
- `day_of_week` range: 0 (Sunday) through 6 (Saturday).

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/MerchantServiceController.php | getSchedules() and updateSchedules() actions |
| Service (business logic) | app/Services/MerchantService.php | getServiceSchedules() + upsertServiceSchedules() |
| Service interface | app/Services/Contracts/MerchantServiceInterface.php | getServiceSchedules, upsertServiceSchedules |
| Form Request (bulk upsert) | app/Http/Requests/Api/V1/Service/UpdateServiceScheduleRequest.php | Validates array of schedules (max 7), time format H:i, end_time after start_time |
| Resource | app/Http/Resources/Api/V1/ServiceScheduleResource.php | id, service_id, day_of_week, start_time, end_time, is_available, timestamps |
| Parent model | app/Models/Service.php | Has schedules() HasMany relationship |
| Storefront service | app/Services/StorefrontService.php | getServiceDetail loads schedules alongside the service |
| Booking service | app/Services/BookingService.php | Reads schedule data to validate booking day/time availability |

## Routes
Schedules have no independent routes. They are managed through the Service routes:

| Method | URI | Action | Middleware |
|--------|-----|--------|-----------|
| GET | /api/v1/merchants/{merchant}/services/{service}/schedules | getSchedules | auth:api, ensure.verified, onboarding, permission:services.update |
| PUT | /api/v1/merchants/{merchant}/services/{service}/schedules | updateSchedules (bulk upsert) | auth:api, ensure.verified, onboarding, permission:services.update |

## Database
| Type | File |
|------|------|
| Migration (create) | database/migrations/2026_02_10_200009_create_service_schedules_table.php |
| Factory | none |
| Seeder | none |

## Tests
| Type | File |
|------|------|
| Feature (schedule get + update within service tests) | tests/Feature/Api/V1/MerchantServiceControllerTest.php |
| Feature (booking context uses schedule data) | tests/Feature/Api/V1/BookingControllerTest.php |
| Feature (customer portal booking context) | tests/Feature/Api/V1/CustomerPortalControllerTest.php |

## Notes
- ServiceSchedule has no standalone controller, service, repository, DTO, or factory. It is managed entirely through `MerchantServiceController` using `MerchantService::upsertServiceSchedules()`.
- The upsert strategy uses `updateOrCreate(['service_id', 'day_of_week'], [...fields])` keyed on `[service_id, day_of_week]`.
- Schedules apply only to `bookable` service types; the schedule data is meaningful for booking availability windows.
- `is_available` allows a day to be recorded but marked as closed (e.g., Sunday entry with `is_available: false`).
- The `PUT /schedules` endpoint is a bulk operation -- it accepts an array of up to 7 schedule objects and upserts each one. Partial updates are supported (not all 7 days need to be sent).
- The Storefront `serviceDetail` endpoint (`GET /api/v1/storefront/merchants/{slug}/services/{service}`) eagerly loads schedules so customers can see availability before booking.
- Booking validation in `BookingService::createBooking()`: checks `service->schedules()->where('day_of_week', $dayOfWeek)` for the requested day, verifies `is_available` is true, then checks start_time is within schedule's time range.
