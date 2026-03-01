# MerchantBusinessHour Module

## Model
- **Path**: `app/Models/MerchantBusinessHour.php`
- **Table**: `merchant_business_hours`
- **Fillable**: `merchant_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`
- **Casts**:
  - `day_of_week` -> integer
  - `is_closed` -> boolean
- **Relationships**:
  - `merchant()` -> BelongsTo -> `Merchant`
- **Traits**: None (no HasFactory, no HasMedia)
- **Scopes**: None

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Parent model | `app/Models/Merchant.php` | businessHours() HasMany, ordered by day_of_week |
| Service | `app/Services/MerchantService.php` | updateBusinessHours() -- iterates hours array, upserts by day_of_week using updateOrCreate |
| Resource | `app/Http/Resources/Api/V1/MerchantBusinessHourResource.php` | Returns id, day_of_week, open_time (formatted H:i via Carbon::parse), close_time (formatted H:i), is_closed |
| FormRequest | `app/Http/Requests/Api/V1/Merchant/UpdateBusinessHoursRequest.php` | Validates hours array; each entry: day_of_week 0-6, open_time/close_time nullable time strings, is_closed boolean |
| Controller (admin) | `app/Http/Controllers/Api/V1/MerchantController.php` | updateBusinessHours() action |
| Controller (self-service) | `app/Http/Controllers/Api/V1/MyMerchantController.php` | updateBusinessHours() action |

## Routes

| Method | URI | Middleware | Action | Permission |
|--------|-----|------------|--------|------------|
| PUT | `api/v1/merchants/{merchant}/business-hours` | auth:api, ensure.verified, onboarding | MerchantController@updateBusinessHours | merchants.update |
| PUT | `api/v1/auth/merchant/business-hours` | auth:api, ensure.verified, onboarding | MyMerchantController@updateBusinessHours | -- |

## Database

| Type | File |
|------|------|
| Migration (create) | `database/migrations/2026_02_08_100002_create_merchant_business_hours_table.php` |
| Factory | -- (none; created directly in tests) |
| Seeder | -- (none) |

## Tests

| Type | File |
|------|------|
| Feature (via MerchantControllerTest) | `tests/Feature/Api/V1/MerchantControllerTest.php` |
| Feature (via MyMerchantControllerTest) | `tests/Feature/Api/V1/MyMerchantControllerTest.php` |

## Notes
- `day_of_week` is a tinyInteger: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
- `open_time` and `close_time` are stored as TIME columns in the database. The resource formats them as `H:i` (e.g., "09:00", "17:30") using `Carbon::parse()`.
- Composite unique constraint on `[merchant_id, day_of_week]` -- one row per day per merchant.
- Managed via `MerchantService::updateBusinessHours()` using a bulk upsert pattern: iterates the input `hours` array and calls `$merchant->businessHours()->updateOrCreate()` keyed on `day_of_week`.
- No dedicated controller, repository, or service -- all operations go through `MerchantService` via `MerchantController` and `MyMerchantController`.
- The `MerchantResource` includes business_hours as a `whenLoaded` conditional relation using `MerchantBusinessHourResource::collection()`.
- `MerchantService::getMerchantById()` eagerly loads `businessHours` as part of its standard relation set.
