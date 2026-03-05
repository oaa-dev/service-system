# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo with four applications:
- **Backend**: `backend/` — Laravel 12 REST API with OAuth2 (Laravel Passport)
- **Frontend (Admin)**: `frontend/` — Next.js 16 with React 19 (admin/merchant management)
- **Frontend (Customer Portal)**: `frontend-customer-portal/` — Next.js 16 (customer-facing storefront, port 3001)
- **Mobile (Customer Portal)**: `mobile/` — Flutter 3.24+ (iOS/Android customer app)

This is a marketplace/merchant management platform with modules for merchants, services, bookings, reservations, orders, customers, platform fees, reviews, loyalty programs, and more. Older domain-specific system designs live in `documentation/` (historical reference only).

**`docs/` directory** (active project docs):
- `docs/brainstorms/` — Exploration and requirements gathering (input to planning)
- `docs/plans/` — Implementation plans with step-by-step breakdowns
- `docs/knowledge/modules/` — Per-module reference docs (auto-generated, 58+ modules)
- `docs/knowledge/solutions/` — Documented solutions to past problems (searchable by frontmatter)
- `docs/knowledge/patterns/` — Cross-cutting architectural patterns
- `docs/knowledge/schema.yaml` — Knowledge-garden taxonomy for categorizing solutions
- `docs/knowledge/index.md` — Auto-generated index of all modules and solutions

## Development Commands

### Backend

All backend commands run via Docker from the `backend/` directory:

```bash
docker compose up -d                            # Start containers
docker compose exec app php artisan migrate     # Run migrations
docker compose exec app php artisan test        # Run all Pest tests
docker compose exec app php artisan test --filter=TestClassName  # Single test class
docker compose exec app php artisan test --filter=test_method_name  # Single test method
docker compose exec app php artisan test tests/Feature/Api/V1/SomeControllerTest.php  # By file
docker compose exec app php artisan db:seed     # Run seeders
docker compose exec app composer install        # Install dependencies
```

**API URL:** http://localhost:8090/api/v1

**Additional backend tools:**
- `l5-swagger` — OpenAPI/Swagger docs. Controllers use `OpenApi\Attributes as OA` PHP 8 attributes
- `laravel/pint` — PHP code style fixer (`docker compose exec app ./vendor/bin/pint`)
- `laravel/pail` — Log tailing (`composer dev` script)

### Frontend

From the `frontend/` directory:

```bash
npm install        # Install dependencies
npm run dev        # Dev server at localhost:3000
npm run build      # Production build
npm run lint       # ESLint
```

When running in Docker: `docker compose exec nextjs npm run build` (from `frontend/` dir)

### Customer Portal Frontend

From the `frontend-customer-portal/` directory:

```bash
npm install        # Install dependencies
npm run dev        # Dev server at localhost:3001
npm run build      # Production build
npm run lint       # ESLint
```

When running in Docker: `docker compose exec nextjs-customer npm run build` (from `frontend-customer-portal/` dir)

### Dev Environment Skill

A `dev-environment` skill (`skills/dev-environment/`) manages the full Docker stack:

```bash
# Use the /dev-environment slash command, or run the script directly:
bash skills/dev-environment/scripts/dev.sh up       # Start all containers + migrations + health checks
bash skills/dev-environment/scripts/dev.sh down      # Stop everything
bash skills/dev-environment/scripts/dev.sh status    # Check container status
```

### Mobile (Customer Portal)

From the `mobile/` directory:

```bash
/home/betrnk/flutter/bin/flutter pub get    # Install dependencies
/home/betrnk/flutter/bin/flutter run        # Run on connected device/emulator
/home/betrnk/flutter/bin/flutter test       # Run all unit tests
/home/betrnk/flutter/bin/dart run build_runner build --delete-conflicting-outputs  # Regenerate .g.dart / injection.config.dart
```

**Architecture:** Clean Architecture + BLoC pattern
```
Presentation (BLoC/Pages) → Domain (UseCases/Entities/Repository Interface) → Data (Repository Impl/DataSources/Models)
```

**Key directories:**
- `lib/core/` — Shared infrastructure: networking (Dio), error types, theme, widgets, storage
- `lib/config/` — DI setup (get_it + injectable), go_router configuration
- `lib/features/auth/` — Auth feature: login, register, OTP verification

**Generated files** (do not edit manually, regenerate with build_runner):
- `lib/config/injection.config.dart` — DI wiring
- `lib/features/auth/data/models/*.g.dart` — JSON serialization
- `lib/core/network/api_response.g.dart` — API response JSON

**Environment config:** Use `--dart-define=API_URL=http://your-backend/api/v1` to override the default (`http://10.0.2.2:8090/api/v1` — Android emulator localhost)

**Flutter SDK location:** `/home/betrnk/flutter/bin/flutter` (not in PATH by default)

## Architecture

### Backend — Service-Repository Pattern

```
Route → Controller → FormRequest (validation) → DTO (data transfer) → Service (business logic) → Repository (data access) → Model
                                                                                                                              ↓
                                                                              Resource (JSON transform) ← ApiResponse trait ← Database
```

**Key directories:**
- `app/Http/Controllers/Api/V1/` — API controllers
- `app/Services/` — Business logic with `Contracts/` interfaces
- `app/Repositories/` — Data access with `Contracts/` interfaces, extends `BaseRepository`
- `app/Http/Resources/Api/V1/` — JSON output transformers
- `app/Http/Requests/Api/V1/` — Form Request validation (organized by module subdirectories)
- `app/Data/` — Input DTOs (Spatie Laravel Data). One model = one DTO. All fields use `string|Optional` pattern
- `app/Rules/` — Custom validation rules (e.g., `ImageRule` with static factories per image type)
- `app/Providers/RepositoryServiceProvider.php` — All service/repository interface bindings
- `routes/api.php` — All API routes (v1 prefix)
- `config/images.php` — Centralized image upload config (avatar, document, merchant_logo, service_image, etc.)
- `database/seeders/RolePermissionSeeder.php` — All permissions and role definitions

**ApiResponse trait** (`app/Traits/ApiResponse.php`) — Used by all controllers and middleware. Key methods:
- `successResponse($data, $message, $code)`, `createdResponse($data, $message)`
- `paginatedResponse($paginator, $resourceClass)` — wraps paginated data with Resource + pagination meta
- `paginatedDataResponse($paginator, $dataClass, ?$currentUserId)` — alternative pagination using DTO `::fromModel()` with optional context
- `errorResponse($message, $code)`, `notFoundResponse()`, `validationErrorResponse($errors)`
- `forbiddenResponse($message)` → 403, `unauthorizedResponse($message)` → 401, `noContentResponse()` → 204

**Standard API Response:**
```json
{"success": true, "message": "...", "data": {...}, "meta": {"pagination": ...}}
```

**DTO pattern (Spatie Laravel Data):**
```php
class ExampleData extends Data {
    public function __construct(
        public string|Optional $name = new Optional(),
    ) {}
}
// Controller: ExampleData::from($request->validated())
// Service: collect($data->toArray())->reject(fn($v) => $v instanceof Optional)->toArray()
```

**BaseRepository** provides: `all()`, `find()`, `findOrFail()`, `create()`, `update()` (returns `->fresh()`), `delete()`, `paginate()`, `findBy()`, `findAllBy()`, `query()`

**Spatie QueryBuilder** — Services use it for list endpoints with filtering/sorting:
```php
QueryBuilder::for(Model::class)
    ->allowedFilters([AllowedFilter::partial('name'), AllowedFilter::exact('status')])
    ->allowedSorts(['name', 'created_at'])
    ->defaultSort('-created_at')
    ->paginate($request->per_page ?? 15)
    ->appends(request()->query());
```

**Exception handling** (`bootstrap/app.php`) — Global API exception rendering:
- `ValidationException` → 422 with errors array
- `ModelNotFoundException` → 404 "Resource not found"
- `NotFoundHttpException` → 404 "Endpoint not found"
- `AuthenticationException` → 401 "Unauthenticated"
- `InvalidArgumentException` → 400 with exception message
- `ApiException` → custom status code with optional errors array

**Route middleware tiers** (in `routes/api.php`):
1. Public — no auth (e.g., `/active` endpoints, login, register, `/storefront/*`)
2. Auth only — `auth:api` (e.g., verify OTP, logout, `auth/me`)
3. Auth + verified + onboarded — `auth:api` + `ensure.verified` + `onboarding` (main app routes)
4. Active merchant — `merchant.active` within tier 3 (e.g., gallery routes). Allows `active` or `approved` merchant status; admin/super-admin bypass

**Custom middleware aliases** (defined in `bootstrap/app.php`):
- `permission` → `CheckPermission` — Spatie permission check via `$request->user()->can()`
- `ensure.verified` → `EnsureEmailIsVerified` — checks `email_verified_at !== null`
- `onboarding` → `EnsureOnboardingComplete` — **only enforced for `merchant` and `branch-merchant` roles**; customer/user/admin roles pass through
- `merchant.active` → `EnsureActiveMerchant` — **only enforced for `merchant`/`branch-merchant`**; admin/super-admin bypass

**Morph map** (in `AppServiceProvider`): polymorphic types are aliased:
- `'booking'` → Booking, `'reservation'` → Reservation, `'service_order'` → ServiceOrder, `'inquiry'` → Merchant

### Conventions & Patterns

- **Permissions:** `module_name.action` format (e.g., `merchants.view`, `services.create`). Defined in `RolePermissionSeeder`, applied via `permission:` middleware on routes
- **Roles:** super-admin (bypasses all checks via Gate::before in `AppServiceProvider`), admin, manager, merchant, branch-merchant, user, customer. Default registration role is `merchant` (with `role` param accepting `merchant|customer`)
- **Guard:** Spatie Permission uses `'api'` guard — User model sets `$guard_name = 'api'`
- **FormRequests:** Always return `authorize(): true` — permission checks happen in route middleware, not FormRequests
- **Public routes:** Reference data has `/active` endpoints (no auth). CRUD routes require auth + permissions
- **Unpaginated lists:** `/all` route inside auth middleware for dropdown data
- **Dual merchant controllers:** `MerchantController` (admin CRUD at `merchants/{merchant}/`) and `MyMerchantController` (self-service at `auth/merchant/`). Self-service auto-resolves merchant from `$request->user()->merchant`. Both share the same `MerchantService`
- **Merchant sub-entities:** Nested under `merchants/{merchant}/` (services, bookings, reservations, orders, service-categories)
- **Status workflows:** Validated in service layer using `VALID_TRANSITIONS` constant map
- **Model defaults:** Use `$attributes` array (not DB defaults) since Eloquent `Model::create()` doesn't pick up DB defaults
- **File uploads:** Spatie Media Library with named collections (logo, icon, image, document). Image config in `config/images.php`, validated via `ImageRule::staticFactory()`
- **Controller destroy:** try-catch wraps `ModelNotFoundException` and returns 422 (not 404)
- **Capability flags:** BusinessType and Merchant have `can_sell_products`, `can_take_bookings`, `can_rent_units` — gating which sub-modules are available
- **Custom fields:** 3-table EAV pattern — Field → FieldValue (options) → BusinessTypeField (pivot with is_required + sort_order)
- **HasAddress trait:** Polymorphic address relationship with `updateOrCreateAddress()` — maps Philippines geographic hierarchy (Region→Province→City→Barangay)
- **Notifications:** `NotificationObserver` on `DatabaseNotification` auto-broadcasts `notification.created` event on `App.Models.User.{id}` private channel

### Messaging / Conversation System

- `Conversation` model: belongs to `merchant` + `customer` (user), polymorphically linked to a `conversable` (booking/reservation/service_order/inquiry via morph map)
- Unique constraint: `[merchant_id, customer_id, conversable_type, conversable_id]` — one conversation per entity pair
- `Message` model: `conversation_id`, `sender_id`, `body`, `read_at`
- `ConversationService`: `getOrCreateConversation()` (idempotent), `sendMessage()`, `getMessages()`, `markAsRead()`, `getMyConversations()` (auto-detects merchant vs customer context), `getTotalUnreadCount()`
- `ChatMessageSent` event broadcasts on `private conversation.{id}` channel
- **Admin/merchant side:** `MessagingController` at `/conversations/*`
- **Customer portal side:** `ConversationController` at `/customer/my/conversations/{type}/{id}/` where `type` ∈ bookings|reservations|orders|inquiries
- **Broadcast channels** (`routes/channels.php`): `App.Models.User.{id}` (notifications), `conversation.{id}` (chat), `presence-merchant.{merchantId}` (online status)

### Testing

Tests use Pest with `describe()`/`it()` BDD syntax. Global setup in `tests/Pest.php`:
- Feature tests auto-use `RefreshDatabase` and seed `RolePermissionSeeder` in `beforeEach`
- Auth in tests: `Passport::actingAs($user)` (not `actingAs()`)
- Test database: `laravel_testing` (separate from main `laravel` DB, configured in `phpunit.xml`)
- Test cache: `array` driver; queue: `sync`

### Frontend (Admin) — Next.js App Router

**Route groups** under `app/`:
- `(auth)` — Login/register pages
- `(system)` — Authenticated layout (`SystemLayout`) containing all admin pages:
  - `(merchants)/` — Admin merchant CRUD, services, bookings, reservations, orders
  - `(my-store)/` — Merchant self-service (onboarding dashboard, settings, own store management)
  - `(settings)/` — Reference data management (business types, payment methods, etc.)
  - `(customers)/` — Customer management
  - `(users)/` — User management
  - `(profile)/` — User profile
  - `(dashboard)/` — Dashboard
  - `(messaging)/` — Messaging

**Stack:**
- TanStack React Query v5 — Server state, API caching
- TanStack React Form v1 — Form management (admin only; customer portal uses `react-hook-form` + `@hookform/resolvers`)
- Zustand v5 — Client/UI state
- Tailwind CSS v4 — Styling
- Zod — Schema validation (in `lib/validations.ts`)
- shadcn/ui — Component library (both apps)
- `sonner` — Toast notifications, `next-themes` — Theme management, `recharts` — Charts (admin only)

**Frontend file conventions:**
- `services/*.ts` — API call functions (one per backend module)
- `hooks/use*.ts` — React Query hooks wrapping services (one per module)
- `types/api.ts` — All TypeScript interfaces for API responses
- `lib/validations.ts` — All Zod schemas for forms
- `components/ui/` — shadcn/ui components
- `components/permission-gate.tsx` — Permission-based conditional rendering
- `components/address-form-fields.tsx` — Cascading geographic dropdown (Region→Province→City→Barangay)

**Axios client** (`lib/axios.ts`):
- Base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:8090/api/v1`)
- Request interceptor adds Bearer token from Zustand auth store
- Response interceptor: 401 → clears auth state, redirects to `/login`

**React Query config** (`app/providers.tsx`):
- `staleTime: 60000` (1 minute), `refetchOnWindowFocus: false`
- Smart retry: no retry on 401/403/404, max 3 retries otherwise
- Mutations: `retry: false`

**Zustand auth store** (`stores/authStore.ts`):
- Persisted to localStorage (`'auth-storage'` key, customer portal uses `'customer-auth-storage'`)
- Built-in permission helpers: `hasRole()`, `hasAnyRole()`, `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`, `isMerchantUser()`
- Super-admin returns true for all permission checks
- `isMerchantUser()` — true when user has `merchant` role but not `super-admin`/`admin`

**WebSocket** (`lib/echo.ts`): Laravel Echo with Reverb broadcaster, singleton pattern via `getEcho()`, also exports `disconnectEcho()` and `reconnectEcho()`

**Messaging state** (admin): `stores/messagingStore.ts` — Zustand store (NOT persisted to localStorage) with conversation/message/unread state and deduplication logic. `useRealtimeMessaging` hook handles Echo subscriptions.

**Notification state** (admin): `stores/notificationStore.ts` — real-time notification management via WebSocket

**Frontend env vars required:**
- Admin: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_REVERB_APP_KEY`, `NEXT_PUBLIC_REVERB_HOST`, `NEXT_PUBLIC_REVERB_PORT`, `NEXT_PUBLIC_REVERB_SCHEME`
- Customer portal: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Next.js image config:** Both `next.config.ts` files configure `images.remotePatterns` for `http://localhost:8090/storage/**` (required for `<Image>` to load Laravel media)

**Frontend gotchas:**
- Use `z.number()` not `z.coerce.number()` with react-hook-form zodResolver (type mismatch)
- Pre-existing build issue in `_global-error` page and lint error in `avatar-crop-dialog.tsx`
- Full test suite has pre-existing memory exhaustion in ProfileControllerTest

**Path alias:** `@/*` maps to project root

### Frontend (Customer Portal) — Architecture

**Route groups** under `frontend-customer-portal/app/`:
- `(auth)/` — Login, register, verify-email pages
- `(storefront)/` — Public merchant browsing (listing, detail pages). Layout has sticky `StorefrontNav` + footer
- `(customer)/` — Authenticated customer dashboard. Auth guard via `useEffect` redirect (not middleware). Nav: Dashboard, Bookings, Reservations, Orders, Favorites, Profile

**Key differences from admin frontend:**
- Uses `react-hook-form` + `@hookform/resolvers` (NOT TanStack Form)
- Auth store persisted as `'customer-auth-storage'` (separate from admin's `'auth-storage'`)
- Has `isCustomer()` helper instead of `isMerchantUser()`
- Messaging uses 5-second polling fallback (Echo not yet fully integrated)
- Fonts: `DM Sans` (body, `--font-body`) and `Bricolage Grotesque` (display, `--font-display`). Admin uses `Geist`/`Geist Mono`

**Customer portal-specific utilities:**
- `lib/storefront-utils.ts` — `formatTime()`, `isOpenNow()`, `formatFullAddress()`, `formatPrice()` (Philippine Peso)
- `lib/geo-utils.ts` — `haversineDistance()`, `filterByRadius()` for geolocation-based merchant filtering
- `@vis.gl/react-google-maps` — Google Maps integration for merchant map view

## Docker Services

Each app directory has its own `docker-compose.yml` — run `docker compose` from the relevant directory (`backend/`, `frontend/`, `frontend-customer-portal/`).

| Service | Port | Directory | Description |
|---------|------|-----------|-------------|
| API (Nginx) | 8090 | backend/ | Laravel REST API |
| phpMyAdmin | 8091 | backend/ | Database management |
| Mailpit | 8092 | backend/ | Email testing UI |
| RabbitMQ | 8093 | backend/ | Message queue management |
| Reverb | 8094 | backend/ | WebSocket server |
| MySQL | 3317 | backend/ | Database |
| Redis | 6389 | backend/ | Cache |
| Admin Frontend | 3000 | frontend/ | Next.js admin app |
| Customer Portal | 3001 | frontend-customer-portal/ | Customer-facing frontend |

## Backend Infrastructure

- **Queue:** RabbitMQ in production (`QUEUE_CONNECTION=rabbitmq`), `sync` in tests
- **Cache:** Redis (`CACHE_STORE=redis`, `REDIS_CLIENT=phpredis`)
- **Sessions:** Database driver (`SESSION_DRIVER=database`)
- **Broadcasting:** Reverb (`BROADCAST_CONNECTION=reverb`)
- **Public config endpoint:** `GET /config/images` exposes image upload config to frontends

## Git Configuration

**Repository:** `git@github-oaa:oaa-dev/laravel-react-project.git`

Uses custom SSH host alias `github-oaa` — requires `~/.ssh/config` entry:
```
Host github-oaa
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_oaa_dev
  IdentitiesOnly yes
```

## Adding a New Module (Checklist)

Backend (in `backend/`):
1. Migration, Model (with factory), relationships
2. Repository + Interface → bind in `RepositoryServiceProvider`
3. Service + Interface → bind in `RepositoryServiceProvider`
4. DTO in `app/Data/`
5. FormRequests in `app/Http/Requests/Api/V1/{Module}/`
6. Resource in `app/Http/Resources/Api/V1/`
7. Controller in `app/Http/Controllers/Api/V1/`
8. Routes in `routes/api.php` with permission middleware
9. Permissions in `RolePermissionSeeder`
10. Tests in `tests/Feature/Api/V1/` (Pest describe/it syntax)

Frontend Admin (in `frontend/`):
1. Types in `types/api.ts`
2. Service in `services/`
3. Hook in `hooks/`
4. Zod schema in `lib/validations.ts`
5. Page components under `app/(system)/`
6. Sidebar entry in `components/layout/app-sidebar.tsx` (permission-gated)

Customer Portal (in `frontend-customer-portal/`):
1. Types in `types/api.ts`
2. Service in `services/`
3. Hook in `hooks/`
4. Zod schema (inline or shared from `lib/`)
5. Pages under `app/(customer)/` (authenticated) or `app/(storefront)/` (public)
6. Nav entry in `app/(customer)/layout.tsx` if authenticated section
