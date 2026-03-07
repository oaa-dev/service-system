# Module: LoyaltyStampQrCode

## Model

- **File:** `backend/app/Models/LoyaltyStampQrCode.php`
- **Table:** `loyalty_stamp_qr_codes`
- **Timestamps:** `$timestamps = false` (only `created_at` manually managed)
- **Fillable:** `merchant_id`, `loyalty_program_id`, `token`, `mode`, `expires_at`, `is_used`, `scanned_by`, `scanned_at`, `scan_count`, `created_by`
- **Attributes (defaults):** `is_used` => false, `scan_count` => 0
- **Relationships:**
  - `merchant()` BelongsTo `Merchant`
  - `loyaltyProgram()` BelongsTo `LoyaltyProgram`
  - `scannedByCustomer()` BelongsTo `Customer` (via `scanned_by`)
  - `creator()` BelongsTo `User` (via `created_by`)
  - `scans()` HasMany `LoyaltyStampQrScan` (via `qr_code_id`)
- **Casts:**
  - `expires_at` => `datetime`
  - `is_used` => `boolean`
  - `scanned_at` => `datetime`
  - `scan_count` => `integer`
  - `created_at` => `datetime`
- **Helper methods:**
  - `isExpired(): bool` -- returns `$this->expires_at->isPast()`

## Migration

- **File:** `database/migrations/2026_03_03_100200_create_loyalty_stamp_qr_codes_table.php`
- **Key columns:**
  - `id` bigint auto-increment
  - `merchant_id` FK to `merchants`, cascadeOnDelete
  - `loyalty_program_id` FK to `loyalty_programs`, cascadeOnDelete
  - `token` string(64), unique
  - `mode` enum(`single_use`, `daily`)
  - `expires_at` timestamp
  - `is_used` boolean default false
  - `scanned_by` FK to `customers`, nullable, nullOnDelete
  - `scanned_at` timestamp nullable
  - `scan_count` unsignedInteger default 0
  - `created_by` FK to `users`, cascadeOnDelete
  - `created_at` timestamp nullable

## Repository

No dedicated repository. QR codes are managed directly via Eloquent in `LoyaltyService`.

## Service

- **File:** `backend/app/Services/LoyaltyService.php`
- **Interface:** `backend/app/Services/Contracts/LoyaltyServiceInterface.php`
- **Key methods:**
  - `generateStampQR(merchantId, mode, createdBy): LoyaltyStampQrCode` -- generates a new QR code
  - `scanStampQR(token, userId): array` -- processes a customer scan, creates stamp, checks rewards
- **Business rules (generation):**
  - Branch merchants resolve the parent's loyalty program (`parent_id ?? merchantId`)
  - Program must be active; 404 if not
  - Token is `Str::random(64)`
  - `single_use` mode: expires in 2 minutes
  - `daily` mode: expires at end of day (`now()->endOfDay()`)
  - `merchant_id` on the QR is the generating merchant (branch), not the program owner (org)
- **Business rules (scanning):**
  - Token lookup via `LoyaltyStampQrCode::where('token', $token)`
  - 404 if QR not found
  - 410 if expired (`expires_at->isPast()`)
  - 404 if program no longer active
  - Customer resolved from `Customer::where('user_id', $userId)` (Customer.id, not User.id)
  - **Single-use mode:** Atomic update with `where('is_used', false)` to prevent race conditions; 409 if already used. Sets `is_used=true`, `scanned_by`, `scanned_at`.
  - **Daily mode:** Checks if customer already earned a stamp from this merchant today via `LoyaltyStamp` query; 409 if duplicate. Records scan in `LoyaltyStampQrScan` and increments `scan_count`.
  - After validation: gets/creates loyalty card, creates stamp, increments card counters, checks tier rewards

## Controller

### Merchant-side (generation)

- **File:** `backend/app/Http/Controllers/Api/V1/LoyaltyController.php`
- **Endpoint:** `POST /api/v1/auth/merchant/loyalty/generate-qr`
- Returns `LoyaltyStampQrCodeResource`

### Customer-side (scanning)

- **File:** `backend/app/Http/Controllers/Api/V1/CustomerLoyaltyController.php`
- **Endpoint:** `POST /api/v1/customer/loyalty/scan`
- Returns stamp, card, reward_unlocked, rewards_unlocked

## Form Requests

- **File:** `backend/app/Http/Requests/Api/V1/Loyalty/GenerateQrCodeRequest.php`
  - `mode` -- `required|in:single_use,daily`
- **File:** `backend/app/Http/Requests/Api/V1/Loyalty/ScanQrCodeRequest.php`
  - `token` -- `required|string|size:64`

## Resource

- **File:** `backend/app/Http/Resources/Api/V1/LoyaltyStampQrCodeResource.php`
- **Output fields:** `id`, `token`, `mode`, `expires_at` (ISO string), `is_used`, `scan_count`, `is_expired` (computed via `isExpired()`), `created_at` (ISO string)

## DTO

No dedicated DTO. QR generation parameters are passed directly from the controller.

## Factory

- **File:** `backend/database/factories/LoyaltyStampQrCodeFactory.php`
- **States:** `daily()`, `expired()`, `used()`
- **Default:** `single_use` mode, expires in 2 minutes, `is_used` false, `scan_count` 0

## Routes

```
POST /api/v1/auth/merchant/loyalty/generate-qr         (merchant self-service, requires merchant.active)
POST /api/v1/customer/loyalty/scan                      (customer, permission: customer_portal.scan_loyalty)
```

## Permissions

- `loyalty_stamps.create` -- merchant-side QR generation (part of merchant self-service routes, no explicit permission middleware on generate-qr route itself)
- `customer_portal.scan_loyalty` -- customer-side QR scanning

## Tests

- **File:** `tests/Feature/Api/V1/LoyaltyTest.php`
  - **QR Generation (5 tests):**
    - Generates a single-use QR code (verifies token length 64, mode, is_used false)
    - Generates a daily QR code
    - Cannot generate QR without active program (404)
    - Validates mode field on QR generation (422)
    - Validates mode is required (422)
  - **Branch QR (2 tests):**
    - Branch generates QR using parent program (QR merchant_id = branch, loyalty_program_id = org's program)
    - Branch cannot generate QR when parent has no program (404)

- **File:** `tests/Feature/Api/V1/CustomerLoyaltyTest.php`
  - **Customer QR Scanning (11 tests):**
    - Scans single-use QR code and earns a stamp
    - Auto-creates loyalty card on first scan
    - Returns 410 for expired QR code
    - Returns 409 for already-used single-use QR code
    - Scans daily QR code and earns stamp
    - Returns 409 when scanning daily QR twice same day
    - Reaching threshold unlocks reward and resets stamps
    - Returns 404 for non-existent QR token
    - Returns 404 when scanning QR for deactivated program
    - Validates token is required (422)
    - Validates token must be 64 characters (422)

## Gotchas / Notes

- **Two QR modes with different lifecycles:** `single_use` expires in 2 minutes and can only be scanned once (atomic `is_used` flag). `daily` expires at end of day and can be scanned by multiple customers (one stamp per customer per merchant per day).
- **Race condition handling:** Single-use mode uses `where('is_used', false)->update(...)` returning affected rows count to prevent double-scanning. If `affected === 0`, the QR was already used (409).
- **Daily mode dedup:** Does not check the `LoyaltyStampQrScan` table for duplicates. Instead, it checks `LoyaltyStamp` records with `source=qr_scan` for the same merchant and customer on the same day. This means the dedup is per-merchant-per-day, not per-QR-code.
- **Branch tracking:** When a branch generates a QR, `merchant_id` is set to the branch ID (for tracking which branch generated it), but `loyalty_program_id` resolves to the parent organization's program.
- **No updated_at column:** The model has `$timestamps = false`. Only `created_at` is stored and manually set during creation.
- **Deactivation cleanup:** When a loyalty program is deactivated via `LoyaltyProgramService::deactivateLoyaltyProgram()`, all unexpired QR codes for that program have their `expires_at` set to `now()`, effectively invalidating them.
- **Customer FK:** `scanned_by` references `customers.id` (not `users.id`). The scanning flow resolves `Customer::where('user_id', $userId)` to get the customer record.
