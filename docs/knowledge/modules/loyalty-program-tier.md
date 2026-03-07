# Module: LoyaltyProgramTier

## Model

- **File:** `backend/app/Models/LoyaltyProgramTier.php`
- **Table:** `loyalty_program_tiers`
- **Fillable:** `loyalty_program_id`, `required_stamps`, `reward_type`, `reward_value`, `reward_product_id`, `reward_description`, `sort_order`
- **Relationships:**
  - `loyaltyProgram()` BelongsTo `LoyaltyProgram`
  - `rewardProduct()` BelongsTo `Service` (via `reward_product_id`)
- **Casts:**
  - `required_stamps` => `integer`
  - `reward_value` => `decimal:2`
  - `sort_order` => `integer`

## Migration

- **File:** `database/migrations/2026_03_04_100000_create_loyalty_program_tiers_and_refactor_rewards.php`
- **Key columns:**
  - `id` bigint auto-increment
  - `loyalty_program_id` FK to `loyalty_programs`, cascadeOnDelete
  - `required_stamps` unsignedInteger
  - `reward_type` enum(`free_product`, `discount_percentage`, `discount_fixed`)
  - `reward_value` decimal(10,2) nullable
  - `reward_product_id` FK to `services`, nullable, nullOnDelete
  - `reward_description` string nullable
  - `sort_order` unsignedInteger default 0
  - `timestamps`
- **Additional migration effects:**
  - Migrates existing reward data from `loyalty_programs` table into `loyalty_program_tiers`
  - Adds `cycle_number` (default 1) to `loyalty_cards`
  - Adds `loyalty_program_tier_id` FK and `cycle_number` to `loyalty_rewards`
  - Drops `reward_type`, `reward_value`, `reward_product_id`, `reward_description` from `loyalty_programs`

## Repository

No dedicated repository. LoyaltyProgramTier is managed directly via Eloquent in `LoyaltyProgramService` and `LoyaltyService`.

## Service

Tier management is split across two services:

### LoyaltyProgramService (CRUD/sync)

- **File:** `backend/app/Services/LoyaltyProgramService.php`
- **Interface:** `backend/app/Services/Contracts/LoyaltyProgramServiceInterface.php`
- **Key methods:**
  - `createOrUpdateLoyaltyProgram(merchantId, data, tiers)` -- creates/updates program and syncs tiers
  - `updateAdminLoyaltyProgram(merchantId, data, tiers)` -- admin variant
  - `syncTiers(program, tiers)` (private) -- delete-and-recreate pattern; assigns `sort_order` from array index
- **Business rules:**
  - Branch merchants (`parent_id` set) cannot manage loyalty programs (403)
  - Tier sync is all-or-nothing: existing tiers are deleted and replaced
  - Tiers are loaded eagerly with `rewardProduct` relationship

### LoyaltyService (reward unlocking)

- **File:** `backend/app/Services/LoyaltyService.php`
- **Interface:** `backend/app/Services/Contracts/LoyaltyServiceInterface.php`
- **Key methods:**
  - `checkAndUnlockTierRewards(card, program)` (private) -- iterates tiers ordered by `required_stamps`, unlocks rewards for any tier where `current_stamps >= required_stamps` and not already earned in the current cycle
  - `unlockTierReward(card, program, tier)` (private) -- creates a `LoyaltyReward` from tier data with `cycle_number` tracking
- **Business rules:**
  - Tier rewards are cycle-aware: duplicate check uses `(loyalty_card_id, loyalty_program_tier_id, cycle_number)` tuple
  - When `current_stamps >= program.required_stamps`, stamps reset to 0 and `cycle_number` increments
  - Multiple tier rewards can unlock in a single stamp event (e.g., mid-tier at 5 and final tier at 10)

## Controller

Tiers are managed through `LoyaltyProgramController`:

- **File:** `backend/app/Http/Controllers/Api/V1/LoyaltyProgramController.php`
- **Endpoints:**
  - `POST /api/v1/auth/merchant/loyalty-program` -- create/update program with tiers (self-service)
  - `GET /api/v1/auth/merchant/loyalty-program` -- view program with tiers
  - `PUT /api/v1/merchants/{merchant}/loyalty-program` -- admin update with tiers
  - `GET /api/v1/merchants/{merchant}/loyalty-program` -- admin view with tiers

Tiers are passed as a nested `tiers[]` array in the request body and returned as a nested array in `LoyaltyProgramResource`.

## Form Requests

- **Files:**
  - `backend/app/Http/Requests/Api/V1/Loyalty/CreateLoyaltyProgramRequest.php`
  - `backend/app/Http/Requests/Api/V1/Loyalty/UpdateLoyaltyProgramRequest.php`
- **Key validation rules (tier-specific):**
  - `tiers` -- `required|array|min:1` on create; `sometimes|array|min:1` on update
  - `tiers.*.required_stamps` -- `required|integer|min:1|max:100`
  - `tiers.*.reward_type` -- `required|in:free_product,discount_percentage,discount_fixed`
  - `tiers.*.reward_value` -- `nullable|numeric|min:0`
  - `tiers.*.reward_product_id` -- `nullable|integer|exists:services,id`
  - `tiers.*.reward_description` -- `nullable|string|max:255`

## Resource

Tiers are rendered inline within `LoyaltyProgramResource`:

- **File:** `backend/app/Http/Resources/Api/V1/LoyaltyProgramResource.php`
- **Output fields (tier sub-object):**
  - `id`, `required_stamps`, `reward_type`, `reward_value`, `reward_product_id`, `reward_description`
  - `reward_product` -- nested object (`id`, `name`, `price`) when `rewardProduct` relation is loaded

## DTO

No dedicated DTO. Tier data is passed as a raw array through the `tiers` parameter in service methods.

## Factory

- **File:** `backend/database/factories/LoyaltyProgramTierFactory.php`
- **States:** `freeProduct()`, `discountPercentage(float)`, `discountFixed(float)`

## Routes

Tiers are nested within loyalty program routes (no standalone tier routes):

```
POST   /api/v1/auth/merchant/loyalty-program          (self-service create/update with tiers)
GET    /api/v1/auth/merchant/loyalty-program           (self-service view with tiers)
DELETE /api/v1/auth/merchant/loyalty-program           (deactivate program)
GET    /api/v1/merchants/{merchant}/loyalty-program    (admin view with tiers)
PUT    /api/v1/merchants/{merchant}/loyalty-program    (admin update with tiers)
```

## Permissions

Tiers share the loyalty program permissions:
- `loyalty_programs.view` -- view program with tiers
- `loyalty_programs.create` -- create program with tiers
- `loyalty_programs.update` -- update program with tiers
- `loyalty_programs.delete` -- deactivate program

Assigned to roles: super-admin, admin (all), manager (view only), merchant (all), branch-merchant (view only).

## Tests

Tier-specific test coverage is embedded in:

- **File:** `tests/Feature/Api/V1/LoyaltyProgramTest.php`
  - Can create a loyalty program with tiers
  - Can create a discount percentage tier
  - Can view my loyalty program with tiers
  - Updates existing program and tiers on second create (delete-and-recreate)
  - Validates tiers must have at least one entry
  - Validates tier reward_type enum
  - Admin can view merchant loyalty program with tiers
  - Admin can update merchant loyalty program with tiers
  - Branch sees parent program with is_inherited true (includes tiers)
  - Branch cannot create a loyalty program (403)

- **File:** `tests/Feature/Api/V1/LoyaltyTest.php`
  - Bonus stamp triggers reward when threshold reached (tier-based)
  - Bonus stamp triggers multiple tier rewards
  - Does not duplicate tier rewards in same cycle

- **File:** `tests/Feature/Api/V1/CustomerLoyaltyTest.php`
  - Reaching threshold unlocks reward and resets stamps (tier-based)

## Gotchas / Notes

- **Refactoring migration:** The tier migration is a refactoring of the original single-reward-per-program design. It migrates existing data from `loyalty_programs` to `loyalty_program_tiers` and drops the old reward columns. This migration is not idempotent.
- **No standalone CRUD:** Tiers have no independent API endpoints. They are always managed as nested data within the loyalty program create/update flow.
- **Delete-and-recreate sync:** `syncTiers()` deletes all existing tiers and recreates them. This means tier IDs change on every update. Any `LoyaltyReward` records referencing old `loyalty_program_tier_id` values will have that FK set to NULL (due to `nullOnDelete`).
- **Cycle-aware deduplication:** The reward unlock logic uses `(card_id, tier_id, cycle_number)` to prevent awarding the same tier reward twice in one cycle. When the full stamp threshold is reached, `current_stamps` resets to 0 and `cycle_number` increments, allowing tiers to be earned again in the next cycle.
- **reward_product_id FK:** Points to the `services` table, not a dedicated products table. This means the reward product must be an existing service entity.
