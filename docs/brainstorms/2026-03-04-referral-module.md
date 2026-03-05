# Brainstorm: Referral Module (Merchant & Customer)

**Date:** 2026-03-04
**Status:** Draft

## Knowledge Context

- **Loyalty Program module** is the closest pattern — per-merchant program, customer-facing actions, dual-controller architecture, reward tracking
- **Customer FK pattern** is critical: `referrer_id` and `referee_id` must FK to `customers` table (NOT `users`). Resolve via `Customer::where('user_id', auth()->id())`
- **Dual-controller pattern**: MerchantReferralController (self-service at `/auth/merchant/`), CustomerReferralController (at `/customer/`), admin CRUD at `/merchants/{merchant}/`
- **Polymorphic reward tracking**: Same pattern as LoyaltyReward — link rewards to Booking/Reservation/ServiceOrder via morphTo
- No existing referral solutions in knowledge base — this is a new module

## Problem / Goal

Enable customer acquisition through word-of-mouth referrals. Merchants create referral programs with configurable rewards. Customers share unique invite codes. When a referee completes their first transaction, both referrer and referee earn discount/credit rewards.

## Decisions Made

| Dimension | Choice |
|-----------|--------|
| Referral Type | Customer-to-Customer |
| Reward Type | Discount/Credit (percentage or fixed amount) |
| Code Scope | Per-Customer unique codes per merchant |
| Reward Target | Both referrer and referee |
| Program Scope | Per-Merchant (each merchant manages own program) |
| Trigger Event | First completed transaction by referee |

## Data Model

### ReferralProgram (per-merchant, 1-to-1 active)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| merchant_id | FK merchants | |
| name | string | e.g., "Refer a Friend" |
| description | text nullable | |
| referrer_reward_type | enum: percentage, fixed | |
| referrer_reward_value | decimal(10,2) | e.g., 10.00 (10% or PHP 10) |
| referee_reward_type | enum: percentage, fixed | |
| referee_reward_value | decimal(10,2) | |
| max_referrals_per_customer | int nullable | null = unlimited |
| code_expiry_days | int default 30 | days until invite code expires |
| is_active | boolean default true | |
| starts_at | datetime nullable | |
| ends_at | datetime nullable | |
| timestamps | | |

### ReferralCode (per-customer per-program)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| referral_program_id | FK referral_programs | |
| customer_id | FK customers | the referrer |
| code | string unique | 8-char alphanumeric, URL-safe |
| uses_count | int default 0 | denormalized counter |
| max_uses | int nullable | null = follows program default |
| expires_at | datetime nullable | |
| is_active | boolean default true | |
| timestamps | | |

### Referral (tracks each referral event)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| referral_code_id | FK referral_codes | |
| referral_program_id | FK referral_programs | denormalized for queries |
| referrer_customer_id | FK customers | who referred |
| referee_customer_id | FK customers | who was referred |
| status | enum: pending, completed, expired, cancelled | |
| completed_at | datetime nullable | when trigger event occurred |
| qualifying_type | string nullable | morph type (booking/reservation/service_order) |
| qualifying_id | bigint nullable | morph ID |
| timestamps | | |

### ReferralReward (tracks rewards for both sides)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| referral_id | FK referrals | |
| customer_id | FK customers | who earns this reward |
| reward_type | enum: percentage, fixed | |
| reward_value | decimal(10,2) | |
| status | enum: pending, available, redeemed, expired | |
| redeemed_at | datetime nullable | |
| redeemed_on_type | string nullable | morph type |
| redeemed_on_id | bigint nullable | morph ID |
| expires_at | datetime nullable | |
| timestamps | | |

## Architecture

### Backend (Service-Repository Pattern)

**Models**: ReferralProgram, ReferralCode, Referral, ReferralReward
**Services**:
- `ReferralProgramService` — CRUD for merchant referral program setup (upsert like loyalty)
- `ReferralService` — Code generation, referral acceptance, reward tracking, completion logic

**Controllers**:
- `ReferralProgramController` — Admin CRUD at `/merchants/{merchant}/referral-program`
- `MyReferralProgramController` — Merchant self-service at `/auth/merchant/referral-program`
- `CustomerReferralController` — Customer actions at `/customer/referrals/`

**Key Flows**:

1. **Merchant Setup**: Create/update referral program with reward config
2. **Code Generation**: Customer visits merchant → auto-generates unique code (or on-demand)
3. **Code Sharing**: Customer shares code via link/QR
4. **Referee Signup**: New customer registers or uses code at checkout
5. **Trigger**: Referee completes first booking/reservation/order with merchant
6. **Reward Unlock**: Both referrer and referee get ReferralReward (status: available)
7. **Redemption**: Rewards applied as discount on next transaction

### API Endpoints

**Merchant Self-Service** (`/auth/merchant/referral-program`):
- `GET /` — View own referral program
- `POST /` — Create/update referral program (upsert)
- `GET /referrals` — List all referrals for own merchant
- `GET /stats` — Referral statistics (total, completed, conversion rate)

**Customer** (`/customer/referrals`):
- `GET /my-codes` — List own referral codes (one per merchant with active program)
- `POST /generate-code/{merchantSlug}` — Generate referral code for a merchant
- `GET /my-referrals` — List people I've referred + status
- `GET /my-rewards` — List earned rewards + status
- `POST /accept/{code}` — Accept/register via referral code
- `POST /redeem/{rewardId}` — Redeem a reward (apply to transaction)

**Storefront** (public):
- `GET /storefront/referral/{code}` — Validate referral code, return merchant info

**Admin** (`/merchants/{merchant}/referral-program`):
- Full CRUD for managing merchant referral programs

### Frontend

**Admin** (`/my-store/referral-program`):
- Program setup form (reward amounts, limits, expiry)
- Referral analytics dashboard (total referrals, conversion rate, top referrers)
- Referral list with statuses

**Customer Portal** (`/referrals`):
- My referral codes with share buttons (copy link, QR)
- My referrals sent (status tracking)
- My rewards (available, redeemed, expired)
- Referral code entry during checkout flow

### Permissions
- `referral_programs.view` / `referral_programs.create` / `referral_programs.update` / `referral_programs.delete` — merchant/admin
- `customer_portal.referral` — customer referral actions

## Approach: Reward Completion Trigger

When a Booking/Reservation/ServiceOrder transitions to `completed` status, the service layer checks:
1. Does the customer (referee) have a pending Referral with this merchant?
2. Is this their first completed transaction?
3. If yes → mark Referral as `completed`, create ReferralReward records for both parties

This hooks into existing status transition logic in BookingService/ReservationService/ServiceOrderService — add a `checkReferralCompletion()` call after successful status change to `completed`.

## Open Questions

- [ ] Should referral rewards have an expiry date? (e.g., 90 days to redeem)
- [ ] Should the referral code be displayed on the merchant storefront page automatically?
- [ ] Should we support "referral tiers" (e.g., 5 referrals = gold referrer with better rewards)?
- [ ] How does the discount actually apply at checkout? (automatic vs manual code entry)
- [ ] Should merchants see which customer referred whom? (privacy consideration)
- [ ] Should there be a platform-level referral leaderboard or is it merchant-scoped only?

## Next Steps

- [ ] Finalize open questions
- [ ] Create implementation plan with `/plan`
- [ ] Phase 1: Backend models, migrations, services, controllers, tests
- [ ] Phase 2: Admin frontend (merchant program setup + referral dashboard)
- [ ] Phase 3: Customer portal (code sharing, reward tracking, checkout integration)
