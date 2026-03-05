# Brainstorm: Loyalty Program Module

**Date:** 2026-03-01
**Status:** Ready for /plan

## Knowledge Context

### Existing Infrastructure
- `Customer.loyalty_points` (integer, default 0) and `customer_tier` (enum: regular|silver|gold|platinum) **already exist** in the Customer model
- Merchant sub-entity pattern proven: merchant_id FK, nested routes, permission middleware
- All transactions (Booking, Reservation, ServiceOrder) use `customer_id → User.id`, NOT `Customer.id`. Loyalty service must bridge: `Customer::where('user_id', auth()->id())->first()`

### Critical Pattern
- **Eager load + Resource = atomic pair**: When adding `->with(['loyaltyCard'])` in service, always add `whenLoaded('loyaltyCard')` in Resource.

## Problem / Goal

Build a merchant-scoped loyalty stamp card system where customers earn stamps by scanning time-limited QR codes and unlock rewards after reaching a threshold. Each merchant configures their own loyalty program independently.

**Core flow:**
1. Merchant generates QR code (single-use: 2 min, OR daily: until midnight)
2. Customer scans QR with their app → stamp awarded
3. Customer reaches stamp threshold → reward unlocked
4. Customer redeems reward at checkout
5. Card resets, new cycle begins

## User Decisions

| Decision | Choice |
|----------|--------|
| **MVP scope** | Core stamp card only (no tiers, no points, no referrals) |
| **Stamp earning** | QR code scan — primary method. Two modes available. |
| **QR mode: Single-use** | 1 scan consumes QR, 2-minute expiry. For individual customer interactions. |
| **QR mode: Daily** | Valid until end of day (23:59:59). Each customer can scan once. 1 stamp per customer per merchant per day max. |
| **Fallback** | Merchant can award manual bonus stamps from admin (no QR needed) |
| **Redemption** | Customer chooses at checkout (select from available rewards during order/booking/reservation creation) |
| **Visibility** | Public on merchant detail page (storefront) |
| **Card creation** | Auto-created on first QR scan. No explicit "join" needed. |
| **Stamp carry-over** | Reset to 0 on reward unlock. No carry-over. |
| **Programs per merchant** | 1 active program at a time |

## Data Model

### Table: `loyalty_programs` (Merchant configures their program)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| merchant_id | FK → merchants | One active program per merchant |
| name | string | e.g., "Buy 10 Get 1 Free" |
| description | text, nullable | Program details for storefront display |
| required_stamps | integer | Stamps needed for 1 reward (e.g., 10) |
| reward_type | enum | `free_product`, `discount_percentage`, `discount_fixed` |
| reward_value | decimal(10,2), nullable | Discount % or fixed amount (null for free_product) |
| reward_product_id | FK → services, nullable | Specific product given as reward (when reward_type = free_product) |
| reward_description | string, nullable | e.g., "FREE 5-gallon refill" |
| stamp_expiry_days | integer, nullable | Days before unused stamps expire (null = never) |
| reward_expiry_days | integer, nullable | Days after earning before reward expires (null = never) |
| is_active | boolean | Only one active program per merchant |
| created_at, updated_at | timestamps | |

### Table: `loyalty_cards` (Customer ↔ Merchant bridge)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| customer_id | FK → customers | |
| merchant_id | FK → merchants | |
| loyalty_program_id | FK → loyalty_programs | |
| current_stamps | integer, default 0 | Stamps in current cycle (resets to 0 on reward unlock) |
| total_stamps_earned | integer, default 0 | Lifetime stamps (never resets) |
| total_rewards_earned | integer, default 0 | Total rewards unlocked |
| total_rewards_redeemed | integer, default 0 | Total rewards used |
| last_stamp_at | timestamp, nullable | For expiry calculation |
| created_at, updated_at | timestamps | |

**Unique constraint:** `[customer_id, merchant_id]` — one card per customer per merchant

### Table: `loyalty_stamp_qr_codes` (QR codes with two modes)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| merchant_id | FK → merchants | |
| loyalty_program_id | FK → loyalty_programs | |
| token | string(64), unique | Cryptographically random token encoded in QR |
| mode | enum | `single_use`, `daily` |
| expires_at | timestamp | Single-use: created_at + 2 min. Daily: end of day (23:59:59). |
| is_used | boolean, default false | Single-use only: set true after scan. Daily: always false. |
| scanned_by | FK → customers, nullable | Single-use only: customer who scanned |
| scanned_at | timestamp, nullable | Single-use only: when scanned |
| scan_count | integer, default 0 | Daily: tracks how many unique customers scanned |
| created_by | FK → users | Merchant user who generated |
| created_at | timestamp | |

**Single-use lifecycle:** Generated → (within 2 min) 1 scan → Consumed.
**Daily lifecycle:** Generated → Valid until 23:59:59 → Multiple customers scan (1 per customer per merchant per day) → Expires at midnight.

### Table: `loyalty_stamp_qr_scans` (Daily QR per-customer tracking)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| qr_code_id | FK → loyalty_stamp_qr_codes | |
| customer_id | FK → customers | |
| scanned_at | timestamp | |

**Purpose:** Only used for daily QR mode. Tracks which customers have scanned a daily QR.
**Daily dedup:** Before awarding stamp, check: `loyalty_stamps WHERE loyalty_card.merchant_id = ? AND DATE(earned_at) = today AND source = 'qr_scan'`. This enforces 1 stamp per customer per merchant per day regardless of how many daily QRs exist.

### Table: `loyalty_stamps` (Audit trail for each stamp earned)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| loyalty_card_id | FK → loyalty_cards | |
| qr_code_id | FK → loyalty_stamp_qr_codes, nullable | Which QR was scanned (null for bonus stamps) |
| source | enum | `qr_scan`, `bonus` |
| notes | string, nullable | Reason for bonus stamp |
| awarded_by | FK → users, nullable | Merchant user who awarded bonus stamp |
| earned_at | timestamp | |
| expires_at | timestamp, nullable | Calculated from program.stamp_expiry_days |
| expired | boolean, default false | Set true when stamp expires |

### Table: `loyalty_rewards` (Earned rewards available for redemption)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| loyalty_card_id | FK → loyalty_cards | |
| loyalty_program_id | FK → loyalty_programs | |
| reward_type | enum | Snapshot from program at earn time |
| reward_value | decimal(10,2), nullable | Snapshot from program |
| reward_product_id | FK → services, nullable | Snapshot from program |
| reward_description | string | Snapshot from program |
| status | enum | `available`, `redeemed`, `expired` |
| earned_at | timestamp | |
| expires_at | timestamp, nullable | Calculated from program.reward_expiry_days |
| redeemed_at | timestamp, nullable | |
| redeemed_on_type | string, nullable | Polymorphic: which transaction redeemed it |
| redeemed_on_id | bigint, nullable | |
| created_at, updated_at | timestamps | |

## Architecture

### Backend (Service-Repository Pattern)

```
LoyaltyProgram:
  Route → LoyaltyProgramController → FormRequest → LoyaltyProgramData (DTO)
  → LoyaltyProgramService → LoyaltyProgramRepository → Model

LoyaltyCard + Stamps + QR + Rewards:
  Route → LoyaltyController (merchant QR + cards) / CustomerLoyaltyController (customer scan + cards)
  → LoyaltyService (business logic for QR gen, scan, bonus, reward unlock/redeem)
  → LoyaltyCardRepository, LoyaltyRewardRepository (data access)
```

### Stamp Earning: QR Code Flow (Primary Method)

**Stamps are earned by scanning QR codes.** Two modes available. No hooks into existing transaction services needed. Completely decoupled from order/booking/reservation lifecycle.

#### Merchant Generates QR

```
POST /auth/merchant/loyalty/generate-qr  { mode: "single_use" | "daily" }
→ LoyaltyService::generateStampQR(merchantId, mode)
→ Creates LoyaltyStampQrCode record with:
  - token: Str::random(64)
  - mode: single_use | daily
  - expires_at: single_use → now()->addMinutes(2)
               daily → now()->endOfDay()  // 23:59:59
→ Returns { token, qr_url, expires_at, mode }
```

QR encodes a URL: `{APP_URL}/loyalty/scan/{token}` — customer portal app intercepts this as a deep link.

**UX notes:**
- Single-use mode: After QR is scanned or expires, auto-show "Generate Next" button.
- Daily mode: Show QR prominently with "Valid until end of day" label. Merchant can print/display it. Show live scan count.

#### Customer Scans QR

```
POST /customer/loyalty/scan  { token: "abc123..." }
→ LoyaltyService::scanStampQR(token, customerId)
```

**LoyaltyService::scanStampQR(token, customerId) flow:**
1. Find QR by token → 404 if not found
2. Check `expires_at > now()` → 410 Gone "QR code has expired"
3. Get merchant's active loyalty program from QR → 404 if program deactivated
4. Get customer via `Customer::where('user_id', $customerId)->firstOrFail()`
5. **Mode-specific validation:**

   **If mode = `single_use`:**
   - Atomically: `UPDATE ... SET is_used=true, scanned_by=?, scanned_at=now() WHERE id=? AND is_used=false`
   - If 0 rows updated → 409 "QR code already used"

   **If mode = `daily`:**
   - Check: has this customer already earned a QR-based stamp from this merchant today?
     `LoyaltyStamp::whereHas('loyaltyCard', fn($q) => $q->where('merchant_id', $merchantId))->where('source', 'qr_scan')->whereDate('earned_at', today())->exists()`
   - If yes → 409 "You already earned a stamp from this merchant today"
   - Record scan in `loyalty_stamp_qr_scans` table
   - Increment QR's `scan_count`

6. Get or create LoyaltyCard for this customer + merchant
7. Create LoyaltyStamp record (source=`qr_scan`, qr_code_id=QR.id)
8. Increment `loyalty_card.current_stamps` and `total_stamps_earned`
9. If `current_stamps >= program.required_stamps` → unlock reward:
    - Create LoyaltyReward record (snapshot program values at this moment)
    - Increment `loyalty_card.total_rewards_earned`
    - Reset `loyalty_card.current_stamps` to 0
10. Return { stamp, card_progress, reward_unlocked? }

### Stamp Earning: Bonus Stamps (Fallback Method)

```
POST /auth/merchant/loyalty-cards/{cardId}/stamp  { notes: "Birthday bonus" }
→ LoyaltyService::awardBonusStamp(cardId, notes)
```

**LoyaltyService::awardBonusStamp(cardId, notes) flow:**
1. Find loyalty card → verify it belongs to merchant's program
2. Create LoyaltyStamp record (source=`bonus`, qr_code_id=null, awarded_by=auth user)
3. Same increment + reward unlock logic as QR flow

### Reward Redemption at Checkout

At checkout (order/booking/reservation creation), customer can apply an available reward:

```
CustomerPortalController::createOrder(request)
  → request includes optional `loyalty_reward_id`
  → LoyaltyService::redeemReward(rewardId, customerId)
  → Validates: reward belongs to customer, status=available, not expired
  → Returns discount info based on reward_type:
     - free_product: service price becomes 0
     - discount_percentage: reduces total by reward_value %
     - discount_fixed: reduces total by reward_value amount
  → After transaction creation, marks reward as redeemed with polymorphic reference
```

**Note:** If `reward_type = free_product` and the reward product is deactivated (`is_active = false`), show customer a message: "This reward product is currently unavailable. Please contact the merchant." Don't auto-expire the reward — let merchant reactivate or customer wait.

### Program Deactivation Rules

When a merchant deactivates their loyalty program:
- **Cards with stamps in progress:** Frozen. Stamps remain but no new stamps can be earned.
- **Earned but unredeemed rewards:** Stay `available` until their expiry date. Customer can still redeem.
- **QR codes:** All unexpired QR codes for this program become invalid (scan returns 404 "program deactivated").
- **New program:** If merchant creates a new program later, existing cards do NOT carry over. Fresh start.

### Cancellation Handling

Since stamps are earned via QR scan (completely decoupled from transactions), **transaction cancellation has zero loyalty impact**. The stamp was earned by physical presence + scan, not by placing an order. No reversal logic needed.

### API Endpoints

**Admin/Merchant — Loyalty Program Management:**
```
GET    /auth/merchant/loyalty-program              → Get my loyalty program
POST   /auth/merchant/loyalty-program              → Create/update loyalty program
DELETE /auth/merchant/loyalty-program              → Deactivate program
```

**Admin/Merchant — QR Code + Cards:**
```
POST   /auth/merchant/loyalty/generate-qr          → Generate QR code (body: { mode: "single_use" | "daily" })
GET    /auth/merchant/loyalty-cards                → List customer loyalty cards for my merchant
GET    /auth/merchant/loyalty-cards/{id}           → View specific customer's card + stamp history + rewards
POST   /auth/merchant/loyalty-cards/{id}/stamp     → Award bonus stamp to customer (manual)
```

**Admin — Full CRUD (super-admin):**
```
GET    /merchants/{merchant}/loyalty-program       → View merchant's program
PUT    /merchants/{merchant}/loyalty-program       → Update merchant's program
```

**Customer Portal:**
```
POST   /customer/loyalty/scan                      → Scan QR token to earn stamp
GET    /customer/loyalty-cards                     → My loyalty cards across all merchants
GET    /customer/loyalty-cards/{id}                → My card detail + stamp history + rewards
GET    /customer/loyalty-rewards                   → My available rewards (for checkout selection)
```

**Storefront (Public):**
```
GET    /storefront/merchants/{slug}                → Already exists; add loyalty_program to response
```

### Frontend

**Customer Portal (`frontend-customer-portal/`):**
- **QR Scanner page** (`/loyalty/scan`) — Camera-based QR scanner using device camera
- **Deep link handler** — `/loyalty/scan/{token}` URL from QR redirects to scan API call
- Loyalty card UI on customer dashboard (stamp progress visual: filled/empty circles)
- Loyalty cards list page (`/loyalty`) — all my cards across merchants
- Card detail page with stamp history
- Reward selection during checkout (booking/order/reservation forms)
- Loyalty program info on merchant detail page (storefront)

**Admin Frontend (`frontend/`):**
- **QR Generator** on my-store loyalty page — Mode selector (Single-use / Daily), countdown timer for single-use, "Valid until end of day" for daily, live scan count for daily mode, auto-prompts "Generate Next" for single-use after scan/expiry
- Loyalty program setup/config page (`/my-store/loyalty`)
- Customer loyalty cards list (see progress, award bonus stamps)
- QR generation history/stats

### Permissions

```
loyalty_programs.view
loyalty_programs.create
loyalty_programs.update
loyalty_programs.delete
loyalty_cards.view              (merchant views their customer cards)
loyalty_stamps.create           (merchant generates QR / awards bonus stamps)
customer_portal.view_loyalty    (customer views own cards)
customer_portal.scan_loyalty    (customer scans QR to earn stamp)
```

## Open Questions

1. **Stamp expiry implementation:** Scheduled job (artisan command) or lazy check on API call? Recommend: lazy check (filter expired stamps when calculating card progress) + optional scheduled job for sending expiry warnings.
2. **QR scanner library:** Which library for camera-based QR scanning? Options: `html5-qrcode` (lightweight, proven), `@yudiel/react-qr-scanner` (React wrapper), or native MediaDevices API. Recommend: decide during implementation.
3. **QR deep link format:** Web URL recommended (`{CUSTOMER_PORTAL_URL}/loyalty/scan/{token}`). Customer portal intercepts the route, extracts token, calls API. Works in any browser without app installation.
4. **Free product reward at checkout:** When customer selects a `free_product` reward, auto-populate the service (reward product) with price=0. If merchant's reward product has variants, customer picks the variant. For MVP, simplest: reward = specific service at zero price.

### Resolved Questions
- ~~Retroactive stamps~~ — Not applicable. QR-based stamps are forward-only.
- ~~Cancellation reversal~~ — Not needed. Stamps decoupled from transactions.
- ~~Card auto-creation~~ — Auto-created on first QR scan.
- ~~Qualifying transaction types/amounts~~ — Removed. Merchant decides when to show QR.
- ~~Stamp carry-over~~ — Reset to 0 on reward unlock. No carry-over.
- ~~Multiple programs~~ — 1 active program per merchant.
- ~~Program deactivation~~ — Cards frozen, earned rewards stay valid, QR codes invalidated, no carry-over to new program.
- ~~Reward product deactivated~~ — Reward stays available, show "product unavailable" message, don't auto-expire.

## Next Steps

- [ ] Create implementation plan with `/plan`
- [ ] Phase 1: Backend — Models, migrations, factories, repositories (5 models)
- [ ] Phase 2: Backend — LoyaltyProgramService (CRUD) + LoyaltyService (QR gen, scan, bonus, reward unlock)
- [ ] Phase 3: Backend — Reward redemption integration at checkout
- [ ] Phase 4: Backend — Tests
- [ ] Phase 5: Admin Frontend — Loyalty program setup + QR generator with countdown
- [ ] Phase 6: Admin Frontend — Customer loyalty cards list + bonus stamp awarding
- [ ] Phase 7: Customer Portal — QR scanner + loyalty cards list + stamp progress UI
- [ ] Phase 8: Customer Portal — Reward selection at checkout
- [ ] Phase 9: Storefront — Loyalty program info on merchant detail page
