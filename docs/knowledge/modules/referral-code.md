# Module: ReferralCode

## Model

- **File:** `backend/app/Models/ReferralCode.php`
- **Table:** `referral_codes`
- **Fillable:** referral_program_id, customer_id, code, uses_count, max_uses, expires_at, is_active
- **Relationships:**
  - `referralProgram()` BelongsTo ReferralProgram
  - `customer()` BelongsTo Customer
  - `referrals()` HasMany Referral
- **Casts:** uses_count (integer), max_uses (integer), expires_at (datetime), is_active (boolean)
- **Defaults ($attributes):** uses_count = 0, is_active = true
- **Custom methods:**
  - `isValid(): bool` -- Returns false if: not active, expired (expires_at is past), or max_uses reached (uses_count >= max_uses)

## Migration

- **File:** `database/migrations/2026_03_04_100100_create_referral_codes_table.php`
- **Key columns:**
  - `id` bigint PK
  - `referral_program_id` FK (constrained, cascadeOnDelete)
  - `customer_id` FK (constrained, cascadeOnDelete) -- the referrer (Customer.id, not User.id)
  - `code` string(16), unique
  - `uses_count` unsigned integer, default 0
  - `max_uses` unsigned integer, nullable
  - `expires_at` timestamp, nullable
  - `is_active` boolean, default true
- **Unique constraints:** `[referral_program_id, customer_id]` -- one code per customer per program
- **Indexes:** code

## Factory

- **File:** `database/factories/ReferralCodeFactory.php`
- **States:** `expired()` (expires_at = now - 1 day), `maxedOut()` (max_uses=5, uses_count=5)
- Code generated as `strtoupper(Str::random(8))`

## Repository

- **File:** `backend/app/Repositories/ReferralCodeRepository.php`
- **Interface:** `backend/app/Repositories/Contracts/ReferralCodeRepositoryInterface.php`
- Extends BaseRepository, no custom methods

## Service

ReferralCode has no dedicated service. It is managed by **ReferralService** (`backend/app/Services/ReferralService.php`).

- **Key methods (from ReferralService):**
  - `generateReferralCode(int $userId, int $merchantId)` -- Creates a code for a customer on a merchant's active program. Returns existing code if one already exists (idempotent). Code is 8-char uppercase random string. Expiry calculated from program's `code_expiry_days`
  - `getMyReferralCodes(int $userId)` -- Returns all active codes for a customer with program and merchant eager-loaded
  - `validateReferralCode(string $code)` -- Public validation returning code details, referrer name, program info, and merchant info. Throws 404 if not found, 422 if expired/inactive

## Controller

ReferralCode endpoints are on **CustomerReferralController** (`backend/app/Http/Controllers/Api/V1/CustomerReferralController.php`):

- `POST /customer/referrals/generate/{merchant}` -- generateCode() -- Generate a referral code for a merchant
- `GET /customer/referral-codes` -- myCodes() -- List customer's referral codes
- `GET /storefront/referral/{code}` -- validateCode() -- Public code validation (no auth required)

## Form Requests

No dedicated form request for code generation (merchantId comes from route param). Validation endpoint has no request body.

## Resource

- **File:** `backend/app/Http/Resources/Api/V1/ReferralCodeResource.php`
- **Output fields:** id, referral_program_id, customer_id, code, uses_count, max_uses, expires_at, is_active, customer (whenLoaded, includes user name), referral_program (whenLoaded, as ReferralProgramResource), created_at

## DTO

No dedicated DTO. Codes are created directly in the service.

## Routes

```
# Customer portal (auth + verified + onboarded + permission:customer_portal.referral)
POST   /api/v1/customer/referrals/generate/{merchant}    -- Generate referral code
GET    /api/v1/customer/referral-codes                    -- List my codes

# Storefront (public, no auth)
GET    /api/v1/storefront/referral/{code}                 -- Validate referral code
```

## Permissions

- `customer_portal.referral` -- Required for customer referral operations (generate, view codes, accept, view referrals/rewards)

## Tests

- **File:** `tests/Feature/Api/V1/ReferralProgramTest.php` (shared test file)
- **Coverage (Customer Referral Routes section):**
  - Customer can generate a referral code
  - Customer gets same code on repeated generation (idempotent)
  - Customer can view their referral codes
- **Coverage (Storefront section):**
  - Can validate a valid referral code (returns structure with code, referrer, program, merchant)
  - Returns 404 for invalid referral code
  - Returns 422 for expired referral code

## Gotchas / Notes

- **customer_id is Customer.id** (FK to customers table), not User.id. The service resolves Customer from User via `Customer::where('user_id', $userId)->firstOrFail()`
- Code generation is **idempotent** -- calling generate multiple times returns the same code (unique constraint on [referral_program_id, customer_id])
- Branch merchants' customers get codes for the **organization's program** (resolved via `merchant.parent_id`)
- The `isValid()` method is a model-level check, not middleware -- used by both validateReferralCode and acceptReferral flows
- Codes are 8-character uppercase random strings, guaranteed unique via do-while loop in `generateUniqueCode()`
- When a program is deactivated, all its codes are bulk-deactivated (`is_active = false`)
