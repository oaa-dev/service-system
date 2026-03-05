# Auth Module

## Overview
Backend authentication module handling user registration, login, logout, OTP email verification, profile updates, and merchant type selection. Uses Laravel Passport for OAuth2 token management. Frontend auth is split between admin (`frontend/`) and customer portal (`frontend-customer-portal/`).

## Backend Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller | `backend/app/Http/Controllers/Api/V1/AuthController.php` | register, login, logout, me, updateProfile, verifyOtp, resendOtp, verificationStatus, selectMerchantType |
| Service Interface | `backend/app/Services/Contracts/UserServiceInterface.php` | User CRUD operations |
| Service Interface | `backend/app/Services/Contracts/EmailVerificationServiceInterface.php` | OTP generation, verification, resend with cooldown |
| Service Interface | `backend/app/Services/Contracts/MerchantServiceInterface.php` | createMerchantForUser (used by selectMerchantType) |
| FormRequest | `backend/app/Http/Requests/Api/V1/Auth/LoginRequest.php` | email, password validation |
| FormRequest | `backend/app/Http/Requests/Api/V1/Auth/RegisterRequest.php` | first_name, last_name, email, password, password_confirmation, role (optional) |
| FormRequest | `backend/app/Http/Requests/Api/V1/Auth/VerifyOtpRequest.php` | OTP code validation |
| FormRequest | `backend/app/Http/Requests/Api/V1/Auth/SelectMerchantTypeRequest.php` | type, name for merchant profile creation |
| FormRequest | `backend/app/Http/Requests/Api/V1/Auth/UpdateProfileRequest.php` | first_name, last_name, email, password (optional) |
| Resource | `backend/app/Http/Resources/Api/V1/UserResource.php` | Serializes user with profile, roles, merchant, customer |
| Model | `backend/app/Models/EmailVerification.php` | OTP tracking: otp, expires_at, verified_at, locked_until, attempts, last_resent_at |
| Provider Binding | `backend/app/Providers/RepositoryServiceProvider.php` | UserServiceInterface, EmailVerificationServiceInterface bindings |

## Middleware
| Alias | Class | Behavior |
|-------|-------|----------|
| `ensure.verified` | `EnsureEmailIsVerified` | Blocks if `email_verified_at === null` |
| `onboarding` | `EnsureOnboardingComplete` | Only enforced for `merchant`/`branch-merchant` roles; others pass through |
| `merchant.active` | `EnsureActiveMerchant` | Only for `merchant`/`branch-merchant`; admin/super-admin bypass |

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

## Key Backend Behaviors
- **Registration re-attempts:** If an unverified user with same email exists, resends OTP instead of creating duplicate
- **Role-based registration:** `role` param defaults to 'merchant'; 'customer' auto-creates Customer record
- **Login flow:** Auto-sends OTP if email not verified; response includes `requires_verification` boolean
- **OTP security:** Lockout after failed attempts, 5-minute resend cooldown, expiration tracking
- **selectMerchantType:** Only for 'merchant' role users without existing merchant; creates merchant with name + type + contact_email from user
- **Guard:** Spatie Permission uses `'api'` guard — User model sets `$guard_name = 'api'`
- **Super-admin:** Gate::before in AppServiceProvider bypasses all permission checks

## Roles and Permissions
| Role | Description |
|------|-------------|
| super-admin | Bypasses all permission checks via Gate::before |
| admin | Full platform management |
| manager | Limited platform management |
| merchant | Merchant self-service |
| branch-merchant | Branch merchant (inherits from parent) |
| user | Regular registered user |
| customer | Customer portal user (auto-created with Customer record) |

Default registration role is `merchant`. Passing `role=customer` creates a Customer record automatically.

## Admin Frontend Auth (frontend/)
| Category | File | Notes |
|----------|------|-------|
| Layout | `frontend/app/(auth)/layout.tsx` | Split-panel auth layout with Cormorant font |
| Login page | `frontend/app/(auth)/login/page.tsx` | Redirects based on role and verification status |
| Register page | `frontend/app/(auth)/register/page.tsx` | Standard registration form |
| Merchant register | `frontend/app/(auth)/register/merchant/page.tsx` | Merchant-specific registration |
| Onboarding | `frontend/app/(auth)/onboarding/page.tsx` | Post-registration: select merchant type + business name |
| Verify email | `frontend/app/(auth)/verify-email/page.tsx` | 6-digit OTP, countdown timer, resend |
| Service | `frontend/services/authService.ts` | login, register, verifyOtp, resendOtp, selectMerchantType, logout, me |
| Hook | `frontend/hooks/useAuth.ts` | useLogin, useRegister, useVerifyOtp, useResendOtp, useSelectMerchantType, useLogout, useMe |
| Auth store | `frontend/stores/authStore.ts` | Persisted to localStorage ('auth-storage'); hasRole(), hasPermission(), isMerchantUser() helpers |

**Login redirect logic (admin):**
- Unverified email → `/verify-email`
- Verified merchant without merchant record → `/onboarding`
- Verified merchant with merchant → `/my-store`
- Admin/other → `/dashboard`

## Customer Portal Auth (frontend-customer-portal/)
| Category | File | Notes |
|----------|------|-------|
| Layout | `frontend-customer-portal/app/(auth)/layout.tsx` | Warm marketplace theme split-panel |
| Login page | `frontend-customer-portal/app/(auth)/login/page.tsx` | Sends `role: 'customer'` implicitly |
| Register page | `frontend-customer-portal/app/(auth)/register/page.tsx` | Sends `role: 'customer'` to auto-create Customer record |
| Verify email | `frontend-customer-portal/app/(auth)/verify-email/page.tsx` | 6-digit OTP, 5-minute countdown, resend |
| Service | `frontend-customer-portal/services/authService.ts` | Same endpoints; always passes `role: 'customer'` |
| Hook | `frontend-customer-portal/hooks/useAuth.ts` | useLogin, useRegister, useVerifyOtp, useResendOtp, useLogout |
| Auth store | `frontend-customer-portal/stores/authStore.ts` | Persisted to localStorage ('customer-auth-storage'); separate from admin store |

**Customer portal auth guard:** The `(customer)` layout uses `useEffect` redirect (not middleware) — checks `isAuthenticated` and redirects to `/login` if not.

## Profile Management
Profile endpoints are under `/profile` (not `/auth`):

| Method | URI | Action |
|--------|-----|--------|
| GET | `profile` | show profile with UserProfile |
| PUT | `profile` | update profile fields |
| PUT | `profile/password` | change password |
| POST | `profile/avatar` | upload avatar (Spatie Media Library) |
| DELETE | `profile/avatar` | delete avatar |
| GET | `profile/customer` | get Customer record |
| PUT | `profile/customer` | update Customer record |

Admin frontend profile: `frontend/app/(system)/(profile)/profile/page.tsx`
Customer portal profile: `frontend-customer-portal/app/(customer)/profile/page.tsx`

## Tests
| Type | File |
|------|------|
| Feature (backend) | `backend/tests/Feature/Api/V1/AuthControllerTest.php` |
| Feature (OTP verification) | `backend/tests/Feature/Api/V1/SelectMerchantTypeTest.php` |
