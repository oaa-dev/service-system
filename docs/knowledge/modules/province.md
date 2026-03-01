# Province Module

## Model
- **Path**: app/Models/Province.php
- **Table**: provinces
- **Fillable**: region_id, code, name, island_group_code, psgc_10_digit_code, is_district
- **Casts**: is_district -> boolean
- **Relationships**:
  - region() -> BelongsTo -> Region
  - cities() -> HasMany -> City
  - barangays() -> HasMany -> Barangay
- **Traits**: (none)
- **Scopes**: (none)

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/GeographicController.php | `provinces(int $region)` returns provinces filtered by region_id, ordered by name |
| Resource | app/Http/Resources/Api/V1/ProvinceResource.php | Returns id, code, name, is_district |
| Trait | app/Traits/HasAddress.php | Looks up Province by `province_id` to auto-populate `state` string column on Address |
| Artisan Command | app/Console/Commands/SeedPsgcData.php | Upserts provinces per region; NCR districts stored as `is_district=true` |

## Routes
All geographic routes are public (no authentication required):

| Method | URI | Action |
|--------|-----|--------|
| GET | api/v1/geographic/regions/{region}/provinces | GeographicController@provinces |
| GET | api/v1/geographic/provinces/{province}/cities | GeographicController@cities |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_10_000002_create_provinces_table.php |
| Factory | (none) |
| Seeder | (none -- populated via `php artisan psgc:seed`) |

### Schema Notes
- `code` is unique (PSGC province/district code)
- `region_id` FK cascades on delete
- `is_district` distinguishes NCR districts from regular provinces; NCR has no provinces, only districts stored with `is_district=true`
- Referenced by City, Barangay, and Address models via `province_id` FK

## Tests
| Type | File |
|------|------|
| (none) | No dedicated test file for geographic endpoints |

### Notes
Province is indirectly exercised through address-related tests in MerchantControllerTest, ProfileControllerTest, and AddressTest. The `HasAddress` trait uses `Province::find()` to resolve the state name when `province_id` is provided.
