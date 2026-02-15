# Customer Portal Frontend — Implementation Plan

## Context

The project needs a customer-facing frontend (`frontend-customer-portal/`) alongside the existing admin frontend (`frontend/`). Customers will browse merchants/services publicly, create bookings/reservations/orders, and manage their history via a dashboard. The backend currently has no public discovery endpoints and no customer-scoped "my" endpoints — these need to be created alongside the frontend.

## Approach

**Fresh scaffold + selective copy.** The admin frontend is sidebar-based with RBAC gating. The customer portal has a fundamentally different layout (public storefront, header/footer navigation, checkout-style flows). Starting fresh avoids inheriting admin complexity while reusing shared infrastructure.

---

## Phase 1: Project Scaffolding

**Goal:** Working Next.js app with shared infrastructure, zero custom pages.

### Create `frontend-customer-portal/`

1. **Scaffold with `create-next-app`** (Next.js 16, TypeScript, Tailwind v4, App Router)
2. **Install dependencies** matching admin frontend:
   - `@tanstack/react-query`, `@tanstack/react-query-devtools`
   - `zustand`
   - `axios`
   - `react-hook-form`, `@hookform/resolvers`, `zod`
   - `lucide-react`, `date-fns`, `next-themes`, `sonner`
   - shadcn/ui Radix dependencies (via `npx shadcn@latest init`)
3. **Copy shared infrastructure from `frontend/`:**
   - `lib/utils.ts`, `lib/axios.ts`
   - `stores/authStore.ts` (change localStorage key to `'customer-auth-storage'`, add `isCustomer()` helper, remove merchant-specific helpers)
   - `stores/themeStore.ts`
   - `components/theme-provider.tsx`
   - `app/providers.tsx` (QueryClient + ThemeProvider + Toaster)
   - `app/globals.css` (Tailwind v4 + theme system)
   - `components.json`, `tsconfig.json` path alias, `next.config.ts` (image remotePatterns), `postcss.config.mjs`, `eslint.config.mjs`
4. **Copy shadcn/ui components** (subset): button, input, label, form, card, badge, skeleton, spinner, dialog, alert, separator, select, textarea, tabs, avatar, dropdown-menu, popover, scroll-area, sonner, tooltip, pagination, calendar
5. **Copy `types/api.ts`** (shared API response types)
6. **Docker:** `docker-compose.yml` with `node:20-alpine` on port **3001**
7. **`.env.local`:** `NEXT_PUBLIC_API_URL=http://localhost:8090/api/v1`

**Verify:** `npm run build` + `npm run lint` pass.

---

## Phase 2: Auth Pages

**Goal:** Customer login, registration, email OTP verification.

### Frontend files
- `services/authService.ts` — Copy from admin, keep login/register/logout/me/verifyOtp/resendOtp. Add `role: 'customer'` to register payload.
- `hooks/useAuth.ts` — React Query hooks for auth operations
- `lib/validations.ts` — Start with loginSchema, registerSchema, otpSchema
- `app/(auth)/layout.tsx` — Centered card layout (no sidebar)
- `app/(auth)/login/page.tsx` — Login form, redirect to `/dashboard`
- `app/(auth)/register/page.tsx` — Register with `role: 'customer'`, redirect to `/verify-email`
- `app/(auth)/verify-email/page.tsx` — OTP input, redirect to `/dashboard`

### Backend changes (needed for auth)
- **`AuthController::register()`** — Accept optional `role` param (`merchant|customer`, default `merchant`)
- **`RegisterRequest`** — Add `role` validation: `'role' => 'sometimes|in:merchant,customer'`
- **Auto-create Customer record** when `role=customer` (in AuthController after role assignment)

---

## Phase 3: Public Storefront Pages

**Goal:** Browse active merchants and services, no auth required.

### Route structure
```
app/(storefront)/layout.tsx              — Header + footer layout (public)
app/(storefront)/merchants/page.tsx      — Merchant listing with search/filters
app/(storefront)/merchants/[slug]/page.tsx — Merchant profile (hours, services, gallery)
```

### Frontend files
- `services/storefrontService.ts` — `getMerchants(params)`, `getMerchantBySlug(slug)`, `getMerchantServices(slug, params)`, `getServiceDetail(slug, serviceId)`, `getServiceSchedules(slug, serviceId)`
- `hooks/useStorefront.ts` — React Query hooks wrapping storefront service
- `components/storefront/merchant-card.tsx` — Card with logo, name, business type, capability badges
- `components/storefront/service-card.tsx` — Card with image, name, price, type badge
- `components/storefront/merchant-header.tsx` — Hero section for merchant profile
- `components/storefront/search-filters.tsx` — Search bar + category/capability filters

### Backend: New public storefront endpoints
- **New controller:** `StorefrontController.php` (read-only, no auth)
- **New service:** `StorefrontService.php` + interface
- **Routes** (public, no auth):
  ```
  GET /storefront/merchants              — Paginated active merchants (filter: search, business_type, capabilities, location)
  GET /storefront/merchants/{slug}       — Merchant detail by slug (only status=active)
  GET /storefront/merchants/{slug}/services — Active services for merchant (filter: service_type, category)
  GET /storefront/merchants/{slug}/services/{service} — Service detail with schedules
  ```
- **Key files:**
  - `app/Http/Controllers/Api/V1/StorefrontController.php`
  - `app/Services/StorefrontService.php` + `app/Services/Contracts/StorefrontServiceInterface.php`
  - `app/Http/Requests/Api/V1/Storefront/MerchantListingRequest.php`
  - `app/Providers/RepositoryServiceProvider.php` — Bind new interfaces
  - `routes/api.php` — Add storefront route group
  - `tests/Feature/Api/V1/StorefrontTest.php`

---

## Phase 4: Booking/Ordering Flows

**Goal:** Authenticated customers create bookings, reservations, and orders.

### Route structure
```
app/(storefront)/merchants/[slug]/book/page.tsx    — Booking flow (date + time slot)
app/(storefront)/merchants/[slug]/reserve/page.tsx — Reservation flow (date range)
app/(storefront)/merchants/[slug]/order/page.tsx   — Order flow (product + quantity)
```

### Frontend files
- `services/customerActionService.ts` — `createBooking(slug, data)`, `createReservation(slug, data)`, `createOrder(slug, data)`
- `hooks/useCustomerActions.ts` — Mutation hooks
- `lib/validations.ts` — Add booking/reservation/order schemas
- `components/booking/auth-gate.tsx` — "Login to continue" prompt with redirect back
- `components/booking/booking-summary.tsx` — Price breakdown card

### Backend: Customer booking endpoints
- **New controller:** `CustomerPortalController.php`
- **New service:** `CustomerPortalService.php` + interface (delegates to existing BookingService/ReservationService/ServiceOrderService, auto-sets `customer_id = auth()->id()`)
- **Routes** (auth required):
  ```
  POST /customer/merchants/{slug}/bookings
  POST /customer/merchants/{slug}/reservations
  POST /customer/merchants/{slug}/orders
  ```
- **New form requests:** `CreateCustomerBookingRequest`, `CreateCustomerReservationRequest`, `CreateCustomerOrderRequest`
- **Permissions:** Add `customer_portal.book/reserve/order` to customer role in seeder

---

## Phase 5: Customer Dashboard

**Goal:** View booking/reservation/order history, manage profile.

### Route structure
```
app/(customer)/layout.tsx              — Auth-required layout with top nav
app/(customer)/dashboard/page.tsx      — Overview cards (upcoming, active, pending)
app/(customer)/bookings/page.tsx       — Booking history + cancel action
app/(customer)/reservations/page.tsx   — Reservation history + cancel action
app/(customer)/orders/page.tsx         — Order history + cancel action
app/(customer)/profile/page.tsx        — Customer profile + preferences
```

### Frontend files
- `services/customerDashboardService.ts` — `getMyBookings()`, `getMyReservations()`, `getMyOrders()`, `cancelMyBooking()`, `getMyStats()`, etc.
- `hooks/useCustomerDashboard.ts` — React Query hooks for dashboard data

### Backend: Customer "my" endpoints
- **Add to `CustomerPortalController.php`:**
  ```
  GET  /customer/my/bookings                    — Own bookings (paginated)
  GET  /customer/my/bookings/{booking}           — Own booking detail
  PATCH /customer/my/bookings/{booking}/cancel   — Cancel own booking (pending/confirmed only)
  GET  /customer/my/reservations                 — Own reservations
  PATCH /customer/my/reservations/{id}/cancel    — Cancel own reservation
  GET  /customer/my/orders                       — Own orders
  PATCH /customer/my/orders/{id}/cancel          — Cancel own order
  GET  /customer/my/stats                        — Dashboard stats
  ```
- **Permissions:** Add `customer_portal.view_own`, `customer_portal.cancel_own` to customer role

---

## Phase 6: Backend Supporting Changes

1. **CORS** — Add `localhost:3001` to `config/cors.php` allowed origins
2. **Merchant slug uniqueness** — Add migration for unique constraint on `merchants.slug` (storefront uses slug-based lookup)
3. **Seeder update** — Add customer_portal permissions and assign to customer role:
   ```
   customer_portal.browse, customer_portal.book, customer_portal.reserve,
   customer_portal.order, customer_portal.view_own, customer_portal.cancel_own
   ```

---

## Implementation Order

1. **Phase 1** — Scaffold frontend project (independent, no backend changes)
2. **Phase 6** — Backend supporting changes (CORS, slug uniqueness, permissions)
3. **Phase 2** — Auth pages + backend auth changes (register with role param)
4. **Phase 3** — Public storefront + backend StorefrontController
5. **Phase 4** — Booking flows + backend CustomerPortalController (create endpoints)
6. **Phase 5** — Dashboard + backend customer "my" endpoints

## Verification

After each phase:
- **Backend:** `docker compose exec app php artisan test` (all tests pass)
- **Frontend:** `npm run build && npm run lint` (TypeScript + lint clean)
- **Manual:** Test flows in browser at `localhost:3001`

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui (new-york) + Tailwind v4 |
| State | Zustand v5 (auth, theme) + TanStack React Query v5 (server state) |
| Forms | react-hook-form + Zod |
| HTTP | Axios with Bearer token interceptor |
| Docker | node:20-alpine on port 3001 |
| Backend API | Same Laravel API at localhost:8090/api/v1 |
