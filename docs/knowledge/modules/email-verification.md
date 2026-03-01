# EmailVerification Module

## Model
- **Path**: `app/Models/EmailVerification.php`
- **Table**: `email_verifications`
- **Fillable**: `user_id`, `otp_hash`, `expires_at`, `attempted_count`, `locked_until`, `last_resent_at`, `verified_at`
- **Casts**:
  - `expires_at` -> datetime
  - `locked_until` -> datetime
  - `last_resent_at` -> datetime
  - `verified_at` -> datetime
- **Relationships**:
  - `user()` -> BelongsTo -> `User`
- **Traits**: None (plain Eloquent Model, `declare(strict_types=1)`)
- **Scopes**: None
- **Helper Methods**:
  - `isExpired(): bool` -- returns true when `expires_at` is in the past
  - `isLocked(): bool` -- returns true when `locked_until` is set and in the future
  - `isVerified(): bool` -- returns true when `verified_at` is not null

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller | `app/Http/Controllers/Api/V1/AuthController.php` | verifyOtp, resendOtp, verificationStatus -- directly queries model in verificationStatus; delegates to service for verify/resend |
| Service Interface | `app/Services/Contracts/EmailVerificationServiceInterface.php` | generateAndSendOtp, verifyOtp, resendOtp, isVerified, cleanupExpired |
| Service | `app/Services/EmailVerificationService.php` | Full OTP lifecycle: generate (SHA-256 hashed), send via OtpMail, verify with timing-safe hash_equals, lockout logic, resend cooldown, expired cleanup |
| FormRequest | `app/Http/Requests/Api/V1/Auth/VerifyOtpRequest.php` | otp: required, string, exactly 6 digits |
| Mail | `app/Mail/OtpMail.php` | Mailable sent via `Mail::to($user->email)->send(new OtpMail($otp, $user->name))` |
| User relationship | `app/Models/User.php` | `emailVerification()` HasOne using `latestOfMany()` |
| Provider Binding | `app/Providers/RepositoryServiceProvider.php` | EmailVerificationServiceInterface -> EmailVerificationService |

## Routes

All routes are prefixed with `/api/v1`. OTP routes require `auth:api` but NOT `ensure.verified` or `onboarding` -- they are placed in the pre-verification tier so unverified users can complete email confirmation.

| Method | URI | Middleware | Action |
|--------|-----|------------|--------|
| POST | `auth/verify-otp` | auth:api | AuthController@verifyOtp |
| POST | `auth/resend-otp` | auth:api | AuthController@resendOtp |
| GET | `auth/verification-status` | auth:api | AuthController@verificationStatus |

## Database

| Type | File |
|------|------|
| Migration (create) | `database/migrations/2026_02_14_000001_create_email_verifications_table.php` |
| Factory | -- (none; records created by EmailVerificationService) |
| Seeder | -- (none) |

## Tests

| Type | File |
|------|------|
| Feature -- OTP verify, resend, lockout, expiry | `tests/Feature/Api/V1/EmailVerificationTest.php` |
| Feature -- Auth flow (register sends OTP) | `tests/Feature/Api/V1/AuthControllerTest.php` |

## OTP Lifecycle
1. **Generate**: `EmailVerificationService::generateAndSendOtp()` deletes all existing unverified records for the user, creates a new record with a SHA-256 hashed 6-digit OTP (`otp_hash`), sets `expires_at = now() + 10 minutes`, and emails the plaintext OTP via `OtpMail`.
2. **Verify**: `verifyOtp()` finds the latest unverified record, checks lockout -> expiry -> hash match (timing-safe `hash_equals`). On success: sets `verified_at = now()` on the record and `email_verified_at = now()` on `User`. On failure: increments `attempted_count`; locks for 30 minutes after 3 failed attempts.
3. **Resend**: `resendOtp()` enforces a 5-minute cooldown via `last_resent_at`, then calls `generateAndSendOtp` (which creates a fresh record, invalidating the previous one).
4. **Cleanup**: `cleanupExpired()` deletes unverified records where `expires_at < now() - 1 day` (callable from a scheduled command).

## Security Constants (in EmailVerificationService)

| Constant | Value | Description |
|----------|-------|-------------|
| OTP_LENGTH | 6 | Digits in the OTP code |
| OTP_EXPIRY_MINUTES | 10 | Minutes until OTP expires |
| RESEND_COOLDOWN_MINUTES | 5 | Minutes between resend requests |
| MAX_ATTEMPTS | 3 | Failed attempts before lockout |
| LOCKOUT_MINUTES | 30 | Minutes of lockout after max attempts |

## Notes
- No repository layer -- the EmailVerificationService works directly with the EmailVerification model (Eloquent queries inline).
- No DTO -- the service accepts primitive arguments (User model, string OTP).
- OTP is stored as a SHA-256 hash (`otp_hash`), never in plaintext. The plaintext OTP is only sent via email.
- The User model has a `emailVerification` relationship using `latestOfMany()` to get the most recent verification record.
- Registration and login flows in AuthController automatically call `generateAndSendOtp` when the user's email is not verified.
- The `verificationStatus` endpoint in AuthController queries EmailVerification directly (not through the service) to return `is_verified`, `can_resend`, `locked_until`, and `expires_at` status.
- The `ensure.verified` middleware blocks access to protected routes until email verification is complete.
- `RegisterRequest` allows an email that already exists in `users` if `email_verified_at IS NULL`. In that case `AuthController::register` resends the OTP instead of creating a duplicate user.
