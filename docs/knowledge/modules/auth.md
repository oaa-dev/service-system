# Auth Module

## Overview
Backend authentication module handling user registration, login, logout, OTP email verification, profile updates, and merchant type selection. Uses Laravel Passport for OAuth2 token management.

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller | `app/Http/Controllers/Api/V1/AuthController.php` | register, login, logout, me, updateProfile, verifyOtp, resendOtp, verificationStatus, selectMerchantType |
| Service Interface | `app/Services/Contracts/UserServiceInterface.php` | User CRUD operations |
| Service Interface | `app/Services/Contracts/EmailVerificationServiceInterface.php` | OTP generation, verification, resend with cooldown |
| Service Interface | `app/Services/Contracts/MerchantServiceInterface.php` | createMerchantForUser (used by selectMerchantType) |
| FormRequest | `app/Http/Requests/Api/V1/Auth/LoginRequest.php` | email, password validation |
| FormRequest | `app/Http/Requests/Api/V1/Auth/RegisterRequest.php` | first_name, last_name, email, password, password_confirmation, role (optional) |
| FormRequest | `app/Http/Requests/Api/V1/Auth/VerifyOtpRequest.php` | OTP code validation |
| FormRequest | `app/Http/Requests/Api/V1/Auth/SelectMerchantTypeRequest.php` | type, name for merchant profile creation |
| FormRequest | `app/Http/Requests/Api/V1/Auth/UpdateProfileRequest.php` | first_name, last_name, email, password (optional) |
| Resource | `app/Http/Resources/Api/V1/UserResource.php` | Serializes user with profile, roles, merchant |
| Model | `app/Models/EmailVerification.php` | OTP tracking: otp, expires_at, verified_at, locked_until, attempts, last_resent_at |
| Provider Binding | `app/Providers/RepositoryServiceProvider.php` | UserServiceInterface, EmailVerificationServiceInterface bindings |

## Routes

### Public routes (no auth)

| Method | URI | Action | Notes |
|--------|-----|--------|-------|
| POST | `auth/register` | register | Creates user, assigns role (merchant\|customer), sends OTP |
| POST | `auth/login` | login | Returns token + requires_verification flag |

### Auth-only routes (auth:api)

| Method | URI | Action | Notes |
|--------|-----|--------|-------|
| POST | `auth/logout` | logout | Revokes current token |
| GET | `auth/me` | me | Returns user with profile, roles, merchant, customer |
| POST | `auth/verify-otp` | verifyOtp | Verifies 6-digit OTP code |
| POST | `auth/resend-otp` | resendOtp | Resends OTP (5-min cooldown) |
| GET | `auth/verification-status` | verificationStatus | Returns is_verified, can_resend, locked_until, expires_at |
| POST | `auth/select-merchant-type` | selectMerchantType | Creates merchant profile (merchant role only, one-time) |

### Auth + verified + onboarded routes

| Method | URI | Action | Notes |
|--------|-----|--------|-------|
| PUT | `auth/me` | updateProfile | Updates user name, email, password, profile first/last name |

## Key Behaviors

- **Registration re-attempts:** If an unverified user with same email exists, resends OTP instead of creating duplicate
- **Role-based registration:** `role` param defaults to 'merchant'; 'customer' auto-creates Customer record
- **Login flow:** Auto-sends OTP if email not verified; response includes `requires_verification` boolean
- **OTP security:** Lockout after failed attempts, 5-minute resend cooldown, expiration tracking
- **selectMerchantType:** Only for 'merchant' role users without existing merchant; creates merchant with name + type + contact_email from user

## Tests

| Type | File |
|------|------|
| Feature | `tests/Feature/Api/V1/AuthControllerTest.php` |
