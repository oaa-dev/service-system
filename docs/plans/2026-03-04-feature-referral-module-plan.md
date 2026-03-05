# Plan: Referral Module (Customer-to-Customer)

**Date:** 2026-03-04
**Type:** feature
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- **Loyalty Program module** is the structural template — per-merchant program with upsert, dual-controller (self-service + admin), customer-facing operations, polymorphic reward tracking
- **Customer FK pattern**: `customer_id` FKs to `customers` table (NOT `users`). Resolve via `Customer::where('user_id', auth()->id())->firstOrFail()`
- **Morph map** in `AppServiceProvider`: `'booking'` → Booking, `'reservation'` → Reservation, `'service_order'` → ServiceOrder — reuse for qualifying transactions
- **DTO pattern**: All fields `string|Optional`, service layer rejects Optional values with `collect($data->toArray())->reject(fn($v) => $v instanceof Optional)->toArray()`
- **Model defaults**: Use `$attributes` array, not DB defaults
- **FormRequests**: Always `authorize(): true` — permission checks at route level
- **Status transitions**: Validated via `VALID_TRANSITIONS` constant in service layer

### Known Gotchas
- `Booking.customer_id` = User.id, but `LoyaltyCard.customer_id` = Customer.id. Referral FKs must use Customer.id (consistent with loyalty)
- Branch merchants inherit organization's program (see `LoyaltyProgramService::getMyLoyaltyProgram()` parent_id fallback) — apply same pattern
- `destroy()` controllers wrap in try-catch for `ModelNotFoundException` → 422
- `BaseRepository::update()` returns `->fresh()` — use when chaining

### Critical Patterns Applied
- **Upsert pattern**: `createOrUpdateReferralProgram()` — same as `LoyaltyProgramService::createOrUpdateLoyaltyProgram()`
- **Dual-controller**: `ReferralProgramController` (admin) + self-service endpoints, both using shared `ReferralProgramService`
- **Customer portal controller**: `CustomerReferralController` — same pattern as `CustomerLoyaltyController`
- **Service provider bindings**: All interfaces bound in `RepositoryServiceProvider`

## Overview

Implement a customer-to-customer referral system where merchants create referral programs, customers share unique invite codes, and both parties earn discount/credit rewards when the referee completes their first transaction. Phase 1 focuses on backend + admin frontend + customer portal. Reward redemption (actual discount application) is deferred to Phase 2.

### Decisions
| Dimension | Choice |
|-----------|--------|
| Referral Type | Customer-to-Customer |
| Reward Type | Discount/Credit (percentage or fixed) |
| Code Scope | Per-Customer unique codes per merchant |
| Reward Target | Both referrer and referee |
| Program Scope | Per-Merchant with configurable settings |
| Trigger Event | First completed transaction by referee |
| Reward Expiry | Configurable by merchant (reward_expiry_days) |
| Redemption | Deferred to Phase 2 (track as available for now) |
| Merchant Visibility | Full — merchants see referrer/referee names and status |

## Implementation Steps

### Step 1: Migrations (4 tables)

**Files:**
- `backend/database/migrations/2026_03_04_100000_create_referral_programs_table.php`
- `backend/database/migrations/2026_03_04_100100_create_referral_codes_table.php`
- `backend/database/migrations/2026_03_04_100200_create_referrals_table.php`
- `backend/database/migrations/2026_03_04_100300_create_referral_rewards_table.php`

**Details:**

`referral_programs`:
- `id`, `merchant_id` (FK merchants, cascadeOnDelete), `name` (string), `description` (text nullable)
- `referrer_reward_type` (enum: percentage, fixed), `referrer_reward_value` (decimal 10,2)
- `referee_reward_type` (enum: percentage, fixed), `referee_reward_value` (decimal 10,2)
- `max_referrals_per_customer` (unsignedInteger nullable, null = unlimited)
- `code_expiry_days` (unsignedInteger default 30)
- `reward_expiry_days` (unsignedInteger nullable)
- `is_active` (boolean default true), `starts_at` (timestamp nullable), `ends_at` (timestamp nullable)
- `timestamps`
- Index: `merchant_id`

`referral_codes`:
- `id`, `referral_program_id` (FK referral_programs, cascadeOnDelete)
- `customer_id` (FK customers, cascadeOnDelete) — the referrer
- `code` (string 16, unique) — 8-char alphanumeric uppercase
- `uses_count` (unsignedInteger default 0)
- `max_uses` (unsignedInteger nullable)
- `expires_at` (timestamp nullable), `is_active` (boolean default true)
- `timestamps`
- Unique: `[referral_program_id, customer_id]` — one code per customer per program
- Index: `code`

`referrals`:
- `id`, `referral_code_id` (FK referral_codes, cascadeOnDelete)
- `referral_program_id` (FK referral_programs, cascadeOnDelete) — denormalized
- `referrer_customer_id` (FK customers, cascadeOnDelete)
- `referee_customer_id` (FK customers, cascadeOnDelete)
- `status` (enum: pending, completed, expired, cancelled, default: pending)
- `completed_at` (timestamp nullable)
- `qualifying_type` (string nullable), `qualifying_id` (unsignedBigInteger nullable) — morph to booking/reservation/service_order
- `timestamps`
- Unique: `[referral_program_id, referee_customer_id]` — one referral per referee per program
- Index: `referrer_customer_id`, `referee_customer_id`

`referral_rewards`:
- `id`, `referral_id` (FK referrals, cascadeOnDelete)
- `customer_id` (FK customers, cascadeOnDelete) — who earns this
- `reward_type` (enum: percentage, fixed)
- `reward_value` (decimal 10,2)
- `role` (enum: referrer, referee) — which side of the referral earned this
- `status` (enum: pending, available, redeemed, expired, default: pending)
- `redeemed_at` (timestamp nullable)
- `redeemed_on_type` (string nullable), `redeemed_on_id` (unsignedBigInteger nullable) — polymorphic
- `expires_at` (timestamp nullable)
- `timestamps`
- Index: `customer_id`, `referral_id`

### Step 2: Models + Factories

**Files:**
- `backend/app/Models/ReferralProgram.php`
- `backend/app/Models/ReferralCode.php`
- `backend/app/Models/Referral.php`
- `backend/app/Models/ReferralReward.php`
- `backend/database/factories/ReferralProgramFactory.php`
- `backend/database/factories/ReferralCodeFactory.php`
- `backend/database/factories/ReferralFactory.php`
- `backend/database/factories/ReferralRewardFactory.php`

**Details:**

`ReferralProgram`:
- Fillable: merchant_id, name, description, referrer_reward_type, referrer_reward_value, referee_reward_type, referee_reward_value, max_referrals_per_customer, code_expiry_days, reward_expiry_days, is_active, starts_at, ends_at
- Defaults (`$attributes`): is_active=true, code_expiry_days=30
- Casts: referrer_reward_value→decimal:2, referee_reward_value→decimal:2, max_referrals_per_customer→integer, code_expiry_days→integer, reward_expiry_days→integer, is_active→boolean, starts_at→datetime, ends_at→datetime
- Relations: `merchant()` BelongsTo Merchant, `referralCodes()` HasMany ReferralCode, `referrals()` HasMany Referral

`ReferralCode`:
- Fillable: referral_program_id, customer_id, code, uses_count, max_uses, expires_at, is_active
- Defaults: uses_count=0, is_active=true
- Casts: uses_count→integer, max_uses→integer, expires_at→datetime, is_active→boolean
- Relations: `referralProgram()` BelongsTo ReferralProgram, `customer()` BelongsTo Customer, `referrals()` HasMany Referral (via referral_code_id)
- Method: `isValid(): bool` — checks is_active, not expired, not max_uses exceeded

`Referral`:
- Fillable: referral_code_id, referral_program_id, referrer_customer_id, referee_customer_id, status, completed_at, qualifying_type, qualifying_id
- Defaults: status='pending'
- Casts: completed_at→datetime
- Relations: `referralCode()` BelongsTo ReferralCode, `referralProgram()` BelongsTo ReferralProgram, `referrerCustomer()` BelongsTo Customer, `refereeCustomer()` BelongsTo Customer, `qualifyingTransaction()` MorphTo (qualifying_type/qualifying_id), `rewards()` HasMany ReferralReward

`ReferralReward`:
- Fillable: referral_id, customer_id, reward_type, reward_value, role, status, redeemed_at, redeemed_on_type, redeemed_on_id, expires_at
- Defaults: status='pending'
- Casts: reward_value→decimal:2, redeemed_at→datetime, expires_at→datetime
- Relations: `referral()` BelongsTo Referral, `customer()` BelongsTo Customer, `redeemedOn()` MorphTo
- Method: `isAvailable(): bool` — status=available AND (expires_at is null OR expires_at > now())

**Factory states:**
- ReferralProgramFactory: `inactive()`, `withExpiry(int $days)`, `percentageRewards($pct)`, `fixedRewards($amount)`
- ReferralCodeFactory: `expired()`, `maxedOut()`
- ReferralFactory: `completed()`, `expired()`, `cancelled()`
- ReferralRewardFactory: `available()`, `redeemed()`, `expired()`

### Step 3: Repositories + Interfaces

**Files:**
- `backend/app/Repositories/Contracts/ReferralProgramRepositoryInterface.php`
- `backend/app/Repositories/ReferralProgramRepository.php`
- `backend/app/Repositories/Contracts/ReferralCodeRepositoryInterface.php`
- `backend/app/Repositories/ReferralCodeRepository.php`
- `backend/app/Repositories/Contracts/ReferralRepositoryInterface.php`
- `backend/app/Repositories/ReferralRepository.php`
- `backend/app/Repositories/Contracts/ReferralRewardRepositoryInterface.php`
- `backend/app/Repositories/ReferralRewardRepository.php`

**Details:** All extend `BaseRepository` / `BaseRepositoryInterface`. Minimal — most query logic in services.

### Step 4: DTO

**Files:**
- `backend/app/Data/ReferralProgramData.php`

**Details:**
```php
class ReferralProgramData extends Data {
    public function __construct(
        public string|Optional $name = new Optional(),
        public string|Optional $description = new Optional(),
        public string|Optional $referrer_reward_type = new Optional(),
        public string|Optional $referrer_reward_value = new Optional(),
        public string|Optional $referee_reward_type = new Optional(),
        public string|Optional $referee_reward_value = new Optional(),
        public string|Optional $max_referrals_per_customer = new Optional(),
        public string|Optional $code_expiry_days = new Optional(),
        public string|Optional $reward_expiry_days = new Optional(),
        public string|Optional $is_active = new Optional(),
        public string|Optional $starts_at = new Optional(),
        public string|Optional $ends_at = new Optional(),
    ) {}
}
```

### Step 5: Services + Interfaces

**Files:**
- `backend/app/Services/Contracts/ReferralProgramServiceInterface.php`
- `backend/app/Services/ReferralProgramService.php`
- `backend/app/Services/Contracts/ReferralServiceInterface.php`
- `backend/app/Services/ReferralService.php`

**Details:**

`ReferralProgramService` (merchant program management):
- `getMyReferralProgram(int $merchantId): ?ReferralProgram` — branch inherits organization's program (same parent_id fallback as loyalty)
- `createOrUpdateReferralProgram(int $merchantId, ReferralProgramData $data): ReferralProgram` — upsert active program. Branches cannot create (403)
- `deactivateReferralProgram(int $merchantId): void` — set is_active=false, deactivate all codes
- `getAdminReferralProgram(int $merchantId): ?ReferralProgram` — admin view with stats
- `updateAdminReferralProgram(int $merchantId, ReferralProgramData $data): ReferralProgram` — admin update
- `getMerchantReferrals(int $merchantId, array $filters): LengthAwarePaginator` — QueryBuilder with filters (status, date range)
- `getReferralStats(int $merchantId): array` — total referrals, completed, pending, conversion rate, top referrers

`ReferralService` (customer operations + referral completion):
- `generateReferralCode(int $userId, int $merchantId): ReferralCode` — resolve Customer, find active program, firstOrCreate code with generated 8-char code
- `validateReferralCode(string $code): array` — return program + merchant info or error
- `acceptReferral(int $userId, string $code): Referral` — create pending Referral record. Validate: code valid, user not already referred by this program, user is not the referrer
- `checkAndCompleteReferral(int $userId, int $merchantId, string $transactionType, int $transactionId): void` — called from BookingService/ReservationService/ServiceOrderService on status→completed. Checks pending referral for this user+merchant, creates rewards for both sides
- `getMyReferralCodes(int $userId): Collection` — customer's generated codes with stats
- `getMyReferrals(int $userId): Collection` — people I've referred + status
- `getMyReferralRewards(int $userId, array $filters): LengthAwarePaginator` — my earned rewards

**Code generation:** `strtoupper(Str::random(8))` with retry on collision (unique constraint).

### Step 6: FormRequests

**Files:**
- `backend/app/Http/Requests/Api/V1/Referral/CreateReferralProgramRequest.php`
- `backend/app/Http/Requests/Api/V1/Referral/UpdateReferralProgramRequest.php`
- `backend/app/Http/Requests/Api/V1/Referral/AcceptReferralRequest.php`

**Details:**

`CreateReferralProgramRequest`:
- name: required|string|max:255
- description: nullable|string|max:1000
- referrer_reward_type: required|in:percentage,fixed
- referrer_reward_value: required|numeric|min:0
- referee_reward_type: required|in:percentage,fixed
- referee_reward_value: required|numeric|min:0
- max_referrals_per_customer: nullable|integer|min:1
- code_expiry_days: required|integer|min:1|max:365
- reward_expiry_days: nullable|integer|min:1|max:365
- starts_at: nullable|date
- ends_at: nullable|date|after:starts_at

`UpdateReferralProgramRequest`: Same fields, all `sometimes`

`AcceptReferralRequest`:
- code: required|string|size:8

### Step 7: Resources

**Files:**
- `backend/app/Http/Resources/Api/V1/ReferralProgramResource.php`
- `backend/app/Http/Resources/Api/V1/ReferralCodeResource.php`
- `backend/app/Http/Resources/Api/V1/ReferralResource.php`
- `backend/app/Http/Resources/Api/V1/ReferralRewardResource.php`

**Details:** Follow existing patterns. Use `whenLoaded()` for relationships. ReferralResource includes referrer/referee customer names. ReferralRewardResource includes referral context.

### Step 8: Controllers

**Files:**
- `backend/app/Http/Controllers/Api/V1/ReferralProgramController.php` — merchant self-service + admin
- `backend/app/Http/Controllers/Api/V1/CustomerReferralController.php` — customer portal

**Details:**

`ReferralProgramController` (mirrors LoyaltyProgramController):
- `show(Request)` → GET /auth/merchant/referral-program — own program
- `store(CreateReferralProgramRequest)` → POST /auth/merchant/referral-program — upsert
- `destroy(Request)` → DELETE /auth/merchant/referral-program — deactivate
- `referrals(Request)` → GET /auth/merchant/referrals — list merchant's referrals
- `stats(Request)` → GET /auth/merchant/referral-stats — conversion stats
- `adminShow(int $merchantId)` → GET /merchants/{merchant}/referral-program
- `adminUpdate(UpdateReferralProgramRequest, int $merchantId)` → PUT /merchants/{merchant}/referral-program

`CustomerReferralController`:
- `generateCode(int $merchantId)` → POST /customer/referrals/generate/{merchant} — get/create referral code
- `myCodes()` → GET /customer/referral-codes — list my codes
- `myReferrals()` → GET /customer/referrals — people I've referred
- `myRewards(Request)` → GET /customer/referral-rewards — my earned rewards
- `accept(AcceptReferralRequest)` → POST /customer/referrals/accept — accept a referral code
- `validateCode(string $code)` → GET /storefront/referral/{code} — public: validate code + return merchant info

### Step 9: Routes + Permissions

**Files:**
- `backend/routes/api.php`
- `backend/database/seeders/RolePermissionSeeder.php`

**Permissions:**
```
referral_programs:
  - referral_programs.view
  - referral_programs.create
  - referral_programs.update
  - referral_programs.delete
customer_portal:
  - customer_portal.referral
```

**Role assignments** (same pattern as loyalty):
- super-admin/admin: all referral_programs.*
- manager: referral_programs.view
- merchant: all referral_programs.*
- branch-merchant: referral_programs.view
- customer: customer_portal.referral

**Routes:**
```
// Public (storefront)
GET /storefront/referral/{code} → CustomerReferralController@validateCode

// Merchant self-service (auth + verified + onboarded)
GET  /auth/merchant/referral-program  → ReferralProgramController@show
POST /auth/merchant/referral-program  → ReferralProgramController@store
DELETE /auth/merchant/referral-program → ReferralProgramController@destroy
GET  /auth/merchant/referrals         → ReferralProgramController@referrals
GET  /auth/merchant/referral-stats    → ReferralProgramController@stats

// Admin (auth + permission)
GET /merchants/{merchant}/referral-program → ReferralProgramController@adminShow (referral_programs.view)
PUT /merchants/{merchant}/referral-program → ReferralProgramController@adminUpdate (referral_programs.update)

// Customer portal (auth + permission)
POST /customer/referrals/generate/{merchant} → CustomerReferralController@generateCode (customer_portal.referral)
GET  /customer/referral-codes               → CustomerReferralController@myCodes (customer_portal.referral)
GET  /customer/referrals                    → CustomerReferralController@myReferrals (customer_portal.referral)
GET  /customer/referral-rewards             → CustomerReferralController@myRewards (customer_portal.referral)
POST /customer/referrals/accept             → CustomerReferralController@accept (customer_portal.referral)
```

### Step 10: Referral Completion Hook in Existing Services

**Files:**
- `backend/app/Services/BookingService.php` — add call after status→completed
- `backend/app/Services/ReservationService.php` — add call after status→completed
- `backend/app/Services/ServiceOrderService.php` — add call after status→completed

**Details:** In each service's `updateStatus()` method, after updating status to `completed`, call:
```php
$this->referralService->checkAndCompleteReferral(
    $entity->customer_id, // This is User.id for bookings
    $entity->merchant_id,
    'booking', // or 'reservation' or 'service_order'
    $entity->id
);
```

**Knowledge note:** `Booking.customer_id` = User.id, not Customer.id. The `checkAndCompleteReferral()` method must resolve Customer from User.id internally.

### Step 11: Service Provider Bindings

**File:** `backend/app/Providers/RepositoryServiceProvider.php`

**Details:** Add 6 bindings:
- ReferralProgramRepositoryInterface → ReferralProgramRepository
- ReferralCodeRepositoryInterface → ReferralCodeRepository
- ReferralRepositoryInterface → ReferralRepository
- ReferralRewardRepositoryInterface → ReferralRewardRepository
- ReferralProgramServiceInterface → ReferralProgramService
- ReferralServiceInterface → ReferralService

### Step 12: Backend Tests

**Files:**
- `backend/tests/Feature/Api/V1/ReferralProgramTest.php` — merchant self-service + admin CRUD
- `backend/tests/Feature/Api/V1/CustomerReferralTest.php` — customer portal referral operations

**Test cases (ReferralProgramTest):**
- Merchant can create referral program
- Merchant can update referral program (upsert)
- Merchant can view own referral program
- Merchant can deactivate referral program
- Merchant can view referral list
- Merchant can view referral stats
- Branch merchant cannot create program (403)
- Branch merchant inherits org program
- Admin can view merchant's referral program
- Admin can update merchant's referral program
- Unauthenticated returns 401
- Missing permission returns 403
- Validation errors return 422

**Test cases (CustomerReferralTest):**
- Customer can generate referral code for merchant
- Customer gets same code on re-generate (idempotent)
- Customer cannot generate code for merchant without active program (404)
- Customer can accept referral code
- Customer cannot accept own referral code (422)
- Customer cannot accept expired code (422)
- Customer cannot be referred twice by same program (409)
- Referral completes on first completed booking → rewards created for both
- Referral completes on first completed reservation → rewards created
- Referral completes on first completed order → rewards created
- Second completed transaction doesn't duplicate rewards
- Customer can view referral codes
- Customer can view referrals sent
- Customer can view earned rewards
- Public code validation returns merchant info
- Invalid code returns 404

**Expected:** ~30 tests

### Step 13: Admin Frontend — Types + Service + Hook

**Files:**
- `frontend/types/api.ts` — add interfaces
- `frontend/services/referralService.ts` — API client
- `frontend/hooks/useReferrals.ts` — React Query hooks

**Types:**
```typescript
// Enums
type ReferralRewardType = 'percentage' | 'fixed';
type ReferralStatus = 'pending' | 'completed' | 'expired' | 'cancelled';
type ReferralRewardStatus = 'pending' | 'available' | 'redeemed' | 'expired';
type ReferralRewardRole = 'referrer' | 'referee';

// Models
interface ReferralProgram { id, merchant_id, name, description, referrer_reward_type, referrer_reward_value, referee_reward_type, referee_reward_value, max_referrals_per_customer, code_expiry_days, reward_expiry_days, is_active, starts_at, ends_at, is_inherited?, created_at, updated_at }
interface ReferralCode { id, referral_program_id, customer_id, code, uses_count, max_uses, expires_at, is_active, customer?, referral_program?, created_at }
interface Referral { id, referral_code_id, referral_program_id, referrer_customer_id, referee_customer_id, status, completed_at, qualifying_type, qualifying_id, referrer_customer?, referee_customer?, rewards?, created_at }
interface ReferralReward { id, referral_id, customer_id, reward_type, reward_value, role, status, redeemed_at, expires_at, customer?, referral?, created_at }
interface ReferralStats { total_referrals, completed_referrals, pending_referrals, conversion_rate, top_referrers: { customer: Customer, count: number }[] }

// Requests
interface CreateReferralProgramRequest { name, description?, referrer_reward_type, referrer_reward_value, referee_reward_type, referee_reward_value, max_referrals_per_customer?, code_expiry_days, reward_expiry_days?, starts_at?, ends_at? }
```

**Service methods:**
- `getMyReferralProgram()` → GET /auth/merchant/referral-program
- `upsertReferralProgram(data)` → POST /auth/merchant/referral-program
- `deactivateReferralProgram()` → DELETE /auth/merchant/referral-program
- `getMerchantReferrals(params)` → GET /auth/merchant/referrals
- `getReferralStats()` → GET /auth/merchant/referral-stats

**Hooks:**
- `useMyReferralProgram()` — query key: `['referral-program']`
- `useUpsertReferralProgram()` — invalidates `['referral-program']`
- `useDeactivateReferralProgram()` — invalidates `['referral-program']`
- `useMerchantReferrals(params)` — query key: `['referrals', params]`
- `useReferralStats()` — query key: `['referral-stats']`

### Step 14: Admin Frontend — Pages + Components

**Files:**
- `frontend/app/(system)/(my-store)/my-store/referrals/page.tsx` — main page (3-tab layout like loyalty)
- `frontend/app/(system)/(my-store)/my-store/referrals/referral-program-form.tsx` — program setup form
- `frontend/app/(system)/(my-store)/my-store/referrals/referral-list.tsx` — referrals list with status filters
- `frontend/app/(system)/(my-store)/my-store/referrals/referral-stats.tsx` — stats dashboard

**Details:**
- 3-tab layout: "Program Setup" | "Referrals" (disabled until program exists) | "Stats" (disabled until program exists)
- Program form: name, description, reward config (type + value for each side), limits, expiry
- Referral list: paginated table with referrer name, referee name, status badge, date, qualifying transaction link
- Stats: total/completed/pending counts, conversion rate percentage, top referrers list

**Sidebar:** Add "Referrals" item in my-store section (icon: UserPlus or Share2, `requiresActiveMerchant`)

### Step 15: Customer Portal Frontend — Types + Service + Hook

**Files:**
- `frontend-customer-portal/types/api.ts` — add interfaces (mirror admin types)
- `frontend-customer-portal/services/referralService.ts` — API client
- `frontend-customer-portal/hooks/useReferrals.ts` — React Query hooks

**Service methods:**
- `generateReferralCode(merchantId)` → POST /customer/referrals/generate/{merchant}
- `getMyReferralCodes()` → GET /customer/referral-codes
- `getMyReferrals()` → GET /customer/referrals
- `getMyReferralRewards(params)` → GET /customer/referral-rewards
- `acceptReferral(code)` → POST /customer/referrals/accept
- `validateReferralCode(code)` → GET /storefront/referral/{code}

**Hooks:**
- `useGenerateReferralCode()` — mutation, invalidates `['customer', 'referral-codes']`
- `useMyReferralCodes()` — query key: `['customer', 'referral-codes']`
- `useMyReferrals()` — query key: `['customer', 'referrals']`
- `useMyReferralRewards(params)` — query key: `['customer', 'referral-rewards', params]`
- `useAcceptReferral()` — mutation, invalidates referral queries
- `useValidateReferralCode(code)` — query key: `['referral-code', code]`

### Step 16: Customer Portal Frontend — Pages + Components

**Files:**
- `frontend-customer-portal/app/(customer)/referrals/page.tsx` — my referrals dashboard
- `frontend-customer-portal/components/referral/referral-code-card.tsx` — code display with copy + share
- `frontend-customer-portal/components/referral/referral-list.tsx` — people I've referred
- `frontend-customer-portal/components/referral/reward-list.tsx` — my earned rewards
- `frontend-customer-portal/app/(storefront)/referral/[code]/page.tsx` — public referral landing page

**Details:**
- Dashboard: 3 sections — My Codes, My Referrals, My Rewards
- Code card: displays code, copy button, share link (merchant storefront URL with ?ref=CODE), uses count
- Referral list: referee name, status badge, date, qualifying transaction type
- Reward list: reward type/value, status badge, earned date, expiry
- Public landing page: validates code, shows merchant info + referral offer, CTA to register/book

**Nav:** Add "Referrals" in customer nav (icon: UserPlus or Share2)

### Step 17: Merchant Storefront Integration

**Files:**
- `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx` — add referral code display/generate

**Details:** On merchant detail page, if merchant has active referral program and user is authenticated customer:
- Show "Refer a Friend" section with generate/view code button
- Display referral program reward info ("Earn 10% off when you refer a friend!")

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Race condition on code generation | Low | Unique DB constraint + retry on collision |
| Duplicate referral completion | Medium | Unique constraint `[referral_program_id, referee_customer_id]` + check in service |
| customer_id FK confusion (User vs Customer) | High | Document clearly, resolve Customer from User.id in service layer |
| Branch merchant creates program | Low | Check parent_id in service, throw 403 (same as loyalty) |
| Expired rewards accumulate | Low | Add scheduled command later to mark expired rewards |

## Testing Strategy

- [ ] 30+ backend Pest tests covering program CRUD, code generation, referral acceptance, completion trigger, reward creation, edge cases
- [ ] TypeScript compilation passes for both frontends
- [ ] Lint passes for both frontends
- [ ] Run migrations successfully
- [ ] Manual flow: merchant creates program → customer generates code → referee accepts → referee books → both get rewards

## Open Questions

- [ ] Should referral code be visible on merchant storefront page for all authenticated customers, or only after explicit "generate code" action?
- [ ] Future: Referral tiers (5 referrals = better rewards) — deferred
- [ ] Future: Actual discount redemption at checkout — deferred to Phase 2
