# Plan: Reservation Calendar Overlays + Merchant Booking Slot Management

**Date:** 2026-03-02
**Type:** feature
**Status:** Draft

---

## Knowledge Context

### Relevant Learnings
- `docs/knowledge/modules/booking.md`: Calendar returns `{date, booking_count, total_booked, total_capacity, is_closed}`; total_booked excludes cancelled/no_show; status is VARCHAR (not ENUM); capacity currently from ServiceSchedule
- `docs/knowledge/modules/reservation.md`: Calendar returns `{date, reservation_count, total_units, available_units, is_closed}`; active statuses are pending/confirmed/checked_in; overlap detection uses `<=` and `>` (not `<` and `>=`)
- `docs/knowledge/modules/frontend-my-store.md`: Settings page has 5 tabs (Details, Business Hours, Payment Methods, Social Links, Documents); each tab is a `my-store-*-tab.tsx` Client Component; follows Card/Form/Table CRUD pattern
- `docs/knowledge/solutions/test-failures/mysql-enum-factory-values-truncated-in-tests-customer-20260228.md`: MySQL ENUM columns reject out-of-set values; always use VARCHAR for status-like columns; factory must specify exact valid values

### Known Gotchas
1. **`total_capacity` in booking calendar** currently sums `max_capacity` from ServiceSchedule — after slot management, when slots exist the calendar should reflect slot capacity, not service capacity. Compute `total_capacity` from `merchant_booking_slots.max_capacity` when `has_slots = true`.
2. **Nullable FK** on `bookings.booking_slot_id` must use `nullOnDelete()` to handle slot deletion gracefully.
3. **`booking_slot_id` must remain Optional** in `BookingData` DTO — backward compat for merchants without slots.
4. **`start_time` / `end_time` overlap** — when slot-based booking, `start_time`/`end_time` come from the slot, not from the request. Do NOT require them as input when `booking_slot_id` is provided.
5. **Status is VARCHAR** — use `whereIn('status', [...])` not ENUM comparisons. Don't add MySQL ENUM columns to migrations; use varchar or tinyint.
6. **Branch merchant service lookup** — `BookingService.createBooking()` already resolves `serviceMerchantId = parent_id ?? merchantId`. Slot lookup should also follow this pattern: slots belong to the parent merchant.
7. **Reservation calendar state** already tracks OPEN/PARTIAL/FULL via color but without explicit badge text — the `getDayColor()` function already implements the 3-state logic. The plan is to add visible badge labels to the existing color scheme, not replace it.
8. **`getBookingAvailability()` in StorefrontService** currently uses `?month=YYYY-MM` param — the new slot endpoint uses `?date=YYYY-MM-DD`. Support both; dispatch in controller via presence of `date` vs `month` param.

### Critical Patterns Applied
- Service-Repository pattern for new `MerchantBookingSlot` module (model → repo/interface → service/interface → DTO → requests → resource → controller → routes → provider bindings)
- `BaseRepository` used for slot CRUD (`find`, `findOrFail`, `create`, `update`, `delete`, `paginate`)
- `Spatie\LaravelData\Optional` on all DTO fields — service filters with `reject(fn($v) => $v instanceof Optional)`
- `ApiResponse` trait on controller — use `successResponse()`, `createdResponse()`, `paginatedResponse()`, `noContentResponse()`
- Pest `describe()`/`it()` BDD test syntax, `Passport::actingAs()` for auth

---

## Overview

Two features from brainstorm `2026-03-02-reservation-calendar-and-booking-slot-management.md`:

**Feature 1 — Reservation Calendar Overlays (Frontend-only):** Add explicit OPEN/PARTIAL/FULL/CLOSED badge labels to each day cell in `ReservationsCalendarView`. No backend changes. The existing calendar endpoint already returns all needed data (`reservation_count`, `available_units`, `total_units`, `is_closed`).

**Feature 2 — Merchant-Level Booking Slot Management (Full-stack):** Merchants define global time slots (`merchant_booking_slots` table). Bookings optionally reference a slot via nullable `booking_slot_id` FK. Capacity is validated against `pending + confirmed` bookings per slot per date. Calendar and storefront endpoints are enhanced to reflect slot-level fill rates. Merchants manage slots via a new "Booking Slots" settings tab. Customers see a slot picker in the booking form instead of free-form time entry when the merchant has slots defined.

---

## Implementation Steps

### Step 1: Reservation Calendar Overlays (Frontend-only)

**Files:**
- `frontend/app/(system)/(my-store)/my-store/reservations/reservations-calendar-view.tsx`

**Details:**
- Keep existing `getDayColor()` function as-is (color-coding is correct)
- Add a `getStatusBadge(day: ReservationCalendarDay)` helper that returns badge props:
  - `is_closed` → `{ label: 'Closed', className: 'text-muted-foreground' }`
  - `total_units === 0` → no badge (no units configured yet)
  - `available_units === 0` → `{ label: 'FULL', className: 'text-red-700' }`
  - `available_units > 0 && available_units < total_units` → `{ label: 'PARTIAL', className: 'text-amber-700' }`
  - `available_units === total_units` → `{ label: 'OPEN', className: 'text-emerald-700' }`
- Replace the current cell content area (which shows `{day.reservation_count} res.` + `{available}/{total} avail.`) with:
  - Date number (top-left)
  - Status badge (bold, small uppercase) — e.g., "FULL", "PARTIAL", "OPEN"
  - Count line: `{day.reservation_count} res.` when > 0
- No type changes needed — `ReservationCalendarDay` already has all needed fields

**Knowledge note:** The frontend already uses color-coding via `getDayColor()` — the badge is an additional explicit label. Keep both (color + label) for clarity.

---

### Step 2: Backend — Migrations

**Files:**
- `backend/database/migrations/2026_03_02_200000_create_merchant_booking_slots_table.php` *(new)*
- `backend/database/migrations/2026_03_02_200001_add_booking_slot_id_to_bookings_table.php` *(new)*

**Migration 1 — `merchant_booking_slots` table:**
```php
Schema::create('merchant_booking_slots', function (Blueprint $table) {
    $table->id();
    $table->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
    $table->tinyInteger('day_of_week'); // 0=Sun, 6=Sat
    $table->time('start_time');
    $table->time('end_time')->nullable();
    $table->unsignedInteger('max_capacity')->nullable(); // null = unlimited
    $table->boolean('is_active')->default(true);
    $table->unsignedInteger('sort_order')->default(0);
    $table->timestamps();

    $table->unique(['merchant_id', 'day_of_week', 'start_time']);
    $table->index(['merchant_id', 'day_of_week', 'is_active']);
});
```

**Migration 2 — add nullable FK to `bookings`:**
```php
Schema::table('bookings', function (Blueprint $table) {
    $table->unsignedBigInteger('booking_slot_id')->nullable()->after('service_id');
    $table->foreign('booking_slot_id')
        ->references('id')
        ->on('merchant_booking_slots')
        ->nullOnDelete();
});
```

**Knowledge note:** `nullOnDelete()` is critical — when a slot is deleted, existing bookings referencing it become slot-less (backward compatible). Do NOT use `cascadeOnDelete()`.

---

### Step 3: Backend — Model + Factory + Model Relationship Updates

**Files:**
- `backend/app/Models/MerchantBookingSlot.php` *(new)*
- `backend/database/factories/MerchantBookingSlotFactory.php` *(new)*
- `backend/app/Models/Merchant.php` *(update)*
- `backend/app/Models/Booking.php` *(update)*

**`MerchantBookingSlot` model:**
```php
class MerchantBookingSlot extends Model {
    use HasFactory;

    protected $fillable = [
        'merchant_id', 'day_of_week', 'start_time', 'end_time',
        'max_capacity', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'max_capacity' => 'integer',  // nullable integer
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'is_active' => true,
        'sort_order' => 0,
    ];

    public function merchant(): BelongsTo { ... }
    public function bookings(): HasMany { ... }
}
```

**Factory:** Generate with `day_of_week` from `fake()->numberBetween(0, 6)`, `start_time` like `09:00`, `end_time` like `10:00`, `max_capacity` from `fake()->optional()->numberBetween(1, 20)`, `is_active = true`.

**Knowledge note:** Do NOT use MySQL ENUM for `day_of_week` — use `tinyInteger` (0-6). If you use ENUM factory values must match exactly, causing test fragility.

**Merchant.php — add:**
```php
public function bookingSlots(): HasMany {
    return $this->hasMany(MerchantBookingSlot::class);
}
```

**Booking.php — add:**
```php
public function bookingSlot(): BelongsTo {
    return $this->belongsTo(MerchantBookingSlot::class);
}
```
Also add `booking_slot_id` to `$fillable`.

---

### Step 4: Backend — Repository + Service + DTO + Requests + Resource

**Files:**
- `backend/app/Repositories/Contracts/MerchantBookingSlotRepositoryInterface.php` *(new)*
- `backend/app/Repositories/MerchantBookingSlotRepository.php` *(new)*
- `backend/app/Services/Contracts/MerchantBookingSlotServiceInterface.php` *(new)*
- `backend/app/Services/MerchantBookingSlotService.php` *(new)*
- `backend/app/Data/MerchantBookingSlotData.php` *(new)*
- `backend/app/Http/Requests/Api/V1/BookingSlot/StoreMerchantBookingSlotRequest.php` *(new)*
- `backend/app/Http/Requests/Api/V1/BookingSlot/UpdateMerchantBookingSlotRequest.php` *(new)*
- `backend/app/Http/Resources/Api/V1/MerchantBookingSlotResource.php` *(new)*
- `backend/app/Providers/RepositoryServiceProvider.php` *(update)*

**DTO (`MerchantBookingSlotData`):**
```php
public function __construct(
    public int|Optional $day_of_week = new Optional(),
    public string|Optional $start_time = new Optional(),       // 'HH:MM'
    public string|null|Optional $end_time = new Optional(),
    public int|null|Optional $max_capacity = new Optional(),   // null = unlimited
    public bool|Optional $is_active = new Optional(),
    public int|Optional $sort_order = new Optional(),
)
```

**Service methods (`MerchantBookingSlotService`):**
- `getMerchantSlots(int $merchantId): Collection` — returns all slots ordered by day_of_week, sort_order, start_time
- `getMerchantSlotById(int $merchantId, int $slotId): MerchantBookingSlot`
- `createSlot(int $merchantId, MerchantBookingSlotData $data): MerchantBookingSlot`
  - Validate unique `[merchant_id, day_of_week, start_time]` → throw ValidationException on conflict
- `updateSlot(int $merchantId, int $slotId, MerchantBookingSlotData $data): MerchantBookingSlot`
  - Validate unique constraint excluding current record
- `deleteSlot(int $merchantId, int $slotId): void`
  - Sets `booking_slot_id = null` on related bookings automatically (via `nullOnDelete`)
- `getMerchantActiveSlotsByDow(int $merchantId, int $dayOfWeek): Collection` — used by BookingService
- `merchantHasActiveSlots(int $merchantId): bool` — used by StorefrontService

**FormRequest validation:**
- `Store`: `day_of_week` required integer 0-6; `start_time` required `H:i` format; `end_time` nullable `H:i`; `max_capacity` nullable integer min 1; `is_active` boolean; `sort_order` integer min 0
- `Update`: same rules but all optional (except unique constraint excludes self)

**Resource (`MerchantBookingSlotResource`):**
```php
[
    'id', 'merchant_id', 'day_of_week', 'start_time', 'end_time',
    'max_capacity', 'is_active', 'sort_order', 'created_at', 'updated_at'
]
```

**RepositoryServiceProvider — add bindings:**
```php
$this->app->bind(MerchantBookingSlotRepositoryInterface::class, MerchantBookingSlotRepository::class);
$this->app->bind(MerchantBookingSlotServiceInterface::class, MerchantBookingSlotService::class);
```

---

### Step 5: Backend — Controller + Routes

**Files:**
- `backend/app/Http/Controllers/Api/V1/MerchantBookingSlotController.php` *(new)*
- `backend/routes/api.php` *(update)*

**Controller actions:**
- `index(Request $request)` — list all slots for resolved merchant (self-service) or given merchant (admin); returns unpaginated collection grouped by day_of_week
- `store(StoreMerchantBookingSlotRequest $request)` — create slot
- `show($slotId)` — get single slot
- `update(UpdateMerchantBookingSlotRequest $request, $slotId)` — update slot
- `destroy($slotId)` — delete slot with try-catch for `ModelNotFoundException` → 422

**Self-service routes** (in `auth/merchant/` group, existing middleware stack):
```
GET    /auth/merchant/booking-slots
POST   /auth/merchant/booking-slots
GET    /auth/merchant/booking-slots/{slot}
PUT    /auth/merchant/booking-slots/{slot}
DELETE /auth/merchant/booking-slots/{slot}
```

**Admin routes** (under `merchants/{merchant}/` with `permission:merchants.update` or `services.update`):
```
GET    /merchants/{merchant}/booking-slots
POST   /merchants/{merchant}/booking-slots
PUT    /merchants/{merchant}/booking-slots/{slot}
DELETE /merchants/{merchant}/booking-slots/{slot}
```

**Knowledge note:** No new permissions needed — use existing `merchants.update` (or `services.update`) for admin routes since slots are store-level configuration. Self-service auto-resolves merchant from `$request->user()->merchant`.

---

### Step 6: Backend — BookingService Updates

**Files:**
- `backend/app/Services/BookingService.php` *(update)*
- `backend/app/Services/Contracts/BookingServiceInterface.php` *(update)*
- `backend/app/Data/BookingData.php` *(update)*
- `backend/app/Http/Requests/Api/V1/Booking/CreateBookingRequest.php` *(update)*

**`BookingData` — add optional field:**
```php
public int|null|Optional $booking_slot_id = new Optional(),
```

**`CreateBookingRequest` — add optional validation:**
```php
'booking_slot_id' => 'nullable|integer|exists:merchant_booking_slots,id',
```

**`BookingService.createBooking()` — slot capacity check:**

After the existing schedule + time validation block, add:
```php
// If booking_slot_id provided, validate slot capacity
if (!($data->booking_slot_id instanceof Optional) && $data->booking_slot_id !== null) {
    $slot = MerchantBookingSlot::where('merchant_id', $merchantId)
        ->where('is_active', true)
        ->findOrFail($data->booking_slot_id);

    // Override start/end time from slot
    $startTime = substr($slot->start_time, 0, 5);
    $endTime = $slot->end_time ? substr($slot->end_time, 0, 5) : $endTime;

    // Check slot capacity (pending + confirmed bookings for this slot on this date)
    if ($slot->max_capacity !== null) {
        $slotBookings = Booking::where('booking_slot_id', $slot->id)
            ->where('booking_date', $data->booking_date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();
        if ($slotBookings >= $slot->max_capacity) {
            throw ValidationException::withMessages([
                'booking_slot_id' => ['This time slot is fully booked.'],
            ]);
        }
    }
}
```

Also add `booking_slot_id` to the `Booking::create([...])` call.

**`BookingService.getBookingCalendar()` — slot-aware calendar:**

After computing `$capacityByDow`, add slot computation:
```php
// Check if merchant has active slots
$slots = MerchantBookingSlot::where('merchant_id', $merchantId)
    ->where('is_active', true)
    ->get()
    ->groupBy('day_of_week');

$hasSlots = $slots->isNotEmpty();

// If has slots: compute per-slot bookings per day
if ($hasSlots) {
    $slotBookings = Booking::where('merchant_id', $merchantId)
        ->whereBetween('booking_date', [$start->toDateString(), $end->toDateString()])
        ->whereNotNull('booking_slot_id')
        ->whereNotIn('status', ['cancelled', 'no_show'])
        ->select('booking_date', 'booking_slot_id',
            DB::raw('COUNT(*) as booked'))
        ->groupBy('booking_date', 'booking_slot_id')
        ->get();
    // Group by date → slot_id → count
}
```

Each day in `$result` now includes:
- `has_slots: bool` — true if merchant has active slots for that `day_of_week`
- `slots: array` — only present when `has_slots = true`; each slot item: `{ slot_id, start_time, end_time, booked, max_capacity, is_full }`
- `total_capacity` — when `has_slots = true`, sum of non-null `max_capacity` for slots on that dow (unlimited slots contribute 0)

**Knowledge note:** The `total_capacity` logic changes when slots exist. Old code sums `ServiceSchedule.service.max_capacity`; new code sums `MerchantBookingSlot.max_capacity`. This changes what the booking calendar color-coding means — update the frontend legend accordingly.

---

### Step 7: Backend — StorefrontService Slot Availability

**Files:**
- `backend/app/Services/StorefrontService.php` *(update)*
- `backend/app/Services/Contracts/StorefrontServiceInterface.php` *(update)*
- `backend/app/Http/Controllers/Api/V1/StorefrontController.php` *(update)*

**New method `getBookingSlotAvailability(string $slug, int $serviceId, string $date)`:**
```php
public function getBookingSlotAvailability(string $slug, int $serviceId, string $date): array
{
    $merchant = Merchant::where('slug', $slug)->where('status', 'active')->firstOrFail();

    // Verify service belongs to merchant and is bookable
    $service = Service::where('merchant_id', $merchant->id)
        ->where('is_active', true)->where('service_type', 'bookable')
        ->findOrFail($serviceId);

    $parsedDate = Carbon::parse($date);
    $dayOfWeek = $parsedDate->dayOfWeek;

    $slots = MerchantBookingSlot::where('merchant_id', $merchant->id)
        ->where('day_of_week', $dayOfWeek)
        ->where('is_active', true)
        ->orderBy('sort_order')->orderBy('start_time')
        ->get();

    if ($slots->isEmpty()) {
        // No slots defined for this day — return existing schedule-based data
        return $this->getBookingAvailability($slug, $serviceId, $parsedDate->format('Y-m'));
    }

    // Get bookings per slot for this date
    $slotBookingCounts = Booking::where('merchant_id', $merchant->id)
        ->where('booking_date', $date)
        ->whereIn('status', ['pending', 'confirmed'])
        ->whereNotNull('booking_slot_id')
        ->select('booking_slot_id', DB::raw('COUNT(*) as booked'))
        ->groupBy('booking_slot_id')
        ->pluck('booked', 'booking_slot_id');

    $slotList = $slots->map(function ($slot) use ($slotBookingCounts) {
        $booked = $slotBookingCounts->get($slot->id, 0);
        $isFull = $slot->max_capacity !== null && $booked >= $slot->max_capacity;
        $available = $slot->max_capacity !== null ? max(0, $slot->max_capacity - $booked) : null;
        return [
            'slot_id' => $slot->id,
            'start_time' => substr($slot->start_time, 0, 5),
            'end_time' => $slot->end_time ? substr($slot->end_time, 0, 5) : null,
            'available' => $available,
            'max_capacity' => $slot->max_capacity,
            'status' => $isFull ? 'full' : 'available',
        ];
    })->values()->toArray();

    return [
        'date' => $date,
        'has_slots' => true,
        'slots' => $slotList,
    ];
}
```

**`StorefrontController.bookingAvailability()` — dispatch based on param:**
```php
if ($request->has('date')) {
    $data = $this->storefrontService->getBookingSlotAvailability($slug, $serviceId, $request->date);
} else {
    $data = $this->storefrontService->getBookingAvailability($slug, $serviceId, $request->month ?? now()->format('Y-m'));
}
return $this->successResponse($data, '...');
```

---

### Step 8: Backend — Tests

**Files:**
- `backend/tests/Feature/Api/V1/MerchantBookingSlotTest.php` *(new)*

**Test cases (Pest describe/it syntax, `Passport::actingAs()`, `RefreshDatabase` auto-applied):**

```
describe('MerchantBookingSlot', function() {
  describe('self-service (my-store)', function() {
    it('lists booking slots for merchant')
    it('creates a booking slot')
    it('rejects duplicate slot (same day_of_week + start_time)')
    it('updates a booking slot')
    it('deletes a booking slot')
    it('cannot manage another merchant\'s slots')
  })

  describe('admin', function() {
    it('lists slots for any merchant with merchants.update permission')
    it('creates slot for any merchant with permission')
    it('deletes slot and nullifies related booking_slot_ids')
  })

  describe('booking capacity validation', function() {
    it('allows booking when slot has remaining capacity')
    it('rejects booking when slot is at max capacity')
    it('allows booking when slot is unlimited (max_capacity = null)')
    it('counts pending + confirmed bookings against capacity')
  })

  describe('calendar endpoint with slots', function() {
    it('returns has_slots=true and slots[] when merchant has active slots')
    it('returns has_slots=false when merchant has no slots')
    it('reflects slot fill rate per day')
  })

  describe('storefront slot availability', function() {
    it('returns slot list when queried with date param and slots exist')
    it('returns full slots as status=full')
    it('returns unlimited slots with available=null and status=available')
    it('falls back to schedule-based availability when no slots for that day')
  })
})
```

**Knowledge note:** Factory must use `day_of_week` as integer (0-6), not ENUM string. `max_capacity` can be null (unlimited). When testing capacity, create bookings with `booking_slot_id` set and verify count logic.

---

### Step 9: Frontend Admin — Types + Service + Hooks + Validations

**Files:**
- `frontend/types/api.ts` *(update)*
- `frontend/services/bookingSlotService.ts` *(new)*
- `frontend/hooks/useBookingSlots.ts` *(new)*
- `frontend/lib/validations.ts` *(update)*

**New types in `types/api.ts`:**
```typescript
export interface MerchantBookingSlot {
  id: number;
  merchant_id: number;
  day_of_week: number;    // 0=Sun, 6=Sat
  start_time: string;     // 'HH:MM'
  end_time: string | null;
  max_capacity: number | null;  // null = unlimited
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookingCalendarSlot {
  slot_id: number;
  start_time: string;
  end_time: string | null;
  booked: number;
  max_capacity: number | null;
  is_full: boolean;
}
```

**Extend `BookingCalendarDay` interface:**
```typescript
export interface BookingCalendarDay {
  // ... existing fields ...
  has_slots?: boolean;
  slots?: BookingCalendarSlot[];
}
```

**Service (`bookingSlotService.ts`):**
```typescript
getAll(merchantId?: number)     // admin: pass merchantId; self-service: omit
create(data, merchantId?)
update(slotId, data, merchantId?)
delete(slotId, merchantId?)
```

**Hooks (`useBookingSlots.ts`):**
- `useBookingSlots(merchantId?)` — `queryKey: ['booking-slots', merchantId ?? 'my']`
- `useCreateBookingSlot(merchantId?)` — invalidates booking-slots on success
- `useUpdateBookingSlot(merchantId?)` — invalidates booking-slots on success
- `useDeleteBookingSlot(merchantId?)` — invalidates booking-slots on success

**Validations:**
```typescript
export const createBookingSlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  max_capacity: z.number().int().min(1).optional().nullable(), // z.number() not z.coerce.number()
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});
export const updateBookingSlotSchema = createBookingSlotSchema.partial();
```

**Knowledge note:** Use `z.number()` not `z.coerce.number()` — coerce causes type mismatch with react-hook-form zodResolver (documented CLAUDE.md gotcha). The form inputs should use `valueAsNumber` on the `<input>` to handle number conversion.

---

### Step 10: Frontend Admin — Booking Slots Settings Tab

**Files:**
- `frontend/app/(system)/(my-store)/my-store/settings/my-store-booking-slots-tab.tsx` *(new)*
- `frontend/app/(system)/(my-store)/my-store/settings/page.tsx` *(update)*

**Tab component (`my-store-booking-slots-tab.tsx`):**
- `'use client'` directive
- Takes `merchant: Merchant` prop (same pattern as other tabs)
- Uses `useBookingSlots()` hook (self-service, no merchantId)
- Shows 7-day grid (Sunday → Saturday) with day name header
- For each day, lists slots with: `{start_time}–{end_time} | max: {max_capacity ?? 'unlimited'} | {is_active ? 'Active' : 'Inactive'}` + edit/delete buttons
- "+ Add slot" button per day — opens create dialog
- Create/edit dialog with react-hook-form + `createBookingSlotSchema` / `updateBookingSlotSchema`
- Dialog fields: Day (Select 0-6 → display name), Start Time (time input), End Time (time input, optional), Max Capacity (number input, leave empty for unlimited), Is Active (switch)
- Delete uses inline confirm (`window.confirm()` per customer portal pattern)
- Feedback via `sonner` toast

**Settings page update (`page.tsx`):**
- Import `MyStoreBookingSlotsTab`
- Only show "Booking Slots" tab when `merchant.can_take_bookings === true` (gate to prevent irrelevant tab for non-booking merchants)
- Add `TabsTrigger value="booking-slots"` and `TabsContent value="booking-slots"` with `<MyStoreBookingSlotsTab merchant={merchant} />`

---

### Step 11: Frontend Admin — Booking Calendar Slot Panel

**Files:**
- `frontend/app/(system)/(my-store)/my-store/bookings/bookings-calendar-view.tsx` *(update)*

**Changes:**
- Accept an `onDayClick(date: string, slots?: BookingCalendarSlot[])` callback (extend Props interface)
- When a day is clicked and `day.has_slots === true`, pass `day.slots` to callback
- In `bookings/page.tsx`, when `has_slots` day is clicked, open a side panel/sheet showing:
  - Day's slot breakdown table: Time | Booked | Capacity | Fill %
  - Color-code each slot row: green (<50%), amber (50-89%), red (90%+), muted (full)
- When `has_slots === false`, existing behavior (filter list by date)
- Update legend: When merchant has slots, add slot-level indicator to legend

**Knowledge note:** `BookingCalendarDay` type extension with `has_slots?` and `slots?` is backward compatible — existing code only uses the original fields.

---

### Step 12: Customer Portal — Types + Service + Hook Updates

**Files:**
- `frontend-customer-portal/types/api.ts` *(update)*
- `frontend-customer-portal/services/storefrontService.ts` *(update)*
- `frontend-customer-portal/hooks/useStorefront.ts` *(update)*

**New type in customer portal `types/api.ts`:**
```typescript
export interface StorefrontBookingSlot {
  slot_id: number;
  start_time: string;
  end_time: string | null;
  available: number | null;   // null = unlimited
  max_capacity: number | null;
  status: 'available' | 'full';
}

export interface BookingSlotAvailability {
  date: string;
  has_slots: boolean;
  slots: StorefrontBookingSlot[];
}
```

**`storefrontService.ts` — add:**
```typescript
getBookingSlotAvailability(slug: string, serviceId: number, date: string): Promise<BookingSlotAvailability>
// GET /storefront/merchants/{slug}/services/{serviceId}/booking-availability?date={date}
```

**`useStorefront.ts` — add:**
```typescript
export function useBookingSlotAvailability(slug: string, serviceId: number, date: string | null) {
  return useQuery({
    queryKey: ['storefront', slug, 'services', serviceId, 'slots', date],
    queryFn: () => storefrontService.getBookingSlotAvailability(slug, serviceId, date!),
    enabled: !!date,
  });
}
```

---

### Step 13: Customer Portal — Slot Picker Integration in Booking Form

**Files:**
- `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/page.tsx` *(update)*
- `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/merchant-slot-picker.tsx` *(new)*

**New component `merchant-slot-picker.tsx`:**
- Props: `slots: StorefrontBookingSlot[]`, `selectedSlotId: number | null`, `onSlotSelect: (slot: StorefrontBookingSlot) => void`
- Renders grid of slot buttons (similar to existing `TimeSlotPicker` design)
- Full slots (status = 'full') are disabled
- Shows available count or "Available" when null (unlimited)
- Selected slot gets primary ring highlight

**`book/page.tsx` changes:**
- After a date is selected, check if merchant has slots:
  - Use existing `useBookingAvailability(slug, serviceId, month)` — this already returns `schedule` and `booked_slots`
  - Add call to `useBookingSlotAvailability(slug, serviceId, selectedDate)` when a date is clicked
  - If response has `has_slots: true` → render `<MerchantSlotPicker>` instead of `<TimeSlotPicker>`
  - Store selected slot: `const [selectedSlot, setSelectedSlot] = useState<StorefrontBookingSlot | null>(null)`
- On booking submission:
  - If `selectedSlot` → include `booking_slot_id: selectedSlot.slot_id` in payload
  - If no slots → existing `start_time` field in payload

**`storefrontService.ts` — update `createBooking` or `customerPortalService` — add `booking_slot_id` to booking creation payload when provided.**

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `booking_slot_id` FK breaks existing booking tests | Medium | Make FK nullable + `nullOnDelete()`. No existing test passes `booking_slot_id`. Tests use `RefreshDatabase` so migration runs clean. |
| Branch merchant slot lookup uses wrong merchant_id | Medium | In `BookingService.createBooking()`, resolve `$merchantId = $merchant->parent_id ?? $merchantId` before slot lookup (already done for service lookup). |
| `total_capacity` change in calendar breaks existing frontend display | Low | Frontend `BookingsCalendarView` still shows ratio-based color; when `has_slots = true`, `total_capacity` now means slot capacity sum. Update legend text accordingly. |
| Storefront `date` param conflicts with `month` param | Low | Use `if ($request->has('date'))` guard in controller — only dispatch to slot method when `date` param explicitly present. |
| Unlimited slot (max_capacity = null) breaks capacity ratio rendering | Medium | In BookingCalendarView, when `max_capacity === null`, skip ratio color; treat as "available". Frontend: check `max_capacity !== null` before computing fill %. |
| My-Store Booking Slots tab shown to non-booking merchants | Low | Gate tab behind `merchant.can_take_bookings` in settings page. |
| React Hook Form with `z.number()` for integer fields | Medium | Documented gotcha: use `z.number()` not `z.coerce.number()`. Use `valueAsNumber` on `<input type="number">` in the form to pass native number. |

---

## Testing Strategy

### Backend (Pest)
- [ ] `MerchantBookingSlotTest` — CRUD + merchant isolation (cannot manage other merchant's slots)
- [ ] Slot capacity validation: full slot → 422; unlimited → always allowed; pending+confirmed both count
- [ ] Calendar endpoint: `has_slots=true` when slots exist; slot data in response
- [ ] Storefront slot availability: correct `full`/`available` status; unlimited slot returns `available=null`
- [ ] Backward compat: existing booking tests still pass (nullable `booking_slot_id` doesn't break)
- [ ] Run: `docker compose exec app php artisan test tests/Feature/Api/V1/MerchantBookingSlotTest.php`

### Frontend (TypeScript + ESLint)
- [ ] `npm run build` from `frontend/` — no new TypeScript errors
- [ ] `npm run lint` from `frontend/` — no new lint errors
- [ ] `npm run build` from `frontend-customer-portal/` — no new TypeScript errors
- [ ] Visual: ReservationsCalendarView shows correct OPEN/PARTIAL/FULL badges
- [ ] Visual: BookingSlotsTab shows 7-day grid with slot CRUD
- [ ] Visual: BookingsCalendarView shows slot panel on day click (when merchant has slots)
- [ ] Visual: Booking form shows `MerchantSlotPicker` when merchant has slots defined

---

## Open Questions

1. **Admin slot management**: The brainstorm lists admin routes under `merchants/{merchant}/booking-slots`. Confirm these are needed at launch or if merchant self-service is sufficient for MVP.
2. **`start_time`/`end_time` on bookings when slot used**: When `booking_slot_id` is set, the slot's `start_time` overrides the booking's `start_time`. Clarify: should `start_time` on the booking still be populated (for display/legacy queries), or can it be left blank?
   - **Recommended**: Always populate `start_time`/`end_time` from slot for consistency with non-slot bookings.
3. **Existing bookings in slot-less bucket**: When a merchant creates slots after having free-form bookings, those old bookings have `booking_slot_id = null`. In the new slot-aware calendar, they'll show in `booking_count` but not in any slot's `booked` count. UI should make this clear (e.g., add "unslotted" count to calendar day).
4. **`start_time`/`end_time` required fields on `CreateBookingRequest`**: Currently both are required. When `booking_slot_id` is provided, should they become optional? **Recommended**: Make `start_time` optional when `booking_slot_id` is present (use `required_without:booking_slot_id` Laravel validation rule).

---

## Execution Waves

For `/work` execution, the steps above can be batched into parallel waves:

### Wave 1 (independent — can all run in parallel)
- **Step 1**: Reservation calendar overlays (frontend-only, no dependencies)
- **Step 2**: Backend migrations (DB layer, no code dependencies)
- **Step 3**: Backend model/factory/model-updates (depends on Step 2)

### Wave 2 (sequential after Wave 1 Step 3)
- **Step 4**: Repository + Service + DTO + Requests + Resource + RepositoryServiceProvider
- **Step 5**: Controller + Routes

### Wave 3 (sequential after Wave 2)
- **Step 6**: BookingService updates (slot capacity check + calendar)
- **Step 7**: StorefrontService slot availability

### Wave 4 (sequential after Wave 3)
- **Step 8**: Backend tests

### Wave 5 (can run after Wave 2 for types; after Wave 3 for full integration)
- **Step 9**: Frontend Admin types + service + hooks + validations
- **Step 10**: Frontend Admin settings tab (Booking Slots)
- **Step 11**: Frontend Admin calendar slot panel

### Wave 6 (after Wave 5)
- **Step 12**: Customer Portal types + service + hook updates
- **Step 13**: Customer Portal slot picker integration
