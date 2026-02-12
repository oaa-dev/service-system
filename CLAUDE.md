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

### Conventions & Patterns

- **Permissions:** `module_name.action` format (e.g., `merchants.view`, `services.create`). Defined in `RolePermissionSeeder`, applied via `permission:` middleware on routes
- **Roles:** super-admin (bypasses all checks via Gate::before), admin, manager, user, customer
- **Public routes:** Reference data has `/active` endpoints (no auth). CRUD routes require auth + permissions
- **Unpaginated lists:** `/all` route inside auth middleware for dropdown data
- **Merchant sub-entities:** Nested under `merchants/{merchant}/` (services, bookings, reservations, orders, service-categories)
- **Status workflows:** Validated in service layer using `VALID_TRANSITIONS` constant map
- **Model defaults:** Use `$attributes` array (not DB defaults) since Eloquent `Model::create()` doesn't pick up DB defaults
- **File uploads:** Spatie Media Library with named collections (logo, icon, image, document). Image config in `config/images.php`, validated via `ImageRule::staticFactory()`
- **Controller destroy:** try-catch wraps `ModelNotFoundException` and returns 422 (not 404)
- **Capability flags:** BusinessType and Merchant have `can_sell_products`, `can_take_bookings`, `can_rent_units` — gating which sub-modules are available
- **Custom fields:** 3-table EAV pattern — Field → FieldValue (options) → BusinessTypeField (pivot with is_required + sort_order)

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
