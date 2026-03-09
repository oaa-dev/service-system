# Plan: Super Admin Advertisement Management

**Date:** 2026-03-07
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-03-07-super-admin-advertisement-creation.md](../brainstorms/2026-03-07-super-admin-advertisement-creation.md)

## Knowledge Context

### Relevant Learnings
- [Permission flag mismatch](../knowledge/solutions/authorization-issues/permission-flag-mismatch-frontend-backend-coupon-20260307.md): Frontend UI gating must match backend authorization exactly. When ads are scoped to merchants, ensure frontend checks mirror backend.
- Coupon module pattern: `merchant_id` nullable (null = platform-wide), `created_by` FK, Spatie QueryBuilder filtering, admin + merchant self-service controllers.

### Known Gotchas
- **Model defaults via `$attributes`** — DB defaults don't apply on `Eloquent::create()`. Use `$attributes` array.
- **`z.number()` not `z.coerce.number()`** — For react-hook-form zodResolver compatibility on admin frontend.
- **Image uploads** — Create after model save (need model ID for media collection). Crop on frontend, upload as FormData.
- **Controller destroy** — Wrap in try-catch, return 422 on `ModelNotFoundException` (project convention).
- **FormRequests** — Always `authorize(): true`, permission checks in route middleware.

### Critical Patterns Applied
- Service-Repository pattern with interface bindings in `RepositoryServiceProvider`
- DTO with `Spatie\LaravelData\Optional` for all fields
- Spatie QueryBuilder for list endpoints with `allowedFilters` and `allowedSorts`
- Pest BDD tests with `describe()`/`it()` syntax

## Overview

Full-stack advertisement management module. Super admins create/manage ads with multiple types, placements, and audience targeting. Ads can be platform-wide or merchant-specific. Images via Spatie Media Library.

## Implementation Steps

### Step 1: Migration & Model

**Files:**
- `backend/database/migrations/YYYY_MM_DD_create_advertisements_table.php`
- `backend/app/Models/Advertisement.php`
- `backend/database/factories/AdvertisementFactory.php`

**Details:**
- Migration columns: `id`, `merchant_id` (FK nullable, nullOnDelete), `title` (string), `description` (text nullable), `type` (string, default 'banner'), `placement` (string, default 'homepage_hero'), `target_audience` (string, default 'all'), `link_url` (string nullable), `link_text` (string nullable), `is_active` (boolean default true), `starts_at` (datetime), `expires_at` (datetime nullable), `sort_order` (integer default 0), `impressions` (integer default 0), `clicks` (integer default 0), `created_by` (FK to users), timestamps
- Model: `$fillable` with all fields, `$attributes` for defaults (`is_active=true`, `sort_order=0`, `impressions=0`, `clicks=0`, `type=banner`, `placement=homepage_hero`, `target_audience=all`)
- Casts: `is_active` boolean, `starts_at` datetime, `expires_at` datetime, `sort_order` integer, `impressions` integer, `clicks` integer
- Relationships: `merchant()` BelongsTo nullable, `creator()` BelongsTo User
- Scopes: `active()`, `valid()` (active + within date range), `forAudience($audience)`, `forPlacement($placement)`
- Spatie Media Library: `InteractsWithMedia`, `HasMedia` interface
- Media collection: `ad_image` — singleFile, conversions: thumb (200x200), preview (1200x600)
- Factory: states for `banner()`, `promotionalCard()`, `popup()`, `featuredMerchant()`, `expired()`, `inactive()`

### Step 2: Image Config & Validation Rule

**Files:**
- `backend/config/images.php` — Add `ad_image` entry
- `backend/app/Rules/ImageRule.php` — Add `adImage()` static factory

**Details:**
- Config: `'ad_image' => ['mimes' => 'jpeg,png,webp', 'max_size' => 10240, 'min_width' => 400, 'min_height' => 200, 'max_width' => 6000, 'max_height' => 6000]`
- ImageRule: `public static function adImage(): static` using `'ad_image'` config key

### Step 3: Repository

**Files:**
- `backend/app/Repositories/AdvertisementRepository.php`
- `backend/app/Repositories/Contracts/AdvertisementRepositoryInterface.php`

**Details:**
- Extends `BaseRepository` with `Advertisement` model
- Interface extends `BaseRepositoryInterface`
- No custom methods needed initially (QueryBuilder handles filtering in service)

### Step 4: DTO

**Files:**
- `backend/app/Data/AdvertisementData.php`

**Details:**
- All fields use `string|Optional` pattern (or appropriate type unions)
- Fields: `title`, `description`, `type`, `placement`, `target_audience`, `link_url`, `link_text`, `is_active`, `starts_at`, `expires_at`, `sort_order`, `merchant_id`

### Step 5: Form Requests

**Files:**
- `backend/app/Http/Requests/Api/V1/Advertisement/StoreAdvertisementRequest.php`
- `backend/app/Http/Requests/Api/V1/Advertisement/UpdateAdvertisementRequest.php`

**Details:**
- `authorize(): true` (permissions via route middleware)
- Store: `title` required string max:255, `type` required in:banner,featured_merchant,promotional_card,popup, `placement` required in:homepage_hero,homepage_sidebar,merchant_listing,merchant_detail,dashboard_banner,storefront_banner, `target_audience` required in:customer,merchant,all, `starts_at` required date, `expires_at` nullable date after:starts_at, `link_url` nullable url, `link_text` nullable string max:100, `merchant_id` nullable exists:merchants,id, `is_active` boolean, `sort_order` integer min:0, `description` nullable string, `image` nullable validated via `ImageRule::adImage()`
- Update: same fields, all optional (except image handled separately)

### Step 6: Resource

**Files:**
- `backend/app/Http/Resources/Api/V1/AdvertisementResource.php`

**Details:**
- All model fields + computed `is_valid` (active + within date range)
- `merchant` via `whenLoaded` (id, name, slug)
- `creator` via `whenLoaded` (id, name)
- `image` — media URL fields (url, thumb, preview) from `ad_image` collection

### Step 7: Service

**Files:**
- `backend/app/Services/AdvertisementService.php`
- `backend/app/Services/Contracts/AdvertisementServiceInterface.php`

**Details:**
- `getAdvertisements(Request)` — Admin paginated list with QueryBuilder. Filters: partial name/title, exact type, exact placement, exact target_audience, exact is_active, exact merchant_id. Sorts: title, created_at, sort_order, starts_at. Default sort: `-created_at`. Eager load: merchant, creator.
- `getAdvertisementById(int $id)` — Load with merchant, creator relations
- `createAdvertisement(AdvertisementData $data, int $createdBy)` — Reject Optional values, set `created_by`
- `updateAdvertisement(int $id, AdvertisementData $data)` — Standard update pattern
- `deleteAdvertisement(int $id)` — Delete via repository
- `uploadImage(int $id, UploadedFile $file)` — Clear existing `ad_image` collection, add new file
- `deleteImage(int $id)` — Clear `ad_image` collection
- `getActiveAds(string $placement, string $audience)` — Public endpoint query: `active + valid dates + (audience = $audience OR audience = 'all') + placement = $placement`, ordered by `sort_order ASC`, eager load media
- `getMerchantAds(int $merchantId)` — Ads targeting specific merchant
- `trackImpression(int $id)` — Atomic `Advertisement::where('id', $id)->increment('impressions')`
- `trackClick(int $id)` — Atomic `Advertisement::where('id', $id)->increment('clicks')`

### Step 8: Controller

**Files:**
- `backend/app/Http/Controllers/Api/V1/AdvertisementController.php`

**Details:**
- `index(Request)` — Paginated list → `paginatedResponse`
- `store(StoreAdvertisementRequest)` — Create with DTO + image upload if present → `createdResponse`
- `show(int $id)` — Get by ID → `successResponse`
- `update(UpdateAdvertisementRequest, int $id)` — Update with DTO → `successResponse`
- `destroy(int $id)` — Delete with try-catch → 422 on not found
- `uploadImage(Request, int $id)` — Validate image, upload → `successResponse`
- `deleteImage(int $id)` — Remove image → `successResponse`
- `trackImpression(int $id)` — Increment impressions → `noContentResponse`
- `trackClick(int $id)` — Increment clicks → `noContentResponse`

### Step 9: Routes & Permissions

**Files:**
- `backend/routes/api.php`
- `backend/database/seeders/RolePermissionSeeder.php`
- `backend/app/Providers/RepositoryServiceProvider.php`

**Details:**

Routes:
```php
// Public (storefront) — no auth
Route::get('storefront/advertisements', [StorefrontController::class, 'advertisements']);

// Tracking — no auth (lightweight)
Route::post('advertisements/{id}/impression', [AdvertisementController::class, 'trackImpression']);
Route::post('advertisements/{id}/click', [AdvertisementController::class, 'trackClick']);

// Admin CRUD — auth + verified + onboarded
Route::middleware('permission:advertisements.view')->group(function () {
    Route::get('advertisements', [AdvertisementController::class, 'index']);
    Route::get('advertisements/{id}', [AdvertisementController::class, 'show']);
});
Route::middleware('permission:advertisements.create')->post('advertisements', [AdvertisementController::class, 'store']);
Route::middleware('permission:advertisements.update')->group(function () {
    Route::put('advertisements/{id}', [AdvertisementController::class, 'update']);
    Route::post('advertisements/{id}/image', [AdvertisementController::class, 'uploadImage']);
    Route::delete('advertisements/{id}/image', [AdvertisementController::class, 'deleteImage']);
});
Route::middleware('permission:advertisements.delete')->delete('advertisements/{id}', [AdvertisementController::class, 'destroy']);

// Merchant self-service — view ads targeting their store
Route::get('/advertisements', [MyMerchantController::class, 'myAdvertisements']);
```

Permissions in seeder:
```php
'advertisements' => [
    'advertisements.view',
    'advertisements.create',
    'advertisements.update',
    'advertisements.delete',
],
```
Assign to: super-admin, admin (view+create+update+delete), manager (view)

Service provider bindings:
- `AdvertisementServiceInterface` → `AdvertisementService`
- `AdvertisementRepositoryInterface` → `AdvertisementRepository`

### Step 10: Storefront Controller Method

**Files:**
- `backend/app/Http/Controllers/Api/V1/StorefrontController.php`
- `backend/app/Services/StorefrontService.php` (or AdvertisementService directly)

**Details:**
- Add `advertisements(Request $request)` method to StorefrontController
- Query params: `placement` (required), `audience` (default 'customer'), `merchant_id` (optional)
- Returns active, valid ads filtered by placement and audience
- No auth required (public endpoint)

### Step 11: Backend Tests

**Files:**
- `backend/tests/Feature/Api/V1/AdvertisementControllerTest.php`

**Details:**
- Pest describe/it syntax with `beforeEach` seeding roles + creating super-admin user
- Test groups:
  - `describe('index')` — lists ads, filters by type/placement/audience/merchant, pagination
  - `describe('store')` — creates ad, validates required fields, validates enums, allows nullable merchant_id, creates with image
  - `describe('show')` — retrieves ad with relations
  - `describe('update')` — updates fields, validates enums
  - `describe('destroy')` — deletes ad, returns 422 for non-existent
  - `describe('image')` — uploads image, deletes image
  - `describe('storefront')` — returns only active+valid ads, filters by placement+audience, excludes expired/inactive
  - `describe('authorization')` — 403 without permission, 401 without auth
  - `describe('tracking')` — increments impressions, increments clicks

**Expected:** ~25-30 tests

### Step 12: Frontend Types & Service (Admin)

**Files:**
- `frontend/types/api.ts` — Add `Advertisement` interface
- `frontend/services/advertisementService.ts`

**Details:**
- Interface: `Advertisement { id, merchant_id, title, description, type, placement, target_audience, link_url, link_text, is_active, starts_at, expires_at, sort_order, impressions, clicks, is_valid, image?, merchant?, creator?, created_at, updated_at }`
- Service methods: `getAdvertisements(params)`, `getAdvertisement(id)`, `createAdvertisement(data)`, `updateAdvertisement(id, data)`, `deleteAdvertisement(id)`, `uploadAdImage(id, file)`, `deleteAdImage(id)`

### Step 13: Frontend Hook (Admin)

**Files:**
- `frontend/hooks/useAdvertisements.ts`

**Details:**
- `useAdvertisements(params)` — Query with key `['advertisements', params]`
- `useAdvertisement(id)` — Single query
- `useCreateAdvertisement()` — Mutation, invalidates list
- `useUpdateAdvertisement()` — Mutation, invalidates list + detail
- `useDeleteAdvertisement()` — Mutation, invalidates list
- `useUploadAdImage()` — Mutation, invalidates detail
- `useDeleteAdImage()` — Mutation, invalidates detail

### Step 14: Frontend Validations (Admin)

**Files:**
- `frontend/lib/validations.ts`

**Details:**
- `advertisementSchema` — title required, type enum, placement enum, target_audience enum, starts_at required, expires_at optional, link_url optional url, link_text optional, merchant_id optional number, is_active boolean, sort_order number min 0, description optional

### Step 15: Frontend Admin Page

**Files:**
- `frontend/app/(system)/(settings)/advertisements/page.tsx`
- `frontend/components/layout/app-sidebar.tsx` — Add sidebar entry

**Details:**
- List page with DataTable: columns for title, type (badge), placement (badge), audience (badge), merchant name, is_active toggle, impressions, clicks, dates, actions
- Filters: type dropdown, placement dropdown, target_audience dropdown, is_active, merchant search
- Create/Edit dialog with form fields: title, description, type selector, placement selector, target_audience selector, merchant combobox (optional), link_url, link_text, starts_at date picker, expires_at date picker, sort_order, is_active switch, image upload with crop
- Image crop using existing `AvatarCropDialog` pattern with `cropShape="rect"`
- Delete confirmation dialog
- Sidebar entry under Settings group, permission-gated: `advertisements.view`

### Step 16: Customer Portal Ad Components

**Files:**
- `frontend-customer-portal/services/advertisementService.ts`
- `frontend-customer-portal/hooks/useAdvertisements.ts`
- `frontend-customer-portal/components/ad-banner.tsx`
- `frontend-customer-portal/types/api.ts` — Add Advertisement interface

**Details:**
- Service: `getActiveAds(placement, audience?)` hitting storefront endpoint
- Hook: `useActiveAds(placement)` with `staleTime: 5 * 60 * 1000` (5 min cache)
- `<AdBanner placement="homepage_hero" />` component: fetches ads for placement, renders as carousel/banner/card based on type, tracks impressions on mount, tracks clicks on link click
- Integrate into storefront layout (homepage, merchant listing, etc.)

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Impression tracking overloads DB | Medium | Use atomic `increment()`, consider debouncing on frontend, batch later if needed |
| Image storage lost on Railway redeploy | High | Must use R2/S3 storage (MEDIA_DISK=s3) — already being configured |
| Enum values hardcoded in multiple places | Low | Keep enum values in one place (validation rules reference same list) |
| Frontend/backend permission mismatch | Medium | Grep for permission strings across codebase after implementation |

## Testing Strategy

- [ ] CRUD operations (create, read, update, delete) with valid data
- [ ] Validation errors for invalid enums, missing required fields
- [ ] Storefront endpoint returns only active, valid, correctly filtered ads
- [ ] Expired ads excluded from storefront
- [ ] Merchant-scoped ads filtered correctly
- [ ] Image upload and delete
- [ ] Impression/click tracking increments atomically
- [ ] Permission enforcement (403 without permission)
- [ ] Unauthenticated access to public endpoints works
- [ ] Frontend TypeScript compiles cleanly
- [ ] Frontend lint passes

## Open Questions

- Impression tracking: server-side per-view for now (simple), optimize later if volume demands
- Ad scheduling (weekday/time restrictions): defer to v2, not in initial scope
- Merchant ad requests/purchasing: defer, admin-only creation for now
- A/B testing: defer, sort_order-based priority for now
