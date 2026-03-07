# Module: ReferralReward

## Model

- **File:** `backend/app/Models/ReferralReward.php`
- **Table:** `referral_rewards`
- **Fillable:** referral_id, customer_id, reward_type, reward_value, role, status, redeemed_at, redeemed_on_type, redeemed_on_id, expires_at
- **Relationships:**
  - `referral()` BelongsTo Referral
  - `customer()` BelongsTo Customer
  - `redeemedOn()` MorphTo (polymorphic: redeemed_on_type + redeemed_on_id)
- **Casts:** reward_value (decimal:2), redeemed_at (datetime), expires_at (datetime)
- **Defaults ($attributes):** status = 'pending'
- **Custom methods:**
  - `isAvailable(): bool` -- Returns true only if status is 'available' AND not expired (expires_at is null or in the future)

## Migration

- **File:** `database/migrations/2026_03_04_100300_create_referral_rewards_table.php`
- **Key columns:**
  - `id` bigint PK
  - `referral_id` FK (constrained, cascadeOnDelete)
  - `customer_id` FK (constrained to customers, cascadeOnDelete) -- the reward recipient
  - `reward_type` enum('percentage', 'fixed')
  - `reward_value` decimal(10,2)
  - `role` enum('referrer', 'referee') -- which party earned this reward
  - `status` enum('pending', 'available', 'redeemed', 'expired'), default 'pending'
  - `redeemed_at` timestamp, nullable
  - `redeemed_on_type` string, nullable -- polymorphic type of the transaction where reward was redeemed
  - `redeemed_on_id` unsigned bigint, nullable -- polymorphic ID
  - `expires_at` timestamp, nullable
- **Indexes:** customer_id, referral_id

## Factory

- **File:** `database/factories/ReferralRewardFactory.php`
- **States:** `available()` (status=available), `redeemed()` (status=redeemed, redeemed_at=now), `expired()` (status=expired, expires_at=now-1day)

## Repository

- **File:** `backend/app/Repositories/ReferralRewardRepository.php`
- **Interface:** `backend/app/Repositories/Contracts/ReferralRewardRepositoryInterface.php`
- Extends BaseRepository, no custom methods

## Service

ReferralReward has no dedicated service. It is managed by **ReferralService** (`backend/app/Services/ReferralService.php`).

- **Key methods (from ReferralService):**
  - `getMyReferralRewards(int $userId, array $filters)` -- Paginated rewards list for a customer using Spatie QueryBuilder. Filters: status (exact), role (exact). Sorts: created_at, status, expires_at. Eager loads referral.referralProgram.merchant
  - Rewards are **created** inside `checkAndCompleteReferral()` -- two rewards per completed referral (one for referrer, one for referee), both with status 'available'

## Controller

ReferralReward endpoint is on **CustomerReferralController** (`backend/app/Http/Controllers/Api/V1/CustomerReferralController.php`):

- `GET /customer/referral-rewards` -- myRewards() -- Paginated list of customer's referral rewards

## Form Requests

No dedicated form request for rewards. The endpoint is a GET with optional query filters.

## Resource

- **File:** `backend/app/Http/Resources/Api/V1/ReferralRewardResource.php`
- **Output fields:** id, referral_id, customer_id, reward_type, reward_value, role, status, redeemed_at, expires_at, customer (whenLoaded, with user name), referral (whenLoaded, with id and status), created_at

## DTO

No dedicated DTO. Rewards are created directly in the service.

## Routes

```
# Customer portal (auth + verified + onboarded + permission:customer_portal.referral)
GET    /api/v1/customer/referral-rewards     -- List my referral rewards (paginated)
```

## Permissions

- `customer_portal.referral` -- Required for viewing referral rewards

## Tests

- **File:** `tests/Feature/Api/V1/ReferralProgramTest.php` (shared test file)
- **Coverage:**
  - Customer can view their referral rewards (1 test in Customer Referral Routes section)
  - Referral completion creates 2 rewards (referrer + referee) with correct types and roles (verified in Referral Completion Hook test)

## Status Workflow

```
pending   -> available   (set when referral completes via checkAndCompleteReferral -- rewards are created directly as 'available')
available -> redeemed    (factory state exists, but no redemption endpoint in current code)
available -> expired     (factory state exists, but no automated expiry logic in current code)
```

Note: In the current implementation, rewards are created with status `available` directly (skipping `pending`). The `pending` default in $attributes exists for potential future use where rewards might need approval before becoming available.

## Reward Creation Flow

When `ReferralService::checkAndCompleteReferral()` fires:
1. Marks the Referral as `completed` with qualifying transaction details
2. Creates **referrer reward**: customer_id = referrer_customer_id, type/value from program's referrer_reward_type/value, role = 'referrer', status = 'available'
3. Creates **referee reward**: customer_id = referee_customer_id, type/value from program's referee_reward_type/value, role = 'referee', status = 'available'
4. Both rewards get `expires_at` calculated from `program.reward_expiry_days` (null if program has no expiry)

## Gotchas / Notes

- **customer_id is Customer.id** (FK to customers table), not User.id
- Two rewards are always created per completed referral -- one for each party (referrer and referee)
- The `redeemed_on_type` / `redeemed_on_id` fields are a **polymorphic relationship** for tracking what transaction the reward was applied to, but **no redemption endpoint exists yet** -- this is scaffolding for future coupon/discount integration
- The `isAvailable()` model method checks both status and expiry, useful for future redemption logic
- `reward_type` can be 'percentage' or 'fixed', mirroring the program's configuration -- interpretation of how to apply these rewards is left to future redemption logic
- The reward_value is stored as decimal(10,2), matching the program's reward value at the time of creation (snapshot, not a live reference)
- Rewards inherit expiry from the program's `reward_expiry_days` setting, calculated from the moment of completion
