# FieldValue Module

## Model
- **Path**: app/Models/FieldValue.php
- **Table**: `field_values`
- **Fillable**: `field_id`, `label`, `value`, `sort_order`
- **Casts**:
  - `sort_order` → `integer`
- **Relationships**:
  - `field()` → BelongsTo → Field
- **Traits**: `HasFactory`
- **Scopes**: none

## Purpose
Stores the selectable options for `select`, `radio`, and `checkbox` field types. Each row represents one choice:
- `value` — the stored/submitted value (machine-readable, unique per field)
- `label` — the display label; if not provided on creation, auto-derived from `value` by FieldService

The `field_values` table enforces a unique constraint on `[field_id, value]`.

`input` type fields do not use FieldValue rows — their runtime answer is stored directly in `BusinessTypeFieldValue.value`.

## Lifecycle
FieldValue records are fully managed by `FieldService::syncFieldValues()` via a delete-and-recreate strategy. They are never created, updated, or deleted independently through API endpoints — all writes happen implicitly when creating or updating a `Field` with a `values` array.

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Model | app/Models/FieldValue.php | Core model |
| Resource | app/Http/Resources/Api/V1/FieldValueResource.php | Returns id, field_id, label, value, sort_order |
| Service | app/Services/FieldService.php | `syncFieldValues()`: deletes all FieldValue rows for the field, then re-creates from `values[]` in FieldData |
| DTO | app/Data/FieldData.php | `values: array\|Optional` — passed through to syncFieldValues |
| Form Request (Store) | app/Http/Requests/Api/V1/Field/StoreFieldRequest.php | `values` required (min:1) for select/checkbox/radio; `values.*.value` required string max:255 |
| Form Request (Update) | app/Http/Requests/Api/V1/Field/UpdateFieldRequest.php | `values` sometimes for select/checkbox/radio |
| Factory | database/factories/FieldValueFactory.php | Default: creates with a Field (select type); generates label/value from fake word |
| Referenced in Model | app/Models/Field.php | Has `fieldValues()` HasMany → FieldValue ordered by sort_order |
| Referenced in Model | app/Models/BusinessTypeFieldValue.php | Has `fieldValue()` BelongsTo → FieldValue (nullable; null for input-type answers) |
| Referenced in Resource | app/Http/Resources/Api/V1/BusinessTypeFieldValueResource.php | `whenLoaded` fieldValue rendered as FieldValueResource |
| Referenced in Resource | app/Http/Resources/Api/V1/FieldResource.php | `whenLoaded` fieldValues rendered as `values` collection |
| Eager-loaded in | app/Services/BusinessTypeService.php | `getActiveBusinessTypes` and `getBusinessTypeById` load `businessTypeFields.field.fieldValues` |
| Eager-loaded in | app/Services/FieldService.php | `getAllFields`, `getAllFieldsWithoutPagination`, `getFieldById` all load fieldValues |
| Eager-loaded in | app/Repositories/FieldRepository.php | `getActive()` eager-loads fieldValues |
| Eager-loaded in | app/Services/MerchantService.php | Service show/create/update loads `customFieldValues.fieldValue` |

## Routes
FieldValue records have no dedicated routes. They are written via Field CRUD and read as embedded `values` within FieldResource.

| Method | URI | Notes |
|--------|-----|-------|
| POST | `/api/v1/fields` | Creates Field + FieldValues if `values[]` provided |
| PUT | `/api/v1/fields/{field}` | Re-syncs FieldValues if `values[]` provided |
| GET | `/api/v1/fields/{field}` | Returns `field.values` in response |
| GET | `/api/v1/fields/active` | Returns active fields with values |
| GET | `/api/v1/fields/all` | Returns all fields with values |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_11_400005_create_field_values_table.php |
| Factory | database/factories/FieldValueFactory.php |
| Seeder | none |

## Tests
| Type | File |
|------|------|
| Feature (via Field CRUD, 22 tests) | tests/Feature/Api/V1/FieldControllerTest.php |

## Notes
- No dedicated controller, service, repository, or DTO — FieldValues are a child entity fully managed through the Field lifecycle
- The sync strategy is delete-and-recreate: all existing rows for the field are removed and new ones created from the input `values[]`
- `label` is auto-derived from `value` if not provided (done in `FieldService::syncFieldValues`)
- Unique constraint on `[field_id, value]` prevents duplicate option values within a single field
- Used as options in the EAV chain: BusinessTypeField links a Field to a BusinessType, and BusinessTypeFieldValue stores the chosen option reference
- No seeder — field values are created alongside their parent Field records
