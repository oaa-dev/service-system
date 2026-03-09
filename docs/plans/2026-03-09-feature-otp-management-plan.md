# Plan: OTP Management (Super Admin)

**Date:** 2026-03-09
**Type:** feature
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- EmailVerification model already has all needed fields: `user_id`, `otp_hash`, `expires_at`, `attempted_count`, `locked_until`, `last_resent_at`, `verified_at`
- OTP stored as SHA-256 hash — never expose plaintext in admin UI
- Helper methods: `isExpired()`, `isLocked()`, `isVerified()`
- User model has `emailVerification()` HasOne with `latestOfMany()`
- Old unverified records deleted on resend — table keeps latest per user + verified records

### Known Gotchas
- Permission flags must match between frontend and backend (documented authorization mismatch pattern)
- EmailVerification has no repository layer — service works directly with Eloquent
- `cleanupExpired()` deletes records older than 1 day — admin page will only show recent records

### Critical Patterns Applied
- Service-Repository pattern (though this is read-only, so no repository needed)
- Spatie QueryBuilder for filtering/sorting
- PermissionGate for frontend visibility
- Sidebar permission gating

## Overview

Read-only admin page for super admins to view OTP verification requests. Displays user details, OTP status (pending/verified/expired/locked), timestamps, and attempt counts. Includes optional admin actions: manually verify a user and unlock a locked account.

## Implementation Steps

### Step 1: Add permission to seeder
- **Files:** `backend/database/seeders/RolePermissionSeeder.php`
- **Details:**
  - Add `'otp_management' => ['otp_management.view']` to permissions array
  - Add `'otp_management.view'` to admin role permissions
  - Super-admin gets it automatically via Gate::before bypass

### Step 2: Create OtpManagementResource
- **Files:** `backend/app/Http/Resources/Api/V1/OtpManagementResource.php`
- **Details:**
  - Fields: `id`, `user` (nested: id, name, email, email_verified_at), `status` (computed), `expires_at`, `attempted_count`, `locked_until`, `last_resent_at`, `verified_at`, `created_at`
  - Computed `status` field: check `isVerified()` → "verified", `isLocked()` → "locked", `isExpired()` → "expired", else → "pending"
  - Never expose `otp_hash`

### Step 3: Create OtpManagementController
- **Files:** `backend/app/Http/Controllers/Api/V1/OtpManagementController.php`
- **Details:**
  - `index()` — Paginated list with Spatie QueryBuilder
    - Filters: `status` (custom callback for computed status), `search` (partial user email/name), `created_from`/`created_to` date range
    - Sorts: `created_at`, `expires_at`, `verified_at`
    - Default sort: `-created_at`
    - Eager load: `user`
  - `show(int $id)` — Single record detail
  - `verifyUser(int $id)` — Manually verify: set `verified_at` on record + `email_verified_at` on user
  - `unlockUser(int $id)` — Clear `locked_until` and reset `attempted_count`

### Step 4: Add routes
- **Files:** `backend/routes/api.php`
- **Details:**
  - Inside auth + verified + onboarded middleware group:
  ```
  Route::prefix('otp-management')->middleware('permission:otp_management.view')->group(function () {
      Route::get('/', [OtpManagementController::class, 'index']);
      Route::get('/{emailVerification}', [OtpManagementController::class, 'show']);
      Route::post('/{emailVerification}/verify', [OtpManagementController::class, 'verifyUser']);
      Route::post('/{emailVerification}/unlock', [OtpManagementController::class, 'unlockUser']);
  });
  ```

### Step 5: Backend tests
- **Files:** `backend/tests/Feature/Api/V1/OtpManagementControllerTest.php`
- **Details:**
  - Unauthenticated → 401
  - Non-admin (merchant role) → 403
  - Admin can list OTP records with pagination
  - Filter by status (verified, pending, expired, locked)
  - Filter by user email search
  - Filter by date range
  - Show single record
  - Verify user action: sets verified_at + email_verified_at
  - Unlock user action: clears locked_until + resets attempted_count
  - Cannot verify already-verified record (422)
  - Cannot unlock non-locked record (422)

### Step 6: Frontend types
- **Files:** `frontend/types/api.ts`
- **Details:**
  - Add `OtpVerification` interface: `id`, `user` (nested UserSummary), `status`, `expires_at`, `attempted_count`, `locked_until`, `last_resent_at`, `verified_at`, `created_at`
  - Add `OtpVerificationQueryParams` interface

### Step 7: Frontend service + hook
- **Files:** `frontend/services/otpManagementService.ts`, `frontend/hooks/useOtpManagement.ts`
- **Details:**
  - Service: `getAll(params)`, `getById(id)`, `verifyUser(id)`, `unlockUser(id)`
  - Hooks: `useOtpVerifications(params)`, `useVerifyUser()`, `useUnlockUser()`

### Step 8: Frontend page
- **Files:** `frontend/app/(system)/(settings)/otp-management/page.tsx`
- **Details:**
  - Follow payment-methods page pattern (read-only list with filters)
  - Table columns: User (name + email), Status (badge), Requested, Expires, Attempts, Actions
  - Status badges: pending (amber), verified (emerald), expired (gray), locked (red)
  - Filters: status dropdown, email search, date range
  - Actions dropdown: "Verify User" (if pending/expired), "Unlock" (if locked)
  - Confirmation dialog for verify/unlock actions

### Step 9: Add to sidebar
- **Files:** `frontend/components/layout/app-sidebar.tsx`
- **Details:**
  - Add to `settingsItems` array:
  ```ts
  {
    title: 'OTP Management',
    href: '/otp-management',
    icon: KeyRound, // from lucide-react
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    permission: 'otp_management.view',
  }
  ```

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Status filter on computed field is complex | Medium | Use callback filter with raw SQL conditions |
| OTP records are short-lived (cleanup deletes old ones) | Low | This is fine — admins only need recent records |
| Exposing OTP hash accidentally | Low | Resource explicitly excludes otp_hash field |

## Testing Strategy

- [ ] 12+ backend tests covering auth, permissions, CRUD, filters, admin actions
- [ ] TypeScript compilation passes
- [ ] Frontend lint clean
- [ ] Manual: verify sidebar shows for admin, hidden for merchant
- [ ] Manual: verify/unlock actions work correctly

## Open Questions

- None — scope is clear: read-only list + verify/unlock actions
