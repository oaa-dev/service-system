# Customer Portal & Storefront Architecture

> Comprehensive architecture documentation for the public storefront API, authenticated customer portal API, multi-role registration, customer portal frontend, and supporting permission system.

**Date:** 2026-02-25
**Components:** AuthController, StorefrontController, CustomerPortalController, StorefrontService, CustomerPortalService, RegisterRequest, RolePermissionSeeder
**Tags:** customer-portal, storefront, multi-role-registration, service-repository-pattern

---

## Overview

This system introduces two new consumer-facing API surfaces and a dedicated frontend application:

1. **Storefront (Public API)** -- Unauthenticated, read-only endpoints for browsing active merchants and their services. Consumed by the customer portal frontend and potentially SEO crawlers.
2. **Customer Portal (Authenticated API)** -- Authenticated endpoints for customers to create bookings/reservations/orders, view their own history, and cancel pending items.
3. **Customer Portal Frontend** -- A standalone Next.js 16 application (`frontend-customer-portal/`, port 3001) providing the customer-facing UI.

The customer portal composes existing domain services (`BookingService`, `ReservationService`, `ServiceOrderService`) rather than reimplementing business logic, following the principle of delegation over duplication.

### Related Documentation

- [`docs/customer-portal-plan.md`](customer-portal-plan.md) -- Original 6-phase implementation plan
- [`docs/onboarding-flow-plan.md`](onboarding-flow-plan.md) -- OTP verification and role assignment foundation
- [`docs/customer-management-module.md`](customer-management-module.md) -- Admin-side customer CRUD system
- [`docs/service-capabilities-module.md`](service-capabilities-module.md) -- Booking, Reservation, ServiceOrder models
- [`CLAUDE.md`](../CLAUDE.md) -- Master project conventions and architecture guide

---

## 1. Storefront (Public API)

### Route Structure

All routes are outside the `auth:api` middleware -- entirely public, no authentication required.

```
GET  /api/v1/storefront/merchants                           -- Paginated active merchants
GET  /api/v1/storefront/merchants/{slug}                    -- Merchant detail by slug
GET  /api/v1/storefront/merchants/{slug}/services           -- Merchant's active services
GET  /api/v1/storefront/merchants/{slug}/services/{service} -- Service detail with schedules
```

```php
// routes/api.php
Route::prefix('storefront')->group(function () {
    Route::get('merchants', [StorefrontController::class, 'merchants']);
    Route::get('merchants/{slug}', [StorefrontController::class, 'merchantDetail']);
    Route::get('merchants/{slug}/services', [StorefrontController::class, 'merchantServices']);
    Route::get('merchants/{slug}/services/{service}', [StorefrontController::class, 'serviceDetail']);
});
```

### Controller

Thin controller delegating to `StorefrontServiceInterface`. Uses existing `MerchantResource` and `ServiceResource` transformers.

### Service Layer

`StorefrontService` is a standalone read-only service with no repository -- it queries models directly through QueryBuilder and Eloquent.

**Critical constraint:** Only `status === 'active'` merchants and `is_active === true` services are exposed.

```php
// Merchants list -- only active, with search + capability filters
public function getActiveMerchants(Request $request)
{
    return QueryBuilder::for(Merchant::where('status', 'active'))
        ->allowedFilters([
            AllowedFilter::partial('search', 'name'),
            AllowedFilter::exact('business_type_id'),
            AllowedFilter::exact('can_sell_products'),
            AllowedFilter::exact('can_take_bookings'),
            AllowedFilter::exact('can_rent_units'),
        ])
        ->allowedSorts(['name', 'created_at'])
        ->defaultSort('name')
        ->with(['businessType', 'media', 'address'])
        ->paginate($request->per_page ?? 15)
        ->appends(request()->query());
}
```

Merchant detail by slug eagerly loads the full profile:

```php
public function getMerchantBySlug(string $slug)
{
    return Merchant::where('slug', $slug)
        ->where('status', 'active')
        ->with([
            'businessType', 'media',
            'address.region', 'address.province', 'address.geoCity', 'address.barangay',
            'businessHours', 'paymentMethods', 'socialLinks', 'serviceCategories',
        ])
        ->firstOrFail();
}
```

### Design Decisions

- **No repository layer** -- Read-only service doesn't need BaseRepository write abstractions
- **Slug-based lookup** -- SEO-friendly, doesn't expose auto-incrementing IDs
- **Double-gating** -- Inactive merchant = 404, inactive service = 404, service from wrong merchant = 404

### Tests

12 tests in `StorefrontControllerTest.php` covering:
- Active-only filtering (status-based)
- Search and business-type filters
- Pagination metadata
- Slug lookup (valid, inactive = 404, non-existent = 404)
- Service listing (active only, inactive merchant = 404, category filter)
- Service detail with schedules
- Cross-merchant isolation (service from merchant B via merchant A's slug = 404)

---

## 2. Customer Portal (Authenticated API)

### Route Structure

Two route groups within `auth:api` + `ensure.verified` + `onboarding` middleware:

```
# Create through merchant slug
POST /api/v1/customer/merchants/{slug}/bookings       [permission: customer_portal.book]
POST /api/v1/customer/merchants/{slug}/reservations    [permission: customer_portal.reserve]
POST /api/v1/customer/merchants/{slug}/orders          [permission: customer_portal.order]

# View and manage own items
GET   /api/v1/customer/my/stats                        [permission: customer_portal.view_own]
GET   /api/v1/customer/my/bookings                     [permission: customer_portal.view_own]
GET   /api/v1/customer/my/bookings/{booking}           [permission: customer_portal.view_own]
PATCH /api/v1/customer/my/bookings/{booking}/cancel     [permission: customer_portal.cancel_own]
GET   /api/v1/customer/my/reservations                 [permission: customer_portal.view_own]
PATCH /api/v1/customer/my/reservations/{reservation}/cancel [permission: customer_portal.cancel_own]
GET   /api/v1/customer/my/orders                       [permission: customer_portal.view_own]
PATCH /api/v1/customer/my/orders/{order}/cancel         [permission: customer_portal.cancel_own]
```

### Service Layer

`CustomerPortalService` composes existing domain services via constructor injection:

```php
public function __construct(
    protected MerchantRepositoryInterface $merchantRepository,
    protected BookingServiceInterface $bookingService,
    protected ReservationServiceInterface $reservationService,
    protected ServiceOrderServiceInterface $serviceOrderService
) {}
```

**Create actions** resolve merchant by slug, ensure active status, then delegate:

```php
public function createBooking(string $slug, BookingData $data): Booking
{
    $merchant = $this->resolveActiveMerchant($slug);
    return $this->bookingService->createBooking($merchant->id, $data);
}

private function resolveActiveMerchant(string $slug): Merchant
{
    $merchant = $this->merchantRepository->findBySlug($slug);
    if (! $merchant || $merchant->status !== 'active') {
        throw new ModelNotFoundException('Merchant not found or not active.');
    }
    return $merchant;
}
```

**"My" endpoints** scope queries to `auth()->id()`:

```php
public function getMyBookings(Request $request): LengthAwarePaginator
{
    $customerId = auth()->id();
    return QueryBuilder::for(Booking::class)
        ->where('customer_id', $customerId)
        ->allowedFilters([
            AllowedFilter::exact('status'),
            AllowedFilter::callback('date_from', fn($q, $v) => $q->where('booking_date', '>=', $v)),
            AllowedFilter::callback('date_to', fn($q, $v) => $q->where('booking_date', '<=', $v)),
        ])
        ->allowedSorts(['booking_date', 'created_at', 'status'])
        ->defaultSort('-created_at')
        ->with(['service', 'service.media'])
        ->paginate($request->per_page ?? 15)
        ->appends(request()->query());
}
```

**Cancel operations** enforce status restrictions:

| Entity | Cancellable from | Not cancellable from |
|--------|-----------------|---------------------|
| Booking | `pending`, `confirmed` | `completed`, `no_show`, `cancelled` |
| Reservation | `pending`, `confirmed` | `checked_in`, `checked_out`, `cancelled` |
| Order | `pending` | `received`, `processing`, `ready`, `delivering`, `completed`, `cancelled` |

**Dashboard stats** -- Aggregate counts:

```php
public function getMyStats(): array
{
    $customerId = auth()->id();
    return [
        'bookings' => [
            'total' => Booking::where('customer_id', $customerId)->count(),
            'upcoming' => Booking::where('customer_id', $customerId)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where('booking_date', '>=', now()->toDateString())->count(),
        ],
        'reservations' => ['total' => ..., 'active' => ...],
        'orders' => ['total' => ..., 'active' => ...],
    ];
}
```

### Form Requests

Three dedicated request classes (no `customer_id` -- derived from `auth()->id()`):

- `CreateCustomerBookingRequest`: service_id, booking_date, start_time, optional party_size + notes
- `CreateCustomerReservationRequest`: service_id, check_in, check_out, optional guest_count + notes + special_requests
- `CreateCustomerOrderRequest`: service_id, quantity, unit_label, optional notes

### Tests

26 tests in `CustomerPortalControllerTest.php` covering:
- Create actions (active merchant, inactive = 404, non-existent = 404, auth required = 401, validation = 422)
- Ownership scoping (list returns only own records, cannot view another user's records = 404)
- Cancel workflows (valid from pending/confirmed, rejected from terminal statuses = 422)
- Dashboard stats (populated counts, zeroes for new customer)

---

## 3. Role-based Registration

### Registration Flow

The `AuthController::register()` endpoint now accepts an optional `role` parameter:

```php
// RegisterRequest
'role' => ['sometimes', 'in:merchant,customer'],
```

```php
// AuthController::register()
$role = $validated['role'] ?? 'merchant';
if ($user->roles->isEmpty()) {
    $user->assignRole($role);
    $user->load('roles');
}

// Auto-create Customer record when registering as customer
if ($role === 'customer') {
    $user->customer()->create(['user_id' => $user->id]);
}
```

### Safety Mechanisms

1. **Whitelist validation** -- Only `merchant` and `customer` allowed via `'in:merchant,customer'`. An attacker cannot register as `admin` or `super-admin`.
2. **Default fallback** -- Omitting `role` defaults to `merchant` (original behavior).
3. **Conditional side-effects** -- Customer registration auto-creates the `Customer` record. Merchant registration creates the merchant later via onboarding.
4. **Idempotent role assignment** -- `if ($user->roles->isEmpty())` prevents double-assignment on re-registration of unverified users.

### Auth endpoint changes

The `me()` endpoint now loads the `customer` relationship:
```php
$user = $request->user()->load(['profile.media', 'roles', 'merchant', 'customer']);
```

### Tests

3 new tests in `AuthControllerTest.php`:
- Default registration assigns `merchant` role, no Customer record
- Registration with `role=customer` assigns customer role and creates Customer record
- Registration with `role=admin` returns 422 validation error

---

## 4. Permission Structure

### New Permission Group

```php
// RolePermissionSeeder
'customer_portal' => [
    'customer_portal.browse',       // Reserved (storefront is public)
    'customer_portal.book',         // POST /customer/merchants/{slug}/bookings
    'customer_portal.reserve',      // POST /customer/merchants/{slug}/reservations
    'customer_portal.order',        // POST /customer/merchants/{slug}/orders
    'customer_portal.view_own',     // GET /customer/my/*
    'customer_portal.cancel_own',   // PATCH /customer/my/*/cancel
],
```

### Customer Role

```php
'customer' => [
    'profile.view', 'profile.update',
    'customer_portal.browse', 'customer_portal.book', 'customer_portal.reserve',
    'customer_portal.order', 'customer_portal.view_own', 'customer_portal.cancel_own',
],
```

Admin/super-admin roles do NOT receive `customer_portal.*` permissions (super-admin bypasses via `Gate::before`).

---

## 5. Frontend Customer Portal

### Stack

- Next.js 16 with React 19 and App Router
- TanStack React Query v5 (server state)
- react-hook-form v7 + Zod v4 (form validation)
- Zustand v5 (auth state, persisted to `customer-auth-storage`)
- Tailwind CSS v4 + shadcn/ui components
- Custom fonts: DM Sans (body) + Bricolage Grotesque (display)

### Route Architecture

```
app/
  page.tsx                              -- Landing page
  (auth)/
    layout.tsx                          -- Centered card layout
    login/page.tsx                      -- Login (redirect-aware)
    register/page.tsx                   -- Registration (hard-codes role=customer)
    verify-email/page.tsx               -- OTP verification
  (storefront)/
    layout.tsx                          -- StorefrontNav header + footer
    merchants/page.tsx                  -- Merchant grid with search
    merchants/[slug]/page.tsx           -- Merchant detail (services + info tabs)
    merchants/[slug]/book/page.tsx      -- Booking form (auth-gated)
    merchants/[slug]/reserve/page.tsx   -- Reservation form (auth-gated)
    merchants/[slug]/order/page.tsx     -- Order form (auth-gated)
  (customer)/
    layout.tsx                          -- Authenticated nav + avatar dropdown
    dashboard/page.tsx                  -- Stats cards
    bookings/page.tsx                   -- Booking history + cancel
    reservations/page.tsx               -- Reservation history + cancel
    orders/page.tsx                     -- Order history + cancel
    profile/page.tsx                    -- Customer profile
```

### Service Layer

| File | Purpose | API Prefix |
|------|---------|------------|
| `authService.ts` | Login, register (role=customer), OTP | `/auth/*` |
| `storefrontService.ts` | Public browsing | `/storefront/*` |
| `customerActionService.ts` | Create booking/reservation/order | `/customer/merchants/{slug}/*` |
| `customerDashboardService.ts` | My stats, history, cancel | `/customer/my/*` |

### AuthGate Pattern

The `AuthGate` component wraps booking/reservation/order forms. Unauthenticated users see a sign-in prompt with redirect-aware links:

```tsx
export function AuthGate({ children, title }: AuthGateProps) {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  if (isAuthenticated) return <>{children}</>;

  return (
    <Card>
      <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Sign in</Link>
      <Link href={`/register?redirect=${encodeURIComponent(pathname)}`}>Create account</Link>
    </Card>
  );
}
```

### Booking Flow

1. Load merchant + bookable services via storefront hooks
2. User selects service -> fetch service detail (with schedules)
3. User selects date -> day-of-week determines applicable schedule
4. Time slots auto-generated from schedule start/end time + service duration
5. User fills party size + notes
6. Submit -> `POST /customer/merchants/{slug}/bookings`
7. Success -> toast + redirect to merchant detail

---

## Best Practices & Patterns

### Public vs Authenticated Route Separation

Two separate controllers and services with a clean boundary. `StorefrontService` never calls `auth()`. `CustomerPortalService` always scopes to `auth()->id()` first. Auditing is simple: check whether the service references `auth()`.

### Customer Data Isolation

The `where('customer_id', $customerId)->findOrFail($id)` compound ensures both record existence and ownership. Returns 404 (not 403) if either condition fails -- no information leakage about other users' records.

### Delegation Over Duplication

`CustomerPortalService` composes `BookingService`, `ReservationService`, and `ServiceOrderService` rather than reimplementing booking/reservation/order creation logic. Changes to business rules propagate automatically.

### Slug-based Public URLs

Public-facing URLs use merchant slugs. Admin routes use integer IDs. This keeps public URLs SEO-friendly while maintaining efficient internal lookups.

---

## Potential Pitfalls

1. **Missing ownership scope** -- New "my" endpoints must always chain `where('customer_id', auth()->id())` before `findOrFail()`. Using `findOrFail($id)` alone allows cross-user access.

2. **Service-merchant mismatch** -- `CreateCustomerBookingRequest` validates `exists:services,id` globally, not scoped to the target merchant. The downstream service handles this, but new form requests should validate merchant ownership.

3. **Cancel status divergence** -- Customer cancellation logic hardcodes allowed statuses. If admin-side `VALID_TRANSITIONS` changes, customer logic must be updated in sync.

4. **Role whitelist** -- `RegisterRequest`'s `'in:merchant,customer'` is the sole privilege escalation gate. New self-registerable roles must be explicitly whitelisted.

5. **Dangling `customer_portal.browse` permission** -- Defined and assigned but unused in route middleware. Storefront is public. Remove or implement.

6. **No rate limiting on storefront** -- Public unauthenticated endpoints have no throttle middleware. Consider applying Laravel's `throttle` middleware.

7. **Capability flag validation** -- `resolveActiveMerchant()` checks `status === 'active'` but not capability flags (`can_take_bookings`, `can_sell_products`, `can_rent_units`). Customer could book with a merchant that has bookings disabled if downstream service doesn't check.

8. **Stats query performance** -- `getMyStats()` runs 6 separate COUNT queries. At scale, consider conditional aggregation or brief caching.

---

## File Inventory

### New Files

| File | Purpose |
|------|---------|
| `backend/app/Http/Controllers/Api/V1/StorefrontController.php` | Public browsing controller |
| `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php` | Authenticated customer controller |
| `backend/app/Services/StorefrontService.php` | Public browsing service |
| `backend/app/Services/Contracts/StorefrontServiceInterface.php` | Storefront interface |
| `backend/app/Services/CustomerPortalService.php` | Customer portal service |
| `backend/app/Services/Contracts/CustomerPortalServiceInterface.php` | Customer portal interface |
| `backend/app/Http/Requests/Api/V1/CustomerPortal/CreateCustomerBookingRequest.php` | Booking validation |
| `backend/app/Http/Requests/Api/V1/CustomerPortal/CreateCustomerReservationRequest.php` | Reservation validation |
| `backend/app/Http/Requests/Api/V1/CustomerPortal/CreateCustomerOrderRequest.php` | Order validation |
| `backend/tests/Feature/Api/V1/StorefrontControllerTest.php` | 12 storefront tests |
| `backend/tests/Feature/Api/V1/CustomerPortalControllerTest.php` | 26 customer portal tests |
| `frontend-customer-portal/` | Full Next.js customer-facing frontend |

### Modified Files

| File | Change |
|------|--------|
| `backend/app/Http/Controllers/Api/V1/AuthController.php` | Role-based registration, customer auto-create, load customer relation |
| `backend/app/Http/Requests/Api/V1/Auth/RegisterRequest.php` | Added `role` validation rule |
| `backend/app/Providers/RepositoryServiceProvider.php` | Bound Storefront + CustomerPortal service interfaces |
| `backend/database/seeders/RolePermissionSeeder.php` | Added `customer_portal` permissions, assigned to customer role |
| `backend/routes/api.php` | Added storefront + customer portal route groups |
| `backend/tests/Feature/Api/V1/AuthControllerTest.php` | 3 new role-based registration tests |
| `CLAUDE.md` | Updated for 3-app monorepo, customer portal commands, port 3001 |
