# BusinessTypeFieldValue Module

## Model
- **Path**: app/Models/BusinessTypeFieldValue.php
- **Table**: `business_type_field_values`
- **Fillable**: `service_id`, `business_type_field_id`, `field_value_id`, `value`
- **Casts**: none
- **Relationships**:
  - `service()` → BelongsTo → Service
  - `businessTypeField()` → BelongsTo → BusinessTypeField
  - `fieldValue()` → BelongsTo → FieldValue (nullable; null when the parent field type is `input`)
- **Traits**: none
- **Scopes**: none
- **Factory**: none

## Purpose
The third table in the EAV (Entity-Attribute-Value) system. Stores the actual runtime value of a custom field for a specific service:

- For `select` / `radio` fields: `field_value_id` points to the chosen `FieldValue`; `value` may be null.
- For `checkbox` fields: one row per selected option, each with a `field_value_id`.
- For `input` fields: `field_value_id` is null; `value` holds the free-text or numeric string.

The combination of `service_id` + `business_type_field_id` identifies which service attribute is being stored.

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Model | app/Models/BusinessTypeFieldValue.php | Core model |
| Resource | app/Http/Resources/Api/V1/BusinessTypeFieldValueResource.php | Returns id, service_id, business_type_field_id, field_value_id, value; `whenLoaded` fieldValue + businessTypeField |
| Referenced in Model | app/Models/Service.php | Has `customFieldValues()` HasMany → BusinessTypeFieldValue |
| Referenced in Service | app/Services/MerchantService.php | `syncCustomFieldValues()`: deletes all rows for a service then re-creates per-field per-value |
| Referenced in Resource | app/Http/Resources/Api/V1/ServiceResource.php | `custom_fields` key — BusinessTypeFieldValueResource::collection(whenLoaded customFieldValues) |
| Eager-loaded in | app/Services/MerchantService.php | `getMerchantServiceById`, `createMerchantService`, `updateMerchantService` all load `customFieldValues.businessTypeField.field` + `customFieldValues.fieldValue` |

## Routes
BusinessTypeFieldValue records are never addressed directly via API routes. They are written via the Service create/update endpoints and read as embedded `custom_fields` in the ServiceResource response.

| Method | URI | Notes |
|--------|-----|-------|
| POST | `/api/v1/merchants/{merchant}/services` | Creates service + custom field values |
| PUT | `/api/v1/merchants/{merchant}/services/{service}` | Updates service + re-syncs custom field values |
| GET | `/api/v1/merchants/{merchant}/services/{service}` | Includes `custom_fields` in response |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_11_400007_create_business_type_field_values_table.php |
| Factory | none |
| Seeder | none |

## Tests
| Type | File |
|------|------|
| Feature (Service custom fields) | tests/Feature/Api/V1/BusinessTypeFieldsTest.php |
| Integration (merchant services) | tests/Feature/Api/V1/MerchantServiceControllerTest.php |

## Notes
- No dedicated controller, service, repository, or DTO — records are fully managed by `MerchantService.syncCustomFieldValues()` via Service create/update
- The sync strategy is delete-and-recreate: all existing rows for the service are removed and new ones created from the input
- For `input` type fields, `field_value_id` is null and `value` stores the free-text answer
- For `select`/`radio`/`checkbox` type fields, `field_value_id` references the chosen option from `FieldValue`
- Checkbox fields produce multiple rows (one per selected option) for the same `business_type_field_id`
