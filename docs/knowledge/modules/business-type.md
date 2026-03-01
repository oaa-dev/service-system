# BusinessType Module

## Model
- **Path**: app/Models/BusinessType.php
- **Table**: `business_types`
- **Fillable**: `name`, `slug`, `description`, `is_active`, `sort_order`, `can_sell_products`, `can_take_bookings`, `can_rent_units`
- **Casts**:
  - `is_active` → `boolean`
  - `sort_order` → `integer`
  - `can_sell_products` → `boolean`
  - `can_take_bookings` → `boolean`
  - `can_rent_units` → `boolean`
- **Relationships**:
  - `businessTypeFields()` → HasMany → BusinessTypeField (ordered by sort_order)
- **Traits**: `HasFactory`, `InteractsWithMedia` (Spatie Media Library)
- **Scopes**: none (filtering handled in service layer via Spatie QueryBuilder)
- **Model Hooks (booted)**:
  - `creating` — auto-generates `slug` from `name` via `Str::slug()` if empty
  - `updating` — auto-updates `slug` when `name` changes and `slug` was not also changed
- **Media Collections**:
  - `icon` — single file, accepts `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`
  - `icon` conversion: `thumb` (64x64, sharpen 10)

## Capability Flags
Three boolean flags copied to Merchant on creation:
- `can_sell_products` — enables ServiceOrder sub-module
- `can_take_bookings` — enables Booking sub-module
- `can_rent_units` — enables Reservation sub-module

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Model | app/Models/BusinessType.php | Core model |
| DTO | app/Data/BusinessTypeData.php | All fields use `string\|Optional` / `bool\|Optional` / `int\|Optional` pattern; includes 3 capability flags |
| Controller | app/Http/Controllers/Api/V1/BusinessTypeController.php | Full CRUD + `all()` + `active()` + `getFields()` + `syncFields()` |
| Form Request (store) | app/Http/Requests/Api/V1/BusinessType/StoreBusinessTypeRequest.php | `name` required + unique; capability flags `sometimes boolean` |
| Form Request (update) | app/Http/Requests/Api/V1/BusinessType/UpdateBusinessTypeRequest.php | All `sometimes`; uniqueness ignores current record |
| Form Request (sync fields) | app/Http/Requests/Api/V1/BusinessType/SyncBusinessTypeFieldsRequest.php | Validates `fields` array with `field_id` exists:fields, `is_required` boolean, `sort_order` integer |
| Resource | app/Http/Resources/Api/V1/BusinessTypeResource.php | Includes capability flags, `whenLoaded` businessTypeFields as `fields`, conditional `icon` (url + thumb) |
| Service Interface | app/Services/Contracts/BusinessTypeServiceInterface.php | Defines 8 methods (standard CRUD + `syncFields`) |
| Service | app/Services/BusinessTypeService.php | Uses Spatie QueryBuilder for `index`; `getActiveBusinessTypes` eager-loads `businessTypeFields.field.fieldValues`; `syncFields` uses delete-and-recreate |
| Repository Interface | app/Repositories/Contracts/BusinessTypeRepositoryInterface.php | Extends BaseRepositoryInterface; adds `findBySlug`, `getActive` |
| Repository | app/Repositories/BusinessTypeRepository.php | Extends BaseRepository; `findBySlug`, `getActive` |
| Service Provider | app/Providers/RepositoryServiceProvider.php | Binds interface → implementation for both service and repository |
| Seeder | database/seeders/BusinessTypeSeeder.php | Seeds default business types via firstOrCreate |
| Factory | database/factories/BusinessTypeFactory.php | States: `inactive()`; capability flags default to false |
| Migration (main) | database/migrations/2026_02_08_000003_create_business_types_table.php | Creates `business_types` table |
| Migration (capabilities) | database/migrations/2026_02_10_200006_add_capabilities_to_business_types_table.php | Adds 3 capability flag columns |
| Migration (cleanup) | database/migrations/2026_02_12_100001_drop_can_take_orders_from_business_types_and_merchants.php | Removes deprecated `can_take_orders` column |
| Test (CRUD) | tests/Feature/Api/V1/BusinessTypeControllerTest.php | 17 tests |
| Test (Fields) | tests/Feature/Api/V1/BusinessTypeFieldsTest.php | 9 tests |
| Related Model | app/Models/Merchant.php | Has `businessType()` BelongsTo; copies capability flags on merchant creation |
| Merchant Service | app/Services/MerchantService.php | Reads capability flags from BusinessType when creating Merchant |
| BusinessTypeField Resource | app/Http/Resources/Api/V1/BusinessTypeFieldResource.php | Used by BusinessTypeResource to render nested fields |
| Role Permission Seeder | database/seeders/RolePermissionSeeder.php | Defines permissions: `business_types.view/create/update/delete` |

## Routes
| Method | URI | Action | Auth | Permission |
|--------|-----|--------|------|------------|
| GET | `/api/v1/business-types/active` | `active()` | Public (no auth) | None |
| GET | `/api/v1/business-types/all` | `all()` | `auth:api` + verified + onboarded | None |
| GET | `/api/v1/business-types` | `index()` | `auth:api` + verified + onboarded | `business_types.view` |
| GET | `/api/v1/business-types/{businessType}` | `show()` | `auth:api` + verified + onboarded | `business_types.view` |
| GET | `/api/v1/business-types/{businessType}/fields` | `getFields()` | `auth:api` + verified + onboarded | `business_types.view` |
| POST | `/api/v1/business-types` | `store()` | `auth:api` + verified + onboarded | `business_types.create` |
| PUT | `/api/v1/business-types/{businessType}` | `update()` | `auth:api` + verified + onboarded | `business_types.update` |
| PUT | `/api/v1/business-types/{businessType}/fields` | `syncFields()` | `auth:api` + verified + onboarded | `business_types.update` |
| DELETE | `/api/v1/business-types/{businessType}` | `destroy()` | `auth:api` + verified + onboarded | `business_types.delete` |

## Database
| Type | File |
|------|------|
| Migration (create) | database/migrations/2026_02_08_000003_create_business_types_table.php |
| Migration (capabilities) | database/migrations/2026_02_10_200006_add_capabilities_to_business_types_table.php |
| Migration (drop can_take_orders) | database/migrations/2026_02_12_100001_drop_can_take_orders_from_business_types_and_merchants.php |
| Factory | database/factories/BusinessTypeFactory.php |
| Seeder | database/seeders/BusinessTypeSeeder.php |

## Tests
| Type | File |
|------|------|
| Feature (CRUD, 17 tests) | tests/Feature/Api/V1/BusinessTypeControllerTest.php |
| Feature (Field sync, 9 tests) | tests/Feature/Api/V1/BusinessTypeFieldsTest.php |
| Integration (merchant creation) | tests/Feature/Api/V1/MerchantControllerTest.php |
| Integration (merchant services) | tests/Feature/Api/V1/MerchantServiceControllerTest.php |
| Integration (storefront) | tests/Feature/Api/V1/StorefrontControllerTest.php |
| Integration (onboarding) | tests/Feature/Api/V1/OnboardingChecklistTest.php |

## Permissions
| Permission | Description |
|------------|-------------|
| `business_types.view` | List and view individual business types |
| `business_types.create` | Create new business types |
| `business_types.update` | Update existing business types |
| `business_types.delete` | Delete business types |

## QueryBuilder Filters (index endpoint)
- `filter[name]` — partial match on name
- `filter[is_active]` — exact match on is_active
- `filter[search]` — partial match on name (alias)
- `sort` — allowed: id, name, sort_order, is_active, created_at (default: sort_order)

## Notes
- `slug` is auto-derived from `name` on create; auto-updated on name change unless explicitly provided
- `active` endpoint is public (no auth required) — used by storefront/public pages; eager-loads `businessTypeFields.field.fieldValues`
- `all` endpoint returns unpaginated collection ordered by `sort_order` — used for dropdown data
- Capability flags (`can_sell_products`, `can_take_bookings`, `can_rent_units`) are copied to Merchant on creation via MerchantService, then independently editable on the Merchant
- `syncFields` endpoint uses delete-and-recreate strategy — all existing BusinessTypeField rows for the business type are deleted and new ones created from the input array
- Icon upload via Spatie Media Library `icon` collection; response includes `icon.url` and `icon.thumb`
- `getFields` endpoint eager-loads `businessTypeFields.field.fieldValues` for the full EAV tree
