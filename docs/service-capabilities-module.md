# Service Capabilities Module

## Overview

The Service Capabilities module extends the existing Service model to support two core business functions: **selling products** and **taking bookings**. Rather than creating separate Product and Booking entities, the unified Service model gains capability flags (`is_sellable`, `is_bookable`) with additional fields for each mode.

Capabilities are controlled at two levels:
- **BusinessType** defines default capabilities (admin-managed)
- **Merchant** inherits defaults on creation, can override independently

## Design: Hybrid Capability System (Option C)

### Inheritance Flow

```
BusinessType (defaults)
    │  can_sell_products = true
    │  can_take_bookings = false
    │
    ▼  copied on merchant creation
Merchant (independent after copy)
    │  can_sell_products = true   ← inherited
    │  can_take_bookings = true   ← admin overridden
    │
    ▼  gates what services can do
Service
       is_sellable = true   ← allowed because merchant.can_sell_products
       is_bookable = true   ← allowed because merchant.can_take_bookings
```

### Why Copy-on-Create (not nullable override)

- Simpler logic — no runtime resolution needed
- Merchant capabilities are fully independent after creation
- Changing a BusinessType's defaults doesn't retroactively affect existing merchants
- Admin can still bulk-update merchants if needed

---

## Database Schema

### 1. BusinessType Changes (existing table)

```sql
ALTER TABLE business_types
  ADD can_sell_products BOOLEAN NOT NULL DEFAULT false,
  ADD can_take_bookings BOOLEAN NOT NULL DEFAULT false;
```

| Column | Type | Notes |
|--------|------|-------|
| can_sell_products | boolean | Default false |
| can_take_bookings | boolean | Default false |

### 2. Merchant Changes (existing table)

```sql
ALTER TABLE merchants
  ADD can_sell_products BOOLEAN NOT NULL DEFAULT false,
  ADD can_take_bookings BOOLEAN NOT NULL DEFAULT false;
```

| Column | Type | Notes |
|--------|------|-------|
| can_sell_products | boolean | Default false, copied from business_type on create |
| can_take_bookings | boolean | Default false, copied from business_type on create |

### 3. Service Changes (existing table)

```sql
ALTER TABLE services
  -- Product fields
  ADD is_sellable BOOLEAN NOT NULL DEFAULT false,
  ADD sku VARCHAR(100) NULL,
  ADD stock_quantity INTEGER NULL,
  ADD track_stock BOOLEAN NOT NULL DEFAULT false,
  -- Booking fields
  ADD is_bookable BOOLEAN NOT NULL DEFAULT false,
  ADD duration INTEGER NULL COMMENT 'minutes',
  ADD max_capacity INTEGER NOT NULL DEFAULT 1,
  ADD requires_confirmation BOOLEAN NOT NULL DEFAULT false;

-- SKU unique per merchant
ADD UNIQUE INDEX services_merchant_sku_unique (merchant_id, sku);
```

| Column | Type | Notes |
|--------|------|-------|
| is_sellable | boolean | Default false. Requires merchant.can_sell_products |
| sku | varchar(100) | Nullable, unique per merchant |
| stock_quantity | integer | Nullable. Required when track_stock=true |
| track_stock | boolean | Default false. Track inventory |
| is_bookable | boolean | Default false. Requires merchant.can_take_bookings |
| duration | integer | Nullable, minutes. Required when is_bookable=true |
| max_capacity | integer | Default 1. People per time slot |
| requires_confirmation | boolean | Default false. Auto-confirm or merchant confirms |

### 4. ServiceSchedule (new table)

Per-service weekly availability for bookable services.

```sql
CREATE TABLE service_schedules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday, 6=Saturday',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE KEY service_schedules_service_day_unique (service_id, day_of_week)
);
```

| Column | Type | Notes |
|--------|------|-------|
| service_id | FK services | CASCADE on delete |
| day_of_week | tinyint | 0=Sunday to 6=Saturday |
| start_time | time | e.g. 09:00 |
| end_time | time | e.g. 17:00 |
| is_available | boolean | Default true |

### 5. Booking (new table)

Customer bookings for bookable services.

```sql
CREATE TABLE bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'users.id',
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  party_size INTEGER UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  confirmed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX bookings_date_status_index (booking_date, status),
  INDEX bookings_merchant_date_index (merchant_id, booking_date)
);
```

| Column | Type | Notes |
|--------|------|-------|
| merchant_id | FK merchants | CASCADE |
| service_id | FK services | CASCADE |
| customer_id | FK users | CASCADE |
| booking_date | date | The date of the booking |
| start_time | time | Slot start |
| end_time | time | Calculated: start_time + service.duration |
| party_size | integer | Default 1, max = service.max_capacity |
| status | enum | pending/confirmed/cancelled/completed/no_show |
| notes | text | Nullable, customer notes |
| confirmed_at | timestamp | When merchant confirmed |
| cancelled_at | timestamp | When cancelled |

---

## Validation Rules

### Service Creation/Update

```php
// Always
'name'        => ['required', 'string', 'max:255'],
'price'       => ['required', 'numeric', 'min:0'],
'is_active'   => ['boolean'],

// Product fields (only if merchant.can_sell_products)
'is_sellable'     => ['boolean'],
'sku'             => ['nullable', 'string', 'max:100', Rule::unique('services')->where('merchant_id', $merchantId)->ignore($serviceId)],
'stock_quantity'  => ['nullable', 'integer', 'min:0'],
'track_stock'     => ['boolean'],

// Booking fields (only if merchant.can_take_bookings)
'is_bookable'             => ['boolean'],
'duration'                => ['required_if:is_bookable,true', 'nullable', 'integer', 'min:5', 'max:1440'],
'max_capacity'            => ['integer', 'min:1'],
'requires_confirmation'   => ['boolean'],
```

### Service Business Rules

```
- is_sellable=true requires merchant.can_sell_products=true
- is_bookable=true requires merchant.can_take_bookings=true
- track_stock=true requires stock_quantity to be set (>= 0)
- is_bookable=true requires duration > 0
- A service can be both is_sellable AND is_bookable
```

### Booking Creation

```php
'service_id'    => ['required', 'exists:services,id'],
'booking_date'  => ['required', 'date', 'after_or_equal:today'],
'start_time'    => ['required', 'date_format:H:i'],
'party_size'    => ['integer', 'min:1', 'max:{service.max_capacity}'],
'notes'         => ['nullable', 'string', 'max:1000'],
```

### Booking Business Rules

```
- Service must be is_bookable=true
- Requested day must have a service_schedule with is_available=true
- start_time must be within schedule's start_time..end_time range
- end_time = start_time + service.duration
- Total bookings for that slot must not exceed max_capacity
- Customer cannot double-book the same time slot
```

---

## Booking Status Workflow

```
                    ┌──────────┐
       create ────→ │ pending  │
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            ▼                         ▼
     ┌─────────────┐          ┌─────────────┐
     │  confirmed  │          │  cancelled  │
     └──────┬──────┘          └─────────────┘
            │
     ┌──────┼──────┐
     ▼             ▼
┌──────────┐ ┌─────────┐
│completed │ │ no_show │
└──────────┘ └─────────┘
```

Valid transitions:
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `completed`, `cancelled`, `no_show`

Auto-confirm: If `service.requires_confirmation = false`, booking is created as `confirmed` directly.

---

## Backend Architecture

### Files per Phase

**Phase A: BusinessType Capability Flags**

| File | Action |
|------|--------|
| `database/migrations/..._add_capabilities_to_business_types_table.php` | Create |
| `app/Models/BusinessType.php` | Modify ($fillable, $casts) |
| `app/Data/BusinessTypeData.php` | Modify (add fields) |
| `app/Http/Resources/Api/V1/BusinessTypeResource.php` | Modify |
| `app/Http/Requests/.../CreateBusinessTypeRequest.php` | Modify |
| `app/Http/Requests/.../UpdateBusinessTypeRequest.php` | Modify |
| `frontend/types/api.ts` | Modify (BusinessType interface) |
| `frontend/lib/validations.ts` | Modify (business type schemas) |
| `frontend/app/...business-types/page.tsx` | Modify (add checkboxes) |

**Phase B: Merchant Capability Flags**

| File | Action |
|------|--------|
| `database/migrations/..._add_capabilities_to_merchants_table.php` | Create |
| `app/Models/Merchant.php` | Modify ($fillable, $casts) |
| `app/Data/MerchantData.php` | Modify (add fields) |
| `app/Services/MerchantService.php` | Modify (copy on create) |
| `app/Http/Resources/Api/V1/MerchantResource.php` | Modify |
| `app/Http/Requests/.../StoreMerchantRequest.php` | Modify |
| `app/Http/Requests/.../UpdateMerchantRequest.php` | Modify |
| `frontend/types/api.ts` | Modify (Merchant interface) |
| `frontend/.../merchant-details-tab.tsx` | Modify (capability toggles) |

**Phase C: Extend Service (Product + Booking Fields)**

| File | Action |
|------|--------|
| `database/migrations/..._add_capability_fields_to_services_table.php` | Create |
| `app/Models/Service.php` | Modify ($fillable, $casts) |
| `app/Data/ServiceData.php` | Modify (add fields) |
| `app/Http/Resources/Api/V1/ServiceResource.php` | Modify |
| `app/Http/Requests/.../CreateServiceRequest.php` | Modify (conditional rules) |
| `app/Http/Requests/.../UpdateServiceRequest.php` | Modify |
| `frontend/types/api.ts` | Modify (Service interface) |
| `frontend/lib/validations.ts` | Modify (service schemas) |
| `frontend/.../create-service-dialog.tsx` | Modify (conditional sections) |
| `frontend/.../edit-service-dialog.tsx` | Modify (conditional sections) |

**Phase D: ServiceSchedule**

| File | Action |
|------|--------|
| `database/migrations/..._create_service_schedules_table.php` | Create |
| `app/Models/ServiceSchedule.php` | Create |
| `app/Services/MerchantService.php` | Modify (schedule CRUD) |
| `app/Http/Controllers/.../MerchantServiceController.php` | Modify (schedule endpoints) |
| `app/Http/Resources/Api/V1/ServiceScheduleResource.php` | Create |
| `app/Http/Requests/.../UpdateServiceScheduleRequest.php` | Create |
| `frontend/types/api.ts` | Modify |
| `frontend/.../services/page.tsx` | Modify (schedule section) |

**Phase E: Booking Model + Management**

| File | Action |
|------|--------|
| `database/migrations/..._create_bookings_table.php` | Create |
| `app/Models/Booking.php` | Create |
| `app/Data/BookingData.php` | Create |
| `app/Services/BookingService.php` | Create |
| `app/Services/Contracts/BookingServiceInterface.php` | Create |
| `app/Repositories/BookingRepository.php` | Create |
| `app/Repositories/Contracts/BookingRepositoryInterface.php` | Create |
| `app/Http/Controllers/Api/V1/BookingController.php` | Create |
| `app/Http/Resources/Api/V1/BookingResource.php` | Create |
| `app/Http/Requests/.../CreateBookingRequest.php` | Create |
| `app/Http/Requests/.../UpdateBookingStatusRequest.php` | Create |
| `routes/api.php` | Modify (booking routes) |
| `database/seeders/PermissionSeeder.php` | Modify (booking permissions) |
| `tests/Feature/Api/V1/BookingControllerTest.php` | Create |
| `frontend/types/api.ts` | Modify |
| `frontend/services/bookingService.ts` | Create |
| `frontend/hooks/useBookings.ts` | Create |
| `frontend/.../merchants/[id]/bookings/page.tsx` | Create |

---

## API Endpoints

### Existing (modified)

```
PUT  /merchants/{id}                    → now accepts can_sell_products, can_take_bookings
POST /merchants/{id}/services           → now accepts product + booking fields
PUT  /merchants/{id}/services/{sid}     → now accepts product + booking fields
```

### New — Service Schedule

```
GET  /merchants/{id}/services/{sid}/schedule       → list schedules
PUT  /merchants/{id}/services/{sid}/schedule       → bulk upsert (like business hours)
```

### New — Bookings (merchant-scoped)

```
GET    /merchants/{id}/bookings                    → list bookings (filterable by date, status)
POST   /merchants/{id}/bookings                    → create booking
GET    /merchants/{id}/bookings/{bid}              → show booking
PATCH  /merchants/{id}/bookings/{bid}/status       → update status (confirm/cancel/complete/no_show)
```

### Permissions

```
bookings.view
bookings.create
bookings.update
bookings.update_status
```

---

## Frontend UI

### BusinessType Admin Form (Phase A)

```
┌──────────────────────────────────────────────┐
│ Business Type                                │
│                                              │
│ Name: [Restaurant        ]                   │
│ Description: [Food service establishment]    │
│                                              │
│ Capabilities:                                │
│ [ ] Can sell products                        │
│ [x] Can take bookings                        │
│                                              │
│ [Active: ✓]  [Sort Order: 0]                │
└──────────────────────────────────────────────┘
```

### Merchant Edit — Details Tab (Phase B)

```
┌──────────────────────────────────────────────┐
│ Capabilities                                 │
│ Inherited from: Restaurant                   │
│                                              │
│ [x] Can sell products                        │
│ [x] Can take bookings                        │
└──────────────────────────────────────────────┘
```

### Service Create/Edit Dialog (Phase C)

```
┌──────────────────────────────────────────────┐
│ Service                                      │
│                                              │
│ [Name        ] [Category ▼    ] [Price     ] │
│ [Description                               ] │
│ [Image]                                      │
│                                              │
│ ── Product Settings ───── (if can_sell)      │
│ [x] Available for purchase                   │
│ [SKU          ] [Stock Qty    ]              │
│ [x] Track stock                              │
│                                              │
│ ── Booking Settings ───── (if can_book)      │
│ [x] Available for booking                    │
│ [Duration: 60 mins] [Max Capacity: 1]        │
│ [ ] Requires confirmation                    │
└──────────────────────────────────────────────┘
```

### Service Schedule (Phase D)

```
┌──────────────────────────────────────────────┐
│ Schedule — Haircut (60 min)                  │
│                                              │
│ Mon  [09:00] - [17:00]  [✓ Available]       │
│ Tue  [09:00] - [17:00]  [✓ Available]       │
│ Wed  [09:00] - [17:00]  [✓ Available]       │
│ Thu  [09:00] - [17:00]  [✓ Available]       │
│ Fri  [09:00] - [17:00]  [✓ Available]       │
│ Sat  [10:00] - [14:00]  [✓ Available]       │
│ Sun  [—————] - [—————]  [  Closed   ]       │
│                                              │
│                          [Save Schedule]     │
└──────────────────────────────────────────────┘
```

### Merchant Bookings Page (Phase E)

```
┌──────────────────────────────────────────────┐
│ Bookings              [Date ▼] [Status ▼]   │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ #101  Haircut                            │ │
│ │ John Doe · Feb 10, 2026 · 09:00-10:00  │ │
│ │ Status: ● Pending    [Confirm] [Cancel] │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ #102  Massage                            │ │
│ │ Jane Smith · Feb 10, 2026 · 10:00-11:30 │ │
│ │ Status: ● Confirmed  [Complete] [No Show]│ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## Implementation Phases

| Phase | Description | Depends On | Estimated Files |
|-------|-------------|------------|-----------------|
| **A** | BusinessType capability flags + admin UI | — | ~9 files |
| **B** | Merchant capability flags (copy on create) + edit UI | A | ~9 files |
| **C** | Extend Service model (product + booking fields) + service form | B | ~10 files |
| **D** | ServiceSchedule model + bulk upsert + UI | C | ~8 files |
| **E** | Booking model + merchant management + UI | D | ~17 files |
| **F** | Customer-facing booking flow (public) | E | Future |

### Phase A + B (can be combined)

Small scope. Add boolean flags to two existing tables, update DTOs/resources/requests/frontend forms. Copy logic in MerchantService.createMerchantForUser().

### Phase C

Medium scope. Extend Service with conditional fields. Frontend service dialogs show/hide product and booking sections based on merchant capabilities. Validation rules are conditional.

### Phase D

Medium scope. New ServiceSchedule model following the same pattern as MerchantBusinessHour (bulk upsert by day_of_week). Schedule is managed per-service, only for bookable services.

### Phase E

Largest scope. New Booking entity with full CRUD, status workflow, availability checking, and a new merchant booking management page. Follows existing Service-Repository pattern.

### Phase F (Future)

Public-facing booking page. Customer selects service → picks date → sees available slots → books. Confirmation email/notification. Payment integration (optional).
