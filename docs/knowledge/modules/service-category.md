# ServiceCategory Module

## Model
- **Path**: app/Models/ServiceCategory.php
- **Table**: service_categories
- **Fillable**: merchant_id, name, slug, description, is_active, sort_order
- **Casts**:
  - is_active -> boolean
  - sort_order -> integer
- **Relationships**:
  - merchant -> BelongsTo -> Merchant
- **Traits**: HasFactory
- **Scopes**: none
- **Boot hooks**:
  - creating: auto-generates slug from name if empty
  - updating: re-generates slug from name if name is dirty and slug is not

### Key Constraints
- Composite unique index on `[merchant_id, slug]` -- the same slug can exist across different merchants but not within the same merchant.
- Name is also unique per merchant (enforced via FormRequest validation, not DB constraint).

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/MerchantServiceCategoryController.php | Full CRUD + all/active listing |
| Service (business logic) | app/Services/ServiceCategoryService.php | Merchant-scoped CRUD; uses MerchantRepository to validate merchant exists |
| Service interface | app/Services/Contracts/ServiceCategoryServiceInterface.php | getMerchantServiceCategories, getMerchantServiceCategoriesAll, getMerchantActiveServiceCategories, getMerchantServiceCategoryById, createMerchantServiceCategory, updateMerchantServiceCategory, deleteMerchantServiceCategory |
| Repository | app/Repositories/ServiceCategoryRepository.php | Extends BaseRepository; adds findBySlug() and getActive() |
| Repository interface | app/Repositories/Contracts/ServiceCategoryRepositoryInterface.php | findBySlug, getActive |
| DTO | app/Data/ServiceCategoryData.php | name, slug, description, is_active, sort_order -- all Optional |
| Form Request (create) | app/Http/Requests/Api/V1/ServiceCategory/StoreServiceCategoryRequest.php | name unique per merchant_id; slug unique per merchant_id |
| Form Request (update) | app/Http/Requests/Api/V1/ServiceCategory/UpdateServiceCategoryRequest.php | name/slug unique per merchant_id, ignoring current record |
| Resource | app/Http/Resources/Api/V1/ServiceCategoryResource.php | Flat output: id, merchant_id, name, slug, description, is_active, sort_order, timestamps |
| ServiceProvider | app/Providers/RepositoryServiceProvider.php | Binds ServiceCategoryServiceInterface (note: ServiceCategoryRepositoryInterface is NOT explicitly bound; see Notes) |
| Parent model | app/Models/Merchant.php | Has serviceCategories() HasMany relationship |
| Child model | app/Models/Service.php | BelongsTo ServiceCategory via serviceCategory() |
| Storefront | app/Http/Controllers/Api/V1/StorefrontController.php | merchantDetail endpoint includes categories for the merchant |
| Storefront service | app/Services/StorefrontService.php | Loads active categories alongside merchant detail |

## Routes
| Method | URI | Action | Middleware |
|--------|-----|--------|-----------|
| GET | /api/v1/merchants/{merchant}/service-categories | index (paginated) | auth:api, ensure.verified, onboarding, permission:service_categories.view |
| GET | /api/v1/merchants/{merchant}/service-categories/all | all (unpaginated) | auth:api, ensure.verified, onboarding, permission:service_categories.view |
| GET | /api/v1/merchants/{merchant}/service-categories/active | active only | auth:api, ensure.verified, onboarding, permission:service_categories.view |
| GET | /api/v1/merchants/{merchant}/service-categories/{serviceCategory} | show | auth:api, ensure.verified, onboarding, permission:service_categories.view |
| POST | /api/v1/merchants/{merchant}/service-categories | store | auth:api, ensure.verified, onboarding, permission:service_categories.create |
| PUT | /api/v1/merchants/{merchant}/service-categories/{serviceCategory} | update | auth:api, ensure.verified, onboarding, permission:service_categories.update |
| DELETE | /api/v1/merchants/{merchant}/service-categories/{serviceCategory} | destroy | auth:api, ensure.verified, onboarding, permission:service_categories.delete |

## Query Filters (index endpoint)
Allowed filters via Spatie QueryBuilder:
- `filter[name]` -- partial match
- `filter[is_active]` -- exact match
- `filter[search]` -- name LIKE

Allowed sorts: id, name, sort_order, is_active, created_at
Default sort: sort_order (ascending)

## Database
| Type | File |
|------|------|
| Migration (create) | database/migrations/2026_02_09_100001_create_service_categories_table.php |
| Migration (add merchant_id) | database/migrations/2026_02_09_200001_add_merchant_id_to_service_categories_table.php |
| Factory | database/factories/ServiceCategoryFactory.php |
| Seeder | database/seeders/ServiceCategorySeeder.php (empty -- categories are per-merchant, not pre-seeded) |

### Factory States
- `inactive()` -- sets is_active to false

## Tests
| Type | File |
|------|------|
| Feature (CRUD + filtering + scoping) | tests/Feature/Api/V1/ServiceCategoryControllerTest.php |
| Feature (merchant detail with categories) | tests/Feature/Api/V1/StorefrontControllerTest.php |
| Feature (self-service merchant view) | tests/Feature/Api/V1/MyMerchantControllerTest.php |

## Notes
- Categories are strictly per-merchant. The initial migration created a global table; the second migration (`add_merchant_id`) added the FK and deleted all pre-seeded data, making it merchant-scoped.
- `ServiceCategoryService` injects `MerchantRepositoryInterface` (not `ServiceCategoryRepositoryInterface`) to do the merchant existence check before any category operation. The `ServiceCategoryRepository` exists and is defined but is not used by `ServiceCategoryService` directly.
- `ServiceCategoryRepositoryInterface` is NOT bound in `RepositoryServiceProvider`. Only `ServiceCategoryServiceInterface` is bound.
- Default sort order for list endpoints is `sort_order` ASC (ascending, unlike most modules which default to `-created_at`).
- Permissions namespace: `service_categories.*` (note the plural with underscore).
- The `/all` endpoint returns an unpaginated list for dropdown usage. The `/active` endpoint returns only active categories for form selects.
- Category creation uses `$merchant->serviceCategories()->create($createData)` to auto-set merchant_id.
