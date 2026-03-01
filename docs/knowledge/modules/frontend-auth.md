# Frontend Auth Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(auth)/layout.tsx` | Layout | Split-panel auth layout (brand left, form right) with Cormorant font |
| `frontend/app/(auth)/login/page.tsx` | Page | Login form with email/password, role-based redirect (merchant vs admin) |
| `frontend/app/(auth)/register/page.tsx` | Page | Admin/user registration with first_name, last_name, email, password |
| `frontend/app/(auth)/register/merchant/page.tsx` | Page | Stub page that renders MerchantRegisterForm |
| `frontend/app/(auth)/register/merchant/merchant-register-form.tsx` | Component | Merchant registration form with inline Zod schema, feature checklist |
| `frontend/app/(auth)/onboarding/page.tsx` | Page | Post-registration merchant setup: choose type (individual/organization) + business name |
| `frontend/app/(auth)/verify-email/page.tsx` | Page | OTP verification with 6-digit input, countdown timer, resend functionality |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/authService.ts` | login, register, verifyOtp, resendOtp, selectMerchantType, logout, me |
| Hook | `hooks/useAuth.ts` | useLogin, useRegister, useVerifyOtp, useResendOtp, useSelectMerchantType, useLogout, useMe, useUpdateMe |
| Type | `types/api.ts` | ApiError, User (with roles, has_merchant, email_verified_at, merchant) |
| Store | `stores/authStore.ts` | isAuthenticated, isLoading, user, token; persisted to localStorage |
| Validation | `lib/validations.ts` | loginSchema, registerSchema, verifyOtpSchema, selectMerchantTypeSchema |
| Component | `components/ui/input-otp.tsx` | OTP input component used in verify-email |
| Component | `components/ui/spinner.tsx` | Loading spinner used across auth forms |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- Login redirects: merchant without verified email -> `/verify-email`; merchant without merchant record -> `/onboarding`; merchant with merchant -> `/my-store`; admin/other -> `/dashboard`
- Merchant register form defines its own inline Zod schema (not from `validations.ts`)
- Onboarding page has redirect guards: checks auth, merchant role, email verification, and existing merchant record
- Verify-email page auto-submits on OTP complete (6 digits), has 5-minute countdown timer for resend
