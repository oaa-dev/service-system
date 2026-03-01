# Region Module

## Model
- **Path**: app/Models/Region.php
- **Table**: regions
- **Fillable**: code, name, region_name, island_group_code, psgc_10_digit_code
- **Casts**: (none)
- **Relationships**:
  - provinces() -> HasMany -> Province
  - cities() -> HasMany -> City
  - barangays() -> HasMany -> Barangay
- **Traits**: (none)
- **Scopes**: (none)

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/GeographicController.php | `regions()` returns all regions ordered by name; no service/repo layer |
| Resource | app/Http/Resources/Api/V1/RegionResource.php | Returns id, code, name, region_name |
| Artisan Command | app/Console/Commands/SeedPsgcData.php | `psgc:seed` upserts from PSGC API (`https://psgc.gitlab.io/api/regions/`) |

## Routes
All geographic routes are public (no authentication required):

| Method | URI | Action |
|--------|-----|--------|
| GET | api/v1/geographic/regions | GeographicController@regions |
| GET | api/v1/geographic/regions/{region}/provinces | GeographicController@provinces |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_10_000001_create_regions_table.php |
| Factory | (none) |
| Seeder | (none -- populated via `php artisan psgc:seed`) |

### Schema Notes
- `code` is unique (PSGC region code, e.g. `130000000` for NCR)
- `region_name` stores the full regional name (e.g. "National Capital Region")
- `island_group_code` identifies Luzon / Visayas / Mindanao grouping
- `psgc_10_digit_code` stores the 10-digit PSGC identifier
- Data sourced from the Philippine Standard Geographic Code (PSGC) public API
- Referenced by Province, City, Barangay, and Address models via `region_id` FK

## Tests
| Type | File |
|------|------|
| (none) | No dedicated test file for geographic endpoints |

### Notes
Region data is seeded via `php artisan psgc:seed` (with optional `--fresh` flag). The GeographicController queries models directly without a Service or Repository layer. Address tests in tests/Feature/Api/V1/AddressTest.php exercise geographic FK references indirectly.
