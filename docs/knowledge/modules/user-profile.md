# UserProfile Module

## Model
- **Path**: `app/Models/UserProfile.php`
- **Table**: `user_profiles`
- **Fillable**: `user_id`, `first_name`, `last_name`, `bio`, `phone`, `date_of_birth`, `gender`
- **Casts**:
  - `date_of_birth` -> date
- **Relationships**:
  - `user()` -> BelongsTo -> `User`
  - `address()` -> (polymorphic via HasAddress trait) -> `Address`
- **Traits**:
  - `HasAddress` (`app/Traits/HasAddress.php`) -- polymorphic address relationship with `updateOrCreateAddress()`
  - `HasFactory`
  - `InteractsWithMedia` (Spatie Media Library)
- **Scopes**: None
- **Implements**: `HasMedia` (Spatie)
- **Media Collections**:
  - `avatar` -- singleFile, accepts image/jpeg, image/png, image/webp
- **Media Conversions**:
  - `thumb` -- 150x150, sharpen(10), on avatar collection
  - `preview` -- 400x400, on avatar collection
- **Auto-created**: `User::booted()` creates a `UserProfile` automatically on every `User::created` event

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller | `app/Http/Controllers/Api/V1/ProfileController.php` | show, update, uploadAvatar, deleteAvatar, showCustomer, updateCustomer |
| Service Interface | `app/Services/Contracts/ProfileServiceInterface.php` | getProfileByUserId, updateProfile, uploadAvatar, deleteAvatar, getCustomerByUserId, updateCustomerPreferences |
| Service | `app/Services/ProfileService.php` | Implements ProfileServiceInterface; handles profile CRUD, avatar media management, address delegation to HasAddress trait; also handles customer profile preferences |
| Repository Interface | `app/Repositories/Contracts/ProfileRepositoryInterface.php` | Extends BaseRepositoryInterface; adds findByUserId |
| Repository | `app/Repositories/ProfileRepository.php` | Extends BaseRepository; findByUserId eager-loads address with geo relations (region, province, geoCity, barangay) and media |
| DTO | `app/Data/ProfileData.php` | bio, phone, date_of_birth (Carbon with Y-m-d cast), gender, address (AddressData) -- all `string\|Optional\|null` |
| Resource | `app/Http/Resources/Api/V1/ProfileResource.php` | Outputs: id, first_name, last_name, bio, phone, address (AddressResource), avatar (original/thumb/preview URLs), date_of_birth (Y-m-d), gender, timestamps |
| Resource (User) | `app/Http/Resources/Api/V1/UserResource.php` | Embeds ProfileResource via `whenLoaded('profile')`; also flattens first_name, last_name, avatar to top-level user response |
| FormRequest | `app/Http/Requests/Api/V1/Profile/UpdateProfileRequest.php` | bio, phone, date_of_birth, gender, nested address (region_id, province_id, city_id, barangay_id as FK `exists:` rules) |
| FormRequest | `app/Http/Requests/Api/V1/Profile/UploadAvatarRequest.php` | avatar file validated via ImageRule::avatar() static factory |
| FormRequest | `app/Http/Requests/Api/V1/Profile/UpdateCustomerPreferencesRequest.php` | preferred_payment_method, communication_preference |
| Provider Binding | `app/Providers/RepositoryServiceProvider.php` | ProfileRepositoryInterface -> ProfileRepository; ProfileServiceInterface -> ProfileService |

## Routes

All routes are prefixed with `/api/v1` and require `auth:api`, `ensure.verified`, `onboarding` middleware.

| Method | URI | Action |
|--------|-----|--------|
| GET | `profile` | ProfileController@show |
| PUT | `profile` | ProfileController@update |
| POST | `profile/avatar` | ProfileController@uploadAvatar |
| DELETE | `profile/avatar` | ProfileController@deleteAvatar |
| GET | `profile/customer` | ProfileController@showCustomer |
| PUT | `profile/customer` | ProfileController@updateCustomer |

## Database

| Type | File |
|------|------|
| Migration (create) | `database/migrations/2026_01_21_100000_create_user_profiles_table.php` |
| Migration (avatar move) | `database/migrations/2026_01_21_120000_migrate_avatars_to_user_profiles.php` |
| Migration (add first/last name) | `database/migrations/2026_02_12_200001_add_first_last_name_to_user_profiles_table.php` |
| Factory | `database/factories/UserProfileFactory.php` |
| Seeder | -- (profiles auto-created via User booted hook) |

### Factory Definition
Fields: user_id (User::factory), bio, phone, address, city, country, date_of_birth, gender -- all optional/nullable using fake().

## Tests

| Type | File |
|------|------|
| Feature -- Profile CRUD + avatar | `tests/Feature/Api/V1/ProfileControllerTest.php` |
| Feature -- Address integration | `tests/Feature/Api/V1/AddressTest.php` |
| Feature -- Customer self-service | `tests/Feature/Api/V1/CustomerSelfServiceTest.php` |

## Notes
- `UserProfile` is always present for every `User` because the `User::booted()` hook calls `$user->profile()->create()` after each user is created.
- `first_name` and `last_name` live on `user_profiles` but are denormalized onto `users.name` (set as `"{first_name} {last_name}"`) whenever either is updated via `AuthController`, `UserController`, or `MerchantController::store`.
- Address uses the `HasAddress` trait's polymorphic relationship (`addressable_type` / `addressable_id`). Geographic hierarchy is Philippines-specific: Region -> Province -> City -> Barangay via FK columns on the addresses table.
- Avatar uploads go through Spatie Media Library `avatar` collection (single file). `ProfileService::uploadAvatar` calls `addMedia()->toMediaCollection('avatar')` which automatically replaces any existing avatar because the collection is `singleFile()`.
- The `ProfileController` also handles `Customer` profile preferences (`showCustomer`, `updateCustomer`) because the customer profile is accessed in the same authenticated-user context -- it delegates to `ProfileService::getCustomerByUserId` / `updateCustomerPreferences`.
- `ProfileService::updateProfile` processes address data separately from profile fields, delegating to the `HasAddress` trait's `updateOrCreateAddress()` method.
- Pre-existing full-suite memory exhaustion can occur in `ProfileControllerTest` when run alongside all other tests; run it in isolation if needed.
