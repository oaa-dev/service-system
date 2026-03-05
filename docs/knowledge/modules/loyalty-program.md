# Loyalty Program Module

## Overview
Stamp-based loyalty program system for merchants. Merchants configure a single active program (name, required stamps, reward type), generate QR codes for customers to scan, and manage customer loyalty cards. Customers earn stamps via QR scans or manual bonus awards, automatically unlocking rewards when the stamp threshold is reached. The module spans six related models: LoyaltyProgram, LoyaltyCard, LoyaltyStamp, LoyaltyReward, LoyaltyStampQrCode, and LoyaltyStampQrScan.

## Model: LoyaltyProgram
- **Path**: `backend/app/Models/LoyaltyProgram.php`
- **Table**: `loyalty_programs`
- **Fillable**: merchant_id, name, description, required_stamps, reward_type, reward_value, reward_product_id, reward_description, stamp_expiry_days, reward_expiry_days, is_active
- **Casts**: required_stamps->integer, reward_value->decimal:2, stamp_expiry_days->integer, reward_expiry_days->integer, is_active->boolean
- **Defaults** (`$attributes`): is_active=true
- **Relationships**:
  - `merchant()` BelongsTo Merchant
  - `rewardProduct()` BelongsTo Service (via reward_product_id FK)
  - `loyaltyCards()` HasMany LoyaltyCard
  - `qrCodes()` HasMany LoyaltyStampQrCode
- **Traits**: HasFactory

## Model: LoyaltyCard
- **Path**: `backend/app/Models/LoyaltyCard.php`
- **Table**: `loyalty_cards`
- **Fillable**: customer_id, merchant_id, loyalty_program_id, current_stamps, total_stamps_earned, total_rewards_earned, total_rewards_redeemed, last_stamp_at
- **Casts**: current_stamps/total_stamps_earned/total_rewards_earned/total_rewards_redeemed->integer, last_stamp_at->datetime
- **Defaults** (`$attributes`): current_stamps=0, total_stamps_earned=0, total_rewards_earned=0, total_rewards_redeemed=0
- **Relationships**:
  - `customer()` BelongsTo Customer (FK to customers table, NOT users table)
  - `merchant()` BelongsTo Merchant
  - `loyaltyProgram()` BelongsTo LoyaltyProgram
  - `stamps()` HasMany LoyaltyStamp
  - `rewards()` HasMany LoyaltyReward

## Model: LoyaltyStamp
- **Path**: `backend/app/Models/LoyaltyStamp.php`
- **Table**: `loyalty_stamps`
- **Timestamps**: false
- **Fillable**: loyalty_card_id, qr_code_id, source, notes, awarded_by, earned_at, expires_at, expired
- **Casts**: earned_at->datetime, expires_at->datetime, expired->boolean
- **Defaults** (`$attributes`): expired=false
- **Relationships**:
  - `loyaltyCard()` BelongsTo LoyaltyCard
  - `qrCode()` BelongsTo LoyaltyStampQrCode
  - `awardedByUser()` BelongsTo User (via awarded_by FK)

## Model: LoyaltyReward
- **Path**: `backend/app/Models/LoyaltyReward.php`
- **Table**: `loyalty_rewards`
- **Fillable**: loyalty_card_id, loyalty_program_id, reward_type, reward_value, reward_product_id, reward_description, status, earned_at, expires_at, redeemed_at, redeemed_on_type, redeemed_on_id
- **Casts**: reward_value->decimal:2, earned_at/expires_at/redeemed_at->datetime
- **Defaults** (`$attributes`): status='available'
- **Relationships**:
  - `loyaltyCard()` BelongsTo LoyaltyCard
  - `loyaltyProgram()` BelongsTo LoyaltyProgram
  - `rewardProduct()` BelongsTo Service (via reward_product_id FK)
  - `redeemedOn()` MorphTo (polymorphic, via redeemed_on_type/redeemed_on_id)
- **Methods**: `isAvailable()` -- checks status=available AND not past expires_at

## Model: LoyaltyStampQrCode
- **Path**: `backend/app/Models/LoyaltyStampQrCode.php`
- **Table**: `loyalty_stamp_qr_codes`
- **Timestamps**: false
- **Fillable**: merchant_id, loyalty_program_id, token, mode, expires_at, is_used, scanned_by, scanned_at, scan_count, created_by
- **Casts**: expires_at/scanned_at/created_at->datetime, is_used->boolean, scan_count->integer
- **Defaults** (`$attributes`): is_used=false, scan_count=0
- **Relationships**:
  - `merchant()` BelongsTo Merchant
  - `loyaltyProgram()` BelongsTo LoyaltyProgram
  - `scannedByCustomer()` BelongsTo Customer (via scanned_by FK)
  - `creator()` BelongsTo User (via created_by FK)
  - `scans()` HasMany LoyaltyStampQrScan

## Model: LoyaltyStampQrScan
- **Path**: `backend/app/Models/LoyaltyStampQrScan.php`
- **Table**: `loyalty_stamp_qr_scans`
- **Timestamps**: false
- **Fillable**: qr_code_id, customer_id, scanned_at
- **Note**: Tracks individual scans for daily-mode QR codes

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller (program, self-service) | `backend/app/Http/Controllers/Api/V1/LoyaltyProgramController.php` | show, store (upsert), destroy (deactivate), adminShow, adminUpdate |
| Controller (QR + cards, self-service) | `backend/app/Http/Controllers/Api/V1/LoyaltyController.php` | generateQr, index (cards list), show (card detail), awardStamp |
| Controller (customer) | `backend/app/Http/Controllers/Api/V1/CustomerLoyaltyController.php` | scan, cards, cardDetail, rewards |
| Service (program) | `backend/app/Services/LoyaltyProgramService.php` | getMyLoyaltyProgram, createOrUpdateLoyaltyProgram, deactivateLoyaltyProgram, getAdminLoyaltyProgram, updateAdminLoyaltyProgram |
| Service Interface (program) | `backend/app/Services/Contracts/LoyaltyProgramServiceInterface.php` | -- |
| Service (operations) | `backend/app/Services/LoyaltyService.php` | generateStampQR, scanStampQR, awardBonusStamp, getMerchantLoyaltyCards, getMerchantLoyaltyCard, getMyLoyaltyCards, getMyLoyaltyCard, getMyAvailableRewards, redeemReward, markRewardRedeemed |
| Service Interface (operations) | `backend/app/Services/Contracts/LoyaltyServiceInterface.php` | -- |
| Repository (program) | `backend/app/Repositories/LoyaltyProgramRepository.php` | extends BaseRepository |
| Repository (card) | `backend/app/Repositories/LoyaltyCardRepository.php` | extends BaseRepository |
| Repository (reward) | `backend/app/Repositories/LoyaltyRewardRepository.php` | extends BaseRepository |
| DTO | `backend/app/Data/LoyaltyProgramData.php` | name, description, required_stamps, reward_type, reward_value, reward_product_id, reward_description, stamp_expiry_days, reward_expiry_days, is_active |
| FormRequest (create program) | `backend/app/Http/Requests/Api/V1/Loyalty/CreateLoyaltyProgramRequest.php` | name required, required_stamps 1-100, reward_type enum, reward_value required_if discount types |
| FormRequest (update program) | `backend/app/Http/Requests/Api/V1/Loyalty/UpdateLoyaltyProgramRequest.php` | All fields `sometimes` |
| FormRequest (generate QR) | `backend/app/Http/Requests/Api/V1/Loyalty/GenerateQrCodeRequest.php` | mode: single_use or daily |
| FormRequest (scan QR) | `backend/app/Http/Requests/Api/V1/Loyalty/ScanQrCodeRequest.php` | token: required, 64 chars |
| FormRequest (award stamp) | `backend/app/Http/Requests/Api/V1/Loyalty/AwardBonusStampRequest.php` | notes: optional string |
| Resource (program) | `backend/app/Http/Resources/Api/V1/LoyaltyProgramResource.php` | Includes whenLoaded: rewardProduct, merchant; whenCounted: loyaltyCards |
| Resource (card) | `backend/app/Http/Resources/Api/V1/LoyaltyCardResource.php` | -- |
| Resource (stamp) | `backend/app/Http/Resources/Api/V1/LoyaltyStampResource.php` | -- |
| Resource (reward) | `backend/app/Http/Resources/Api/V1/LoyaltyRewardResource.php` | -- |
| Resource (QR code) | `backend/app/Http/Resources/Api/V1/LoyaltyStampQrCodeResource.php` | -- |
| Provider Binding | `backend/app/Providers/RepositoryServiceProvider.php` | LoyaltyProgramRepositoryInterface->LoyaltyProgramRepository, LoyaltyProgramServiceInterface->LoyaltyProgramService, LoyaltyCardRepositoryInterface->LoyaltyCardRepository, LoyaltyRewardRepositoryInterface->LoyaltyRewardRepository, LoyaltyServiceInterface->LoyaltyService |

## Routes
| Method | URI | Action | Middleware / Permission |
|--------|-----|--------|------------------------|
| GET | `/api/v1/auth/merchant/loyalty-program` | LoyaltyProgramController@show | auth:api, ensure.verified, onboarding |
| POST | `/api/v1/auth/merchant/loyalty-program` | LoyaltyProgramController@store | auth:api, ensure.verified, onboarding |
| DELETE | `/api/v1/auth/merchant/loyalty-program` | LoyaltyProgramController@destroy | auth:api, ensure.verified, onboarding |
| POST | `/api/v1/auth/merchant/loyalty/generate-qr` | LoyaltyController@generateQr | auth:api, ensure.verified, onboarding |
| GET | `/api/v1/auth/merchant/loyalty-cards` | LoyaltyController@index | auth:api, ensure.verified, onboarding |
| GET | `/api/v1/auth/merchant/loyalty-cards/{id}` | LoyaltyController@show | auth:api, ensure.verified, onboarding |
| POST | `/api/v1/auth/merchant/loyalty-cards/{id}/stamp` | LoyaltyController@awardStamp | auth:api, ensure.verified, onboarding |
| GET | `/api/v1/merchants/{merchant}/loyalty-program` | LoyaltyProgramController@adminShow | auth + loyalty_programs.view |
| PUT | `/api/v1/merchants/{merchant}/loyalty-program` | LoyaltyProgramController@adminUpdate | auth + loyalty_programs.update |
| POST | `/api/v1/customer/loyalty/scan` | CustomerLoyaltyController@scan | auth + customer_portal.scan_loyalty |
| GET | `/api/v1/customer/loyalty-cards` | CustomerLoyaltyController@cards | auth + customer_portal.view_loyalty |
| GET | `/api/v1/customer/loyalty-cards/{id}` | CustomerLoyaltyController@cardDetail | auth + customer_portal.view_loyalty |
| GET | `/api/v1/customer/loyalty-rewards` | CustomerLoyaltyController@rewards | auth + customer_portal.view_loyalty |

## Permissions
Defined in `RolePermissionSeeder`:
- `loyalty_programs.view`, `loyalty_programs.create`, `loyalty_programs.update`, `loyalty_programs.delete` -- program management
- `loyalty_cards.view` -- view customer cards
- `loyalty_stamps.create` -- award stamps
- `customer_portal.view_loyalty` -- customer views own cards/rewards
- `customer_portal.scan_loyalty` -- customer scans QR codes

**Role assignments:**
- super-admin/admin: all loyalty_programs.*, loyalty_cards.view, loyalty_stamps.create
- manager: loyalty_programs.view, loyalty_cards.view
- merchant: all loyalty_programs.*, loyalty_cards.view, loyalty_stamps.create
- branch-merchant: loyalty_programs.view, loyalty_cards.view, loyalty_stamps.create
- customer: customer_portal.view_loyalty, customer_portal.scan_loyalty

## Business Rules

### Program Management
- **One active program per merchant**: `createOrUpdateLoyaltyProgram()` is an upsert -- if an active program exists for the merchant, it updates; otherwise, it creates a new one
- **Deactivation** (not deletion): `deactivateLoyaltyProgram()` sets `is_active=false` and immediately expires all unexpired QR codes for that program
- **Reward types**: `free_product`, `discount_percentage`, `discount_fixed` (enum in DB)
- **Conditional validation**: `reward_value` is required when reward_type is `discount_percentage` or `discount_fixed`
- **Expiry configuration**: optional `stamp_expiry_days` (1-365) and `reward_expiry_days` (1-365)

### QR Code Generation
- **Two modes**: `single_use` (expires in 2 minutes, one scan only) and `daily` (expires at end of day, multiple customers can scan)
- **Token**: 64-character random string (`Str::random(64)`)
- **Requires active program**: generation fails with 404 if no active program exists

### QR Scanning (Customer)
- **Single-use mode**: atomic `update ... where is_used=false` prevents race conditions; returns 409 if already used
- **Daily mode**: checks if customer already earned a stamp from this merchant today; returns 409 on duplicate; records each scan in `loyalty_stamp_qr_scans` table
- **Expired QR**: returns 410 (Gone)
- **Inactive program**: returns 404
- **Auto-creates loyalty card**: `LoyaltyCard::firstOrCreate()` on first scan -- customer does not need to manually enroll

### Stamp and Reward Lifecycle
- Each stamp increments `current_stamps` and `total_stamps_earned` on the loyalty card
- When `current_stamps >= required_stamps`, a reward is automatically unlocked:
  - `LoyaltyReward` record created with status=`available`, copying reward configuration from program
  - `current_stamps` resets to 0, `total_rewards_earned` incremented
  - Reward expiry calculated from program's `reward_expiry_days`
- Stamps can optionally expire based on `stamp_expiry_days`
- Bonus stamps: merchants can manually award stamps with optional notes

### CRITICAL: customer_id FK Distinction
- `LoyaltyCard.customer_id` = FK to **customers** table (same as Review.customer_id)
- `LoyaltyService.scanStampQR()` resolves the Customer record via `Customer::where('user_id', $userId)->firstOrFail()`
- This is different from Booking/Reservation/ServiceOrder where `customer_id` = User.id

### Reward Redemption
- `redeemReward()` validates ownership and availability (`isAvailable()` checks status + expiry)
- `markRewardRedeemed()` updates status to `redeemed`, records `redeemed_at`, and polymorphically links to the redeemed-on entity (via `redeemed_on_type`/`redeemed_on_id`)
- `total_rewards_redeemed` incremented on the loyalty card

## Database
| Type | File |
|------|------|
| Migration (programs) | `backend/database/migrations/2026_03_03_100000_create_loyalty_programs_table.php` |
| Migration (cards) | `backend/database/migrations/2026_03_03_100100_create_loyalty_cards_table.php` |
| Migration (QR codes) | `backend/database/migrations/2026_03_03_100200_create_loyalty_stamp_qr_codes_table.php` |
| Migration (QR scans) | `backend/database/migrations/2026_03_03_100300_create_loyalty_stamp_qr_scans_table.php` |
| Migration (stamps) | `backend/database/migrations/2026_03_03_100400_create_loyalty_stamps_table.php` |
| Migration (rewards) | `backend/database/migrations/2026_03_03_100500_create_loyalty_rewards_table.php` |
| Factory (program) | `backend/database/factories/LoyaltyProgramFactory.php` |
| Factory (card) | `backend/database/factories/LoyaltyCardFactory.php` |
| Factory (reward) | `backend/database/factories/LoyaltyRewardFactory.php` |
| Factory (stamp) | `backend/database/factories/LoyaltyStampFactory.php` |
| Factory (QR code) | `backend/database/factories/LoyaltyStampQrCodeFactory.php` |

### Factory States
- **LoyaltyProgramFactory**: `inactive()`, `freeProduct()`, `discountPercentage($pct)`, `discountFixed($amt)`, `withExpiry($stampDays, $rewardDays)`
- **LoyaltyRewardFactory**: `available()`, `redeemed()`, `expiredReward()`
- **LoyaltyStampQrCodeFactory**: `expired()`, `used()`, `daily()`

## Admin Frontend
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/loyaltyService.ts` | getMyProgram, upsertProgram, deactivateProgram, generateQr, getLoyaltyCards(params), getLoyaltyCard(id), awardBonusStamp(cardId, data) |
| Hook | `frontend/hooks/useLoyalty.ts` | useMyLoyaltyProgram, useUpsertLoyaltyProgram, useDeactivateLoyaltyProgram, useGenerateLoyaltyQr, useLoyaltyCards(params), useLoyaltyCard(id), useAwardBonusStamp |
| Types | `frontend/types/api.ts` | LoyaltyProgram, LoyaltyCard, LoyaltyStamp, LoyaltyReward, LoyaltyStampQrCode, LoyaltyRewardType, LoyaltyStampSource, LoyaltyRewardStatus, LoyaltyQrMode, CreateLoyaltyProgramRequest, GenerateLoyaltyQrRequest, AwardBonusStampRequest, LoyaltyCardQueryParams |
| Page | `frontend/app/(system)/(my-store)/my-store/loyalty/page.tsx` | 3-tab layout: Program Setup, QR Generator (disabled until program exists), Customer Cards (disabled until program exists) |
| Component | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-program-form.tsx` | Create/edit program form |
| Component | `frontend/app/(system)/(my-store)/my-store/loyalty/qr-generator.tsx` | Generate single_use/daily QR codes with countdown timer |
| Component | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-cards-list.tsx` | Paginated customer cards list with search |
| Component | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-card-detail-sheet.tsx` | Card detail sheet with stamp/reward history and bonus stamp action |
| Sidebar | `frontend/components/layout/app-sidebar.tsx` | "Loyalty" in my-store items, icon: Gift, requiresActiveMerchant |

### Query Keys (Admin)
- `['loyalty-program']` -- program data
- `['loyalty-cards', params]` -- paginated cards list
- `['loyalty-cards', id]` -- single card detail

## Customer Portal Frontend
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend-customer-portal/services/loyaltyService.ts` | scanQr(token), getMyCards(params), getCardById(id), getMyRewards(params) |
| Hook | `frontend-customer-portal/hooks/useLoyalty.ts` | useMyLoyaltyCards(params), useLoyaltyCard(id), useMyLoyaltyRewards(params), useScanLoyaltyQr |
| Types | `frontend-customer-portal/types/api.ts` | LoyaltyProgram, LoyaltyCard, LoyaltyStamp, LoyaltyReward, ScanResult, LoyaltyCardQueryParams, LoyaltyRewardQueryParams |
| Page (my cards) | `frontend-customer-portal/app/(customer)/loyalty/page.tsx` | Paginated loyalty card list with StampCard components |
| Page (card detail) | `frontend-customer-portal/app/(customer)/loyalty/[id]/page.tsx` | Card detail: stamp card visual, stats grid, program details, reward history, stamp history |
| Page (QR scan) | `frontend-customer-portal/app/(storefront)/loyalty/scan/[token]/page.tsx` | Public scan page: auto-fires scan on mount, shows auth prompt if not logged in, success/error states |
| Component | `frontend-customer-portal/components/loyalty/stamp-card.tsx` | Visual stamp card display with filled/empty stamp slots |
| Component | `frontend-customer-portal/components/loyalty/reward-selector.tsx` | Reward selection UI |
| Nav | `frontend-customer-portal/app/(customer)/layout.tsx` | "Loyalty" in customer nav, icon: Gift |

### Query Keys (Customer Portal)
- `['customer', 'loyalty-cards', params]` -- my cards list
- `['customer', 'loyalty-cards', id]` -- single card detail
- `['customer', 'loyalty-rewards', params]` -- available rewards

### ScanResult Interface
```typescript
interface ScanResult {
  stamp: LoyaltyStamp;
  card: LoyaltyCard;
  reward_unlocked: LoyaltyReward | null;
}
```

## Tests
| Type | File |
|------|------|
| Feature (program CRUD + admin) | `backend/tests/Feature/Api/V1/LoyaltyProgramTest.php` |
| Feature (QR generation + card management) | `backend/tests/Feature/Api/V1/LoyaltyTest.php` |
| Feature (customer QR scanning + cards + rewards) | `backend/tests/Feature/Api/V1/CustomerLoyaltyTest.php` |

## Notes
- The QR scan page (`/loyalty/scan/[token]`) is under the storefront route group (public layout) but requires authentication to actually scan -- unauthenticated users see a sign-in prompt with redirect back to scan page
- QR code tokens are NOT cached in React Query -- the QR generator component manages state locally with countdown timer behavior
- The `useScanLoyaltyQr` mutation invalidates both `loyalty-cards` and `loyalty-rewards` query keys on success
- `useMyLoyaltyProgram` hook has custom retry logic: no retry on 401/403/404 (404 means no program, which is a valid empty state)
- Two separate services handle different concerns: `LoyaltyProgramService` manages program CRUD, `LoyaltyService` handles operational logic (QR generation, scanning, stamping, rewards)
