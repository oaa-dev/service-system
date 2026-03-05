# Loyalty Stamp Module (Stamp, QR Code, QR Scan)

## Models

### LoyaltyStamp
- **Path**: `backend/app/Models/LoyaltyStamp.php`
- **Table**: `loyalty_stamps`
- **Timestamps**: disabled (`$timestamps = false`)
- **Fillable**: loyalty_card_id, qr_code_id, source, notes, awarded_by, earned_at, expires_at, expired
- **Casts**: earned_at->datetime, expires_at->datetime, expired->boolean
- **Defaults** (`$attributes`): expired=false
- **Relationships**:
  - `loyaltyCard()` BelongsTo LoyaltyCard
  - `qrCode()` BelongsTo LoyaltyStampQrCode (FK: qr_code_id)
  - `awardedByUser()` BelongsTo User (FK: awarded_by)
- **Traits**: HasFactory
- **Source enum** (DB-level): `qr_scan`, `bonus`

### LoyaltyStampQrCode
- **Path**: `backend/app/Models/LoyaltyStampQrCode.php`
- **Table**: `loyalty_stamp_qr_codes`
- **Timestamps**: disabled (`$timestamps = false`); `created_at` is manually set on creation
- **Fillable**: merchant_id, loyalty_program_id, token, mode, expires_at, is_used, scanned_by, scanned_at, scan_count, created_by
- **Casts**: expires_at->datetime, is_used->boolean, scanned_at->datetime, scan_count->integer, created_at->datetime
- **Defaults** (`$attributes`): is_used=false, scan_count=0
- **Relationships**:
  - `merchant()` BelongsTo Merchant
  - `loyaltyProgram()` BelongsTo LoyaltyProgram
  - `scannedByCustomer()` BelongsTo Customer (FK: scanned_by)
  - `creator()` BelongsTo User (FK: created_by)
  - `scans()` HasMany LoyaltyStampQrScan (FK: qr_code_id)
- **Methods**: `isExpired(): bool` -- checks if `expires_at` is in the past
- **Traits**: HasFactory
- **Mode enum** (DB-level): `single_use`, `daily`

### LoyaltyStampQrScan
- **Path**: `backend/app/Models/LoyaltyStampQrScan.php`
- **Table**: `loyalty_stamp_qr_scans`
- **Timestamps**: disabled (`$timestamps = false`)
- **Fillable**: qr_code_id, customer_id, scanned_at
- **Casts**: scanned_at->datetime
- **No factory** -- records are created inline in the service during daily QR scans
- **Relationships**:
  - `qrCode()` BelongsTo LoyaltyStampQrCode (FK: qr_code_id)
  - `customer()` BelongsTo Customer
- **Unique constraint**: `[qr_code_id, customer_id]` -- prevents same customer scanning same daily QR twice

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller (merchant) | `backend/app/Http/Controllers/Api/V1/LoyaltyController.php` | generateQr, index, show, awardStamp (self-service) |
| Controller (customer) | `backend/app/Http/Controllers/Api/V1/CustomerLoyaltyController.php` | scan, cards, cardDetail, rewards |
| Service | `backend/app/Services/LoyaltyService.php` | generateStampQR, scanStampQR, awardBonusStamp, getMerchantLoyaltyCards, getMerchantLoyaltyCard, getMyLoyaltyCards, getMyLoyaltyCard, getMyAvailableRewards, redeemReward, markRewardRedeemed |
| Service Interface | `backend/app/Services/Contracts/LoyaltyServiceInterface.php` | -- |
| Repository | `backend/app/Repositories/LoyaltyCardRepository.php` | extends BaseRepository (stamps/QR use inline Eloquent, not dedicated repositories) |
| FormRequest | `backend/app/Http/Requests/Api/V1/Loyalty/GenerateQrCodeRequest.php` | mode: required, in:single_use,daily |
| FormRequest | `backend/app/Http/Requests/Api/V1/Loyalty/ScanQrCodeRequest.php` | token: required, string, size:64 |
| FormRequest | `backend/app/Http/Requests/Api/V1/Loyalty/AwardBonusStampRequest.php` | notes: nullable, string, max:255 |
| Resource | `backend/app/Http/Resources/Api/V1/LoyaltyStampResource.php` | id, loyalty_card_id, qr_code_id, source, notes, awarded_by, earned_at, expires_at, expired, awarded_by_user (whenLoaded) |
| Resource | `backend/app/Http/Resources/Api/V1/LoyaltyStampQrCodeResource.php` | id, token, mode, expires_at, is_used, scan_count, is_expired (computed), created_at |

## Routes
| Method | URI | Action | Middleware |
|--------|-----|--------|------------|
| POST | `/api/v1/auth/merchant/loyalty/generate-qr` | LoyaltyController@generateQr | auth:api, ensure.verified, onboarding |
| GET | `/api/v1/auth/merchant/loyalty-cards` | LoyaltyController@index | auth:api, ensure.verified, onboarding |
| GET | `/api/v1/auth/merchant/loyalty-cards/{id}` | LoyaltyController@show | auth:api, ensure.verified, onboarding |
| POST | `/api/v1/auth/merchant/loyalty-cards/{id}/stamp` | LoyaltyController@awardStamp | auth:api, ensure.verified, onboarding |
| POST | `/api/v1/customer/loyalty/scan` | CustomerLoyaltyController@scan | auth + customer_portal.scan_loyalty |
| GET | `/api/v1/customer/loyalty-cards` | CustomerLoyaltyController@cards | auth + customer_portal.view_loyalty |
| GET | `/api/v1/customer/loyalty-cards/{id}` | CustomerLoyaltyController@cardDetail | auth + customer_portal.view_loyalty |
| GET | `/api/v1/customer/loyalty-rewards` | CustomerLoyaltyController@rewards | auth + customer_portal.view_loyalty |

## Permissions
| Permission | Roles |
|------------|-------|
| `loyalty_stamps.create` | merchant, branch-merchant, super-admin, admin |
| `loyalty_cards.view` | merchant, branch-merchant, manager, super-admin, admin |
| `customer_portal.scan_loyalty` | customer |
| `customer_portal.view_loyalty` | customer |

## Business Rules

### QR Code Generation (Merchant)
1. Requires an **active** LoyaltyProgram for the merchant (`is_active = true`); returns 404 if none
2. Mode determines expiry:
   - `single_use` -- expires in **2 minutes**
   - `daily` -- expires at **end of day** (`now()->endOfDay()`)
3. Token is a random 64-character string (`Str::random(64)`)
4. `created_by` tracks which merchant user generated the QR

### QR Scan Flow (Customer)
The `scanStampQR()` method runs inside a `DB::transaction`:

1. **Lookup**: Find QR by token; 404 if not found
2. **Expiry check**: 410 Gone if `expires_at` is past
3. **Program validation**: 404 if associated program is inactive
4. **Customer resolution**: Resolves `Customer` record via `user_id` (CRITICAL: `scanned_by` FK points to `customers.id`, NOT `users.id`)
5. **Mode-specific validation**:
   - **single_use**: Atomic `UPDATE ... WHERE is_used = false`; 409 if already used. Sets `is_used`, `scanned_by`, `scanned_at`
   - **daily**: Checks if customer already earned a stamp from this merchant today; 409 if duplicate. Creates `LoyaltyStampQrScan` record and increments `scan_count`
6. **Card auto-creation**: `LoyaltyCard::firstOrCreate()` with `[customer_id, merchant_id]`; auto-links to program
7. **Stamp creation**: Creates `LoyaltyStamp` with `source='qr_scan'`, optional `expires_at` from `program->stamp_expiry_days`
8. **Counter updates**: Increments `current_stamps` and `total_stamps_earned`, updates `last_stamp_at`
9. **Reward threshold check**: If `current_stamps >= required_stamps`, calls `unlockReward()` which resets `current_stamps` to 0

### Bonus Stamp Award (Merchant)
1. Card must belong to the merchant's own cards; 404 otherwise
2. Program must be active; 404 if deactivated
3. Creates stamp with `source='bonus'`, `qr_code_id=null`, `awarded_by` set to the merchant user
4. Same reward threshold logic as QR scan

### Reward Unlock (Private Method)
When stamp count reaches the program threshold:
1. Creates `LoyaltyReward` with `status='available'` and optional `expires_at` from `program->reward_expiry_days`
2. Resets `current_stamps` to 0 on the card
3. Increments `total_rewards_earned`

### Error Codes
| Code | Scenario |
|------|----------|
| 404 | QR token not found |
| 404 | Program inactive (generate or scan) |
| 404 | Card belongs to another merchant |
| 410 | QR code expired |
| 409 | Single-use QR already used |
| 409 | Daily QR already scanned by same customer today |

## Database
| Type | File |
|------|------|
| Migration | `backend/database/migrations/2026_03_03_100200_create_loyalty_stamp_qr_codes_table.php` |
| Migration | `backend/database/migrations/2026_03_03_100300_create_loyalty_stamp_qr_scans_table.php` |
| Migration | `backend/database/migrations/2026_03_03_100400_create_loyalty_stamps_table.php` |
| Factory | `backend/database/factories/LoyaltyStampFactory.php` |
| Factory | `backend/database/factories/LoyaltyStampQrCodeFactory.php` |

### Factory States

**LoyaltyStampFactory**:
- default: `source='qr_scan'`, `expired=false`, `qr_code_id=null`
- `bonus(?string $notes)`: sets `source='bonus'` with optional notes
- `expiredStamp()`: sets `expires_at` to yesterday, `expired=true`

**LoyaltyStampQrCodeFactory**:
- default: `mode='single_use'`, `expires_at=now()+2min`, `is_used=false`, `scan_count=0`
- `daily()`: sets `mode='daily'`, `expires_at=endOfDay()`
- `expired()`: sets `expires_at` to 1 minute ago
- `used()`: sets `is_used=true`, `scanned_at=now()`

### Table Schema Notes

**loyalty_stamp_qr_codes**:
- `token` VARCHAR(64) UNIQUE
- `mode` ENUM('single_use', 'daily')
- `scanned_by` FK to `customers` (nullOnDelete) -- only set for single_use mode
- `created_by` FK to `users` (cascadeOnDelete)
- No `updated_at` column

**loyalty_stamp_qr_scans**:
- Unique composite: `[qr_code_id, customer_id]`
- Used only for daily mode tracking
- `qr_code_id` FK cascadeOnDelete, `customer_id` FK cascadeOnDelete

**loyalty_stamps**:
- `qr_code_id` nullable FK (nullOnDelete) -- null for bonus stamps
- `source` ENUM('qr_scan', 'bonus')
- `awarded_by` nullable FK to users (nullOnDelete) -- set for bonus stamps
- Indexed on `loyalty_card_id` and `earned_at`
- No `updated_at` column

## Frontend (Admin)
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/loyaltyService.ts` | generateQr, getLoyaltyCards, getLoyaltyCard, awardBonusStamp |
| Hook | `frontend/hooks/useLoyalty.ts` | React Query hooks for loyalty operations |
| QR Generator | `frontend/app/(system)/(my-store)/my-store/loyalty/qr-generator.tsx` | QR code generation UI component |
| Card List | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-cards-list.tsx` | Customer card listing with search |
| Card Detail | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-card-detail-sheet.tsx` | Sheet with stamp/reward history |
| Page | `frontend/app/(system)/(my-store)/my-store/loyalty/page.tsx` | Main loyalty management page |
| Program Form | `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-program-form.tsx` | Loyalty program create/edit |

## Frontend (Customer Portal)
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend-customer-portal/services/loyaltyService.ts` | scanQr, getMyCards, getCardById, getMyRewards |
| Hook | `frontend-customer-portal/hooks/useLoyalty.ts` | React Query hooks for customer loyalty |
| Scan Page | `frontend-customer-portal/app/(storefront)/loyalty/scan/[token]/page.tsx` | QR scan landing page (deep link from scanned QR) |
| Cards Page | `frontend-customer-portal/app/(customer)/loyalty/page.tsx` | My loyalty cards list |
| Card Detail | `frontend-customer-portal/app/(customer)/loyalty/[id]/page.tsx` | Card detail with stamps and rewards |
| Stamp Card | `frontend-customer-portal/components/loyalty/stamp-card.tsx` | Visual stamp card component |
| Reward Selector | `frontend-customer-portal/components/loyalty/reward-selector.tsx` | Reward selection/redemption UI |

## Tests
| Type | File | Test Count |
|------|------|------------|
| Feature (merchant QR + cards) | `backend/tests/Feature/Api/V1/LoyaltyTest.php` | 14 tests (5 QR generation + 9 card management) |
| Feature (customer scan + cards + rewards) | `backend/tests/Feature/Api/V1/CustomerLoyaltyTest.php` | 18 tests (11 QR scanning + 4 cards + 3 rewards) |

### Key Test Scenarios
- **QR Generation**: single-use mode, daily mode, requires active program, validates mode field
- **QR Scanning**: single-use success, daily success, expired QR (410), already-used single-use (409), daily duplicate same day (409), reward threshold trigger, invalid token (404), deactivated program (404), token validation (422)
- **Bonus Stamps**: award with/without notes, reward threshold trigger, cross-merchant isolation, inactive program guard
- **Customer Cards**: list own cards only, view detail with stamps, cross-customer isolation
- **Rewards**: lists only available + unexpired rewards, excludes redeemed/expired, cross-customer isolation
