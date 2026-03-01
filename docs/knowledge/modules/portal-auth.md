# Portal Auth Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend-customer-portal/app/(auth)/layout.tsx` | Layout | Split-panel auth layout (brand left, form right) with warm marketplace theme |
| `frontend-customer-portal/app/(auth)/login/page.tsx` | Page | Customer login form, redirects to dashboard or verify-email |
| `frontend-customer-portal/app/(auth)/register/page.tsx` | Page | Customer registration with first_name, last_name, email, password |
| `frontend-customer-portal/app/(auth)/verify-email/page.tsx` | Page | OTP verification with 6-digit input, countdown timer, resend |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/authService.ts` | login (with role: 'customer'), register (with role: 'customer'), verifyOtp, resendOtp, logout, me |
| Hook | `hooks/useAuth.ts` | useLogin, useRegister, useVerifyOtp, useResendOtp, useLogout |
| Type | `types/api.ts` | ApiError, User, LoginResponse |
| Store | `stores/authStore.ts` | isAuthenticated, user, token; persisted to localStorage ('customer-auth-storage') |
| Validation | `lib/validations.ts` | loginSchema, registerSchema, verifyOtpSchema |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- Login redirects: unverified email -> `/verify-email`; verified -> `/dashboard`
- Register automatically sends `role: 'customer'` in the API request (auto-creates Customer record on backend)
- Verify-email follows the same OTP pattern as admin frontend (6-digit, 5-minute countdown)
- Auth layout has a warm marketplace theme (gradient mesh background, different from admin's dark theme)
- Portal auth store uses a different localStorage key ('customer-auth-storage') to avoid conflicts with admin
