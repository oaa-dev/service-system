# Reference Data Module

## Overview
Global reference/lookup data entities used across the platform. These are admin-managed lists with public read endpoints for forms. Includes: PaymentMethod, DocumentType, BusinessType, SocialPlatform, CustomerTag, Field (custom field definitions), and Geographic data. All follow the same CRUD pattern with `/active` public endpoints and `/all` unpaginated authenticated endpoints.

## Entities

### PaymentMethod
- **Table**: `payment_methods`
- **Fields**: name, slug (auto-generated), description, is_active, sort_order, icon (Spatie Media Library)
- **Public endpoint**: `GET /payment-methods/active`
- **Used by**: Merchant payment method sync, Customer preferred payment method
- **Permissions**: `payment_methods.view/create/update/delete`
- **See also**: `payment-method.md`

### DocumentType
- **Table**: `document_types`
- **Fields**: name, slug (auto-generated), description, level (enum: organization/branch/both), is_active, sort_order, icon (Spatie Media Library)
- **Public endpoint**: `GET /document-types/active`
- **Used by**: Merchant document uploads (filter by level)
- **Permissions**: `document_types.view/create/update/delete`
- **See also**: `document-type.md`

### BusinessType
- **Table**: `business_types`
- **Fields**: name, slug (auto-generated), description, can_sell_products, can_take_bookings, can_rent_units, is_active, sort_order, icon (Spatie Media Library)
- **Special**: Capability flags (`can_sell_products`, `can_take_bookings`, `can_rent_units`) copied to Merchant on creation or business_type_id change
- **Custom fields**: `business_type_fields` pivot linking BusinessType → Field (with is_required, sort_order)
- **Public endpoint**: `GET /business-types/active`
- **Permissions**: `business_types.view/create/update/delete`
- **See also**: `business-type.md`, `business-type-field.md`

### SocialPlatform
- **Table**: `social_platforms`
- **Fields**: name, slug (auto-generated), base_url, is_active, sort_order, icon (Spatie Media Library)
- **Public endpoint**: `GET /social-platforms/active`
- **Used by**: Merchant social links sync
- **Permissions**: `social_platforms.view/create/update/delete`
- **See also**: `social-platform.md`

### CustomerTag
- **Table**: `customer_tags`
- **Fields**: name, slug (auto-generated), description, color, is_active
- **Public endpoint**: `GET /customer-tags/active`
- **Used by**: Admin customer tagging (many-to-many via `customer_customer_tag` pivot)
- **Permissions**: `customer_tags.view/create/update/delete`

### Field (Custom Field Definitions)
- **Table**: `fields`
- **Fields**: name, slug (auto-generated), label, type (enum: input/select/checkbox/radio), is_active, config (JSON)
- **Config JSON**: Stores type-specific settings. For select/radio: `{ default_value: string }`. For checkbox: `{ default_value: string[] }`. For select/radio/checkbox: also stores options array.
- **Linked to BusinessType** via `business_type_fields` pivot (is_required, sort_order)
- **Used by**: Service custom fields (EAV pattern with BusinessTypeFieldValue)
- **Public endpoint**: `GET /fields/active`
- **Permissions**: `fields.view/create/update/delete`
- **See also**: `field.md`, `field-value.md`, `business-type-field.md`, `business-type-field-value.md`

### Geographic (PSGC)
- Philippine Standard Geographic Code: Region → Province → City → Barangay
- **Public endpoints**: `GET /geographic/regions`, `/regions/{id}/provinces`, `/provinces/{id}/cities`, `/cities/{id}/barangays`
- **No CRUD** — pre-seeded read-only data
- **See also**: `geographic.md`

## Shared CRUD Pattern

All reference data entities follow this pattern:

### Backend
```
Route → Controller → DTO (all Optional) → Service (Spatie QueryBuilder) → Repository (extends BaseRepository) → Model
```

| Layer | Pattern |
|-------|---------|
| Model | `$attributes` for defaults; boot hooks for auto-slug; Media Library for icon |
| DTO | All fields `string|Optional`, `bool|Optional`, `int|Optional` |
| Service | Spatie QueryBuilder with partial name filter, exact is_active filter, and search callback |
| Repository | Extends BaseRepository; adds `findBySlug()` and `getActive()` |
| Controller | `index()`, `show()`, `store()`, `update()`, `destroy()`, `all()`, `active()` |
| FormRequest | `authorize(): true`; uniqueness ignores current record on update |

### Routes
Each entity has:
| Method | URI | Auth | Permission |
|--------|-----|------|------------|
| GET | `/{entity}/active` | Public | None |
| GET | `/{entity}/all` | auth:api | None (any authenticated user) |
| GET | `/{entity}` | auth + verified + onboarded | `{entity}.view` |
| GET | `/{entity}/{id}` | auth + verified + onboarded | `{entity}.view` |
| POST | `/{entity}` | auth + verified + onboarded | `{entity}.create` |
| PUT | `/{entity}/{id}` | auth + verified + onboarded | `{entity}.update` |
| DELETE | `/{entity}/{id}` | auth + verified + onboarded | `{entity}.delete` |

## Connected Files

### Backend
| Category | Files |
|----------|-------|
| Controllers | `PaymentMethodController`, `DocumentTypeController`, `BusinessTypeController`, `SocialPlatformController`, `CustomerTagController`, `FieldController`, `GeographicController` |
| Services | `PaymentMethodService`, `DocumentTypeService`, `BusinessTypeService`, `SocialPlatformService`, `CustomerTagService`, `FieldService` |
| Repositories | `PaymentMethodRepository`, `DocumentTypeRepository`, `BusinessTypeRepository`, `SocialPlatformRepository`, `CustomerTagRepository`, `FieldRepository` |
| DTOs | `PaymentMethodData`, `DocumentTypeData`, `BusinessTypeData`, `SocialPlatformData`, `CustomerTagData`, `FieldData` |
| FormRequests | Organized per entity under `app/Http/Requests/Api/V1/{Entity}/` |
| Resources | `PaymentMethodResource`, `DocumentTypeResource`, `BusinessTypeResource`, `SocialPlatformResource`, `CustomerTagResource`, `FieldResource` |
| Seeders | `PaymentMethodSeeder`, `DocumentTypeSeeder`, `BusinessTypeSeeder`, `SocialPlatformSeeder`, `RolePermissionSeeder` (permissions) |
| Bindings | All interfaces bound in `app/Providers/RepositoryServiceProvider.php` |

### Admin Frontend
| Category | Files |
|----------|-------|
| Services | `frontend/services/paymentMethodService.ts`, `documentTypeService.ts`, `businessTypeService.ts`, `socialPlatformService.ts`, `customerTagService.ts`, `fieldService.ts` |
| Hooks | `frontend/hooks/usePaymentMethods.ts`, `useDocumentTypes.ts`, `useBusinessTypes.ts`, `useSocialPlatforms.ts`, `useCustomerTags.ts`, `useFields.ts` |
| Types | `frontend/types/api.ts` — PaymentMethod, DocumentType, BusinessType, SocialPlatform, CustomerTag, Field, FieldValue |
| Validations | `frontend/lib/validations.ts` — Zod schemas per entity |
| Pages | Under `frontend/app/(system)/(settings)/` — CRUD pages for each entity |

### Customer Portal Frontend
| Category | Files |
|----------|-------|
| Storefront service | `frontend-customer-portal/services/storefrontService.ts` — calls `/storefront/business-types`, `/storefront/payment-methods` |
| Geographic service | `frontend-customer-portal/services/geographicService.ts` — cascading geo dropdowns |
| Geographic hook | `frontend-customer-portal/hooks/useGeographic.ts` — staleTime: Infinity |

## Config Endpoint
`GET /api/v1/config/images` — public endpoint that exposes all image upload configuration (mimes, max sizes, dimensions) from `config/images.php`. Used by both frontends to display upload requirements without hardcoding.

## BusinessType Custom Fields (EAV Pattern)
```
Field (definition)
  └─ FieldValue (options for select/radio/checkbox)
  └─ BusinessTypeField (pivot: business_type_id, field_id, is_required, sort_order)
       └─ BusinessTypeFieldValue (service custom field values: service_id, field_id, value)
```
- Admin links fields to business types via `PUT /business-types/{id}/fields` (`syncFields` action)
- Merchant services capture values for their business type's fields on create/update
- `StoreMerchantServiceRequest` / `UpdateMerchantServiceRequest` dynamically validate custom fields based on the merchant's business_type_id

## Tests
| Type | File |
|------|------|
| Feature (payment methods) | `backend/tests/Feature/Api/V1/PaymentMethodControllerTest.php` |
| Feature (document types) | `backend/tests/Feature/Api/V1/DocumentTypeControllerTest.php` |
| Feature (business types) | `backend/tests/Feature/Api/V1/BusinessTypeControllerTest.php` |
| Feature (social platforms) | `backend/tests/Feature/Api/V1/SocialPlatformControllerTest.php` |
| Feature (customer tags) | `backend/tests/Feature/Api/V1/CustomerTagControllerTest.php` |
| Feature (fields) | `backend/tests/Feature/Api/V1/FieldControllerTest.php` |

## Notes
- All `/active` endpoints are public (no auth required) — used by storefront, booking forms, registration forms
- All `/all` endpoints return unpaginated collections (for dropdown data) — behind auth:api but no specific permission
- Icon uploads handled by Spatie Media Library `icon` collection with `thumb` (64x64) conversion
- `CustomerTag` has no icon (only name, color, description) — simpler than the others
- BusinessType is the only entity with capability flags that propagate to other models
- BusinessType also has the `syncFields` endpoint for linking custom field definitions
