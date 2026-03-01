# City Module

## Model
- **Path**: app/Models/City.php
- **Table**: cities
- **Fillable**: province_id, region_id, code, name, old_name, is_capital, is_city, is_municipality, island_group_code, psgc_10_digit_code
- **Casts**: is_capital -> boolean, is_city -> boolean, is_municipality -> boolean
- **Relationships**:
  - province() -> BelongsTo -> Province
  - region() -> BelongsTo -> Region
  - barangays() -> HasMany -> Barangay
- **Traits**: (none)
- **Scopes**: (none)

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/GeographicController.php | `cities(int $province)` returns cities filtered by province_id, ordered by name |
| Resource | app/Http/Resources/Api/V1/CityResource.php | Returns id, code, name, is_city, is_municipality, is_capital |
| Trait | app/Traits/HasAddress.php | Looks up City by `city_id` to auto-populate `city` string column on Address |
| Service | app/Services/MerchantService.php | Eager loads `address.geoCity` when retrieving merchant |
| Service | app/Services/ProfileService.php | Eager loads `address.geoCity` when retrieving profile |
| Service | app/Services/CustomerService.php | Eager loads `address.geoCity` on user profile when retrieving customer |
| Service | app/Services/StorefrontService.php | Eager loads `address.geoCity` on merchant for storefront display |
| Repository | app/Repositories/ProfileRepository.php | Eager loads `address.geoCity` |
| Artisan Command | app/Console/Commands/SeedPsgcData.php | Upserts cities per province; both cities and municipalities stored in same table |

## Routes
All geographic routes are public (no authentication required):

| Method | URI | Action |
|--------|-----|--------|
| GET | api/v1/geographic/provinces/{province}/cities | GeographicController@cities |
| GET | api/v1/geographic/cities/{city}/barangays | GeographicController@barangays |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_10_000003_create_cities_table.php |
| Factory | (none) |
| Seeder | (none -- populated via `php artisan psgc:seed`) |

### Schema Notes
- `code` is unique (PSGC city/municipality code)
- `province_id` and `region_id` are both FKs (cascadeOnDelete), both indexed
- `is_city` and `is_municipality` are mutually exclusive boolean flags from the PSGC data
- `is_capital` indicates the city is the provincial capital
- `old_name` preserves historical/alternative city names from PSGC
- The relationship in Address is deliberately named `geoCity()` (not `city()`) because the model also has a string attribute `$city` that would shadow an Eloquent relation of the same name
- Referenced by Barangay and Address models via `city_id` FK

## Tests
| Type | File |
|------|------|
| (none) | No dedicated test file for geographic endpoints |

### Notes
City is indirectly exercised through address-related tests. The `HasAddress` trait uses `City::find()` to resolve the city name string when `city_id` is provided. The `AddressResource` returns the `geoCity` relation via `whenLoaded` with a fallback to the string `city` attribute for backward compatibility.
