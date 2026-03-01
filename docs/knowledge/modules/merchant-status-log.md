# MerchantStatusLog Module

## Model
- **Path**: `app/Models/MerchantStatusLog.php`
- **Table**: `merchant_status_logs`
- **Fillable**: `merchant_id`, `from_status`, `to_status`, `reason`, `changed_by`, `metadata`
- **Casts**:
  - `metadata` -> array
  - `created_at` -> datetime
- **Relationships**:
  - `merchant()` -> BelongsTo -> `Merchant`
  - `changedBy()` -> BelongsTo -> `User` (FK: changed_by)
- **Traits**: None (no HasFactory, no HasMedia)
- **Scopes**: None
- **Special**: `const UPDATED_AT = null` -- this model is append-only; no updated_at column exists
- **Strict types**: `declare(strict_types=1)`

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Parent model | `app/Models/Merchant.php` | statusLogs() HasMany, ordered by created_at desc |
| Service | `app/Services/MerchantService.php` | Creates logs in createMerchant, createMerchantForUser, updateStatus, submitApplication, createBranch; reads via getMerchantStatusLogs() |
| Resource | `app/Http/Resources/Api/V1/MerchantStatusLogResource.php` | Returns id, merchant_id, from_status, to_status, reason, changed_by (id+name whenLoaded), metadata, created_at |
| Controller (admin) | `app/Http/Controllers/Api/V1/MerchantController.php` | statusLogs() action -- GET merchants/{merchant}/status-logs |
| Controller (self-service) | `app/Http/Controllers/Api/V1/MyMerchantController.php` | statusLogs() action -- GET auth/merchant/status-logs |
| Notification | `app/Notifications/MerchantStatusChangedNotification.php` | Triggered by MerchantService::updateStatus() after log is created |
| Notification | `app/Notifications/MerchantApplicationSubmittedNotification.php` | Triggered by MerchantService::submitApplication() after log is created |

## Routes

| Method | URI | Middleware | Action | Permission |
|--------|-----|------------|--------|------------|
| GET | `api/v1/merchants/{merchant}/status-logs` | auth:api, ensure.verified, onboarding | MerchantController@statusLogs | merchants.view |
| GET | `api/v1/auth/merchant/status-logs` | auth:api, ensure.verified, onboarding | MyMerchantController@statusLogs | -- |

## Database

| Type | File |
|------|------|
| Migration (create) | `database/migrations/2026_02_15_000001_create_merchant_status_logs_table.php` |
| Factory | -- (none; records created by MerchantService) |
| Seeder | -- (none) |

## Tests

| Type | File |
|------|------|
| Feature -- Status log endpoints | `tests/Feature/Api/V1/MerchantStatusLogTest.php` |
| Feature -- Implicitly via status transitions | `tests/Feature/Api/V1/MerchantControllerTest.php` |
| Feature -- Submit application flow | `tests/Feature/Api/V1/SubmitApplicationTest.php` |

## Notes
- **Append-only audit log**: records are never updated, only created. The `UPDATED_AT = null` constant prevents Eloquent from managing an updated_at column.
- `from_status` is nullable to capture the initial creation state (no previous status).
- `changed_by` is nullable for system-initiated transitions (e.g., initial creation, self-service submission).
- `metadata` is a JSON column cast to array, available for storing additional context about the transition.
- Records are created in five places within MerchantService:
  1. `createMerchant()` -- initial log: null -> 'pending'
  2. `createMerchantForUser()` -- initial log: null -> 'pending'
  3. `updateStatus()` -- logs every admin-initiated transition; also sends MerchantStatusChangedNotification to the merchant user
  4. `submitApplication()` -- logs pending/rejected -> submitted; sends MerchantApplicationSubmittedNotification to all admins
  5. `createBranch()` -- logs initial status for new branch (null -> 'pending' or null -> 'active')
- `getMerchantStatusLogs()` queries directly (not via repository) with eager-loaded `changedBy` relationship, ordered by `created_at desc`.
- The MerchantResource includes status_logs as a `whenLoaded` conditional relation.
