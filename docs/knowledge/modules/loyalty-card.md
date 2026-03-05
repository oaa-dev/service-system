# Loyalty Card Module

## Overview
Loyalty cards track a customer's stamp progress with a specific merchant's loyalty program. Cards are auto-created on first QR scan, accumulate stamps (via QR scan or merchant bonus), and unlock rewards when the stamp threshold is reached. The card resets `current_stamps` to 0 on reward unlock while preserving lifetime counters (`total_stamps_earned`, `total_rewards_earned`, `total_rewards_redeemed`).

## Model
- **Path**: `backend/app/Models/LoyaltyCard.php`
- **Table**: `loyalty_cards`
- **Fillable**: `customer_id`, `merchant_id`, `loyalty_program_id`, `current_stamps`, `total_stamps_earned`, `total_rewards_earned`, `total_rewards_redeemed`, `last_stamp_at`
- **Defaults** (`$attributes`): `current_stamps=0`, `total_stamps_earned=0`, `total_rewards_earned=0`, `total_rewards_redeemed=0`
- **Casts**: `current_stamps` -> integer, `total_stamps_earned` -> integer, `total_rewards_earned` -> integer, `total_rewards_redeemed` -> integer, `last_stamp_at` -> datetime
- **Relationships**:
  - `customer()` -> BelongsTo -> `Customer` (FK: customer_id -> customers table, NOT users table)
  - `merchant()` -> BelongsTo -> `Merchant`
  - `loyaltyProgram()` -> BelongsTo -> `LoyaltyProgram`
  - `stamps()` -> HasMany -> `LoyaltyStamp`
  - `rewards()` -> HasMany -> `LoyaltyReward`
- **Traits**: HasFactory

## CRITICAL: customer_id FK Distinction
The `LoyaltyCard.customer_id` is a FK to the `customers` table (not `users`). The `LoyaltyService` resolves the Customer record via `Customer::where('user_id', $userId)->firstOrFail()` before creating/querying loyalty cards.

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller (merchant self-service) | `backend/app/Http/Controllers/Api/V1/LoyaltyController.php` | generateQr, index (cards list), show (card detail), awardStamp (bonus stamp) |
| Controller (customer portal) | `backend/app/Http/Controllers/Api/V1/CustomerLoyaltyController.php` | scan (QR), cards (my list), cardDetail, rewards (available) |
| Service | `backend/app/Services/LoyaltyService.php` | Shared service: QR generation, QR scanning, bonus stamp, card lists (merchant + customer), reward unlock/redeem/mark-redeemed |
| Service Interface | `backend/app/Services/Contracts/LoyaltyServiceInterface.php` | -- |
| Repository | `backend/app/Repositories/LoyaltyCardRepository.php` | Extends BaseRepository |
| Repository Interface | `backend/app/Repositories/Contracts/LoyaltyCardRepositoryInterface.php` | -- |
| FormRequest (QR generate) | `backend/app/Http/Requests/Api/V1/Loyalty/GenerateQrCodeRequest.php` | mode: required, in:single_use,daily |
| FormRequest (QR scan) | `backend/app/Http/Requests/Api/V1/Loyalty/ScanQrCodeRequest.php` | token: required, string, size:64 |
| FormRequest (bonus stamp) | `backend/app/Http/Requests/Api/V1/Loyalty/AwardBonusStampRequest.php` | notes: nullable, string, max:255 |
| Resource | `backend/app/Http/Resources/Api/V1/LoyaltyCardResource.php` | Includes whenLoaded: customer (id + user.name), merchant (id, name, slug, logo thumb), loyaltyProgram (full LoyaltyProgramResource), stamps (LoyaltyStampResource collection), rewards (LoyaltyRewardResource collection) |
| Provider Binding | `backend/app/Providers/RepositoryServiceProvider.php` | LoyaltyCardRepositoryInterface -> LoyaltyCardRepository; LoyaltyServiceInterface -> LoyaltyService |

## Routes
| Method | URI | Action | Auth / Permission |
|--------|-----|--------|-------------------|
| POST | `auth/merchant/loyalty/generate-qr` | generate QR code stamp token | auth + merchant self-service |
| GET | `auth/merchant/loyalty-cards` | list merchant's customer loyalty cards | auth + merchant self-service |
| GET | `auth/merchant/loyalty-cards/{id}` | view single loyalty card detail | auth + merchant self-service |
| POST | `auth/merchant/loyalty-cards/{id}/stamp` | award bonus stamp to card | auth + merchant self-service |
| POST | `customer/loyalty/scan` | scan QR code to earn stamp | auth + customer_portal.scan_loyalty |
| GET | `customer/loyalty-cards` | list my loyalty cards | auth + customer_portal.view_loyalty |
| GET | `customer/loyalty-cards/{id}` | view my loyalty card detail | auth + customer_portal.view_loyalty |
| GET | `customer/loyalty-rewards` | list my available rewards | auth + customer_portal.view_loyalty |

## Business Rules
- **Auto-creation**: Loyalty cards are created via `LoyaltyCard::firstOrCreate()` on first QR scan -- the card is linked to the customer and merchant with the active loyalty program.
- **Unique constraint**: `[customer_id, merchant_id]` -- one card per customer per merchant.
- **Stamp sources**: `qr_scan` (from scanning QR codes) and `bonus` (manually awarded by merchant).
- **QR modes**: `single_use` (expires in 2 minutes, one-time use with `is_used` flag) and `daily` (expires end of day, limits one stamp per customer per merchant per day, allows unlimited scans by different customers).
- **Daily QR duplicate check**: Verifies no existing `qr_scan` stamp earned today for the same merchant by the same customer. Returns 409 on duplicate.
- **Reward threshold**: When `current_stamps >= program.required_stamps`, the `unlockReward()` method creates a `LoyaltyReward` (status=available), resets `current_stamps` to 0, and increments `total_rewards_earned`.
- **Stamp expiry**: If `LoyaltyProgram.stamp_expiry_days` is set, stamps get an `expires_at` date.
- **Reward expiry**: If `LoyaltyProgram.reward_expiry_days` is set, rewards get an `expires_at` date.
- **Counter tracking**: `increment()` is used for `current_stamps`, `total_stamps_earned`; `last_stamp_at` is updated on each stamp. `total_rewards_redeemed` is incremented by `markRewardRedeemed()`.
- **Merchant scoping**: Merchant self-service card operations (list, show, awardStamp) all filter by the authenticated merchant's ID. Returns 404 for cards belonging to other merchants.
- **Customer scoping**: Customer card/reward queries resolve Customer via `Customer::where('user_id', $userId)` and then filter by `customer_id`.
- **Active program required**: QR generation, QR scanning, and bonus stamp all require an active loyalty program (`is_active = true`). Returns 404 if program is inactive.
- **QR expiry**: Expired QR codes return 410 Gone. Already-used single-use QR codes return 409 Conflict.
- **DB transactions**: `scanStampQR()` and `awardBonusStamp()` run inside `DB::transaction()`.

## Permissions
| Permission | Roles |
|------------|-------|
| `loyalty_cards.view` | admin, manager, merchant, branch-merchant |
| `loyalty_stamps.create` | admin, merchant, branch-merchant |
| `customer_portal.view_loyalty` | customer |
| `customer_portal.scan_loyalty` | customer |

## Database
| Type | File |
|------|------|
| Migration | `backend/database/migrations/2026_03_03_100100_create_loyalty_cards_table.php` |
| Factory | `backend/database/factories/LoyaltyCardFactory.php` |

### Migration Details
- `customer_id` FK -> customers (cascadeOnDelete)
- `merchant_id` FK -> merchants (cascadeOnDelete)
- `loyalty_program_id` FK -> loyalty_programs (cascadeOnDelete)
- `current_stamps` unsignedInteger default 0
- `total_stamps_earned` unsignedInteger default 0
- `total_rewards_earned` unsignedInteger default 0
- `total_rewards_redeemed` unsignedInteger default 0
- `last_stamp_at` timestamp nullable
- Unique index: `[customer_id, merchant_id]`
- Indexes: `merchant_id`, `loyalty_program_id`

### Factory States
- `withProgress(int $stamps = 5)` -- sets current_stamps, total_stamps_earned, and last_stamp_at
- `withRewards(int $earned = 1, int $redeemed = 0)` -- sets total_rewards_earned and total_rewards_redeemed

## Admin Frontend (Merchant Self-Service)
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/loyaltyService.ts` | getMyProgram, upsertProgram, deactivateProgram, generateQr, getLoyaltyCards(params), getLoyaltyCard(id), awardBonusStamp(cardId, data) |
| Hook | `frontend/hooks/useLoyalty.ts` | useMyLoyaltyProgram, useUpsertLoyaltyProgram, useDeactivateLoyaltyProgram, useGenerateLoyaltyQr, useLoyaltyCards(params), useLoyaltyCard(cardId), useAwardBonusStamp |
| Types | `frontend/types/api.ts` | LoyaltyCard, LoyaltyStamp, LoyaltyReward, LoyaltyStampQrCode, LoyaltyProgram, LoyaltyRewardType, LoyaltyStampSource, LoyaltyRewardStatus, LoyaltyQrMode, CreateLoyaltyProgramRequest, GenerateLoyaltyQrRequest, AwardBonusStampRequest, LoyaltyCardQueryParams |
| Page | `frontend/app/(system)/(my-store)/my-store/loyalty/page.tsx` | Main loyalty management page |
| Component | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-program-form.tsx` | Create/edit loyalty program form |
| Component | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-cards-list.tsx` | Paginated list of customer loyalty cards |
| Component | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-card-detail-sheet.tsx` | Card detail sheet with stamps + rewards history |
| Component | `frontend/app/(system)/(my-store)/my-store/loyalty/qr-generator.tsx` | QR code generation with mode selection and countdown timer |

## Customer Portal Frontend
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend-customer-portal/services/loyaltyService.ts` | scanQr(token), getMyCards(params), getCardById(id), getMyRewards(params) |
| Hook | `frontend-customer-portal/hooks/useLoyalty.ts` | useMyLoyaltyCards(params), useLoyaltyCard(id), useMyLoyaltyRewards(params), useScanLoyaltyQr |
| Types | `frontend-customer-portal/types/api.ts` | LoyaltyCard, LoyaltyStamp, LoyaltyReward, ScanResult, LoyaltyCardQueryParams, LoyaltyRewardQueryParams |
| Page | `frontend-customer-portal/app/(customer)/loyalty/page.tsx` | Customer loyalty dashboard with cards and rewards |
| Component | `frontend-customer-portal/components/loyalty/stamp-card.tsx` | Visual stamp card display showing progress toward reward |
| Component | `frontend-customer-portal/components/loyalty/reward-selector.tsx` | Reward selection/redemption interface |

## Tests
| Type | File | Test Count |
|------|------|------------|
| Feature (merchant QR + cards) | `backend/tests/Feature/Api/V1/LoyaltyTest.php` | 14 tests (QR generation: 5, card management: 9) |
| Feature (customer scanning + cards + rewards) | `backend/tests/Feature/Api/V1/CustomerLoyaltyTest.php` | 18 tests (QR scanning: 11, cards: 4, rewards: 3 -- includes data isolation) |

## Notes
- Admin query keys: `['loyalty-program']` (program), `['loyalty-cards', params]` (list), `['loyalty-cards', id]` (detail)
- Customer portal query keys: `['customer', 'loyalty-cards', params]` (list), `['customer', 'loyalty-cards', id]` (detail), `['customer', 'loyalty-rewards', params]` (rewards)
- `useScanLoyaltyQr` mutation invalidates both `['customer', 'loyalty-cards']` and `['customer', 'loyalty-rewards']` on success
- QR generation result is NOT cached in React Query -- managed via local component state with countdown timer behavior
- The `LoyaltyService` is a unified service handling both merchant-side and customer-side operations (no separate services)
- The `LoyaltyCardRepository` exists but the service mostly uses Eloquent directly with `LoyaltyCard::where(...)` for scoped queries
- Reward redemption (`markRewardRedeemed`) is designed to be called from other services (e.g., during booking/order checkout) to link the reward to a redeemable entity
