# Field Module

## Model
- **Path**: app/Models/Field.php
- **Table**: `fields`
- **Fillable**: `label`, `name`, `type`, `config`, `is_active`, `sort_order`
- **Casts**:
  - `config` → `array` (JSON column)
  - `is_active` → `boolean`
  - `sort_order` → `integer`
- **Relationships**:
  - `fieldValues()` → HasMany → FieldValue (ordered by sort_order)
- **Traits**: `HasFactory`
- **Scopes**: none (filtering handled in service layer via Spatie QueryBuilder)
- **Model Hooks (booted)**:
  - `creating` — auto-generates `name` from `label` via `Str::slug($label, '_')` if name is empty
  - `updating` — auto-updates `name` from `label` if label is dirty but name is not

## Field Types
The `type` column is an enum with four values:
- `input` — free-text or numeric input; config keys: `is_number`, `placeholder`, `default_value` (string), `min`, `max`
- `select` — single-choice dropdown; requires FieldValues; config key: `default_value` (string)
- `radio` — single-choice radio; requires FieldValues; config key: `default_value` (string)
- `checkbox` — multi-choice; requires FieldValues; config key: `default_value` (string[])

## Config JSON Shape
```json
{
  "is_number": false,
  "placeholder": "Enter a value",
  "default_value": "some default",
  "min": 0,
  "max": 100
}
```
For select/radio: `default_value` is a single string matching a FieldValue.value.
For checkbox: `default_value` is an array of strings matching FieldValue.value entries.

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Model | app/Models/Field.php | Core model |
| DTO | app/Data/FieldData.php | All fields Optional (Spatie Laravel Data); includes `values` array for FieldValue sync |
| Controller | app/Http/Controllers/Api/V1/FieldController.php | Full CRUD + `all()` + `active()` |
| Form Request (store) | app/Http/Requests/Api/V1/Field/StoreFieldRequest.php | Dynamic rules: `values` required for select/checkbox/radio; config keys validated per type |
| Form Request (update) | app/Http/Requests/Api/V1/Field/UpdateFieldRequest.php | All `sometimes`; resolves current type from DB to apply correct value/config rules |
| Resource | app/Http/Resources/Api/V1/FieldResource.php | Returns id, label, name, type, config, is_active, sort_order, `whenLoaded` fieldValues as `values`, timestamps |
| Service Interface | app/Services/Contracts/FieldServiceInterface.php | Defines 7 methods |
| Service | app/Services/FieldService.php | QueryBuilder filtering; `syncFieldValues` delete-and-recreate on create/update; eager-loads fieldValues |
| Repository Interface | app/Repositories/Contracts/FieldRepositoryInterface.php | Extends BaseRepositoryInterface; adds `findByName`, `getActive` |
| Repository | app/Repositories/FieldRepository.php | Extends BaseRepository; `findByName`, `getActive` (where is_active=true, ordered by sort_order, eager-loads fieldValues) |
| Service Provider | app/Providers/RepositoryServiceProvider.php | Binds interface → implementation for both service and repository |
| Factory | database/factories/FieldFactory.php | States: `input()`, `numberInput()`, `select()`, `checkbox()`, `radio()`, `inactive()` |
| Migration | database/migrations/2026_02_11_400004_create_fields_table.php | Creates `fields` table with JSON `config` column |
| Test | tests/Feature/Api/V1/FieldControllerTest.php | 22 tests |
| Referenced in Model | app/Models/BusinessTypeField.php | Has `field()` BelongsTo → Field |
| Referenced in Request | app/Http/Requests/Api/V1/BusinessType/SyncBusinessTypeFieldsRequest.php | `fields[].field_id` exists:fields,id |
| Referenced in Request | app/Http/Requests/Api/V1/Service/StoreMerchantServiceRequest.php | Loads businessTypeField.field to build custom_fields validation |
| Referenced in Request | app/Http/Requests/Api/V1/Service/UpdateMerchantServiceRequest.php | Same dynamic validation for update |
| Eager-loaded in | app/Services/BusinessTypeService.php | `getActiveBusinessTypes` and `getBusinessTypeById` load `businessTypeFields.field.fieldValues` |
| Role Permission Seeder | database/seeders/RolePermissionSeeder.php | Defines permissions: `fields.view/create/update/delete` |

## Routes
| Method | URI | Action | Auth | Permission |
|--------|-----|--------|------|------------|
| GET | `/api/v1/fields/active` | `active()` | Public (no auth) | None |
| GET | `/api/v1/fields/all` | `all()` | `auth:api` + verified + onboarded | None |
| GET | `/api/v1/fields` | `index()` | `auth:api` + verified + onboarded | `fields.view` |
| GET | `/api/v1/fields/{field}` | `show()` | `auth:api` + verified + onboarded | `fields.view` |
| POST | `/api/v1/fields` | `store()` | `auth:api` + verified + onboarded | `fields.create` |
| PUT | `/api/v1/fields/{field}` | `update()` | `auth:api` + verified + onboarded | `fields.update` |
| DELETE | `/api/v1/fields/{field}` | `destroy()` | `auth:api` + verified + onboarded | `fields.delete` |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_11_400004_create_fields_table.php |
| Factory | database/factories/FieldFactory.php |
| Seeder | none |

## Tests
| Type | File |
|------|------|
| Feature (CRUD, 22 tests) | tests/Feature/Api/V1/FieldControllerTest.php |

## Permissions
| Permission | Description |
|------------|-------------|
| `fields.view` | List and view individual fields |
| `fields.create` | Create new fields |
| `fields.update` | Update existing fields |
| `fields.delete` | Delete fields |

## QueryBuilder Filters (index endpoint)
- `filter[label]` — partial match on label
- `filter[type]` — exact match on type
- `filter[is_active]` — exact match on is_active
- `filter[search]` — partial match on label (alias)
- `sort` — allowed: id, label, type, sort_order, is_active, created_at (default: sort_order)

## Notes
- `name` is auto-derived from `label` using `Str::slug($label, '_')` (underscore separator, not hyphen); auto-updated when label changes unless explicitly set
- `active` endpoint is public (no auth required) — used for dynamic form rendering
- `all` endpoint returns unpaginated collection ordered by `sort_order` — used for field linker dropdown in BusinessType edit
- FieldValues (options for select/checkbox/radio) are synced via delete-and-recreate when creating/updating a Field with a `values[]` array
- The `config` column is a JSON object whose shape varies by field type; `default_value` is a string for input/select/radio, an array of strings for checkbox
- The `UpdateFieldRequest` dynamically resolves the current field type from the database to apply the correct validation rules for values and config
- No seeder — fields are user-created reference data, not pre-seeded
