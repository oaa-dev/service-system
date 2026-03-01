# Plan: Comprehensive Demo Seeders

**Date:** 2026-02-27
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-02-27-comprehensive-demo-seeders.md](../brainstorms/2026-02-27-comprehensive-demo-seeders.md)

## Knowledge Context

### Known Gotchas
1. **Capability flags default to false** — MerchantFactory sets all 3 caps to false. Must explicitly set `can_sell_products`, `can_take_bookings`, `can_rent_units` per business type
2. **MerchantFactory has no business_type_id** — Must set it explicitly in seeder
3. **ServiceCategory is per-merchant** — Cannot reuse categories across merchants; must create per merchant
4. **customer_id = user_id** — Booking/Reservation/ServiceOrder `customer_id` FK points to `users.id`, not `customers.id`
5. **Order number uniqueness** — ServiceOrderFactory generates `ORD-YYYYMMDD-NNN`; use sequential counter to avoid collision
6. **PSGC data partial** — Only 17 regions, 9 provinces, 160 cities, 3927 barangays seeded; pick from existing data
7. **Service slug auto-generated** — Model boot hook creates slug from name if empty; no need to set manually
8. **BusinessTypeSeeder has no capability flags** — Current seeder creates 8 generic types (Restaurant, Retail, etc.) without setting any capability flags. Need to update with specific business types and set capabilities

### Critical Patterns Applied
- Use `firstOrCreate` for idempotency on reference data seeders
- Use model factories for transactional data
- Use `$merchant->updateOrCreateAddress()` from HasAddress trait for addresses
- Assign roles via `$user->assignRole('merchant')` (Spatie)

## Overview

Create 3 new seeders + update BusinessTypeSeeder to populate the database with ~50 merchants across 9 business types, full merchant profiles, ~20 customers, and ~150+ transactions with mixed statuses. Also update DatabaseSeeder to call new seeders.

## Pre-Implementation: Update BusinessTypeSeeder

### Step 0: Update BusinessTypeSeeder with domain-specific types and capabilities
- **Files:** `database/seeders/BusinessTypeSeeder.php`
- **Details:** Replace 8 generic types with 9 specific types that map to real business domains with correct capability flags:

```
Resort & Spa       → can_take_bookings=true, can_rent_units=true, can_sell_products=true
Salon & Beauty     → can_take_bookings=true, can_sell_products=true
Pet Services       → can_take_bookings=true, can_rent_units=true, can_sell_products=true
Barbershop         → can_take_bookings=true, can_sell_products=true
Flower Shop        → can_sell_products=true
Camping & Glamping → can_take_bookings=true, can_rent_units=true
Restaurant & Cafe  → can_take_bookings=true, can_sell_products=true
Fitness & Gym      → can_take_bookings=true
Photography Studio → can_take_bookings=true, can_sell_products=true
```

- **Knowledge note:** BusinessType model has `can_sell_products`, `can_take_bookings`, `can_rent_units` boolean fields. These are copied to Merchant on creation and independently editable after

## Implementation Steps

### Step 1: Create DemoMerchantSeeder
- **Files:** `database/seeders/DemoMerchantSeeder.php`
- **Details:** Creates ~50 merchants with full profiles. For each merchant:
  1. Create User with `merchant` role + `email_verified_at`
  2. Create Merchant with `business_type_id`, capability flags copied from BusinessType, status distribution (40 active, 4 approved, 3 pending, 2 suspended, 1 rejected)
  3. Create Address using `$merchant->updateOrCreateAddress()` with real PSGC data (random from existing regions/provinces/cities/barangays)
  4. Create BusinessHours (Mon-Sat schedules, varies by type: resorts 24/7, salons 9-7, restaurants 10-10)
  5. Sync PaymentMethods (2-4 random from seeded payment methods)
  6. Create SocialLinks (Facebook + Instagram always, plus 0-1 random)
  7. Create ServiceCategories (2-4 per merchant, named for their business type)
  8. Create Services under appropriate categories (sellable/bookable/reservation matching capabilities)
  9. Create ServiceSchedules for bookable services (matching business hours)

- **Data structure:** Define merchant configurations as a keyed array per business type with:
  - Business type slug
  - Count of merchants
  - Capability flags
  - Service category templates (name + service list per category)
  - Business hours template

- **Knowledge note:** Must NOT use factory defaults for capabilities (all false). Set explicitly per business type.

### Step 2: Create DemoCustomerSeeder
- **Files:** `database/seeders/DemoCustomerSeeder.php`
- **Details:** Creates ~20 customer users:
  1. Create User with `customer` role + `email_verified_at`
  2. Create Customer record linked to user (mix of individual/corporate, 18 active + 2 suspended)
  3. Attach 1-3 random CustomerTags via sync
  4. Use realistic Filipino names via Faker

- **Knowledge note:** Customer model has `user_id` FK. Transactions use `customer_id` pointing to `users.id` (the User, not Customer model).

### Step 3: Create DemoTransactionSeeder
- **Files:** `database/seeders/DemoTransactionSeeder.php`
- **Details:** Creates transactions across active merchants only. Queries seeded data to build relationships.

  **Bookings (~70):**
  - Get all active merchants with `can_take_bookings=true` and their bookable services
  - Random customer from seeded customers
  - Status distribution: 10 pending, 18 confirmed, 28 completed, 7 cancelled, 7 no_show
  - Completed/no_show/cancelled: booking_date in past 30 days
  - Pending/confirmed: booking_date in next 14 days
  - Time slots: 1-hour blocks within service schedule hours
  - Fees: lookup active PlatformFee for `booking` type, calculate fee_amount + total_amount

  **Reservations (~35):**
  - Get all active merchants with `can_rent_units=true` and their reservation services
  - Status distribution: 5 pending, 7 confirmed, 4 checked_in, 12 checked_out, 7 cancelled
  - Checked_out: check_in/check_out in past; checked_in: check_in=today; pending/confirmed: future dates
  - Pricing: use service's `price_per_night` * nights
  - Fees: lookup active PlatformFee for `reservation` type

  **Service Orders (~45):**
  - Get all active merchants with `can_sell_products=true` and their sellable services
  - Status distribution: 5 pending, 5 received, 5 processing, 5 ready, 2 delivering, 18 completed, 5 cancelled
  - Order numbers: sequential `ORD-YYYYMMDD-001`, `ORD-YYYYMMDD-002`, etc.
  - Quantity/unit based on service type (flowers: stems/pcs, pet supplies: kg/pcs, products: pcs)
  - Fees: lookup active PlatformFee for `sell_product` type

  **Timestamps per status:**
  - Booking: `confirmed_at` for confirmed+completed, `cancelled_at` for cancelled
  - Reservation: `confirmed_at`, `checked_in_at`, `checked_out_at`, `cancelled_at` as appropriate
  - ServiceOrder: `received_at`, `completed_at`, `cancelled_at` as appropriate

- **Knowledge note:** Order numbers must be unique. Use a counter variable in the seeder, not faker->unique().

### Step 4: Update DatabaseSeeder
- **Files:** `database/seeders/DatabaseSeeder.php`
- **Details:** Add 3 new seeders after existing reference data seeders:
  ```php
  $this->call([
      // ...existing seeders...
      DemoMerchantSeeder::class,
      DemoCustomerSeeder::class,
      DemoTransactionSeeder::class,
  ]);
  ```

### Step 5: Test Full Seed
- **Command:** `docker compose exec app php artisan migrate:fresh --seed`
- **Verify:**
  - ~50 merchants created with correct business types + capabilities
  - Each merchant has address, business hours, payment methods, social links
  - Services exist per merchant matching their capabilities
  - ~20 customers with tags
  - ~150 transactions with mixed statuses and calculated fees
  - No unique constraint violations
  - No FK constraint violations

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| PSGC data not seeded | Medium | Check Region::count() > 0 at start of DemoMerchantSeeder; skip addresses if empty |
| Slug uniqueness collision | Medium | Use Faker::unique() for merchant names; add counter suffix if needed |
| Order number collision | High | Use sequential counter instead of random faker numbers |
| Memory exhaustion on large seed | Low | Use chunk processing; don't eager-load unnecessary relations |
| Service schedule mismatch with bookings | Medium | Seeder reads actual service schedules when creating bookings |

## Testing Strategy

- [ ] `php artisan migrate:fresh --seed` runs without errors
- [ ] Verify merchant counts per business type via tinker
- [ ] Verify capability flags match business type on each merchant
- [ ] Verify each active merchant has: address, business hours, payment methods, social links, services
- [ ] Verify bookable services have schedules
- [ ] Verify transaction status distribution roughly matches plan
- [ ] Verify all transactions have correct fee calculations
- [ ] Verify customer portal can browse merchants and see services
- [ ] Verify admin dashboard shows data in list views

## Open Questions

None — all requirements clarified in brainstorm.
