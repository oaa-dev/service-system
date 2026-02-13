# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo with two applications:
- **Backend**: `backend/` — Laravel 12 REST API with OAuth2 (Laravel Passport)
- **Frontend**: `frontend/` — Next.js 16 with React 19

This is a marketplace/merchant management platform with modules for merchants, services, bookings, reservations, orders, customers, and platform fees.

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

### Frontend

From the `frontend/` directory:

```bash
npm install        # Install dependencies
npm run dev        # Dev server at localhost:3000
npm run build      # Production build
npm run lint       # ESLint
```

When running in Docker: `docker compose exec nextjs npm run build` (from `frontend/` dir)

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

**ApiResponse trait** (`app/Traits/ApiResponse.php`) — Used by all controllers. Key methods:
- `successResponse($data, $message, $code)`, `createdResponse($data, $message)`
- `paginatedResponse($paginator, $resourceClass)` — wraps paginated data with Resource + pagination meta
- `errorResponse($message, $code)`, `notFoundResponse()`, `validationErrorResponse($errors)`

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
- `ApiException` → custom status code with optional errors array

**Route middleware tiers** (in `routes/api.php`):
1. Public — no auth (e.g., `/active` endpoints, login, register)
2. Auth only — `auth:api` (e.g., verify OTP, logout, `auth/me`)
3. Auth + verified + onboarded — `auth:api` + `ensure.verified` + `onboarding` (main app routes)

### Conventions & Patterns

- **Permissions:** `module_name.action` format (e.g., `merchants.view`, `services.create`). Defined in `RolePermissionSeeder`, applied via `permission:` middleware on routes
- **Roles:** super-admin (bypasses all checks via Gate::before in `AppServiceProvider`), admin, manager, user, customer
- **Guard:** Spatie Permission uses `'api'` guard — User model sets `$guard_name = 'api'`
- **FormRequests:** Always return `authorize(): true` — permission checks happen in route middleware, not FormRequests
- **Public routes:** Reference data has `/active` endpoints (no auth). CRUD routes require auth + permissions
- **Unpaginated lists:** `/all` route inside auth middleware for dropdown data
- **Merchant sub-entities:** Nested under `merchants/{merchant}/` (services, bookings, reservations, orders, service-categories)
- **Status workflows:** Validated in service layer using `VALID_TRANSITIONS` constant map
- **Model defaults:** Use `$attributes` array (not DB defaults) since Eloquent `Model::create()` doesn't pick up DB defaults
- **File uploads:** Spatie Media Library with named collections (logo, icon, image, document). Image config in `config/images.php`, validated via `ImageRule::staticFactory()`
- **Controller destroy:** try-catch wraps `ModelNotFoundException` and returns 422 (not 404)
- **Capability flags:** BusinessType and Merchant have `can_sell_products`, `can_take_bookings`, `can_rent_units` — gating which sub-modules are available
- **Custom fields:** 3-table EAV pattern — Field → FieldValue (options) → BusinessTypeField (pivot with is_required + sort_order)
- **HasAddress trait:** Polymorphic address relationship with `updateOrCreateAddress()` — maps Philippines geographic hierarchy (Region→Province→City→Barangay)

### Testing

Tests use Pest with `describe()`/`it()` BDD syntax. Global setup in `tests/Pest.php`:
- Feature tests auto-use `RefreshDatabase` and seed `RolePermissionSeeder` in `beforeEach`
- Auth in tests: `Passport::actingAs($user)` (not `actingAs()`)
- Test database: `laravel_testing` (separate from main `laravel` DB, configured in `phpunit.xml`)
- Test cache: `array` driver; queue: `sync`

### Frontend — Next.js App Router

**Route groups** under `app/`:
- `(auth)` — Login/register pages
- `(system)` — Authenticated layout (`SystemLayout`) containing all admin pages:
  - `(merchants)/` — Merchant CRUD, services, bookings, reservations, orders
  - `(settings)/` — Reference data management (business types, payment methods, etc.)
  - `(customers)/` — Customer management
  - `(users)/` — User management
  - `(profile)/` — User profile
  - `(dashboard)/` — Dashboard
  - `(messaging)/` — Messaging

**Stack:**
- TanStack React Query v5 — Server state, API caching
- TanStack React Form v1 — Form management
- Zustand v5 — Client/UI state
- Tailwind CSS v4 — Styling
- Zod — Schema validation (in `lib/validations.ts`)

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
- Persisted to localStorage (`'auth-storage'` key) — stores user, token, isAuthenticated
- Built-in permission helpers: `hasRole()`, `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`
- Super-admin returns true for all permission checks

**WebSocket** (`lib/echo.ts`): Laravel Echo with Reverb broadcaster, singleton pattern via `getEcho()`

**Frontend env vars required:**
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_REVERB_APP_KEY`, `NEXT_PUBLIC_REVERB_HOST`, `NEXT_PUBLIC_REVERB_PORT`, `NEXT_PUBLIC_REVERB_SCHEME`

**Frontend gotchas:**
- Use `z.number()` not `z.coerce.number()` with react-hook-form zodResolver (type mismatch)
- Pre-existing build issue in `_global-error` page and lint error in `avatar-crop-dialog.tsx`
- Full test suite has pre-existing memory exhaustion in ProfileControllerTest

**Path alias:** `@/*` maps to project root

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| API (Nginx) | 8090 | Laravel REST API |
| phpMyAdmin | 8091 | Database management |
| Mailpit | 8092 | Email testing UI |
| RabbitMQ | 8093 | Message queue management |
| Reverb | 8094 | WebSocket server |
| MySQL | 3317 | Database |
| Redis | 6389 | Cache |

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

Frontend (in `frontend/`):
1. Types in `types/api.ts`
2. Service in `services/`
3. Hook in `hooks/`
4. Zod schema in `lib/validations.ts`
5. Page components under `app/(system)/`
6. Sidebar entry in `components/layout/app-sidebar.tsx` (permission-gated)
