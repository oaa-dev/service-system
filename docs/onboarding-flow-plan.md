# Post-Registration Onboarding Flow — Implementation Plan

## Overview

Complete flow: **Register → Email OTP Verification → Merchant Type Selection → Dashboard**

All registered users get the `merchant` role. Users cannot access the dashboard until they:
1. Verify their email via 6-digit OTP (10-min expiry, 5-min resend cooldown, 3-attempt lockout)
2. Select merchant type (Individual or Organization) which creates their merchant profile

---

## Phase 1: Backend — Email OTP Verification

### New Files (10)

| # | File | Purpose |
|---|------|---------|
| 1 | `backend/database/migrations/2026_02_13_100001_create_email_verifications_table.php` | Migration: user_id FK, otp_hash(64), expires_at, attempted_count, locked_until, last_resent_at, verified_at |
| 2 | `backend/app/Models/EmailVerification.php` | Model with isExpired(), isLocked(), isVerified() helpers, casts for datetime fields |
| 3 | `backend/app/Mail/OtpMail.php` | Mailable: subject "Your Email Verification Code", accepts $otp + $userName |
| 4 | `backend/resources/views/emails/otp-verification.blade.php` | Blade template: large centered OTP digits, expiry notice |
| 5 | `backend/app/Services/Contracts/EmailVerificationServiceInterface.php` | Interface: generateAndSendOtp, verifyOtp, resendOtp, isVerified, cleanupExpired |
| 6 | `backend/app/Services/EmailVerificationService.php` | Implementation with SHA-256 hashing, hash_equals() comparison, cooldown/lockout logic |
| 7 | `backend/app/Http/Requests/Api/V1/Auth/VerifyOtpRequest.php` | Validation: otp required, string, size:6, regex:/^\d{6}$/ |
| 8 | `backend/app/Http/Requests/Api/V1/Auth/ResendOtpRequest.php` | Empty rules (user from auth token) |
| 9 | `backend/app/Http/Middleware/EnsureEmailIsVerified.php` | Returns 403 JSON if email_verified_at is null |
| 10 | `backend/tests/Feature/Api/V1/EmailVerificationTest.php` | ~18 Pest tests |

### Modified Files (6)

| # | File | Change |
|---|------|--------|
| 1 | `backend/app/Models/User.php` | Add `emailVerification()` HasOne with latestOfMany() |
| 2 | `backend/app/Http/Controllers/Api/V1/AuthController.php` | Add EmailVerificationService dep, 3 new methods (verifyOtp, resendOtp, verificationStatus), modify register() to send OTP, modify login() to return requires_verification flag |
| 3 | `backend/routes/api.php` | Add 3 routes, restructure into verified/unverified groups |
| 4 | `backend/app/Providers/RepositoryServiceProvider.php` | Bind EmailVerificationServiceInterface → EmailVerificationService |
| 5 | `backend/bootstrap/app.php` | Register `ensure.verified` middleware alias |
| 6 | `backend/tests/Feature/Api/V1/AuthControllerTest.php` | Add Mail::fake() to registration test |

### Service Constants
```
OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
RESEND_COOLDOWN_MINUTES = 5
MAX_ATTEMPTS = 3
LOCKOUT_MINUTES = 30
```

### API Endpoints
```
POST /api/v1/auth/verify-otp          — body: { otp: "123456" } → verifies OTP, sets email_verified_at
POST /api/v1/auth/resend-otp          — no body → generates new OTP, sends email (5-min cooldown)
GET  /api/v1/auth/verification-status — returns: is_verified, can_resend, locked_until, expires_at
```

### Route Restructuring
```
auth:api middleware group
├── No verification required:
│   ├── POST auth/logout
│   ├── GET  auth/me
│   ├── POST auth/verify-otp
│   ├── POST auth/resend-otp
│   ├── GET  auth/verification-status
│   └── POST auth/select-merchant-type
│
└── ensure.verified + onboarding middleware:
    └── All existing protected routes (merchants, services, etc.)
```

### Test Coverage (~18 tests)
- Verify: valid OTP, invalid OTP, expired OTP, lockout after 3 failures, locked state, format validation, already verified, auth required
- Resend: success, 5-min cooldown enforced, cooldown expired allows resend, already verified rejected, auth required
- Status: verified user, unverified user with metadata, auth required
- Middleware: blocks unverified, allows verified, allows auth endpoints for unverified
- Integration: register sends OTP email

---

## Phase 2: Backend — Merchant Type Selection + Role

### New Files (3)

| # | File | Purpose |
|---|------|---------|
| 1 | `backend/app/Http/Requests/Api/V1/Auth/SelectMerchantTypeRequest.php` | Validation: type required + in:individual,organization; name required + max:255 |
| 2 | `backend/app/Http/Middleware/EnsureOnboardingComplete.php` | Returns 403 JSON with onboarding_step if no merchant; admin/super-admin bypass |
| 3 | `backend/tests/Feature/Api/V1/SelectMerchantTypeTest.php` | ~12 Pest tests |

### Modified Files (7)

| # | File | Change |
|---|------|--------|
| 1 | `backend/database/seeders/RolePermissionSeeder.php` | Add `merchant` role with permissions: profile.view/update, merchants.view/update, service_categories.*, services.*, bookings.view/create/update_status, reservations.*, service_orders.*, customers.view |
| 2 | `backend/app/Http/Controllers/Api/V1/AuthController.php` | Add MerchantService dep, `selectMerchantType()` method, change role from 'user' to 'merchant', eager-load merchant relation in me/login/register |
| 3 | `backend/app/Models/User.php` | Add `hasMerchant()` helper method |
| 4 | `backend/app/Http/Resources/Api/V1/UserResource.php` | Add `has_merchant` boolean + `merchant` whenLoaded + `is_email_verified` boolean |
| 5 | `backend/bootstrap/app.php` | Register `onboarding` middleware alias |
| 6 | `backend/routes/api.php` | Add POST auth/select-merchant-type route, wrap protected routes with onboarding middleware |
| 7 | `backend/tests/Feature/Api/V1/AuthControllerTest.php` | Verify merchant role assignment, has_merchant in response |

### API Endpoint
```
POST /api/v1/auth/select-merchant-type — body: { type: "individual"|"organization", name: "My Business" }
  → Creates merchant (status=pending, contact_email=user.email)
  → Returns { user: UserResource, merchant: MerchantResource }
```

### Onboarding Middleware Logic
```
1. If user has role super-admin or admin → pass through (bypass)
2. If email_verified_at is null → 403 { onboarding_step: "email_verification" }
3. If user has no merchant → 403 { onboarding_step: "merchant_type_selection" }
4. Otherwise → pass through
```

### Test Coverage (~12 tests)
- Select type: individual success, organization success, cannot duplicate, type required, type enum, name required, auth required
- Middleware: blocks without merchant, allows with merchant, admin bypass, auth/me accessible, select-merchant-type accessible
- Registration: assigns merchant role (not user)

---

## Phase 3: Frontend — Email OTP Verification Page

### New Files (1)

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/app/(auth)/verify-email/page.tsx` | OTP verification page with 6-digit input, countdown timer, resend button |

### Modified Files (6)

| # | File | Change |
|---|------|--------|
| 1 | `frontend/types/api.ts` | Add VerifyOtpRequest, ResendOtpResponse, VerificationStatusResponse interfaces |
| 2 | `frontend/lib/validations.ts` | Add verifyOtpSchema (string, length 6, regex digits) |
| 3 | `frontend/services/authService.ts` | Add verifyOtp(), resendOtp(), getVerificationStatus() methods |
| 4 | `frontend/hooks/useAuth.ts` | Add useVerifyOtp, useResendOtp, useVerificationStatus hooks |
| 5 | `frontend/app/(auth)/register/page.tsx` | Change redirect from /dashboard to /verify-email |
| 6 | `frontend/app/(auth)/register/merchant/merchant-register-form.tsx` | Change redirect from /dashboard to /verify-email |

### Verify Email Page UX
- Uses existing `InputOTP` shadcn component (already installed: input-otp v1.4.2)
- 6 slots in two groups of 3 with separator: `[_ _ _] - [_ _ _]`
- Auto-submit when 6th digit entered (onComplete callback)
- Countdown timer in MM:SS format (initialized from API's retry_after)
- Resend button disabled during cooldown, shows spinner when sending
- Masked email display: `j***@gmail.com`
- Error states: wrong OTP, expired, locked out (with remaining attempts warning)
- Redirect guards: unauthenticated → /login, already verified → /onboarding or /dashboard

---

## Phase 4: Frontend — Merchant Type Selection + Guards

### New Files (1)

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/app/(auth)/onboarding/page.tsx` | Two-card selection: Individual (User icon) vs Organization (Building2 icon) + optional name input |

### Modified Files (6)

| # | File | Change |
|---|------|--------|
| 1 | `frontend/types/api.ts` | Add MerchantType, SelectMerchantTypeRequest, has_merchant to User interface |
| 2 | `frontend/lib/validations.ts` | Add selectMerchantTypeSchema (type enum + optional name) |
| 3 | `frontend/services/authService.ts` | Add selectMerchantType() method |
| 4 | `frontend/hooks/useAuth.ts` | Add useSelectMerchantType mutation hook |
| 5 | `frontend/app/(auth)/login/page.tsx` | Update onSuccess: check email_verified_at → /verify-email, has_merchant → /onboarding, else → /dashboard |
| 6 | `frontend/app/(system)/layout.tsx` | Add onboarding guard: check email_verified_at and has_merchant, redirect accordingly; admin/super-admin bypass |

### Onboarding Page UX
- Two large clickable cards side-by-side (max-w-lg):
  - **Individual**: User icon, "I'm a sole proprietor or freelancer"
  - **Organization**: Building2 icon, "I represent a company or business"
- Selected card: primary border + bg-primary/5 + ring + Check icon
- Optional "Business name" text input below cards
- "Continue to Dashboard" button (disabled until type selected)
- Cannot dismiss or navigate away
- On success: invalidate ['auth', 'me'] query → router.push('/dashboard')

### System Layout Guard Logic
```typescript
// In (system)/layout.tsx useEffect:
if (!isLoading && !isAuthenticated) → /login
if (isAuthenticated && user) {
  if (admin/super-admin role) → pass through
  if (!email_verified_at) → /verify-email
  if (has_merchant === false) → /onboarding
}
```

---

## Implementation Order (Build Sequence)

### Phase 1: Backend OTP (9 steps)
1. Migration (email_verifications table)
2. EmailVerification model
3. User model → add emailVerification() relationship
4. OtpMail mailable + blade template
5. EmailVerificationService interface + implementation
6. RepositoryServiceProvider binding
7. FormRequests (VerifyOtpRequest, ResendOtpRequest)
8. EnsureEmailIsVerified middleware + bootstrap registration
9. AuthController modifications + route additions

### Phase 2: Backend Merchant Type (7 steps)
10. RolePermissionSeeder → add merchant role
11. User model → add hasMerchant()
12. UserResource → add has_merchant, merchant, is_email_verified
13. SelectMerchantTypeRequest
14. EnsureOnboardingComplete middleware + bootstrap registration
15. AuthController → add selectMerchantType(), change role assignment, inject MerchantService
16. Route restructuring (verified/unverified + onboarding groups)

### Phase 3: Backend Tests (2 steps)
17. EmailVerificationTest.php (~18 tests)
18. SelectMerchantTypeTest.php (~12 tests)

### Phase 4: Frontend OTP (7 steps)
19. Types in api.ts (OTP interfaces)
20. Zod schema (verifyOtpSchema)
21. authService methods (verifyOtp, resendOtp, getVerificationStatus)
22. useAuth hooks (useVerifyOtp, useResendOtp, useVerificationStatus)
23. /verify-email page
24. Register page redirect change
25. Merchant register form redirect change

### Phase 5: Frontend Onboarding (7 steps)
26. Types in api.ts (MerchantType, SelectMerchantTypeRequest, has_merchant on User)
27. Zod schema (selectMerchantTypeSchema)
28. authService method (selectMerchantType)
29. useAuth hook (useSelectMerchantType)
30. /onboarding page
31. Login page redirect update
32. System layout guard update

---

## Total File Count

| Category | New | Modified | Total |
|----------|-----|----------|-------|
| Backend Phase 1 (OTP) | 10 | 6 | 16 |
| Backend Phase 2 (Merchant Type) | 3 | 7 | 10 |
| Frontend Phase 3 (OTP Page) | 1 | 6 | 7 |
| Frontend Phase 4 (Onboarding) | 1 | 6 | 7 |
| **Total** | **15** | **25** | **40** |

Note: Some files are modified in multiple phases (AuthController, routes/api.php, types/api.ts, etc.) — counted once per phase but changes are cumulative.

**Estimated test count: ~30 new backend tests**
