# Module: ReferralProgram

## Model

- **File:** `backend/app/Models/ReferralProgram.php`
- **Table:** `referral_programs`
- **Fillable:** merchant_id, name, description, referrer_reward_type, referrer_reward_value, referee_reward_type, referee_reward_value, max_referrals_per_customer, code_expiry_days, reward_expiry_days, is_active, starts_at, ends_at
- **Relationships:**
  - `merchant()` BelongsTo Merchant
  - `referralCodes()` HasMany ReferralCode
  - `referrals()` HasMany Referral
- **Casts:** referrer_reward_value (decimal:2), referee_reward_value (decimal:2), max_referrals_per_customer (integer), code_expiry_days (integer), reward_expiry_days (integer), is_active (boolean), starts_at (datetime), ends_at (datetime)
- **Defaults ($attributes):** is_active = true, code_expiry_days = 30

## Migration

- **File:** `database/migrations/2026_03_04_100000_create_referral_programs_table.php`
- **Key columns:**
  - `id` bigint PK
  - `merchant_id` FK (constrained, cascadeOnDelete)
  - `name` string
  - `description` text, nullable
  - `referrer_reward_type` enum('percentage', 'fixed')
  - `referrer_reward_value` decimal(10,2)
  - `referee_reward_type` enum('percentage', 'fixed')
  - `referee_reward_value` decimal(10,2)
  - `max_referrals_per_customer` unsigned integer, nullable
  - `code_expiry_days` unsigned integer, default 30
  - `reward_expiry_days` unsigned integer, nullable
  - `is_active` boolean, default true
  - `starts_at` timestamp, nullable
  - `ends_at` timestamp, nullable
- **Indexes:** merchant_id

## Factory

- **File:** `database/factories/ReferralProgramFactory.php`
- **States:** `inactive()`, `withExpiry(int $days)`, `percentageRewards(float, float)`, `fixedRewards(float, float)`

## Repository

- **File:** `backend/app/Repositories/ReferralProgramRepository.php`
- **Interface:** `backend/app/Repositories/Contracts/ReferralProgramRepositoryInterface.php`
- Extends BaseRepository, no custom methods

## Service

- **File:** `backend/app/Services/ReferralProgramService.php`
- **Interface:** `backend/app/Services/Contracts/ReferralProgramServiceInterface.php`
- **Key methods:**
  - `getMyReferralProgram(int $merchantId)` -- Returns active program for merchant; branch merchants inherit from org (via parent_id). Sets `is_inherited` attribute on inherited programs
  - `createOrUpdateReferralProgram(int $merchantId, ReferralProgramData $data)` -- Upserts the active program (creates new or updates existing). Branch merchants are blocked (403)
  - `deactivateReferralProgram(int $merchantId)` -- Sets is_active=false on program and all its referral codes. Branch merchants blocked (403)
  - `getAdminReferralProgram(int $merchantId)` -- Returns active program with merchant relation and referrals count (admin view)
  - `updateAdminReferralProgram(int $merchantId, ReferralProgramData $data)` -- Admin update of active program
  - `getMerchantReferrals(int $merchantId, array $filters)` -- Paginated referrals list using Spatie QueryBuilder. Scoped to accessible merchant IDs (org + branches). Filters: status (exact), date_from, date_to. Sorts: created_at, status, completed_at
  - `getReferralStats(int $merchantId)` -- Returns aggregated stats: total_referrals, completed_referrals, pending_referrals, conversion_rate, top_referrers (top 10 by completed count)
- **Business rules:**
  - One active program per merchant at a time (upsert pattern)
  - Branch merchants inherit the organization's program (read-only)
  - Branch merchants cannot create, update, or deactivate programs (403 ApiException)
  - Deactivation cascades to all active referral codes
  - Stats and referral lists scope across org + all branches via `getAccessibleMerchantIds()`

## Controller

- **File:** `backend/app/Http/Controllers/Api/V1/ReferralProgramController.php`
- **Endpoints:**
  - `GET /auth/merchant/referral-program` -- show() -- View own referral program
  - `POST /auth/merchant/referral-program` -- store() -- Create or update own referral program
  - `DELETE /auth/merchant/referral-program` -- destroy() -- Deactivate own referral program
  - `GET /auth/merchant/referrals` -- referrals() -- List referrals for merchant
  - `GET /auth/merchant/referral-stats` -- stats() -- Get referral statistics
  - `GET /merchants/{merchant}/referral-program` -- adminShow() -- Admin view of merchant's program
  - `PUT /merchants/{merchant}/referral-program` -- adminUpdate() -- Admin update of merchant's program
- Uses `getMerchantId(Request)` helper that resolves merchant from `$request->user()->merchant->id`

## Form Requests

- **Files:**
  - `backend/app/Http/Requests/Api/V1/Referral/CreateReferralProgramRequest.php`
  - `backend/app/Http/Requests/Api/V1/Referral/UpdateReferralProgramRequest.php`
- **CreateReferralProgramRequest rules:**
  - name: required, string, max:255
  - description: nullable, string, max:1000
  - referrer_reward_type: required, in:percentage,fixed
  - referrer_reward_value: required, numeric, min:0
  - referee_reward_type: required, in:percentage,fixed
  - referee_reward_value: required, numeric, min:0
  - max_referrals_per_customer: nullable, integer, min:1
  - code_expiry_days: required, integer, min:1, max:365
  - reward_expiry_days: nullable, integer, min:1, max:365
  - starts_at: nullable, date
  - ends_at: nullable, date, after:starts_at
- **UpdateReferralProgramRequest rules:** Same fields but all `sometimes` instead of `required`

## Resource

- **File:** `backend/app/Http/Resources/Api/V1/ReferralProgramResource.php`
- **Output fields:** id, merchant_id, name, description, referrer_reward_type, referrer_reward_value, referee_reward_type, referee_reward_value, max_referrals_per_customer, code_expiry_days, reward_expiry_days, is_active, starts_at, ends_at, merchant (whenLoaded), is_inherited (getAttribute, default false), referrals_count (whenCounted), created_at, updated_at

## DTO

- **File:** `backend/app/Data/ReferralProgramData.php`
- **Fields (all string|Optional):** name, description (nullable), referrer_reward_type, referrer_reward_value, referee_reward_type, referee_reward_value, max_referrals_per_customer (nullable), code_expiry_days, reward_expiry_days (nullable), is_active, starts_at (nullable), ends_at (nullable)

## Routes

```
# Merchant self-service (auth + verified + onboarded + merchant.active)
GET    /api/v1/auth/merchant/referral-program
POST   /api/v1/auth/merchant/referral-program
DELETE /api/v1/auth/merchant/referral-program
GET    /api/v1/auth/merchant/referrals
GET    /api/v1/auth/merchant/referral-stats

# Admin (auth + verified + onboarded + permission middleware)
GET    /api/v1/merchants/{merchant}/referral-program    [permission: referral_programs.view]
PUT    /api/v1/merchants/{merchant}/referral-program    [permission: referral_programs.update]
```

## Permissions

- `referral_programs.view` -- View referral programs (admin)
- `referral_programs.create` -- Create referral programs (admin)
- `referral_programs.update` -- Update referral programs (admin)
- `referral_programs.delete` -- Delete referral programs (admin)

**Assigned to roles:**
- merchant: all four (view, create, update, delete)
- branch-merchant: all four (view, create, update, delete)
- manager: view only
- customer: customer_portal.referral (separate permission)

## Tests

- **File:** `tests/Feature/Api/V1/ReferralProgramTest.php`
- **Coverage:**
  - **Merchant CRUD (6 tests):** create program, view program, returns null when no active program, update existing program (upsert), deactivate program, view referrals list, view referral stats
  - **Branch merchant (2 tests):** branch can view inherited program (is_inherited=true), branch cannot create program (403)
  - **Admin routes (2 tests):** admin can view merchant referral program, admin can update merchant referral program

## Gotchas / Notes

- The program uses an **upsert pattern** -- POST always creates or updates the single active program (no separate create vs update endpoints for merchant self-service)
- `is_inherited` is a **virtual attribute** set via `setAttribute()`, not a database column. It appears in the resource when a branch merchant views the inherited org program
- Deactivation does not delete the program record -- it sets `is_active = false` and also deactivates all associated referral codes
- Branch merchants see the org's program via `parent_id` lookup but cannot modify it
- Stats include `top_referrers` with customer name resolution through the Customer -> User relationship chain
