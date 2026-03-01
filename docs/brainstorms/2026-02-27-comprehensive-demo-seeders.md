# Brainstorm: Comprehensive Demo Seeders

**Date:** 2026-02-27
**Status:** Approved

## Knowledge Context

- Existing seeders cover reference data (BusinessType, PaymentMethod, DocumentType, SocialPlatform, CustomerTag, PlatformFee) and base users (super-admin, admin, manager, user)
- Factories exist for all major models with appropriate states (merchant statuses, service types, booking/reservation/order workflows)
- Model defaults use `$attributes` array (not DB defaults) — Eloquent `Model::create()` doesn't pick up DB defaults
- Capability flags (`can_sell_products`, `can_take_bookings`, `can_rent_units`) must be explicitly set true to enable sub-modules
- Service types: `sellable` (price), `bookable` (duration/capacity), `reservation` (price_per_night/amenities)
- ServiceCategory is per-merchant (not global), so categories must be created per merchant
- Bookings/Reservations/Orders use `customer_id` which is actually `user_id` FK, not Customer model ID
- Order numbers auto-generated as `ORD-YYYYMMDD-NNN` — must handle uniqueness in seeding
- Platform fees calculated as `fee_amount = total_price * (fee_rate / 100)`

## Problem / Goal

Create realistic demo seed data across all tables: ~50 merchants with diverse business types, full merchant profiles (business hours, social links, payment methods, addresses), appropriate services per type, ~20 customers with transaction history spanning mixed statuses, and all supporting data. The database should showcase the full platform capabilities for demos and development.

## Architecture Decision

**Modular per-domain seeders** — separate seeders by domain, called in dependency order from `DatabaseSeeder`.

## Seeder Execution Order

```
DatabaseSeeder
  1. RolePermissionSeeder          (existing - roles + permissions)
  2. UserSeeder                     (existing - super-admin, admin, manager, user)
  3. PaymentMethodSeeder            (existing - 5 payment methods)
  4. DocumentTypeSeeder             (existing - 6 document types)
  5. BusinessTypeSeeder             (existing - 8 business types)
  6. SocialPlatformSeeder           (existing - 7 platforms)
  7. CustomerTagSeeder              (existing - 5 tags)
  8. PlatformFeeSeeder              (existing - 3 fee rules at 5%)
  9. FieldSeeder                    (existing - custom fields)
  ── new demo seeders below ──
  10. DemoMerchantSeeder            (NEW - ~50 merchants with full profiles)
  11. DemoCustomerSeeder            (NEW - ~20 customers with tags)
  12. DemoTransactionSeeder         (NEW - bookings, reservations, orders with mixed statuses)
```

## Merchant Distribution (~50 total)

| Business Type | Count | Capabilities | Services Per Merchant |
|---------------|-------|-------------|----------------------|
| Resort & Spa | 8 | bookings + units + products | 3-5 bookable (spa/massage), 4-8 rentable (rooms/villas), 2-3 sellable (gift shop) |
| Salon & Beauty | 8 | bookings + products | 4-6 bookable (haircut/coloring/styling/nails), 2-4 sellable (products) |
| Pet Services | 6 | bookings + units + products | 2-4 bookable (grooming/vet), 2-4 rentable (pet hotel), 3-5 sellable (food/supplies) |
| Barbershop | 6 | bookings + products | 3-5 bookable (haircut/shave/beard), 1-3 sellable (grooming products) |
| Flower Shop | 6 | products only | 5-8 sellable (bouquets/arrangements/gifts) |
| Camping & Glamping | 5 | bookings + units | 2-3 bookable (guided tours/activities), 3-5 rentable (tents/cabins/sites) |
| Restaurant & Cafe | 5 | bookings + products | 1-2 bookable (table reservations), 5-10 sellable (menu items/catering) |
| Fitness & Gym | 3 | bookings | 4-6 bookable (personal training/classes/sessions) |
| Photography Studio | 3 | bookings + products | 3-5 bookable (photo sessions), 2-3 sellable (prints/packages) |

**Total: ~50 merchants, ~300+ services**

## Merchant Profile Sub-Data

Each merchant gets:
- **Business hours**: Mon-Sat 8am-6pm (resorts: 24/7, restaurants: 10am-10pm, salons: 9am-7pm)
- **Payment methods**: 2-4 random from seeded payment methods (sync pivot)
- **Social links**: 2-3 random platforms (Facebook + Instagram always, plus 0-1 random)
- **Address**: Philippine addresses with PSGC geographic data (Region→Province→City→Barangay FKs)
- **Service categories**: 2-4 per merchant matching their business type
- **Service schedules**: Weekly schedules for bookable services (matching merchant business hours)

## Merchant Statuses

| Status | Count | Notes |
|--------|-------|-------|
| Active | 40 | Main demo merchants |
| Approved | 4 | Just approved, not yet active |
| Pending | 3 | New applications |
| Suspended | 2 | Suspended merchants |
| Rejected | 1 | Rejected application |

## Customer Data (~20 customers)

- Each customer: User account with `customer` role + Customer record
- Random customer tags assigned (1-3 tags each)
- Mix of individual and corporate customers
- All with `active` status (1-2 suspended for variety)

## Transaction Data (Mixed Statuses)

### Bookings (~60-80 total)
| Status | % | Count |
|--------|---|-------|
| Pending | 15% | ~10 |
| Confirmed | 25% | ~18 |
| Completed | 40% | ~28 |
| Cancelled | 10% | ~7 |
| No Show | 10% | ~7 |

- Spread across resort spa services, salon appointments, pet grooming, barbershop, fitness sessions
- Dates: past 30 days (completed/no_show/cancelled) + next 14 days (pending/confirmed)
- Platform fees calculated on each

### Reservations (~30-40 total)
| Status | % | Count |
|--------|---|-------|
| Pending | 15% | ~5 |
| Confirmed | 20% | ~7 |
| Checked In | 10% | ~4 |
| Checked Out | 35% | ~12 |
| Cancelled | 20% | ~7 |

- Resort rooms/villas, pet hotel stays, camping sites
- 1-7 night stays, guest counts matching capacity
- Past dates for checked_out, future dates for pending/confirmed

### Service Orders (~40-50 total)
| Status | % | Count |
|--------|---|-------|
| Pending | 10% | ~5 |
| Received | 10% | ~5 |
| Processing | 10% | ~5 |
| Ready | 10% | ~5 |
| Delivering | 5% | ~2 |
| Completed | 40% | ~18 |
| Cancelled | 15% | ~7 |

- Flower orders, pet supplies, salon products, gift shop items, restaurant orders
- Auto-generated order numbers (ORD-YYYYMMDD-NNN)
- Platform fees calculated on each

## Gotchas to Handle

1. **Capability flags**: Must match BusinessType — set explicitly on Merchant model, don't rely on factory defaults (all false)
2. **ServiceCategory scoping**: Create categories per merchant, not globally. Service's `service_category_id` must belong to same merchant
3. **Service type alignment**: Bookable services need `duration` + `max_capacity`. Rentable need `price_per_night` + `amenities`. Sellable need `price` + optional `sku`/`stock_quantity`
4. **customer_id = user_id**: Transaction tables use `customer_id` FK pointing to `users.id`, not `customers.id`
5. **Order number uniqueness**: Use sequential counter in seeder to avoid collision
6. **PSGC geo data**: Must seed from actual PSGC tables (regions/provinces/cities/barangays) — pick real Philippine locations
7. **Status transitions**: Don't randomly assign — respect `VALID_TRANSITIONS` map (e.g., can't go from pending→checked_out)
8. **Booking time slots**: Must align with service schedules. Bookable services need ServiceSchedule records
9. **Platform fees**: Use `PlatformFee::where('transaction_type', $type)->where('is_active', true)->first()` to get current rate

## Next Steps

- [ ] Create `DemoMerchantSeeder` — merchants with full profiles, service categories, services, schedules
- [ ] Create `DemoCustomerSeeder` — customer users with Customer records and tags
- [ ] Create `DemoTransactionSeeder` — bookings, reservations, orders with mixed statuses and fees
- [ ] Update `DatabaseSeeder` to call new seeders
- [ ] Test full seed: `docker compose exec app php artisan migrate:fresh --seed`
