# Loyalty Reward Module

## Overview
Loyalty rewards are automatically generated when a customer reaches the stamp threshold on their loyalty card. Each reward records its type (free product, percentage discount, or fixed discount), value, expiry, and redemption state. Rewards are tied to a `LoyaltyCard` and `LoyaltyProgram`, and can be polymorphically linked to the entity they were redeemed against (booking, reservation, or service order via `redeemed_on` morph).

## Model
- **Path**: `backend/app/Models/LoyaltyReward.php`
- **Table**: `loyalty_rewards`
- **Fillable**: `loyalty_card_id`, `loyalty_program_id`, `reward_type`, `reward_value`, `reward_product_id`, `reward_description`, `status`, `earned_at`, `expires_at`, `redeemed_at`, `redeemed_on_type`, `redeemed_on_id`
- **Defaults** (`$attributes`): `status='available'`
- **Casts**: `reward_value` -> decimal:2, `earned_at` -> datetime, `expires_at` -> datetime, `redeemed_at` -> datetime
- **Relationships**:
  - `loyaltyCard()` -> BelongsTo -> `LoyaltyCard`
  - `loyaltyProgram()` -> BelongsTo -> `LoyaltyProgram`
  - `rewardProduct()` -> BelongsTo -> `Service` (FK: `reward_product_id` -> `services.id`)
  - `redeemedOn()` -> MorphTo (polymorphic: `redeemed_on_type` / `redeemed_on_id`)
- **Helper methods**:
  - `isAvailable(): bool` -- returns true only if status is `available` AND not past `expires_at`
- **Traits**: HasFactory

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller (merchant) | `backend/app/Http/Controllers/Api/V1/LoyaltyController.php` | Rewards returned embedded in loyalty card detail and stamp award responses (reward_unlocked) |
| Controller (customer) | `backend/app/Http/Controllers/Api/V1/CustomerLoyaltyController.php` | `rewards()` lists available rewards; reward data in scan response |
| Service | `backend/app/Services/LoyaltyService.php` | `unlockReward()` (private), `getMyAvailableRewards()`, `redeemReward()`, `markRewardRedeemed()` |
| Service Interface | `backend/app/Services/Contracts/LoyaltyServiceInterface.php` | `getMyAvailableRewards()`, `redeemReward()`, `markRewardRedeemed()` |
| Repository | `backend/app/Repositories/LoyaltyRewardRepository.php` | Extends BaseRepository (no custom methods) |
| Repository Interface | `backend/app/Repositories/Contracts/LoyaltyRewardRepositoryInterface.php` | Extends BaseRepositoryInterface |
| Resource | `backend/app/Http/Resources/Api/V1/LoyaltyRewardResource.php` | Returns id, reward_type, reward_value, reward_description, status, earned_at, expires_at, redeemed_at, plus whenLoaded for rewardProduct and loyaltyCard.merchant |
| Factory | `backend/database/factories/LoyaltyRewardFactory.php` | States: `available()`, `redeemed()`, `expiredReward()`, `freeProduct()`, `discountFixed($amount)` |
| Provider Binding | `backend/app/Providers/RepositoryServiceProvider.php` | `LoyaltyRewardRepositoryInterface` -> `LoyaltyRewardRepository`; `LoyaltyServiceInterface` -> `LoyaltyService` |

## Routes
LoyaltyReward does not have its own dedicated CRUD routes. Rewards are accessed through the broader loyalty endpoints:

| Method | URI | Action | Auth / Permission |
|--------|-----|--------|-------------------|
| GET | `customer/loyalty-rewards` | List available (unredeemed, unexpired) rewards for authenticated customer | auth + `customer_portal.view_loyalty` |
| GET | `customer/loyalty-cards/{id}` | Card detail includes `rewards` relation | auth + `customer_portal.view_loyalty` |
| GET | `auth/merchant/loyalty-cards/{id}` | Card detail includes `rewards` relation | auth (merchant self-service) |
| POST | `customer/loyalty/scan` | Scan QR; response includes `reward_unlocked` if threshold reached | auth + `customer_portal.scan_loyalty` |
| POST | `auth/merchant/loyalty-cards/{id}/stamp` | Award bonus stamp; response includes `reward_unlocked` if threshold reached | auth (merchant self-service) |

## Business Rules

### Reward Generation (Unlocking)
- Rewards are created automatically by the private `LoyaltyService::unlockReward()` method, never via direct API call
- Triggered when `current_stamps >= program.required_stamps` after a stamp is earned (QR scan or bonus stamp)
- The reward copies its configuration from the `LoyaltyProgram` at creation time: `reward_type`, `reward_value`, `reward_product_id`, `reward_description`
- If `program.reward_expiry_days` is set, `expires_at` is calculated as `now() + reward_expiry_days`; otherwise null (no expiry)
- After unlock: `current_stamps` is reset to 0 and `total_rewards_earned` is incremented on the card

### Reward Types (enum)
- `free_product` -- free service/product (`reward_value` is null, `reward_product_id` references a `Service`)
- `discount_percentage` -- percentage off (`reward_value` is the percentage amount, e.g. 10.00 for 10%)
- `discount_fixed` -- fixed amount off (`reward_value` is the currency amount)

### Reward Status Lifecycle
- `available` -- default; reward is earned but not yet redeemed
- `redeemed` -- reward has been used; `redeemed_at`, `redeemed_on_type`, `redeemed_on_id` are populated
- `expired` -- reward has passed its `expires_at` date (factory state; note that `isAvailable()` also checks `expires_at` for `available` status rewards)

### Retrieval & Filtering
- `getMyAvailableRewards()` filters by: `status=available` AND (`expires_at IS NULL OR expires_at > now()`) AND card belongs to authenticated customer
- Returns an unpaginated `Collection` (not paginated), ordered by `earned_at` desc
- Loads `loyaltyCard.merchant` and `rewardProduct` relations

### Redemption
- `redeemReward($rewardId, $userId)` validates ownership (card belongs to customer) and availability via `isAvailable()`. Throws 409 if unavailable
- `markRewardRedeemed($rewardId, $redeemableType, $redeemableId)` sets `status=redeemed`, `redeemed_at=now()`, and the polymorphic `redeemed_on` fields. Increments `total_rewards_redeemed` on the card

### CRITICAL: customer_id FK Distinction
- `LoyaltyCard.customer_id` is a FK to the `customers` table (not `users`)
- `LoyaltyReward` belongs to `LoyaltyCard`, so customer scoping goes through the card: `whereHas('loyaltyCard', fn($q) => $q->where('customer_id', $customer->id))`
- `LoyaltyService` resolves the Customer record via `Customer::where('user_id', $userId)->firstOrFail()` before querying

## Database
| Type | File |
|------|------|
| Migration | `backend/database/migrations/2026_03_03_100500_create_loyalty_rewards_table.php` |
| Factory | `backend/database/factories/LoyaltyRewardFactory.php` |

### Schema
| Column | Type | Notes |
|--------|------|-------|
| id | bigint (PK) | auto-increment |
| loyalty_card_id | FK -> loyalty_cards | cascadeOnDelete |
| loyalty_program_id | FK -> loyalty_programs | cascadeOnDelete |
| reward_type | enum | `free_product`, `discount_percentage`, `discount_fixed` |
| reward_value | decimal(10,2) | nullable; percentage or fixed amount |
| reward_product_id | FK -> services | nullable, nullOnDelete; for `free_product` type |
| reward_description | string | nullable; human-readable description |
| status | enum | `available`, `redeemed`, `expired`; default `available` |
| earned_at | timestamp | when the reward was unlocked |
| expires_at | timestamp | nullable; when the reward expires |
| redeemed_at | timestamp | nullable; when the reward was redeemed |
| redeemed_on_type | string | nullable; morph type (e.g. booking, reservation, service_order) |
| redeemed_on_id | unsignedBigInteger | nullable; morph ID |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes**: `loyalty_card_id`, `status`, `[redeemed_on_type, redeemed_on_id]`

## Admin Frontend
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/loyaltyService.ts` | Rewards appear in card detail response (via `getLoyaltyCard`); no dedicated reward endpoint |
| Hook | `frontend/hooks/useLoyalty.ts` | `useLoyaltyCard(cardId)` returns card with embedded rewards |
| Types | `frontend/types/api.ts` | `LoyaltyReward` interface, `LoyaltyRewardType`, `LoyaltyRewardStatus` |
| Card detail sheet | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-card-detail-sheet.tsx` | Shows reward history within card detail |
| Loyalty page | `frontend/app/(system)/(my-store)/my-store/loyalty/page.tsx` | Loyalty management page (program, QR, cards) |

## Customer Portal Frontend
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend-customer-portal/services/loyaltyService.ts` | `getMyRewards(params)` calls `GET /customer/loyalty-rewards` |
| Hook | `frontend-customer-portal/hooks/useLoyalty.ts` | `useMyLoyaltyRewards(params)`, `useLoyaltyCard(id)` (card includes rewards), `useScanLoyaltyQr()` (invalidates rewards on scan) |
| Types | `frontend-customer-portal/types/api.ts` | `LoyaltyReward`, `ScanResult` (includes `reward_unlocked`), `LoyaltyRewardQueryParams` |
| Stamp card component | `frontend-customer-portal/components/loyalty/stamp-card.tsx` | Visual stamp card display |
| Reward selector | `frontend-customer-portal/components/loyalty/reward-selector.tsx` | Component to select available rewards for redemption |
| Loyalty cards page | `frontend-customer-portal/app/(customer)/loyalty/page.tsx` | Customer's loyalty cards list |
| Card detail page | `frontend-customer-portal/app/(customer)/loyalty/[id]/page.tsx` | Card detail with stamps + rewards |
| QR scan page | `frontend-customer-portal/app/(storefront)/loyalty/scan/[token]/page.tsx` | Scans QR code token and shows result |

## Permissions
| Permission | Roles | Notes |
|------------|-------|-------|
| `customer_portal.view_loyalty` | customer | View own loyalty cards and rewards |
| `customer_portal.scan_loyalty` | customer | Scan QR code to earn stamps |

Merchant-side loyalty routes (generating QR, viewing cards, awarding stamps) are under the self-service `auth/merchant/` prefix and do not use separate permission middleware -- access is gated by merchant role and active merchant status.

## Tests
| Type | File | Relevant Sections |
|------|------|-------------------|
| Feature (customer scanning + rewards) | `backend/tests/Feature/Api/V1/CustomerLoyaltyTest.php` | "Customer Loyalty Rewards" describe block: lists available rewards, excludes expired/redeemed, isolates by customer |
| Feature (merchant card/stamp management) | `backend/tests/Feature/Api/V1/LoyaltyTest.php` | "Merchant Loyalty Card Management" describe block: bonus stamp triggers reward at threshold, reward_unlocked in response |

## Notes
- Reward is never created directly via API -- it is always a side effect of reaching the stamp threshold
- The `reward_unlocked` field in scan/stamp responses is either a `LoyaltyReward` object or `null` (no reward earned)
- Admin frontend query keys: `['loyalty-cards', cardId]` for card detail (rewards embedded)
- Customer portal query keys: `['customer', 'loyalty-rewards', params]` for available rewards, `['customer', 'loyalty-cards', id]` for card detail
- `useScanLoyaltyQr` mutation invalidates both `['customer', 'loyalty-cards']` and `['customer', 'loyalty-rewards']` on success to keep reward data fresh after a scan
- The `redeemed_on` morph is not yet wired to a specific booking/reservation/order checkout flow in the current codebase -- `redeemReward` validates availability and `markRewardRedeemed` records the redemption, but the integration with checkout is pending
