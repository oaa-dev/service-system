# Geographic Module

## Overview
Cascading geographic data API for the Philippines Standard Geographic Code (PSGC) hierarchy: Region → Province → City/Municipality → Barangay. Provides public endpoints for address form dropdowns. No CRUD — data is pre-seeded.

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller | `app/Http/Controllers/Api/V1/GeographicController.php` | regions, provinces, cities, barangays — direct model queries (no service layer) |
| Model | `app/Models/Region.php` | Top-level geographic entity |
| Model | `app/Models/Province.php` | BelongsTo Region |
| Model | `app/Models/City.php` | BelongsTo Province |
| Model | `app/Models/Barangay.php` | BelongsTo City |
| Resource | `app/Http/Resources/Api/V1/RegionResource.php` | id, psgc_code, name |
| Resource | `app/Http/Resources/Api/V1/ProvinceResource.php` | id, region_id, psgc_code, name |
| Resource | `app/Http/Resources/Api/V1/CityResource.php` | id, province_id, psgc_code, name |
| Resource | `app/Http/Resources/Api/V1/BarangayResource.php` | id, city_id, psgc_code, name |
| Frontend Service | `frontend/services/geographicService.ts` | getRegions, getProvinces, getCities, getBarangays |
| Frontend Hook | `frontend/hooks/useGeographic.ts` | useRegions, useProvinces, useCities, useBarangays (staleTime: Infinity) |
| Frontend Component | `frontend/components/address-form-fields.tsx` | Cascading dropdown: Region→Province→City→Barangay |

## Routes

### Public routes (no auth)

| Method | URI | Action | Notes |
|--------|-----|--------|-------|
| GET | `geographic/regions` | regions | All regions ordered by name |
| GET | `geographic/regions/{region}/provinces` | provinces | Provinces for a region |
| GET | `geographic/provinces/{province}/cities` | cities | Cities for a province |
| GET | `geographic/cities/{city}/barangays` | barangays | Barangays for a city |

## Notes
- No service/repository layer — controller queries models directly (read-only data)
- Frontend hooks use `staleTime: Infinity` since geographic data never changes at runtime
- Used by `AddressFormFields` component in merchant edit, profile edit, and customer portal forms
- Related to `HasAddress` trait which stores FK references (region_id, province_id, city_id, barangay_id) on the polymorphic Address model
- See also: `region.md`, `province.md`, `city.md`, `barangay.md` for individual model details
