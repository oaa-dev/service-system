# Service Capabilities Module

## Overview

The Service Capabilities module adds four core business functions to the merchant system. Each capability unlocks different features and models. Capabilities are controlled via a hybrid system: **BusinessType** defines defaults, **Merchant** inherits on creation and can override independently.

### Four Capabilities

| Capability | Purpose | Example Businesses |
|---|---|---|
| `can_sell_products` | Sell physical items with inventory | Water station, pet shop, barbershop (products) |
| `can_take_bookings` | Time-slot appointments | Barbershop, salon, photographer |
| `can_rent_units` | Date-range unit reservations | Hotel, resort, campsite |
| `can_take_orders` | Service orders with job tracking | Laundry, water delivery |

### Business Type Mapping

| Business Type | Products | Bookings | Rentals | Orders |
|---|---|---|---|---|
| Barbershop | yes | yes | — | — |
| Water Station | yes | — | — | yes |
| Laundry | — | — | — | yes |
| Pet Shop Salon | yes | yes | — | — |
| Professional Photographer | yes | yes | — | — |
| Hotel | yes | — | yes | — |
| Resort | yes | — | yes | — |
| Campsite | — | — | yes | — |
| Restaurant | yes | yes | — | — |
| Spa | yes | yes | — | — |

---

## Design: Hybrid Capability System

### Inheritance Flow (Copy-on-Create)

```
BusinessType (admin-managed defaults)
    │  can_sell_products  = true
    │  can_take_bookings  = true
    │  can_rent_units     = false
    │  can_take_orders    = false
    │
    ▼  copied on merchant creation
Merchant (independent after copy)
    │  can_sell_products  = true   ← inherited
    │  can_take_bookings  = true   ← inherited
    │  can_rent_units     = false  ← inherited
    │  can_take_orders    = true   ← admin overridden
    │
    ▼  gates what the merchant can do
Service      → is_sellable, is_bookable (gated by merchant flags)
Units        → only if can_rent_units
Orders       → only if can_take_orders
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
  ADD can_take_bookings BOOLEAN NOT NULL DEFAULT false,
  ADD can_rent_units    BOOLEAN NOT NULL DEFAULT false,
  ADD can_take_orders   BOOLEAN NOT NULL DEFAULT false;
```

| Column | Type | Notes |
|--------|------|-------|
| can_sell_products | boolean | Default false |
| can_take_bookings | boolean | Default false |
| can_rent_units | boolean | Default false |
| can_take_orders | boolean | Default false |

### 2. Merchant Changes (existing table)

```sql
ALTER TABLE merchants
  ADD can_sell_products BOOLEAN NOT NULL DEFAULT false,
  ADD can_take_bookings BOOLEAN NOT NULL DEFAULT false,
  ADD can_rent_units    BOOLEAN NOT NULL DEFAULT false,
  ADD can_take_orders   BOOLEAN NOT NULL DEFAULT false;
```

| Column | Type | Notes |
|--------|------|-------|
| can_sell_products | boolean | Default false, copied from business_type on create |
| can_take_bookings | boolean | Default false, copied from business_type on create |
| can_rent_units | boolean | Default false, copied from business_type on create |
| can_take_orders | boolean | Default false, copied from business_type on create |

### 3. Service Changes (existing table)

Extends existing Service model with product and booking fields.

```sql
ALTER TABLE services
  -- Product fields
  ADD is_sellable    BOOLEAN NOT NULL DEFAULT false,
  ADD sku            VARCHAR(100) NULL,
  ADD stock_quantity INTEGER NULL,
  ADD track_stock    BOOLEAN NOT NULL DEFAULT false,
  -- Booking fields
  ADD is_bookable            BOOLEAN NOT NULL DEFAULT false,
  ADD duration               INTEGER NULL COMMENT 'minutes',
  ADD max_capacity           INTEGER NOT NULL DEFAULT 1,
  ADD requires_confirmation  BOOLEAN NOT NULL DEFAULT false;

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

Customer bookings for bookable services (time-slot appointments).

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

### 6. UnitType (new table)

Per-merchant categories for rentable units (e.g. "Deluxe Room", "Standard Tent Site").

```sql
CREATE TABLE unit_types (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  base_price_per_night DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_capacity INTEGER UNSIGNED NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  UNIQUE KEY unit_types_merchant_slug_unique (merchant_id, slug)
);
```

| Column | Type | Notes |
|--------|------|-------|
| merchant_id | FK merchants | CASCADE |
| name | varchar(255) | e.g. "Deluxe Room", "Tent Site A" |
| slug | varchar(255) | Unique per merchant |
| description | text | Nullable |
| base_price_per_night | decimal(10,2) | Base rate, can be overridden per unit |
| max_capacity | integer | Max guests for this type |
| is_active | boolean | Default true |
| sort_order | integer | Display ordering |

**Media:** Spatie Media Library `image` collection (photos of room type)

### 7. Unit (new table)

Individual rentable units (rooms, cabins, campsites).

```sql
CREATE TABLE units (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL,
  unit_type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price_per_night DECIMAL(10,2) NULL COMMENT 'overrides unit_type base price if set',
  floor VARCHAR(50) NULL,
  status ENUM('available','occupied','maintenance') NOT NULL DEFAULT 'available',
  amenities JSON NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_type_id) REFERENCES unit_types(id) ON DELETE CASCADE,
  UNIQUE KEY units_merchant_slug_unique (merchant_id, slug),
  INDEX units_merchant_status_index (merchant_id, status)
);
```

| Column | Type | Notes |
|--------|------|-------|
| merchant_id | FK merchants | CASCADE |
| unit_type_id | FK unit_types | CASCADE |
| name | varchar(255) | e.g. "Room 201", "Campsite A3" |
| slug | varchar(255) | Unique per merchant |
| description | text | Nullable, unit-specific notes |
| price_per_night | decimal(10,2) | Nullable. Overrides unit_type.base_price_per_night |
| floor | varchar(50) | Nullable. e.g. "2nd Floor", "Zone B" |
| status | enum | available/occupied/maintenance |
| amenities | json | Nullable. e.g. ["wifi", "ac", "tv", "minibar"] |
| is_active | boolean | Default true |

**Media:** Spatie Media Library `image` collection (photos of specific unit)

### 8. Reservation (new table)

Date-range bookings of units (hotels, resorts, campsites).

```sql
CREATE TABLE reservations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL,
  unit_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'users.id',
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_count INTEGER UNSIGNED NOT NULL DEFAULT 1,
  nights INTEGER UNSIGNED NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('pending','confirmed','checked_in','checked_out','cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  special_requests TEXT NULL,
  confirmed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  checked_in_at TIMESTAMP NULL,
  checked_out_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX reservations_merchant_dates_index (merchant_id, check_in, check_out),
  INDEX reservations_unit_dates_index (unit_id, check_in, check_out),
  INDEX reservations_status_index (status)
);
```

| Column | Type | Notes |
|--------|------|-------|
| merchant_id | FK merchants | CASCADE |
| unit_id | FK units | CASCADE |
| customer_id | FK users | CASCADE |
| check_in | date | Arrival date |
| check_out | date | Departure date |
| guest_count | integer | Default 1, max = unit_type.max_capacity |
| nights | integer | Calculated: check_out - check_in |
| price_per_night | decimal(10,2) | Snapshot of rate at time of booking |
| total_price | decimal(10,2) | nights * price_per_night |
| status | enum | pending/confirmed/checked_in/checked_out/cancelled |
| notes | text | Nullable, internal notes |
| special_requests | text | Nullable, guest requests |
| confirmed_at | timestamp | When confirmed |
| cancelled_at | timestamp | When cancelled |
| checked_in_at | timestamp | Actual check-in time |
| checked_out_at | timestamp | Actual check-out time |

### 9. ServiceOrder (new table)

Service orders with job tracking (laundry, water delivery, etc.).

```sql
CREATE TABLE service_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'users.id',
  order_number VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_label VARCHAR(20) NOT NULL DEFAULT 'pcs' COMMENT 'kg, pcs, gal, load, etc.',
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('pending','received','processing','ready','delivering','completed','cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  estimated_completion DATETIME NULL,
  received_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY service_orders_order_number_unique (order_number),
  INDEX service_orders_merchant_status_index (merchant_id, status),
  INDEX service_orders_customer_index (customer_id)
);
```

| Column | Type | Notes |
|--------|------|-------|
| merchant_id | FK merchants | CASCADE |
| service_id | FK services | CASCADE |
| customer_id | FK users | CASCADE |
| order_number | varchar(50) | Auto-generated, unique (e.g. ORD-20260210-001) |
| quantity | decimal(10,2) | e.g. 5.5 (kg), 10 (gal), 2 (loads) |
| unit_label | varchar(20) | Display unit: "kg", "pcs", "gal", "load" |
| unit_price | decimal(10,2) | Price per unit at time of order |
| total_price | decimal(10,2) | quantity * unit_price |
| status | enum | pending/received/processing/ready/delivering/completed/cancelled |
| notes | text | Nullable, customer or merchant notes |
| estimated_completion | datetime | Nullable, when order is expected ready |
| received_at | timestamp | When merchant received the items |
| completed_at | timestamp | When customer picked up or delivery completed |
| cancelled_at | timestamp | When cancelled |

---

## Status Workflows

### Booking Status (time-slot appointments)

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

### Reservation Status (date-range units)

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
            ▼
     ┌─────────────┐
     │ checked_in  │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │ checked_out │
     └─────────────┘
```

Valid transitions:
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `checked_in`, `cancelled`
- `checked_in` → `checked_out`

### Service Order Status (job tracking)

```
                    ┌──────────┐
       create ────→ │ pending  │
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            ▼                         ▼
     ┌─────────────┐          ┌─────────────┐
     │  received   │          │  cancelled  │
     └──────┬──────┘          └─────────────┘
            │
            ▼
     ┌─────────────┐
     │ processing  │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │    ready    │
     └──────┬──────┘
            │
     ┌──────┼──────┐
     ▼             ▼
┌──────────┐ ┌─────────────┐
│completed │ │ delivering  │──→ completed
└──────────┘ └─────────────┘
```

Valid transitions:
- `pending` → `received`, `cancelled`
- `received` → `processing`, `cancelled`
- `processing` → `ready`
- `ready` → `completed` (pickup), `delivering` (delivery)
- `delivering` → `completed`

---

## Validation Rules

### Service Creation/Update

```php
// Always
'name'        => ['required', 'string', 'max:255'],
'price'       => ['required', 'numeric', 'min:0'],
'is_active'   => ['boolean'],

// Product fields (only accepted if merchant.can_sell_products)
'is_sellable'     => ['boolean'],
'sku'             => ['nullable', 'string', 'max:100', Rule::unique('services')->where('merchant_id', $merchantId)->ignore($serviceId)],
'stock_quantity'  => ['nullable', 'integer', 'min:0'],
'track_stock'     => ['boolean'],

// Booking fields (only accepted if merchant.can_take_bookings)
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
'party_size'    => ['integer', 'min:1'],
'notes'         => ['nullable', 'string', 'max:1000'],
```

### Booking Business Rules

```
- Service must have is_bookable=true
- Requested day must have a service_schedule with is_available=true
- start_time must be within schedule's start_time..end_time range
- end_time = start_time + service.duration
- Total bookings for that slot must not exceed max_capacity
- Customer cannot double-book the same time slot
```

### Reservation Creation

```php
'unit_id'       => ['required', 'exists:units,id'],
'check_in'      => ['required', 'date', 'after_or_equal:today'],
'check_out'     => ['required', 'date', 'after:check_in'],
'guest_count'   => ['integer', 'min:1'],
'notes'         => ['nullable', 'string', 'max:1000'],
'special_requests' => ['nullable', 'string', 'max:1000'],
```

### Reservation Business Rules

```
- Merchant must have can_rent_units=true
- Unit must be is_active=true and status=available
- Unit must not have overlapping confirmed/checked_in reservations for the date range
- guest_count must not exceed unit_type.max_capacity
- nights = check_out - check_in (minimum 1)
- price_per_night = unit.price_per_night ?? unit_type.base_price_per_night
- total_price = nights * price_per_night
```

### Service Order Creation

```php
'service_id'    => ['required', 'exists:services,id'],
'quantity'      => ['required', 'numeric', 'min:0.01'],
'unit_label'    => ['required', 'string', 'max:20'],
'notes'         => ['nullable', 'string', 'max:1000'],
```

### Service Order Business Rules

```
- Merchant must have can_take_orders=true
- order_number auto-generated (e.g. ORD-YYYYMMDD-NNN)
- unit_price = service.price at time of order
- total_price = quantity * unit_price
- Service used for orders doesn't require is_sellable or is_bookable
```

---

## API Endpoints

### Existing (modified)

```
PUT  /merchants/{id}                    → accepts can_sell_products, can_take_bookings, can_rent_units, can_take_orders
POST /merchants/{id}/services           → accepts product + booking fields
PUT  /merchants/{id}/services/{sid}     → accepts product + booking fields
```

### Service Schedule (for bookable services)

```
GET  /merchants/{mid}/services/{sid}/schedule       → list schedules (7 days)
PUT  /merchants/{mid}/services/{sid}/schedule       → bulk upsert (like business hours)
```

### Bookings (time-slot appointments)

```
GET    /merchants/{mid}/bookings                    → list (filterable: date, status, service_id)
POST   /merchants/{mid}/bookings                    → create booking
GET    /merchants/{mid}/bookings/{bid}              → show
PATCH  /merchants/{mid}/bookings/{bid}/status       → update status
```

### Unit Types (rental categories)

```
GET    /merchants/{mid}/unit-types                  → list
POST   /merchants/{mid}/unit-types                  → create
GET    /merchants/{mid}/unit-types/{utid}           → show
PUT    /merchants/{mid}/unit-types/{utid}           → update
DELETE /merchants/{mid}/unit-types/{utid}           → delete
```

### Units (individual rentable units)

```
GET    /merchants/{mid}/units                       → list (filterable: unit_type_id, status)
POST   /merchants/{mid}/units                       → create
GET    /merchants/{mid}/units/{uid}                 → show
PUT    /merchants/{mid}/units/{uid}                 → update
DELETE /merchants/{mid}/units/{uid}                 → delete
```

### Reservations (date-range bookings)

```
GET    /merchants/{mid}/reservations                → list (filterable: date range, status, unit_id)
POST   /merchants/{mid}/reservations                → create
GET    /merchants/{mid}/reservations/{rid}          → show
PATCH  /merchants/{mid}/reservations/{rid}/status   → update status
```

### Availability Check (public or auth)

```
GET    /merchants/{mid}/units/availability?check_in=&check_out=&guest_count=  → available units
```

### Service Orders (job tracking)

```
GET    /merchants/{mid}/service-orders              → list (filterable: status, date range)
POST   /merchants/{mid}/service-orders              → create order
GET    /merchants/{mid}/service-orders/{oid}        → show
PATCH  /merchants/{mid}/service-orders/{oid}/status → update status
```

### Permissions

```
# Bookings
bookings.view
bookings.create
bookings.update_status

# Units & Reservations
unit_types.view
unit_types.create
unit_types.update
unit_types.delete
units.view
units.create
units.update
units.delete
reservations.view
reservations.create
reservations.update_status

# Service Orders
service_orders.view
service_orders.create
service_orders.update_status
```

---

## Backend Architecture

### Models & Relationships

```
BusinessType
  └── hasMany Merchant

Merchant
  ├── hasMany Service
  ├── hasMany Booking
  ├── hasMany UnitType
  ├── hasMany Unit
  ├── hasMany Reservation
  └── hasMany ServiceOrder

Service
  ├── belongsTo Merchant
  ├── belongsTo ServiceCategory
  ├── hasMany ServiceSchedule     (if is_bookable)
  ├── hasMany Booking             (if is_bookable)
  └── hasMany ServiceOrder        (if used for orders)

UnitType
  ├── belongsTo Merchant
  └── hasMany Unit

Unit
  ├── belongsTo Merchant
  ├── belongsTo UnitType
  └── hasMany Reservation

Booking
  ├── belongsTo Merchant
  ├── belongsTo Service
  └── belongsTo Customer (User)

Reservation
  ├── belongsTo Merchant
  ├── belongsTo Unit
  └── belongsTo Customer (User)

ServiceOrder
  ├── belongsTo Merchant
  ├── belongsTo Service
  └── belongsTo Customer (User)
```

### Files per Phase

**Phase A: BusinessType Capability Flags**

| File | Action |
|------|--------|
| `database/migrations/..._add_capabilities_to_business_types_table.php` | Create |
| `app/Models/BusinessType.php` | Modify ($fillable, $casts) |
| `app/Data/BusinessTypeData.php` | Modify (add 4 fields) |
| `app/Http/Resources/Api/V1/BusinessTypeResource.php` | Modify |
| `app/Http/Requests/.../CreateBusinessTypeRequest.php` | Modify |
| `app/Http/Requests/.../UpdateBusinessTypeRequest.php` | Modify |
| `tests/Feature/Api/V1/BusinessTypeControllerTest.php` | Modify |
| `frontend/types/api.ts` | Modify (BusinessType interface) |
| `frontend/lib/validations.ts` | Modify (business type schemas) |
| `frontend/app/...business-types/page.tsx` | Modify (add checkboxes) |

**Phase B: Merchant Capability Flags**

| File | Action |
|------|--------|
| `database/migrations/..._add_capabilities_to_merchants_table.php` | Create |
| `app/Models/Merchant.php` | Modify ($fillable, $casts) |
| `app/Data/MerchantData.php` | Modify (add 4 fields) |
| `app/Services/MerchantService.php` | Modify (copy capabilities on create) |
| `app/Http/Resources/Api/V1/MerchantResource.php` | Modify |
| `app/Http/Requests/.../StoreMerchantRequest.php` | Modify |
| `app/Http/Requests/.../UpdateMerchantRequest.php` | Modify |
| `tests/Feature/Api/V1/MerchantControllerTest.php` | Modify |
| `frontend/types/api.ts` | Modify (Merchant interface) |
| `frontend/.../merchant-details-tab.tsx` | Modify (capability toggles) |

**Phase C: Extend Service (Product + Booking Fields)**

| File | Action |
|------|--------|
| `database/migrations/..._add_capability_fields_to_services_table.php` | Create |
| `app/Models/Service.php` | Modify ($fillable, $casts) |
| `app/Data/ServiceData.php` | Modify (add fields) |
| `app/Http/Resources/Api/V1/ServiceResource.php` | Modify |
| `app/Http/Requests/.../CreateMerchantServiceRequest.php` | Modify (conditional rules) |
| `app/Http/Requests/.../UpdateMerchantServiceRequest.php` | Modify |
| `tests/Feature/Api/V1/MerchantServiceControllerTest.php` | Modify |
| `frontend/types/api.ts` | Modify (Service interface) |
| `frontend/lib/validations.ts` | Modify (service schemas) |
| `frontend/.../create-service-dialog.tsx` | Modify (conditional sections) |
| `frontend/.../edit-service-dialog.tsx` | Modify (conditional sections) |

**Phase D: ServiceSchedule**

| File | Action |
|------|--------|
| `database/migrations/..._create_service_schedules_table.php` | Create |
| `app/Models/ServiceSchedule.php` | Create |
| `app/Services/MerchantService.php` | Modify (schedule CRUD methods) |
| `app/Http/Controllers/.../MerchantServiceController.php` | Modify (schedule endpoints) |
| `app/Http/Resources/Api/V1/ServiceScheduleResource.php` | Create |
| `app/Http/Requests/.../UpdateServiceScheduleRequest.php` | Create |
| `routes/api.php` | Modify (schedule routes) |
| `tests/Feature/Api/V1/MerchantServiceControllerTest.php` | Modify |
| `frontend/types/api.ts` | Modify |
| `frontend/.../services/page.tsx` | Modify (schedule UI) |

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
| `routes/api.php` | Modify |
| `database/seeders/PermissionSeeder.php` | Modify |
| `tests/Feature/Api/V1/BookingControllerTest.php` | Create |
| `frontend/types/api.ts` | Modify |
| `frontend/services/bookingService.ts` | Create |
| `frontend/hooks/useBookings.ts` | Create |
| `frontend/.../merchants/[id]/bookings/page.tsx` | Create |

**Phase F: Unit Types + Units**

| File | Action |
|------|--------|
| `database/migrations/..._create_unit_types_table.php` | Create |
| `database/migrations/..._create_units_table.php` | Create |
| `app/Models/UnitType.php` | Create |
| `app/Models/Unit.php` | Create |
| `app/Data/UnitTypeData.php` | Create |
| `app/Data/UnitData.php` | Create |
| `app/Services/MerchantService.php` | Modify (unit CRUD methods) |
| `app/Http/Controllers/.../MerchantUnitTypeController.php` | Create |
| `app/Http/Controllers/.../MerchantUnitController.php` | Create |
| `app/Http/Resources/Api/V1/UnitTypeResource.php` | Create |
| `app/Http/Resources/Api/V1/UnitResource.php` | Create |
| `app/Http/Requests/.../CreateUnitTypeRequest.php` | Create |
| `app/Http/Requests/.../UpdateUnitTypeRequest.php` | Create |
| `app/Http/Requests/.../CreateUnitRequest.php` | Create |
| `app/Http/Requests/.../UpdateUnitRequest.php` | Create |
| `routes/api.php` | Modify |
| `database/seeders/PermissionSeeder.php` | Modify |
| `tests/Feature/Api/V1/MerchantUnitTypeControllerTest.php` | Create |
| `tests/Feature/Api/V1/MerchantUnitControllerTest.php` | Create |
| `frontend/types/api.ts` | Modify |
| `frontend/services/unitService.ts` | Create |
| `frontend/hooks/useUnits.ts` | Create |
| `frontend/.../merchants/[id]/units/page.tsx` | Create |
| `frontend/.../merchants/[id]/unit-types/page.tsx` | Create |

**Phase G: Reservations**

| File | Action |
|------|--------|
| `database/migrations/..._create_reservations_table.php` | Create |
| `app/Models/Reservation.php` | Create |
| `app/Data/ReservationData.php` | Create |
| `app/Services/ReservationService.php` | Create |
| `app/Services/Contracts/ReservationServiceInterface.php` | Create |
| `app/Repositories/ReservationRepository.php` | Create |
| `app/Repositories/Contracts/ReservationRepositoryInterface.php` | Create |
| `app/Http/Controllers/Api/V1/ReservationController.php` | Create |
| `app/Http/Resources/Api/V1/ReservationResource.php` | Create |
| `app/Http/Requests/.../CreateReservationRequest.php` | Create |
| `app/Http/Requests/.../UpdateReservationStatusRequest.php` | Create |
| `routes/api.php` | Modify |
| `database/seeders/PermissionSeeder.php` | Modify |
| `tests/Feature/Api/V1/ReservationControllerTest.php` | Create |
| `frontend/types/api.ts` | Modify |
| `frontend/services/reservationService.ts` | Create |
| `frontend/hooks/useReservations.ts` | Create |
| `frontend/.../merchants/[id]/reservations/page.tsx` | Create |

**Phase H: Service Orders**

| File | Action |
|------|--------|
| `database/migrations/..._create_service_orders_table.php` | Create |
| `app/Models/ServiceOrder.php` | Create |
| `app/Data/ServiceOrderData.php` | Create |
| `app/Services/ServiceOrderService.php` | Create |
| `app/Services/Contracts/ServiceOrderServiceInterface.php` | Create |
| `app/Repositories/ServiceOrderRepository.php` | Create |
| `app/Repositories/Contracts/ServiceOrderRepositoryInterface.php` | Create |
| `app/Http/Controllers/Api/V1/ServiceOrderController.php` | Create |
| `app/Http/Resources/Api/V1/ServiceOrderResource.php` | Create |
| `app/Http/Requests/.../CreateServiceOrderRequest.php` | Create |
| `app/Http/Requests/.../UpdateServiceOrderStatusRequest.php` | Create |
| `routes/api.php` | Modify |
| `database/seeders/PermissionSeeder.php` | Modify |
| `tests/Feature/Api/V1/ServiceOrderControllerTest.php` | Create |
| `frontend/types/api.ts` | Modify |
| `frontend/services/serviceOrderService.ts` | Create |
| `frontend/hooks/useServiceOrders.ts` | Create |
| `frontend/.../merchants/[id]/orders/page.tsx` | Create |

---

## Frontend UI

### BusinessType Admin Form (Phase A)

```
┌──────────────────────────────────────────────────┐
│ Business Type                                    │
│                                                  │
│ Name: [Restaurant            ]                   │
│ Description: [Food service establishment]        │
│                                                  │
│ Capabilities:                                    │
│ [x] Can sell products                            │
│ [x] Can take bookings                            │
│ [ ] Can rent units                               │
│ [ ] Can take orders                              │
│                                                  │
│ [Active: ✓]  [Sort Order: 0]                    │
└──────────────────────────────────────────────────┘
```

### Merchant Edit — Details Tab (Phase B)

```
┌──────────────────────────────────────────────────┐
│ Capabilities                                     │
│ Inherited from: Hotel                            │
│                                                  │
│ [x] Can sell products       (souvenir shop)      │
│ [ ] Can take bookings                            │
│ [x] Can rent units          (rooms)              │
│ [ ] Can take orders                              │
└──────────────────────────────────────────────────┘
```

### Service Create/Edit Dialog (Phase C)

Sections appear conditionally based on merchant capabilities.

```
┌──────────────────────────────────────────────────┐
│ Service                                          │
│                                                  │
│ [Name          ] [Category ▼     ] [Price      ] │
│ [Description                                   ] │
│ [Image]                                          │
│                                                  │
│ ── Product Settings ────── (if can_sell)         │
│ [x] Available for purchase                       │
│ [SKU            ] [Stock Qty      ]              │
│ [x] Track stock                                  │
│                                                  │
│ ── Booking Settings ────── (if can_book)         │
│ [x] Available for booking                        │
│ [Duration: 60 mins ] [Max Capacity: 1  ]         │
│ [ ] Requires confirmation                        │
└──────────────────────────────────────────────────┘
```

### Service Schedule (Phase D)

Only shown for services with `is_bookable = true`.

```
┌──────────────────────────────────────────────────┐
│ Schedule — Haircut (60 min)                      │
│                                                  │
│ Mon  [09:00] - [17:00]  [✓ Available]           │
│ Tue  [09:00] - [17:00]  [✓ Available]           │
│ Wed  [09:00] - [17:00]  [✓ Available]           │
│ Thu  [09:00] - [17:00]  [✓ Available]           │
│ Fri  [09:00] - [17:00]  [✓ Available]           │
│ Sat  [10:00] - [14:00]  [✓ Available]           │
│ Sun  [—————] - [—————]  [  Closed   ]           │
│                                                  │
│                            [Save Schedule]       │
└──────────────────────────────────────────────────┘
```

### Merchant Bookings Page (Phase E)

```
┌──────────────────────────────────────────────────┐
│ Bookings                [Date ▼] [Status ▼]     │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ #101  Haircut                                │ │
│ │ John Doe · Feb 10, 2026 · 09:00-10:00      │ │
│ │ Status: ● Pending      [Confirm] [Cancel]   │ │
│ └──────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────┐ │
│ │ #102  Massage                                │ │
│ │ Jane Smith · Feb 10, 2026 · 10:00-11:30    │ │
│ │ Status: ● Confirmed    [Complete] [No Show] │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Unit Types Page (Phase F)

```
┌──────────────────────────────────────────────────┐
│ Unit Types                          [+ Add Type] │
│                                                  │
│ ┌─────────┬──────────┬──────────┬─────────────┐ │
│ │ Name    │ Base Rate│ Capacity │ Units Count │ │
│ ├─────────┼──────────┼──────────┼─────────────┤ │
│ │ Deluxe  │ ₱3,500   │ 2 guests │ 10 units   │ │
│ │ Standard│ ₱2,000   │ 2 guests │ 20 units   │ │
│ │ Suite   │ ₱8,000   │ 4 guests │ 5 units    │ │
│ └─────────┴──────────┴──────────┴─────────────┘ │
└──────────────────────────────────────────────────┘
```

### Units Page (Phase F)

```
┌──────────────────────────────────────────────────┐
│ Units           [Type ▼] [Status ▼] [+ Add Unit]│
│                                                  │
│ ┌─────────┬──────────┬────────┬────────────────┐ │
│ │ Name    │ Type     │ Rate   │ Status         │ │
│ ├─────────┼──────────┼────────┼────────────────┤ │
│ │ Room 201│ Deluxe   │ ₱3,500 │ ● Available    │ │
│ │ Room 202│ Deluxe   │ ₱3,800 │ ● Occupied     │ │
│ │ Room 101│ Standard │ ₱2,000 │ ● Maintenance  │ │
│ │ Site A1 │ Campsite │ ₱1,500 │ ● Available    │ │
│ └─────────┴──────────┴────────┴────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Reservations Page (Phase G)

```
┌──────────────────────────────────────────────────┐
│ Reservations         [Date Range] [Status ▼]    │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ #R001  Room 201 (Deluxe)                     │ │
│ │ Jane Smith · Feb 10-13 · 3 nights · 2 guests│ │
│ │ Total: ₱10,500                               │ │
│ │ Status: ● Confirmed   [Check In] [Cancel]   │ │
│ └──────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────┐ │
│ │ #R002  Site A1 (Campsite)                    │ │
│ │ John Doe · Feb 14-16 · 2 nights · 4 guests  │ │
│ │ Total: ₱3,000                                │ │
│ │ Status: ● Checked In  [Check Out]            │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Service Orders Page (Phase H)

```
┌──────────────────────────────────────────────────┐
│ Service Orders             [Status ▼] [Date ▼]  │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ ORD-20260210-001  Laundry Regular Wash       │ │
│ │ Maria Santos · 5.5 kg × ₱35/kg = ₱192.50   │ │
│ │ Est. completion: Feb 10, 5:00 PM             │ │
│ │ Status: ● Processing   [Mark Ready]          │ │
│ └──────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────┐ │
│ │ ORD-20260210-002  Water Refill 5 Gallon      │ │
│ │ Juan Cruz · 3 gal × ₱25/gal = ₱75.00       │ │
│ │ Status: ● Ready        [Deliver] [Complete]  │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Merchant Edit — Tabs Adapt to Capabilities

```
Base tabs (always):
  [Details] [Payment Methods] [Social Links] [Documents] [Account]

Conditional tabs:
  + [Bookings]      → if can_take_bookings (link to bookings page)
  + [Units]         → if can_rent_units (link to units page)
  + [Reservations]  → if can_rent_units (link to reservations page)
  + [Orders]        → if can_take_orders (link to orders page)

Merchant detail page header buttons adapt:
  [Categories] [Services]                              ← always
  + [Bookings]                                         ← if can_take_bookings
  + [Units] [Reservations]                             ← if can_rent_units
  + [Orders]                                           ← if can_take_orders
```

---

## Implementation Phases Summary

| Phase | Description | Depends On | New Models | Scope |
|-------|-------------|------------|------------|-------|
| **A** | BusinessType capability flags (4 booleans) + admin UI | — | — | Small |
| **B** | Merchant capability flags (copy on create) + edit UI | A | — | Small |
| **C** | Extend Service (product + booking fields) + service form | B | — | Medium |
| **D** | ServiceSchedule + bulk upsert + schedule UI | C | ServiceSchedule | Medium |
| **E** | Booking model + merchant booking management | D | Booking | Medium-Large |
| **F** | UnitType + Unit models + CRUD + UI | B | UnitType, Unit | Medium |
| **G** | Reservation model + management | F | Reservation | Medium-Large |
| **H** | ServiceOrder model + job tracking + UI | B | ServiceOrder | Medium-Large |
| **I** | Customer-facing booking/reservation flow (public) | E, G | — | Future |
| **J** | Customer-facing order placement (public) | H | — | Future |

### Recommended Order

```
Phase A+B  →  Phase C+D  →  Phase E     (Products + Bookings track)
                          →  Phase F+G   (Rentals track, can parallel with E)
                          →  Phase H     (Orders track, can parallel with E)
                          →  Phase I+J   (Public-facing, future)
```

Phases A+B should be done first as they are prerequisites for everything else. After that, C+D+E (products/bookings) and F+G (rentals) and H (orders) can be developed in any order based on priority.
