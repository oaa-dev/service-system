# Address Module

## Model
- **Path**: app/Models/Address.php
- **Table**: addresses
- **Fillable**: street, city, state, postal_code, country, region_id, province_id, city_id, barangay_id
- **Casts**: (none)
- **Relationships**:
  - addressable() -> MorphTo -> polymorphic owner (UserProfile, Merchant)
  - region() -> BelongsTo -> Region
  - province() -> BelongsTo -> Province
  - geoCity() -> BelongsTo -> City (FK: city_id; named to avoid collision with `city` string attribute)
  - barangay() -> BelongsTo -> Barangay
- **Traits**: HasFactory
- **Scopes**: (none)

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Trait | app/Traits/HasAddress.php | Adds `address()` morphOne, `updateOrCreateAddress()`, `deleteAddress()`, `hasAddress()` to models |
| DTO | app/Data/AddressData.php | All fields `string|Optional|null` or `int|Optional|null` |
| Resource | app/Http/Resources/Api/V1/AddressResource.php | Returns street, postal_code, region/province/city/barangay as nested id+name objects via `whenLoaded`; city falls back to string |
| FormRequest | app/Http/Requests/Api/V1/Merchant/UpdateMerchantRequest.php | Validates `address.region_id` etc. with `exists:regions,id` |
| FormRequest | app/Http/Requests/Api/V1/Profile/UpdateProfileRequest.php | Validates `address.region_id` etc. with `exists:regions,id` |
| FormRequest | app/Http/Requests/Api/V1/Customer/UpdateCustomerProfileRequest.php | Validates `address.region_id` etc. with `exists:regions,id` |
| Service | app/Services/MerchantService.php | Calls `updateOrCreateAddress()` on merchant after update |
| Service | app/Services/ProfileService.php | Calls `updateOrCreateAddress()` on profile; eager loads address with geo relations |
| Service | app/Services/CustomerService.php | Eager loads address with geo relations via user.profile.address chain |
| Service | app/Services/StorefrontService.php | Eager loads `address.geoCity` on merchant for storefront display |
| Repository | app/Repositories/ProfileRepository.php | Eager loads address.region/province/geoCity/barangay |

### Models Using HasAddress Trait
- app/Models/UserProfile.php
- app/Models/Merchant.php

## Routes
Address has no dedicated CRUD routes. It is managed as a nested payload (`address.*`) within parent resource update endpoints:

| Method | URI | Action |
|--------|-----|--------|
| PUT | api/v1/merchants/{merchant} | MerchantController@update (includes address) |
| PUT | api/v1/auth/merchant | MyMerchantController@update (includes address) |
| PUT | api/v1/profile | ProfileController@update (includes address) |
| PUT | api/v1/customers/{customer}/profile | CustomerController@updateProfile (includes address) |

## Database
| Type | File |
|------|------|
| Migration (create) | database/migrations/2026_01_21_110000_create_addresses_table.php |
| Migration (add geo FKs) | database/migrations/2026_02_10_100000_add_geographic_fks_to_addresses_table.php |
| Factory | database/factories/AddressFactory.php |
| Seeder | (none) |

### Schema Notes
- Polymorphic morph columns: `addressable_type`, `addressable_id` (unique pair -- one address per owner)
- Legacy string columns: `city`, `state`, `country` -- auto-populated by `HasAddress::updateOrCreateAddress()` from FK lookups
- Geographic FK columns: `region_id`, `province_id`, `city_id`, `barangay_id` -- all nullable, nullOnDelete

## Tests
| Type | File |
|------|------|
| Feature | tests/Feature/Api/V1/AddressTest.php |
| Feature (merchant address) | tests/Feature/Api/V1/MerchantControllerTest.php |
| Feature (profile address) | tests/Feature/Api/V1/ProfileControllerTest.php |
| Feature (my merchant address) | tests/Feature/Api/V1/MyMerchantControllerTest.php |
| Feature (branch address) | tests/Feature/Api/V1/MyMerchantBranchTest.php |
| Feature (onboarding address) | tests/Feature/Api/V1/OnboardingChecklistTest.php |
