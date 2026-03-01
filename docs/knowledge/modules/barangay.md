# Barangay Module

## Model
- **Path**: app/Models/Barangay.php
- **Table**: barangays
- **Fillable**: city_id, province_id, region_id, code, name, old_name, island_group_code, psgc_10_digit_code
- **Casts**: (none)
- **Relationships**:
  - city() -> BelongsTo -> City
  - province() -> BelongsTo -> Province
  - region() -> BelongsTo -> Region
- **Traits**: (none)
- **Scopes**: (none)

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/GeographicController.php | `barangays(int $city)` returns barangays filtered by city_id, ordered by name |
| Resource | app/Http/Resources/Api/V1/BarangayResource.php | Returns id, code, name |
| Artisan Command | app/Console/Commands/SeedPsgcData.php | Upserts barangays per city in chunks of 500 to manage memory |

## Routes
All geographic routes are public (no authentication required):

| Method | URI | Action |
|--------|-----|--------|
| GET | api/v1/geographic/cities/{city}/barangays | GeographicController@barangays |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_10_000004_create_barangays_table.php |
| Factory | (none) |
| Seeder | (none -- populated via `php artisan psgc:seed`) |

### Schema Notes
- `code` is unique (PSGC barangay code)
- Three FK columns: `city_id`, `province_id`, `region_id` -- all cascadeOnDelete
- `old_name` preserves historical/alternative barangay names from PSGC
- Leaf node in the Philippines geographic hierarchy (Region -> Province -> City -> Barangay)
- Largest table in the geographic set (~42,000+ rows); seeder batches upserts in chunks of 500
- Referenced by Address model via `barangay_id` FK

## Tests
| Type | File |
|------|------|
| (none) | No dedicated test file for geographic endpoints |

### Notes
Barangay is indirectly exercised through address-related tests. The `HasAddress` trait does not auto-populate any string column from `barangay_id` (unlike province_id -> state and city_id -> city). The `AddressResource` returns barangay as a nested `{id, name}` object via `whenLoaded('barangay')`.
