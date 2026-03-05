# Plan: Loyalty Program Module

**Date:** 2026-03-03
**Type:** feature
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- [Eager-loaded relation missing from API response](../knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md): Always add `whenLoaded()` in Resource when adding `->with()` in Service — they're an atomic pair
- [Enforce morph map breaks existing polymorphic models](../knowledge/solutions/runtime-errors/enforce-morph-map-breaks-existing-polymorphic-models-chat-20260228.md): Use `Relation::morphMap()`, never `enforceMorphMap()` — Spatie Media Library and HasAddress use unregistered morphs

### Known Gotchas
- **customer_id FK disambiguation**: `Booking/Reservation/ServiceOrder.customer_id` → `users.id`, but `Review.customer_id` → `customers.id`. Loyalty models (LoyaltyCard, etc.) must FK to `customers.id`. Bridge via `Customer::where('user_id', auth()->id())->firstOrFail()`
- **Model `$attributes` for defaults**: DB defaults don't propagate on `Model::create()`. Use `$attributes` array for `current_stamps => 0`, `is_active => true`, etc.
- **Atomic update for QR single-use scan**: Must use `UPDATE ... WHERE is_used = false` returning affected rows to prevent race conditions — do NOT read-then-write

### Critical Patterns Applied
- Service-Repository pattern with interface bindings in `RepositoryServiceProvider`
- Spatie LaravelData DTOs with `string|Optional` for all fields
- Spatie QueryBuilder for list endpoints
- Pest PHP `describe/it` syntax with `Passport::actingAs()`
- Nested merchant routes (`/auth/merchant/...`) for self-service + admin routes (`/merchants/{merchant}/...`)
- Status workflow via `VALID_TRANSITIONS` constant in service layer (for reward status)
- Permission format `module_name.action` in `RolePermissionSeeder`

## Overview

Build a merchant-scoped loyalty stamp card system. Merchants generate time-limited QR codes; customers scan to earn stamps; reaching a threshold unlocks rewards redeemable at checkout. Each merchant has one active program. Completely decoupled from transaction lifecycle — stamps come from physical presence (QR scan), not from placing orders.

**5 new models**: LoyaltyProgram, LoyaltyCard, LoyaltyStampQrCode, LoyaltyStamp, LoyaltyReward
**6 new tables**: loyalty_programs, loyalty_cards, loyalty_stamp_qr_codes, loyalty_stamp_qr_scans, loyalty_stamps, loyalty_rewards

## Implementation Steps

### Phase 1: Backend — Migrations, Models, Factories

**Files:**
- `backend/database/migrations/2026_03_03_100000_create_loyalty_programs_table.php`
- `backend/database/migrations/2026_03_03_100100_create_loyalty_cards_table.php`
- `backend/database/migrations/2026_03_03_100200_create_loyalty_stamp_qr_codes_table.php`
- `backend/database/migrations/2026_03_03_100300_create_loyalty_stamp_qr_scans_table.php`
- `backend/database/migrations/2026_03_03_100400_create_loyalty_stamps_table.php`
- `backend/database/migrations/2026_03_03_100500_create_loyalty_rewards_table.php`
- `backend/app/Models/LoyaltyProgram.php`
- `backend/app/Models/LoyaltyCard.php`
- `backend/app/Models/LoyaltyStampQrCode.php`
- `backend/app/Models/LoyaltyStamp.php`
- `backend/app/Models/LoyaltyReward.php`
- `backend/database/factories/LoyaltyProgramFactory.php`
- `backend/database/factories/LoyaltyCardFactory.php`
- `backend/database/factories/LoyaltyStampQrCodeFactory.php`
- `backend/database/factories/LoyaltyStampFactory.php`
- `backend/database/factories/LoyaltyRewardFactory.php`

**Details:**
- All models use `$attributes` for defaults (not DB defaults)
- `loyalty_cards` unique constraint: `[customer_id, merchant_id]` — customer_id FKs to `customers.id`
- `loyalty_stamp_qr_codes.token`: `string(64)`, unique index
- `loyalty_rewards.redeemed_on_type` + `redeemed_on_id`: polymorphic (booking/reservation/service_order already in morph map)
- LoyaltyProgram: `reward_type` enum (`free_product`, `discount_percentage`, `discount_fixed`)
- LoyaltyStamp: `source` enum (`qr_scan`, `bonus`)
- LoyaltyReward: `status` enum (`available`, `redeemed`, `expired`)
- LoyaltyStampQrCode: `mode` enum (`single_use`, `daily`)
- Merchant `hasOne` LoyaltyProgram (active), `hasMany` LoyaltyCards
- Customer `hasMany` LoyaltyCards
- Factories with state methods: `LoyaltyCardFactory::withProgress($stamps)`, `LoyaltyRewardFactory::available()`, `LoyaltyStampQrCodeFactory::daily()`, etc.

**Knowledge note:** Use `$attributes` array for all defaults. Customer FK points to `customers.id`.

### Phase 2: Backend — Repositories, DTOs, Form Requests, Resources

**Files:**
- `backend/app/Repositories/Contracts/LoyaltyProgramRepositoryInterface.php`
- `backend/app/Repositories/LoyaltyProgramRepository.php`
- `backend/app/Repositories/Contracts/LoyaltyCardRepositoryInterface.php`
- `backend/app/Repositories/LoyaltyCardRepository.php`
- `backend/app/Repositories/Contracts/LoyaltyRewardRepositoryInterface.php`
- `backend/app/Repositories/LoyaltyRewardRepository.php`
- `backend/app/Data/LoyaltyProgramData.php`
- `backend/app/Http/Requests/Api/V1/Loyalty/CreateLoyaltyProgramRequest.php`
- `backend/app/Http/Requests/Api/V1/Loyalty/UpdateLoyaltyProgramRequest.php`
- `backend/app/Http/Requests/Api/V1/Loyalty/GenerateQrCodeRequest.php`
- `backend/app/Http/Requests/Api/V1/Loyalty/ScanQrCodeRequest.php`
- `backend/app/Http/Requests/Api/V1/Loyalty/AwardBonusStampRequest.php`
- `backend/app/Http/Resources/Api/V1/LoyaltyProgramResource.php`
- `backend/app/Http/Resources/Api/V1/LoyaltyCardResource.php`
- `backend/app/Http/Resources/Api/V1/LoyaltyStampResource.php`
- `backend/app/Http/Resources/Api/V1/LoyaltyRewardResource.php`
- `backend/app/Http/Resources/Api/V1/LoyaltyStampQrCodeResource.php`
- `backend/app/Providers/RepositoryServiceProvider.php` (add bindings)

**Details:**
- 3 repositories (LoyaltyProgram, LoyaltyCard, LoyaltyReward) extending BaseRepository
- LoyaltyProgramData DTO: all fields `string|Optional` pattern
- FormRequests: `authorize(): true` (permissions in route middleware)
- Resources: `whenLoaded()` for all relationships — atomic pair with service eager loading
- Bind all interfaces in RepositoryServiceProvider `$bindings` array

**Knowledge note:** Eager load + whenLoaded = atomic pair. Always add both together.

### Phase 3: Backend — LoyaltyProgramService (Program CRUD)

**Files:**
- `backend/app/Services/Contracts/LoyaltyProgramServiceInterface.php`
- `backend/app/Services/LoyaltyProgramService.php`

**Details:**
- `getMyLoyaltyProgram(merchantId)`: Get merchant's active program with eager loading
- `createOrUpdateLoyaltyProgram(merchantId, LoyaltyProgramData)`: Upsert — one active program per merchant
- `deactivateLoyaltyProgram(merchantId)`: Set `is_active = false`, invalidate unexpired QR codes
- `getAdminLoyaltyProgram(merchantId)`: Admin view of merchant's program
- `updateAdminLoyaltyProgram(merchantId, LoyaltyProgramData)`: Admin edit
- Spatie QueryBuilder not needed here (single program per merchant, not paginated)

### Phase 4: Backend — LoyaltyService (QR Gen, Scan, Bonus, Rewards)

**Files:**
- `backend/app/Services/Contracts/LoyaltyServiceInterface.php`
- `backend/app/Services/LoyaltyService.php`

**Details:**
- `generateStampQR(merchantId, mode)`:
  - Verify active program exists
  - Generate `Str::random(64)` token
  - Set `expires_at`: single_use → `now()->addMinutes(2)`, daily → `now()->endOfDay()`
  - Return QR code record

- `scanStampQR(token, userId)`:
  - Find QR by token → 404
  - Check `expires_at > now()` → 410 Gone
  - Get active program from QR → 404 if deactivated
  - Resolve Customer: `Customer::where('user_id', $userId)->firstOrFail()`
  - **Single-use mode**: Atomic `UPDATE loyalty_stamp_qr_codes SET is_used=true, scanned_by=?, scanned_at=now() WHERE id=? AND is_used=false` → 409 if 0 rows
  - **Daily mode**: Check existing stamp today for this customer+merchant → 409 "already earned today". Record in `loyalty_stamp_qr_scans`, increment `scan_count`
  - Get/create LoyaltyCard (firstOrCreate on customer_id + merchant_id)
  - Create LoyaltyStamp (source=qr_scan)
  - Increment card counters
  - Check threshold → unlock reward if met (snapshot program values, reset current_stamps to 0)
  - Wrap in DB::transaction

- `awardBonusStamp(cardId, merchantId, notes, awardedBy)`:
  - Verify card belongs to merchant's program
  - Create stamp (source=bonus), same increment + reward check logic

- `redeemReward(rewardId, customerId)`:
  - Find reward → verify belongs to customer, status=available, not expired
  - Return discount info (reward_type, reward_value, reward_product_id)
  - After caller creates transaction, call `markRewardRedeemed(rewardId, redeemableType, redeemableId)`

- `getMyLoyaltyCards(userId)`: Customer's cards across merchants with QueryBuilder
- `getMyLoyaltyCard(userId, cardId)`: Single card with stamps + rewards
- `getMerchantLoyaltyCards(merchantId)`: Merchant's customer cards with QueryBuilder
- `getMerchantLoyaltyCard(merchantId, cardId)`: Single customer card detail
- `getMyAvailableRewards(userId)`: Available rewards for checkout selection

**Knowledge note:** Customer resolution via `Customer::where('user_id', $userId)->firstOrFail()`. Atomic QR update prevents race conditions.

### Phase 5: Backend — Controllers, Routes, Permissions

**Files:**
- `backend/app/Http/Controllers/Api/V1/LoyaltyProgramController.php` (merchant self-service + admin)
- `backend/app/Http/Controllers/Api/V1/LoyaltyController.php` (merchant QR + cards)
- `backend/app/Http/Controllers/Api/V1/CustomerLoyaltyController.php` (customer scan + cards)
- `backend/routes/api.php` (add all routes)
- `backend/database/seeders/RolePermissionSeeder.php` (add permissions)

**Routes:**
```
# Merchant self-service (auth + verified + onboarded + merchant.active)
GET    /auth/merchant/loyalty-program              → LoyaltyProgramController@show
POST   /auth/merchant/loyalty-program              → LoyaltyProgramController@store
DELETE /auth/merchant/loyalty-program               → LoyaltyProgramController@destroy

POST   /auth/merchant/loyalty/generate-qr           → LoyaltyController@generateQr
GET    /auth/merchant/loyalty-cards                 → LoyaltyController@index
GET    /auth/merchant/loyalty-cards/{id}            → LoyaltyController@show
POST   /auth/merchant/loyalty-cards/{id}/stamp      → LoyaltyController@awardStamp

# Admin (auth + verified + onboarded + permission)
GET    /merchants/{merchant}/loyalty-program        → LoyaltyProgramController@adminShow
PUT    /merchants/{merchant}/loyalty-program        → LoyaltyProgramController@adminUpdate

# Customer portal (auth + verified)
POST   /customer/loyalty/scan                       → CustomerLoyaltyController@scan
GET    /customer/loyalty-cards                      → CustomerLoyaltyController@cards
GET    /customer/loyalty-cards/{id}                 → CustomerLoyaltyController@cardDetail
GET    /customer/loyalty-rewards                    → CustomerLoyaltyController@rewards
```

**Permissions** (added to RolePermissionSeeder):
```
loyalty_programs.view    → merchant, branch-merchant, admin, manager
loyalty_programs.create  → merchant, admin
loyalty_programs.update  → merchant, admin
loyalty_programs.delete  → merchant, admin
loyalty_cards.view       → merchant, branch-merchant, admin, manager
loyalty_stamps.create    → merchant, branch-merchant, admin
customer_portal.view_loyalty  → customer
customer_portal.scan_loyalty  → customer
```

**Knowledge note:** FormRequests return `authorize(): true`. Permissions enforced in route middleware.

### Phase 6: Backend — Reward Redemption Integration at Checkout

**Files:**
- `backend/app/Http/Requests/Api/V1/Booking/CreateBookingRequest.php` (add optional `loyalty_reward_id`)
- `backend/app/Services/BookingService.php` (integrate reward redemption)
- `backend/app/Services/ReservationService.php` (integrate reward redemption)
- `backend/app/Services/CustomerPortalService.php` (pass reward through)

**Details:**
- Add optional `loyalty_reward_id` to booking/reservation/order creation requests
- In service `create` methods: if `loyalty_reward_id` provided, call `LoyaltyService::redeemReward()` to validate + get discount
- After transaction created, call `LoyaltyService::markRewardRedeemed()` with polymorphic reference
- Apply discount based on reward_type (free_product, discount_percentage, discount_fixed)
- Wrap in DB::transaction with the main creation

**Knowledge note:** Transaction morph types (booking, reservation, service_order) already in AppServiceProvider morph map.

### Phase 7: Backend — Tests

**Files:**
- `backend/tests/Feature/Api/V1/LoyaltyProgramTest.php`
- `backend/tests/Feature/Api/V1/LoyaltyTest.php`
- `backend/tests/Feature/Api/V1/CustomerLoyaltyTest.php`

**Test Cases (~60-70 tests):**

LoyaltyProgramTest:
- Merchant can create loyalty program
- Merchant can view their loyalty program
- Merchant can update loyalty program
- Merchant can deactivate loyalty program
- Only one active program per merchant
- Admin can view merchant's program
- Admin can update merchant's program
- Unauthorized user cannot access
- Validation: required_stamps min 1, reward_type valid enum, reward_value required for discount types

LoyaltyTest (Merchant QR + Cards):
- Generate single-use QR with 2-min expiry
- Generate daily QR with end-of-day expiry
- Cannot generate QR without active program
- List customer loyalty cards
- View card detail with stamps + rewards
- Award bonus stamp to customer
- Bonus stamp triggers reward unlock at threshold
- Cannot award stamp to card from another merchant

CustomerLoyaltyTest:
- Scan single-use QR earns stamp
- Scan expired QR returns 410
- Scan already-used single-use QR returns 409
- Scan daily QR earns stamp
- Scan daily QR twice same day returns 409
- Scan daily QR from different merchant same day succeeds
- Reaching threshold unlocks reward (current_stamps resets to 0)
- View my loyalty cards across merchants
- View card detail with stamp history
- View available rewards for checkout
- Card auto-created on first scan
- Scan QR for deactivated program returns 404
- Customer without Customer record gets proper error

### Phase 8: Frontend (Admin) — Loyalty Program Setup + QR Generator

**Files:**
- `frontend/types/api.ts` (add LoyaltyProgram, LoyaltyCard, LoyaltyStamp, LoyaltyReward, LoyaltyStampQrCode types)
- `frontend/services/loyaltyService.ts`
- `frontend/hooks/useLoyalty.ts`
- `frontend/lib/validations.ts` (add loyalty Zod schemas)
- `frontend/app/(system)/(my-store)/my-store/loyalty/page.tsx` (program setup + QR generator)
- `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-program-form.tsx`
- `frontend/app/(system)/(my-store)/my-store/loyalty/qr-generator.tsx` (mode selector, QR display, countdown timer, scan count)
- `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-cards-list.tsx` (customer cards)
- `frontend/app/(system)/(my-store)/my-store/loyalty/loyalty-card-detail-sheet.tsx` (stamp history, bonus stamp, rewards)
- `frontend/components/layout/app-sidebar.tsx` (add Loyalty nav item under my-store)

**Details:**
- QR Generator: mode selector (Single-use / Daily), display generated QR code, countdown timer for single-use (2 min), "Valid until end of day" for daily, live scan count for daily, auto-prompt "Generate Next" after expiry/use
- Program form: name, description, required_stamps, reward_type selector, conditional reward_value/reward_product_id fields
- Cards list: paginated table with customer name, stamps progress, total rewards
- Card detail sheet: stamp history timeline, bonus stamp form, rewards list

### Phase 9: Frontend (Customer Portal) — QR Scanner + Loyalty Cards

**Files:**
- `frontend-customer-portal/types/api.ts` (add loyalty types)
- `frontend-customer-portal/services/loyaltyService.ts`
- `frontend-customer-portal/hooks/useLoyalty.ts`
- `frontend-customer-portal/app/(customer)/loyalty/page.tsx` (my loyalty cards)
- `frontend-customer-portal/app/(customer)/loyalty/[id]/page.tsx` (card detail)
- `frontend-customer-portal/app/(storefront)/loyalty/scan/[token]/page.tsx` (deep link handler)
- `frontend-customer-portal/components/loyalty/stamp-card.tsx` (visual stamp card with filled/empty circles)
- `frontend-customer-portal/components/loyalty/reward-selector.tsx` (checkout integration)
- `frontend-customer-portal/components/loyalty/qr-scanner.tsx` (camera-based scanner)
- `frontend-customer-portal/app/(customer)/layout.tsx` (add Loyalty nav item)

**Details:**
- QR Scanner: camera-based scanning using `html5-qrcode` library (or chosen at implementation time)
- Deep link: `/loyalty/scan/{token}` route extracts token, calls scan API, shows result (stamp earned, reward unlocked, or error)
- Stamp card component: visual grid of filled/empty stamp circles, progress bar
- Reward selector: shown during checkout (booking/order/reservation forms) — list available rewards with "Apply" button
- Merchant detail page (storefront): show loyalty program info if active

### Phase 10: Storefront Integration

**Files:**
- `backend/app/Services/StorefrontService.php` (add loyalty program to merchant detail)
- `backend/app/Http/Resources/Api/V1/MerchantResource.php` (add whenLoaded loyaltyProgram)
- `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx` (show loyalty program info)
- `frontend-customer-portal/components/storefront/merchant-header.tsx` (loyalty badge)

**Details:**
- StorefrontService `getMerchantBySlug()`: add `->with(['loyaltyProgram' => fn($q) => $q->where('is_active', true)])`
- MerchantResource: add `'loyalty_program' => $this->whenLoaded('loyaltyProgram', ...)`
- Merchant detail: show loyalty program section (stamp count needed, reward description, "Earn Stamps" CTA)

**Knowledge note:** Eager load + whenLoaded atomic pair. Add both together.

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Race condition on single-use QR scan | Medium | Atomic UPDATE with WHERE clause; 0 affected rows = already consumed |
| customer_id FK confusion | High | Document clearly in model; always use `Customer::where('user_id', ...)` bridge |
| Stamp expiry complexity | Low | MVP: lazy check on read (filter expired stamps). Scheduled job deferred |
| QR scanner library compatibility | Medium | Choose well-supported library; fallback to manual token input |
| Reward redemption affecting checkout flow | Medium | Make reward optional; validate before transaction; rollback on failure |
| Daily QR dedup edge case (timezone) | Low | Use server timezone consistently; `whereDate('earned_at', today())` |

## Testing Strategy

- [ ] LoyaltyProgram CRUD (merchant + admin): ~10 tests
- [ ] QR generation (both modes): ~5 tests
- [ ] QR scanning (single-use flow, daily flow, edge cases): ~12 tests
- [ ] Bonus stamp awarding: ~5 tests
- [ ] Reward unlock on threshold: ~5 tests
- [ ] Reward redemption at checkout: ~8 tests
- [ ] Customer loyalty card views: ~5 tests
- [ ] Merchant loyalty card views: ~5 tests
- [ ] Authorization/permission tests: ~5 tests
- [ ] Validation error tests: ~5 tests
- [ ] Total: ~65 tests

**Run:** `docker compose exec app php artisan test --filter=Loyalty`

## Open Questions

1. **Stamp expiry**: Lazy check on read (filter expired when calculating progress) vs scheduled artisan command? Recommend lazy check for MVP, scheduled job later for expiry warning emails.
2. **QR scanner library**: `html5-qrcode` (lightweight, well-maintained) vs `@yudiel/react-qr-scanner` (React wrapper)? Decide during Phase 9.
3. **QR deep link format**: `{CUSTOMER_PORTAL_URL}/loyalty/scan/{token}` — confirmed as web URL approach (works without app install).
4. **Free product reward at checkout**: Auto-add reward product with price=0, or just apply as discount? Recommend: treat as fixed discount equal to product price for simplicity.
