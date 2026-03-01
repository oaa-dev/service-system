# User Module

## Model
- **Path**: `app/Models/User.php`
- **Table**: `users`
- **Fillable**: `name`, `email`, `password`, `email_verified_at`
- **Hidden**: `password`, `remember_token`
- **Casts**:
  - `email_verified_at` -> datetime
  - `password` -> hashed
- **Relationships**:
  - `profile()` -> HasOne -> `UserProfile`
  - `merchant()` -> HasOne -> `Merchant`
  - `customer()` -> HasOne -> `Customer`
  - `emailVerification()` -> HasOne (latestOfMany) -> `EmailVerification`
  - `conversationsAsUserOne()` -> HasMany -> `Conversation` (user_one_id)
  - `conversationsAsUserTwo()` -> HasMany -> `Conversation` (user_two_id)
  - `conversationParticipants()` -> HasMany -> `ConversationParticipant`
  - `sentMessages()` -> HasMany -> `Message` (sender_id)
- **Traits**:
  - `HasApiTokens` (Laravel Passport)
  - `HasFactory`
  - `HasRoles` (Spatie Permission, guard: api)
  - `InteractsWithMedia` (Spatie Media Library)
  - `Notifiable`
- **Scopes**: None (filtering done via Spatie QueryBuilder in UserService)
- **Implements**: `HasMedia` (Spatie)
- **Media Collections**: `documents`
- **Guard**: `$guard_name = 'api'` (required by Spatie Permission)
- **Booted Hook**: Auto-creates `UserProfile` record on `User::created`
- **Helper Method**: `hasMerchant(): bool` -- checks if a Merchant relationship exists

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller | `app/Http/Controllers/Api/V1/AuthController.php` | register, login, logout, me, updateProfile, verifyOtp, resendOtp, verificationStatus, selectMerchantType |
| Controller | `app/Http/Controllers/Api/V1/UserController.php` | Admin CRUD: index, store, show, update, destroy, syncRoles |
| Service Interface | `app/Services/Contracts/UserServiceInterface.php` | getAllUsers, getUserById, createUser, updateUser, deleteUser, findByEmail, syncRoles |
| Service | `app/Services/UserService.php` | Implements UserServiceInterface; Spatie QueryBuilder filtering on list (name, email, status, search, date range); notifies admins on create |
| Repository Interface | `app/Repositories/Contracts/UserRepositoryInterface.php` | Extends BaseRepositoryInterface; adds findByEmail |
| Repository | `app/Repositories/UserRepository.php` | Extends BaseRepository; findByEmail custom method |
| DTO | `app/Data/UserData.php` | name, email, password, roles -- all `string\|Optional` (roles is `array\|Optional`) |
| Resource | `app/Http/Resources/Api/V1/UserResource.php` | Outputs: id, name, first_name, last_name, email, email_verified_at, avatar, profile (ProfileResource), is_email_verified, has_merchant, merchant (MerchantResource whenLoaded), roles, permissions, timestamps |
| FormRequest | `app/Http/Requests/Api/V1/Auth/RegisterRequest.php` | first_name, last_name, email (unique among verified users), password confirmed, optional role (merchant\|customer) |
| FormRequest | `app/Http/Requests/Api/V1/Auth/LoginRequest.php` | email, password |
| FormRequest | `app/Http/Requests/Api/V1/Auth/UpdateProfileRequest.php` | Auth profile update (first_name, last_name, email, password) |
| FormRequest | `app/Http/Requests/Api/V1/Auth/VerifyOtpRequest.php` | otp: required 6-digit string |
| FormRequest | `app/Http/Requests/Api/V1/Auth/ResendOtpRequest.php` | No extra fields |
| FormRequest | `app/Http/Requests/Api/V1/Auth/SelectMerchantTypeRequest.php` | type (individual\|organization), name -- for merchant profile creation |
| FormRequest | `app/Http/Requests/Api/V1/User/StoreUserRequest.php` | first_name, last_name, email (unique), password, optional roles |
| FormRequest | `app/Http/Requests/Api/V1/User/UpdateUserRequest.php` | All optional; email unique ignoring current user |
| FormRequest | `app/Http/Requests/Api/V1/User/SyncRolesRequest.php` | roles array (existing role names) |
| Notification | `app/Notifications/UserCreatedNotification.php` | Queued; sent to super-admin + admin users on new user creation |
| Provider Binding | `app/Providers/RepositoryServiceProvider.php` | UserRepositoryInterface -> UserRepository; UserServiceInterface -> UserService; EmailVerificationServiceInterface -> EmailVerificationService |

## Routes

All routes are prefixed with `/api/v1`.

| Method | URI | Middleware | Action |
|--------|-----|------------|--------|
| POST | `auth/register` | public | AuthController@register |
| POST | `auth/login` | public | AuthController@login |
| POST | `auth/logout` | auth:api | AuthController@logout |
| GET | `auth/me` | auth:api | AuthController@me |
| PUT | `auth/me` | auth:api, ensure.verified, onboarding | AuthController@updateProfile |
| POST | `auth/verify-otp` | auth:api | AuthController@verifyOtp |
| POST | `auth/resend-otp` | auth:api | AuthController@resendOtp |
| GET | `auth/verification-status` | auth:api | AuthController@verificationStatus |
| POST | `auth/select-merchant-type` | auth:api | AuthController@selectMerchantType |
| GET | `users` | auth:api, ensure.verified, onboarding, permission:users.view | UserController@index |
| GET | `users/{user}` | auth:api, ensure.verified, onboarding, permission:users.view | UserController@show |
| POST | `users` | auth:api, ensure.verified, onboarding, permission:users.create | UserController@store |
| PUT | `users/{user}` | auth:api, ensure.verified, onboarding, permission:users.update | UserController@update |
| POST | `users/{user}/roles` | auth:api, ensure.verified, onboarding, permission:users.update | UserController@syncRoles |
| DELETE | `users/{user}` | auth:api, ensure.verified, onboarding, permission:users.delete | UserController@destroy |

## Database

| Type | File |
|------|------|
| Migration (create) | `database/migrations/0001_01_01_000000_create_users_table.php` |
| Factory | `database/factories/UserFactory.php` |
| Seeder | `database/seeders/UserSeeder.php` |

### Factory States
- `unverified()` -- sets email_verified_at to null

### Seeder Details
Creates 4 users with roles: super-admin (superadmin@example.com), admin (admin@example.com), manager (manager@example.com), user (user@example.com) -- all email-verified.

## Tests

| Type | File |
|------|------|
| Feature -- Auth flows | `tests/Feature/Api/V1/AuthControllerTest.php` |
| Feature -- Admin CRUD | `tests/Feature/Api/V1/UserControllerTest.php` |
| Feature -- OTP verification | `tests/Feature/Api/V1/EmailVerificationTest.php` |
| Feature -- Merchant type selection | `tests/Feature/Api/V1/SelectMerchantTypeTest.php` |

## Notes
- `email` uniqueness on register allows emails that exist but are unverified -- the register flow resends OTP to the existing unverified user instead of creating a duplicate.
- On create, `UserService::createUser` dispatches `UserCreatedNotification` to all super-admin/admin users (queued, `database` channel).
- `register` auto-assigns `merchant` role by default; pass `role=customer` to create a customer account (also auto-creates a `Customer` record).
- `selectMerchantType` is the onboarding step where a merchant user creates their `Merchant` record after verifying their email.
- Passport guard (`auth:api`) is used throughout; Spatie Permission guard is set to `api` via `$guard_name`.
- super-admin bypasses all permission checks via `Gate::before` in `AppServiceProvider`.
- UserResource includes `has_merchant` flag and conditionally loaded `merchant` relation for onboarding flow detection.
- Login automatically sends OTP if email is not yet verified.
- `UserService::getAllUsers` filters: partial name, partial email, status (verified/unverified), search (name+email), created_from/to date range. Sorts: id, name, email, created_at.
