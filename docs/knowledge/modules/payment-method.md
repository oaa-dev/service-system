# PaymentMethod Module

## Model
- **Path**: app/Models/PaymentMethod.php
- **Table**: `payment_methods`
- **Fillable**: `name`, `slug`, `description`, `is_active`, `sort_order`
- **Casts**:
  - `is_active` → `boolean`
  - `sort_order` → `integer`
- **Relationships**: none (belongs to many Merchants via `merchant_payment_method` pivot — relationship defined on `Merchant`, not on `PaymentMethod`)
- **Traits**: `HasFactory`, `InteractsWithMedia` (Spatie Media Library)
- **Scopes**: none (filtering handled in service layer via Spatie QueryBuilder)
- **Model Hooks (booted)**:
  - `creating` — auto-generates `slug` from `name` via `Str::slug()` if empty
  - `updating` — auto-updates `slug` when `name` changes and `slug` was not also changed
- **Media Collections**:
  - `icon` — single file, accepts `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`
  - `icon` conversion: `thumb` (64x64, sharpen 10)

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Model | app/Models/PaymentMethod.php | Core model |
| DTO | app/Data/PaymentMethodData.php | All fields use `string\|Optional` / `bool\|Optional` / `int\|Optional` pattern |
| Controller | app/Http/Controllers/Api/V1/PaymentMethodController.php | Full CRUD + `all()` + `active()` |
| Form Request (store) | app/Http/Requests/Api/V1/PaymentMethod/StorePaymentMethodRequest.php | `name` required + unique; `slug` optional + unique |
| Form Request (update) | app/Http/Requests/Api/V1/PaymentMethod/UpdatePaymentMethodRequest.php | All `sometimes`; uniqueness ignores current record |
| Resource | app/Http/Resources/Api/V1/PaymentMethodResource.php | Includes conditional `icon` (url + thumb) when media loaded |
| Service Interface | app/Services/Contracts/PaymentMethodServiceInterface.php | Defines 7 methods |
| Service | app/Services/PaymentMethodService.php | Uses Spatie QueryBuilder for `index`; filters: name (partial), is_active (exact), search (callback); sorts: id, name, sort_order, is_active, created_at; default sort: sort_order |
| Repository Interface | app/Repositories/Contracts/PaymentMethodRepositoryInterface.php | Extends BaseRepositoryInterface; adds `findBySlug`, `getActive` |
| Repository | app/Repositories/PaymentMethodRepository.php | Extends BaseRepository; `findBySlug`, `getActive` (where is_active=true, ordered by sort_order) |
| Service Provider | app/Providers/RepositoryServiceProvider.php | Binds interface → implementation for both service and repository |
| Seeder | database/seeders/PaymentMethodSeeder.php | Seeds default payment methods |
| Factory | database/factories/PaymentMethodFactory.php | States: `inactive()` |
| Migration (main) | database/migrations/2026_02_08_000001_create_payment_methods_table.php | Creates `payment_methods` table |
| Migration (pivot) | database/migrations/2026_02_08_100003_create_merchant_payment_method_table.php | Creates `merchant_payment_method` pivot table (merchant_id, payment_method_id) |
| Test | tests/Feature/Api/V1/PaymentMethodControllerTest.php | Pest describe/it; 15 tests covering index, filter, pagination, all, active, store, show, update, delete |
| Related Model | app/Models/Merchant.php | Has `paymentMethods()` BelongsToMany through `merchant_payment_method` pivot |
| Merchant Sync Request | app/Http/Requests/Api/V1/Merchant/SyncPaymentMethodsRequest.php | Validates array of payment_method_ids for sync endpoint |
| Merchant Resource | app/Http/Resources/Api/V1/MerchantResource.php | Includes `payment_methods` via `whenLoaded` |
| Merchant Service | app/Services/MerchantService.php | `syncMerchantPaymentMethods()` — calls BelongsToMany `sync()` |
| Role Permission Seeder | database/seeders/RolePermissionSeeder.php | Defines permissions: `payment_methods.view/create/update/delete` |

## Routes
| Method | URI | Action | Auth | Permission |
|--------|-----|--------|------|------------|
| GET | `/api/v1/payment-methods/active` | `active()` | Public (no auth) | None |
| GET | `/api/v1/payment-methods/all` | `all()` | `auth:api` + verified + onboarded | None |
| GET | `/api/v1/payment-methods` | `index()` | `auth:api` + verified + onboarded | `payment_methods.view` |
| GET | `/api/v1/payment-methods/{paymentMethod}` | `show()` | `auth:api` + verified + onboarded | `payment_methods.view` |
| POST | `/api/v1/payment-methods` | `store()` | `auth:api` + verified + onboarded | `payment_methods.create` |
| PUT | `/api/v1/payment-methods/{paymentMethod}` | `update()` | `auth:api` + verified + onboarded | `payment_methods.update` |
| DELETE | `/api/v1/payment-methods/{paymentMethod}` | `destroy()` | `auth:api` + verified + onboarded | `payment_methods.delete` |
| POST | `/api/v1/merchants/{merchant}/payment-methods` | `MerchantController@syncPaymentMethods()` | `auth:api` + verified + onboarded | `merchants.update` |
| POST | `/api/v1/auth/merchant/payment-methods` | `MyMerchantController@syncPaymentMethods()` | `auth:api` + verified + onboarded | None (self-service) |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_08_000001_create_payment_methods_table.php |
| Pivot Migration | database/migrations/2026_02_08_100003_create_merchant_payment_method_table.php |
| Factory | database/factories/PaymentMethodFactory.php |
| Seeder | database/seeders/PaymentMethodSeeder.php |

## Tests
| Type | File |
|------|------|
| Feature (controller, 15 tests) | tests/Feature/Api/V1/PaymentMethodControllerTest.php |
| Integration (merchant sync) | tests/Feature/Api/V1/MerchantControllerTest.php |
| Integration (self-service sync) | tests/Feature/Api/V1/MyMerchantControllerTest.php |

## Permissions
| Permission | Description |
|------------|-------------|
| `payment_methods.view` | List and view individual payment methods |
| `payment_methods.create` | Create new payment methods |
| `payment_methods.update` | Update existing payment methods |
| `payment_methods.delete` | Delete payment methods |

## Notes
- `slug` is auto-derived from `name` on create; auto-updated on name change unless explicitly provided
- `active` endpoint is public (no auth required) — used by storefront/public pages
- `all` endpoint returns unpaginated collection ordered by `sort_order` — used for dropdown data
- `index` endpoint supports query filtering: `filter[name]`, `filter[is_active]`, `filter[search]`, and sorting via `sort` parameter
- Icon upload is done via Spatie Media Library `icon` collection; response includes `icon.url` and `icon.thumb`
- Merchant-PaymentMethod is a many-to-many relationship managed via `sync()` (replace-all semantics)
