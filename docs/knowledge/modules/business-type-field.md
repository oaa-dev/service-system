# BusinessTypeField Module

## Model
- **Path**: app/Models/BusinessTypeField.php
- **Table**: `business_type_fields`
- **Fillable**: `business_type_id`, `field_id`, `is_required`, `sort_order`
- **Casts**:
  - `is_required` → `boolean`
  - `sort_order` → `integer`
- **Relationships**:
  - `businessType()` → BelongsTo → BusinessType
  - `field()` → BelongsTo → Field
- **Traits**: none
- **Scopes**: none
- **Factory**: none

## Purpose
Pivot/join model for the EAV (Entity-Attribute-Value) system. Links a `Field` definition to a `BusinessType`, carrying per-link metadata:
- `is_required` — whether the field is mandatory when filling out a service form of this business type
- `sort_order` — display order of the field within the business type

The relationship is unique on `[business_type_id, field_id]` (enforced by DB constraint).

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Model | app/Models/BusinessTypeField.php | Core model |
| Controller | app/Http/Controllers/Api/V1/BusinessTypeController.php | `getFields()` and `syncFields()` endpoints manage BusinessTypeField records |
| Service | app/Services/BusinessTypeService.php | `syncFields()`: deletes all existing BusinessTypeField rows then re-creates from input array |
| Resource | app/Http/Resources/Api/V1/BusinessTypeFieldResource.php | Returns id, business_type_id, field_id, is_required, sort_order, and `whenLoaded` field |
| FormRequest (Sync) | app/Http/Requests/Api/V1/BusinessType/SyncBusinessTypeFieldsRequest.php | Validates `fields[].field_id` exists:fields, `fields[].is_required` boolean, `fields[].sort_order` integer |
| Parent Model | app/Models/BusinessType.php | Has `businessTypeFields()` HasMany ordered by sort_order |
| Eager-loaded via | app/Services/BusinessTypeService.php | `getBusinessTypeById` and `getActiveBusinessTypes` load `businessTypeFields.field.fieldValues` |
| Referenced in Service | app/Services/MerchantService.php | `syncCustomFieldValues` uses BusinessTypeField to build BusinessTypeFieldValue records |
| Referenced in Request | app/Http/Requests/Api/V1/Service/StoreMerchantServiceRequest.php | Fetches BusinessTypeField records to dynamically build custom_fields validation rules |
| Referenced in Request | app/Http/Requests/Api/V1/Service/UpdateMerchantServiceRequest.php | Same dynamic validation for update |
| Referenced in Model | app/Models/BusinessTypeFieldValue.php | Has `businessTypeField()` BelongsTo |
| Referenced in Resource | app/Http/Resources/Api/V1/BusinessTypeFieldValueResource.php | `whenLoaded` businessTypeField rendered as BusinessTypeFieldResource |

## Routes
BusinessTypeField records are managed through the BusinessType endpoints. There are no standalone routes for this model.

| Method | URI | Action | Auth | Permission |
|--------|-----|--------|------|------------|
| GET | `/api/v1/business-types/{businessType}/fields` | `BusinessTypeController@getFields()` | `auth:api` + verified + onboarded | `business_types.view` |
| PUT | `/api/v1/business-types/{businessType}/fields` | `BusinessTypeController@syncFields()` | `auth:api` + verified + onboarded | `business_types.update` |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_11_400006_create_business_type_fields_table.php |
| Factory | none |
| Seeder | none |

## Tests
| Type | File |
|------|------|
| Feature (Field sync, 9 tests) | tests/Feature/Api/V1/BusinessTypeFieldsTest.php |
| Integration (merchant services) | tests/Feature/Api/V1/MerchantServiceControllerTest.php |

## Notes
- No dedicated controller, service, repository, or DTO — records are fully managed by `BusinessTypeService.syncFields()` via the `BusinessTypeController`
- The sync strategy is delete-and-recreate: all existing rows for the business type are removed and new ones created from the input
- Unique constraint on `[business_type_id, field_id]` prevents duplicate field assignments
- Eagerly loaded as part of the EAV chain: `businessTypeFields.field.fieldValues` provides the full field definition tree
- `is_required` and `sort_order` are per-business-type overrides — the same Field can be required in one BusinessType and optional in another
