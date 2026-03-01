# DocumentType Module

## Model
- **Path**: app/Models/DocumentType.php
- **Table**: `document_types`
- **Fillable**: `name`, `slug`, `description`, `is_required`, `level`, `is_active`, `sort_order`
- **Casts**:
  - `is_required` → `boolean`
  - `is_active` → `boolean`
  - `sort_order` → `integer`
- **Relationships**: none defined on model (referenced by `MerchantDocument.document_type_id` and `CustomerDocument.document_type_id` via BelongsTo)
- **Traits**: `HasFactory`
- **Scopes**: none (filtering handled in service layer via Spatie QueryBuilder)
- **Model Hooks (booted)**:
  - `creating` — auto-generates `slug` from `name` via `Str::slug()` if empty
  - `updating` — auto-updates `slug` when `name` changes and `slug` was not also changed
- **Level Enum Values**: `organization`, `branch`, `both`

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Model | app/Models/DocumentType.php | Core model |
| DTO | app/Data/DocumentTypeData.php | All fields use `string\|Optional` / `bool\|Optional` / `int\|Optional` pattern |
| Controller | app/Http/Controllers/Api/V1/DocumentTypeController.php | Full CRUD + `all()` + `active()` |
| Form Request (store) | app/Http/Requests/Api/V1/DocumentType/StoreDocumentTypeRequest.php | `name` required + unique; `level` validated against enum `in:organization,branch,both` |
| Form Request (update) | app/Http/Requests/Api/V1/DocumentType/UpdateDocumentTypeRequest.php | All `sometimes`; uniqueness ignores current record |
| Resource | app/Http/Resources/Api/V1/DocumentTypeResource.php | Flat response: id, name, slug, description, is_required, level, is_active, sort_order, timestamps |
| Service Interface | app/Services/Contracts/DocumentTypeServiceInterface.php | Defines 7 methods |
| Service | app/Services/DocumentTypeService.php | Uses Spatie QueryBuilder for `index`; filters: name (partial), is_active (exact), is_required (exact), level (exact), search (callback); sorts: id, name, sort_order, is_active, is_required, level, created_at; default sort: sort_order |
| Repository Interface | app/Repositories/Contracts/DocumentTypeRepositoryInterface.php | Extends BaseRepositoryInterface; adds `findBySlug`, `getActive` |
| Repository | app/Repositories/DocumentTypeRepository.php | Extends BaseRepository; `findBySlug`, `getActive` (where is_active=true, ordered by sort_order) |
| Service Provider | app/Providers/RepositoryServiceProvider.php | Binds interface → implementation for both service and repository |
| Seeder | database/seeders/DocumentTypeSeeder.php | Seeds default document types |
| Factory | database/factories/DocumentTypeFactory.php | States: `required()`, `inactive()`, `organizationLevel()`, `branchLevel()` |
| Migration | database/migrations/2026_02_08_000002_create_document_types_table.php | Creates `document_types` table with level enum |
| Test | tests/Feature/Api/V1/DocumentTypeControllerTest.php | Pest describe/it; 16 tests covering index, filter by name/level, pagination, active, store, level enum validation, show, update, delete |
| Related Model | app/Models/MerchantDocument.php | Has `documentType()` BelongsTo; stores actual uploaded files via Spatie Media Library `document` collection |
| Related Model | app/Models/CustomerDocument.php | Has `documentType()` BelongsTo |
| Related Resource | app/Http/Resources/Api/V1/MerchantDocumentResource.php | Wraps MerchantDocument with embedded DocumentType data |
| Related Resource | app/Http/Resources/Api/V1/CustomerDocumentResource.php | Wraps CustomerDocument with embedded DocumentType data |
| Role Permission Seeder | database/seeders/RolePermissionSeeder.php | Defines permissions: `document_types.view/create/update/delete` |

## Routes
| Method | URI | Action | Auth | Permission |
|--------|-----|--------|------|------------|
| GET | `/api/v1/document-types/active` | `active()` | Public (no auth) | None |
| GET | `/api/v1/document-types/all` | `all()` | `auth:api` + verified + onboarded | None |
| GET | `/api/v1/document-types` | `index()` | `auth:api` + verified + onboarded | `document_types.view` |
| GET | `/api/v1/document-types/{documentType}` | `show()` | `auth:api` + verified + onboarded | `document_types.view` |
| POST | `/api/v1/document-types` | `store()` | `auth:api` + verified + onboarded | `document_types.create` |
| PUT | `/api/v1/document-types/{documentType}` | `update()` | `auth:api` + verified + onboarded | `document_types.update` |
| DELETE | `/api/v1/document-types/{documentType}` | `destroy()` | `auth:api` + verified + onboarded | `document_types.delete` |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_08_000002_create_document_types_table.php |
| Factory | database/factories/DocumentTypeFactory.php |
| Seeder | database/seeders/DocumentTypeSeeder.php |

## Tests
| Type | File |
|------|------|
| Feature (controller, 16 tests) | tests/Feature/Api/V1/DocumentTypeControllerTest.php |
| Integration (merchant documents) | tests/Feature/Api/V1/MerchantControllerTest.php |
| Integration (self-service documents) | tests/Feature/Api/V1/MyMerchantControllerTest.php |
| Integration (onboarding) | tests/Feature/Api/V1/OnboardingChecklistTest.php |
| Integration (customer documents) | tests/Feature/Api/V1/CustomerControllerTest.php |

## Permissions
| Permission | Description |
|------------|-------------|
| `document_types.view` | List and view individual document types |
| `document_types.create` | Create new document types |
| `document_types.update` | Update existing document types |
| `document_types.delete` | Delete document types |

## Notes
- `level` controls which merchant entity type the document applies to: `organization` (company-level), `branch` (location-level), or `both`
- `is_required` flags whether merchants must upload this document type during onboarding
- `slug` is auto-derived from `name` on create; auto-updated on name change unless explicitly provided
- `active` endpoint is public (no auth required) — used for onboarding and public pages
- `all` endpoint returns unpaginated collection ordered by `sort_order` — used for dropdown data
- `index` endpoint supports extra filters not present in other modules: `filter[is_required]` and `filter[level]`
- Actual document files are stored on `MerchantDocument` (not on `DocumentType`) via Spatie Media Library `document` collection
- DocumentType is reference data — it defines categories; `MerchantDocument` is the per-merchant uploaded instance
- No icon/media on DocumentType itself (unlike PaymentMethod and SocialPlatform)
