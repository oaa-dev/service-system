# Platform Convenience Fee Module

## Context

The marketplace system currently has three transaction types (Bookings, Reservations, Service Orders) but none of them apply any platform/convenience fees. This module adds an admin-managed fee configuration system that automatically calculates and applies a percentage-based convenience fee to every transaction. The fee is paid by the customer (added on top of the subtotal).

**Current state:** Bookings have NO monetary fields. Reservations have `total_price = nights * price_per_night`. Service Orders have `total_price = quantity * unit_price`. No fee infrastructure exists.

### Design Decisions

1. **Customer pays** -- Fee is added on top of the subtotal. Customer sees: Subtotal + Convenience Fee = Total Amount. Merchant receives the subtotal.
2. **All transaction types** -- Bookings (need to add pricing), Reservations, and Service Orders.
3. **Admin-managed DB table** -- PlatformFee model with full CRUD. Different rates per transaction type. Can be changed without code deploy.
4. **Percentage only** -- Simple percentage calculation (e.g., 5% of subtotal). Scales with transaction value.
5. **One active fee per type** -- Only one PlatformFee record can be active per `transaction_type` at a time (enforced in service layer).
6. **Additive columns** -- Existing `total_price` fields are kept as-is (they represent the subtotal). New `fee_rate`, `fee_amount`, `total_amount` columns are added alongside.
7. **Fee snapshot** -- The fee rate at time of transaction creation is stored on the record. Changing the PlatformFee rate does not retroactively affect existing transactions.

---

## Phase 1: PlatformFee Reference Data Module (Backend + Frontend)

Admin-managed CRUD following the PaymentMethod reference data pattern.

### Database: `platform_fees`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | varchar(255) | e.g. "Booking Convenience Fee" |
| slug | varchar(255) | unique, auto-generated |
| description | text | nullable |
| transaction_type | enum | booking / reservation / service_order |
| rate_percentage | decimal(5,2) | e.g. 5.00 = 5% |
| is_active | boolean | default true |
| sort_order | int | default 0 |
| timestamps | | |

**Uniqueness:** Only one active fee per `transaction_type`. When activating a fee, any other active fee for the same transaction_type gets deactivated. Enforced in service layer (MySQL doesn't support partial unique indexes).

### Backend Files

| # | File | Action |
|---|------|--------|
| 1 | `backend/database/migrations/2026_02_11_200001_create_platform_fees_table.php` | Create |
| 2 | `backend/app/Models/PlatformFee.php` | Create |
| 3 | `backend/database/factories/PlatformFeeFactory.php` | Create |
| 4 | `backend/app/Data/PlatformFeeData.php` | Create |
| 5 | `backend/app/Repositories/Contracts/PlatformFeeRepositoryInterface.php` | Create |
| 6 | `backend/app/Repositories/PlatformFeeRepository.php` | Create |
| 7 | `backend/app/Services/Contracts/PlatformFeeServiceInterface.php` | Create |
| 8 | `backend/app/Services/PlatformFeeService.php` | Create |
| 9 | `backend/app/Http/Controllers/Api/V1/PlatformFeeController.php` | Create |
| 10 | `backend/app/Http/Requests/Api/V1/PlatformFee/StorePlatformFeeRequest.php` | Create |
| 11 | `backend/app/Http/Requests/Api/V1/PlatformFee/UpdatePlatformFeeRequest.php` | Create |
| 12 | `backend/app/Http/Resources/Api/V1/PlatformFeeResource.php` | Create |
| 13 | `backend/database/seeders/PlatformFeeSeeder.php` | Create |
| 14 | `backend/tests/Feature/Api/V1/PlatformFeeControllerTest.php` | Create |
| 15 | `backend/app/Providers/RepositoryServiceProvider.php` | Modify (add 2 bindings) |
| 16 | `backend/database/seeders/RolePermissionSeeder.php` | Modify (add platform_fees permissions) |
| 17 | `backend/database/seeders/DatabaseSeeder.php` | Modify (add PlatformFeeSeeder) |
| 18 | `backend/routes/api.php` | Modify (add routes) |

### Key Service Method: `calculateFee()`

```php
public function calculateFee(string $transactionType, float $subtotal): array
{
    $fee = $this->platformFeeRepository->getActiveByTransactionType($transactionType);

    if (! $fee) {
        return ['fee_rate' => 0, 'fee_amount' => 0, 'total_amount' => $subtotal];
    }

    $feeRate = (float) $fee->rate_percentage;
    $feeAmount = round($subtotal * ($feeRate / 100), 2);

    return [
        'fee_rate' => $feeRate,
        'fee_amount' => $feeAmount,
        'total_amount' => round($subtotal + $feeAmount, 2),
    ];
}
```

### API Routes

```
GET    /api/v1/platform-fees/active                    (public -- for displaying fees in customer-facing UI)
GET    /api/v1/platform-fees/all                       (auth -- no pagination)
GET    /api/v1/platform-fees                           (permission: platform_fees.view)
POST   /api/v1/platform-fees                           (permission: platform_fees.create)
GET    /api/v1/platform-fees/{platformFee}             (permission: platform_fees.view)
PUT    /api/v1/platform-fees/{platformFee}             (permission: platform_fees.update)
DELETE /api/v1/platform-fees/{platformFee}             (permission: platform_fees.delete)
```

### Permissions

```
platform_fees.view
platform_fees.create
platform_fees.update
platform_fees.delete
```

### Seed Data

| Name | Transaction Type | Rate |
|------|-----------------|------|
| Booking Convenience Fee | booking | 5.00% |
| Reservation Convenience Fee | reservation | 5.00% |
| Service Order Convenience Fee | service_order | 5.00% |

### Frontend Files

| # | File | Action |
|---|------|--------|
| 19 | `frontend/types/api.ts` | Modify (add PlatformFee interface + request types) |
| 20 | `frontend/services/platformFeeService.ts` | Create |
| 21 | `frontend/hooks/usePlatformFees.ts` | Create |
| 22 | `frontend/lib/validations.ts` | Modify (add platform fee schemas) |
| 23 | `frontend/app/(system)/(settings)/platform-fees/page.tsx` | Create |
| 24 | `frontend/app/(system)/(settings)/platform-fees/create-platform-fee-dialog.tsx` | Create |
| 25 | `frontend/app/(system)/(settings)/platform-fees/edit-platform-fee-dialog.tsx` | Create |
| 26 | `frontend/components/layout/app-sidebar.tsx` | Modify (add Platform Fees to settings) |

### Admin UI

```
┌──────────────────────────────────────────────────────────────┐
│ Platform Fees                              [+ Create Fee]    │
│                                                              │
│ [Search...        ] [Type ▼      ] [Status ▼  ]             │
│                                                              │
│ ┌──────────────────────────┬──────────────┬──────┬────────┐  │
│ │ Name                     │ Type         │ Rate │ Active │  │
│ ├──────────────────────────┼──────────────┼──────┼────────┤  │
│ │ Booking Convenience Fee  │ Booking      │ 5.0% │   ✓    │  │
│ │ Reservation Conv. Fee    │ Reservation  │ 5.0% │   ✓    │  │
│ │ Service Order Conv. Fee  │ Service Order│ 5.0% │   ✓    │  │
│ └──────────────────────────┴──────────────┴──────┴────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Fee Columns on Transaction Tables + Service Integration

### Migration: Add fee columns to 3 tables

**Bookings** (currently has NO monetary fields -- add subtotal + fee):
- `service_price` decimal(10,2) default 0 -- snapshot of service.price at booking time (the subtotal)
- `fee_rate` decimal(5,2) default 0 -- percentage rate snapshot
- `fee_amount` decimal(10,2) default 0 -- calculated fee
- `total_amount` decimal(10,2) default 0 -- service_price + fee_amount

**Reservations** (keep existing `total_price` as subtotal, add fee fields):
- `fee_rate` decimal(5,2) default 0
- `fee_amount` decimal(10,2) default 0
- `total_amount` decimal(10,2) default 0 -- total_price + fee_amount
- Backfill existing rows: `UPDATE reservations SET total_amount = total_price`

**Service Orders** (keep existing `total_price` as subtotal, add fee fields):
- `fee_rate` decimal(5,2) default 0
- `fee_amount` decimal(10,2) default 0
- `total_amount` decimal(10,2) default 0 -- total_price + fee_amount
- Backfill existing rows: `UPDATE service_orders SET total_amount = total_price`

### Pricing Flow After Implementation

```
Booking:
  service_price = service.price (snapshot)
  fee_amount = service_price × (fee_rate / 100)
  total_amount = service_price + fee_amount

Reservation:
  total_price = nights × price_per_night (existing, unchanged)
  fee_amount = total_price × (fee_rate / 100)
  total_amount = total_price + fee_amount

Service Order:
  total_price = quantity × unit_price (existing, unchanged)
  fee_amount = total_price × (fee_rate / 100)
  total_amount = total_price + fee_amount
```

### Backend Files

| # | File | Action |
|---|------|--------|
| 27 | `backend/database/migrations/2026_02_11_200002_add_fee_columns_to_transaction_tables.php` | Create |
| 28 | `backend/app/Models/Booking.php` | Modify (add fee fields to $fillable, $casts, $attributes) |
| 29 | `backend/app/Models/Reservation.php` | Modify (add fee fields) |
| 30 | `backend/app/Models/ServiceOrder.php` | Modify (add fee fields) |
| 31 | `backend/app/Http/Resources/Api/V1/BookingResource.php` | Modify (add service_price, fee_rate, fee_amount, total_amount) |
| 32 | `backend/app/Http/Resources/Api/V1/ReservationResource.php` | Modify (add fee_rate, fee_amount, total_amount) |
| 33 | `backend/app/Http/Resources/Api/V1/ServiceOrderResource.php` | Modify (add fee_rate, fee_amount, total_amount) |
| 34 | `backend/app/Services/BookingService.php` | Modify (inject PlatformFeeService, add fee calc to createBooking) |
| 35 | `backend/app/Services/ReservationService.php` | Modify (inject PlatformFeeService, add fee calc to createReservation) |
| 36 | `backend/app/Services/ServiceOrderService.php` | Modify (inject PlatformFeeService, add fee calc to createServiceOrder) |
| 37 | `backend/database/factories/BookingFactory.php` | Modify (add fee fields + withFee state) |
| 38 | `backend/database/factories/ReservationFactory.php` | Modify (add fee fields + withFee state) |
| 39 | `backend/database/factories/ServiceOrderFactory.php` | Modify (add fee fields + withFee state) |
| 40 | `backend/tests/Feature/Api/V1/BookingControllerTest.php` | Modify (add fee calculation tests) |
| 41 | `backend/tests/Feature/Api/V1/ReservationControllerTest.php` | Modify (add fee calculation tests) |
| 42 | `backend/tests/Feature/Api/V1/ServiceOrderControllerTest.php` | Modify (add fee calculation tests) |

### Service Integration Details

**BookingService::createBooking()** -- After existing validation, before `Booking::create()`:
```php
// Inject PlatformFeeServiceInterface in constructor
$servicePrice = (float) $service->price;
$feeData = $this->platformFeeService->calculateFee('booking', $servicePrice);

$booking = Booking::create([
    // ... existing fields ...
    'service_price' => $servicePrice,
    'fee_rate' => $feeData['fee_rate'],
    'fee_amount' => $feeData['fee_amount'],
    'total_amount' => $feeData['total_amount'],
]);
```

**ReservationService::createReservation()** -- After calculating `$totalPrice`:
```php
// Inject PlatformFeeServiceInterface in constructor
$feeData = $this->platformFeeService->calculateFee('reservation', $totalPrice);

$reservation = Reservation::create([
    // ... existing fields ...
    'total_price' => $totalPrice,
    'fee_rate' => $feeData['fee_rate'],
    'fee_amount' => $feeData['fee_amount'],
    'total_amount' => $feeData['total_amount'],
]);
```

**ServiceOrderService::createServiceOrder()** -- After calculating `$totalPrice`:
```php
// Inject PlatformFeeServiceInterface in constructor
$feeData = $this->platformFeeService->calculateFee('service_order', $totalPrice);

$serviceOrder = ServiceOrder::create([
    // ... existing fields ...
    'total_price' => $totalPrice,
    'fee_rate' => $feeData['fee_rate'],
    'fee_amount' => $feeData['fee_amount'],
    'total_amount' => $feeData['total_amount'],
]);
```

### New Tests (added to existing test files)

Per transaction type (6 new tests total):
- `it calculates platform fee on creation` -- Create PlatformFee at 5%, create transaction, assert fee_rate=5.00, fee_amount calculated correctly, total_amount = subtotal + fee_amount
- `it sets zero fee when no active platform fee` -- No PlatformFee record, assert fee_rate=0, fee_amount=0, total_amount equals subtotal

---

## Phase 3: Frontend Transaction Page Updates

| # | File | Action |
|---|------|--------|
| 43 | `frontend/types/api.ts` | Modify (add fee fields to Booking, Reservation, ServiceOrder interfaces) |
| 44 | `frontend/app/(system)/(merchants)/merchants/[id]/bookings/page.tsx` | Modify (add pricing + fee display) |
| 45 | `frontend/app/(system)/(merchants)/merchants/[id]/reservations/page.tsx` | Modify (add fee breakdown) |
| 46 | `frontend/app/(system)/(merchants)/merchants/[id]/orders/page.tsx` | Modify (add fee breakdown) |

### Type Updates

```typescript
// Add to Booking interface
service_price: string;
fee_rate: string;
fee_amount: string;
total_amount: string;

// Add to Reservation interface
fee_rate: string;
fee_amount: string;
total_amount: string;

// Add to ServiceOrder interface
fee_rate: string;
fee_amount: string;
total_amount: string;
```

### Display Format

When fee > 0:
```
Subtotal: ₱500.00 + Fee (5%): ₱25.00 = Total: ₱525.00
```

When fee = 0:
```
Total: ₱500.00
```

### Booking Card (new pricing display):
```
┌──────────────────────────────────────────────┐
│ #101  Haircut                                │
│ John Doe · Feb 10, 2026 · 09:00-10:00      │
│ ₱500.00 + Fee (5%): ₱25.00 = Total: ₱525.00│
│ Status: ● Pending      [Confirm] [Cancel]   │
└──────────────────────────────────────────────┘
```

### Reservation Card (updated pricing):
```
┌──────────────────────────────────────────────┐
│ #R001  Room 201 (Deluxe)                     │
│ Jane Smith · Feb 10-13 · 3 nights · 2 guests│
│ ₱3,500/night × 3 = ₱10,500                  │
│ + Fee (5%): ₱525.00 = Total: ₱11,025.00     │
│ Status: ● Confirmed   [Check In] [Cancel]   │
└──────────────────────────────────────────────┘
```

### Service Order Card (updated pricing):
```
┌──────────────────────────────────────────────┐
│ ORD-20260210-001  Laundry Regular Wash       │
│ Maria Santos · 5.5 kg × ₱35/kg = ₱192.50   │
│ + Fee (5%): ₱9.63 = Total: ₱202.13          │
│ Status: ● Processing   [Mark Ready]          │
└──────────────────────────────────────────────┘
```

---

## File Summary

| Phase | New Files | Modified Files | Total |
|-------|-----------|----------------|-------|
| Phase 1 Backend | 14 | 4 | 18 |
| Phase 1 Frontend | 4 | 3 | 7 |
| Phase 2 Backend | 1 | 12 | 13 |
| Phase 3 Frontend | 0 | 4 | 4 |
| **Total** | **19** | **23** | **42** |

---

## Implementation Order

```
Phase 1  →  Phase 2  →  Phase 3
(PlatformFee CRUD)  (Fee columns + service integration)  (Frontend display)
```

Phase 1 must complete first (PlatformFee model and `calculateFee()` method needed by Phase 2).
Phase 2 and Phase 3 backend/frontend can overlap but Phase 3 types depend on Phase 2 migration.

---

## Verification

```bash
# Phase 1 - Backend
docker compose exec app php artisan migrate
docker compose exec app php artisan db:seed --class=PlatformFeeSeeder
docker compose exec app php artisan test --filter=PlatformFeeControllerTest

# Phase 2 - Backend (run after Phase 1)
docker compose exec app php artisan test --filter=BookingControllerTest
docker compose exec app php artisan test --filter=ReservationControllerTest
docker compose exec app php artisan test --filter=ServiceOrderControllerTest

# Frontend (after all phases)
docker compose exec nextjs npx tsc --noEmit
docker compose exec nextjs npm run lint
```
