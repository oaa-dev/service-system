# Module: Referral

## Model

- **File:** `backend/app/Models/Referral.php`
- **Table:** `referrals`
- **Fillable:** referral_code_id, referral_program_id, referrer_customer_id, referee_customer_id, status, completed_at, qualifying_type, qualifying_id
- **Relationships:**
  - `referralCode()` BelongsTo ReferralCode
  - `referralProgram()` BelongsTo ReferralProgram
  - `referrerCustomer()` BelongsTo Customer (FK: referrer_customer_id)
  - `refereeCustomer()` BelongsTo Customer (FK: referee_customer_id)
  - `qualifyingTransaction()` MorphTo (polymorphic: qualifying_type + qualifying_id)
  - `rewards()` HasMany ReferralReward
- **Casts:** completed_at (datetime)
- **Defaults ($attributes):** status = 'pending'

## Migration

- **File:** `database/migrations/2026_03_04_100200_create_referrals_table.php`
- **Key columns:**
  - `id` bigint PK
  - `referral_code_id` FK (constrained, cascadeOnDelete)
  - `referral_program_id` FK (constrained, cascadeOnDelete)
  - `referrer_customer_id` FK (constrained to customers, cascadeOnDelete)
  - `referee_customer_id` FK (constrained to customers, cascadeOnDelete)
  - `status` enum('pending', 'completed', 'expired', 'cancelled'), default 'pending'
  - `completed_at` timestamp, nullable
  - `qualifying_type` string, nullable -- polymorphic type (e.g., booking, reservation, service_order)
  - `qualifying_id` unsigned bigint, nullable -- polymorphic ID
- **Unique constraints:** `[referral_program_id, referee_customer_id]` -- one referral per referee per program
- **Indexes:** referrer_customer_id, referee_customer_id

## Factory

- **File:** `database/factories/ReferralFactory.php`
- **States:** `completed()` (status=completed, completed_at=now), `expired()`, `cancelled()`

## Repository

- **File:** `backend/app/Repositories/ReferralRepository.php`
- **Interface:** `backend/app/Repositories/Contracts/ReferralRepositoryInterface.php`
- Extends BaseRepository, no custom methods

## Service

Referral has no dedicated service. It is managed by **ReferralService** (`backend/app/Services/ReferralService.php`).

- **Key methods (from ReferralService):**
  - `acceptReferral(int $userId, string $code)` -- Creates a pending referral linking referrer and referee. Validates: code exists and is valid, program is active, not self-referral, not duplicate (409), max referrals per customer not exceeded. Increments code's uses_count in transaction
  - `checkAndCompleteReferral(int $userId, int $merchantId, string $transactionType, int $transactionId)` -- **Completion hook** called by BookingService, ReservationService, and ServiceOrderService when a transaction completes. Resolves Customer from User.id, finds pending referral for the merchant's program, marks as completed with qualifying transaction, and creates rewards for both referrer and referee
  - `getMyReferrals(int $userId)` -- Returns all referrals where the user is the referrer, with referee and program details

## Controller

Referral endpoints are split across two controllers:

**CustomerReferralController** (`backend/app/Http/Controllers/Api/V1/CustomerReferralController.php`):
- `POST /customer/referrals/accept` -- accept() -- Accept a referral code (creates pending referral)
- `GET /customer/referrals` -- myReferrals() -- List referrals where customer is the referrer

**ReferralProgramController** (`backend/app/Http/Controllers/Api/V1/ReferralProgramController.php`):
- `GET /auth/merchant/referrals` -- referrals() -- Merchant view of all referrals (paginated with filters)

## Form Requests

- **File:** `backend/app/Http/Requests/Api/V1/Referral/AcceptReferralRequest.php`
- **Rules:** code: required, string, size:8

## Resource

- **File:** `backend/app/Http/Resources/Api/V1/ReferralResource.php`
- **Output fields:** id, referral_code_id, referral_program_id, referrer_customer_id, referee_customer_id, status, completed_at, qualifying_type, qualifying_id, referrer_customer (whenLoaded, with user name), referee_customer (whenLoaded, with user name), rewards (whenLoaded, as ReferralRewardResource collection), created_at

## DTO

No dedicated DTO. Referrals are created directly in the service.

## Routes

```
# Customer portal (auth + verified + onboarded + permission:customer_portal.referral)
POST   /api/v1/customer/referrals/accept     -- Accept a referral code
GET    /api/v1/customer/referrals             -- List my referrals (as referrer)

# Merchant self-service (auth + verified + onboarded + merchant.active)
GET    /api/v1/auth/merchant/referrals        -- List all referrals for merchant's program(s)
```

## Permissions

- `customer_portal.referral` -- Required for customer referral operations
- Merchant self-service routes use merchant.active middleware (no explicit permission middleware)

## Tests

- **File:** `tests/Feature/Api/V1/ReferralProgramTest.php` (shared test file)
- **Coverage:**
  - **Customer Referral Routes:**
    - Customer can accept a referral code (creates referral, returns 201)
    - Customer cannot accept own referral code (422)
    - Customer cannot accept same program referral twice (409)
    - Customer can view their referrals
  - **Referral Completion Hook:**
    - Completes referral and creates rewards when booking completes (end-to-end test with BookingService status update)
  - **Max Referrals Per Customer:**
    - Enforces max_referrals_per_customer limit (422)
  - **Merchant CRUD:**
    - Can view merchant referrals list

## Status Workflow

```
pending -> completed   (via checkAndCompleteReferral when qualifying transaction completes)
pending -> expired     (factory state exists, but no automated expiry logic in code)
pending -> cancelled   (factory state exists, but no automated cancellation logic in code)
```

## Completion Hook Integration

The `checkAndCompleteReferral` method is called from three services:
- **BookingService** -- When booking status changes to `completed`
- **ReservationService** -- When reservation status changes to `checked_out`
- **ServiceOrderService** -- When order status changes to `completed`

Each passes `(customer_id, merchant_id, transactionType, transactionId)` where customer_id is **User.id** (not Customer.id). The service internally resolves to Customer.id.

## Gotchas / Notes

- **CRITICAL FK distinction:** `referrer_customer_id` and `referee_customer_id` are FKs to **customers.id** (Customer model), NOT users.id. But `checkAndCompleteReferral` receives User.id and resolves internally
- The `qualifying_type` and `qualifying_id` form a **polymorphic relationship** to the transaction that triggered completion (booking, reservation, or service_order)
- The unique constraint `[referral_program_id, referee_customer_id]` prevents a customer from being referred multiple times for the same program (409 Conflict)
- Self-referral is blocked (422) by comparing referralCode.customer_id with the accepting customer's ID
- `max_referrals_per_customer` limits how many people a single referrer can refer, not how many times a referee can be referred
- The `expired` and `cancelled` statuses exist in the enum but have no automated transitions -- they would need to be set manually or via a scheduled command
