# Plan: Wizard Guide/Tutorial for New Registered Users

**Date:** 2026-03-07
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-03-07-wizard-guide-tutorial-new-users.md](../brainstorms/2026-03-07-wizard-guide-tutorial-new-users.md)

## Knowledge Context

### Relevant Learnings
- [Auth race condition](../knowledge/solutions/state-issues/auth-race-condition-customer-portal-layout-20260307.md): Must check `isLoading` before `isAuthenticated` on persisted Zustand stores — applies to wizard conditional rendering
- [Hardcoded Content-Type](../knowledge/solutions/config-errors/hardcoded-content-type-breaks-file-uploads-axios-20260307.md): Already fixed, but verify no regression if wizard links to upload pages
- [Permission flag mismatch](../knowledge/solutions/authorization-issues/permission-flag-mismatch-frontend-backend-coupon-20260307.md): When wizard checks capability flags, use same source as backend (merchant's own flags, not parent)

### Known Gotchas
- Admin/super-admin bypass all middleware — wizard must exclude them via role check
- Customer portal uses `'customer-auth-storage'` localStorage key (separate from admin `'auth-storage'`)
- Merchant `OnboardingDashboard` already has 9-step checklist via `useMyOnboardingChecklist()` hook — enhance, don't replace
- Customer dashboard currently has zero onboarding — entirely new component needed
- `isMerchantUser()` exists on admin auth store; `isCustomer()` on customer portal store

### Critical Patterns Applied
- Zustand `isLoading` guard on all auth-dependent conditional rendering
- Role-based exclusion: check `hasRole('super-admin') || hasRole('admin')` to skip wizard
- Capability-conditional steps: use `merchant.can_sell_products`, `merchant.can_take_bookings`, `merchant.can_rent_units`

## Overview

Add a hybrid onboarding wizard (welcome modal + persistent getting-started checklist) for both merchant and customer users. The wizard explains platform features and links to setup pages without inline setup. Completion is tracked via `wizard_completed_at` DB column; individual step progress via localStorage.

**Scope:**
- 2 backend migrations (add `wizard_completed_at` to merchants + customers)
- 2 backend endpoints (mark wizard complete for merchant + customer)
- 1 enhanced component (merchant OnboardingDashboard)
- 4 new frontend components (WelcomeModal shared pattern, MerchantWelcomeModal, CustomerWelcomeModal, CustomerGettingStartedCard)
- Integration into existing pages (my-store dashboard, customer dashboard)

## Implementation Steps

### Phase 1: Backend — Migrations & Endpoints

#### Step 1.1: Migration — Add `wizard_completed_at` to merchants
- **Files:** `backend/database/migrations/2026_03_08_000001_add_wizard_completed_at_to_merchants_table.php`
- **Details:**
  ```php
  $table->timestamp('wizard_completed_at')->nullable()->after('status_changed_at');
  ```
- **Down:** `$table->dropColumn('wizard_completed_at');`

#### Step 1.2: Migration — Add `wizard_completed_at` to customers
- **Files:** `backend/database/migrations/2026_03_08_000002_add_wizard_completed_at_to_customers_table.php`
- **Details:**
  ```php
  $table->timestamp('wizard_completed_at')->nullable()->after('identity_document_status');
  ```
- **Down:** `$table->dropColumn('wizard_completed_at');`

#### Step 1.3: Update Models — Add to $fillable and $casts
- **Files:**
  - `backend/app/Models/Merchant.php` — add `'wizard_completed_at'` to `$fillable`, add `'wizard_completed_at' => 'datetime'` to `$casts`
  - `backend/app/Models/Customer.php` — same
- **Knowledge note:** Follow existing pattern — both models already have datetime casts for similar fields

#### Step 1.4: Update DTOs — Add wizard_completed_at
- **Files:**
  - `backend/app/Data/MerchantData.php` — add `public string|Optional $wizard_completed_at`
  - `backend/app/Data/CustomerData.php` — add same
- **Knowledge note:** DTOs use `Spatie\LaravelData\Optional` pattern for all fields

#### Step 1.5: Update Resources — Expose wizard_completed_at
- **Files:**
  - `backend/app/Http/Resources/Api/V1/MerchantResource.php` — add `'wizard_completed_at' => $this->wizard_completed_at`
  - `backend/app/Http/Resources/Api/V1/CustomerResource.php` — add same
- **Details:** This field needs to be visible in the auth `/me` response so frontends can check it

#### Step 1.6: Add Wizard Completion Endpoints
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/MyMerchantController.php` — add `completeWizard()` method
  - `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php` — add `completeWizard()` method
  - `backend/routes/api.php` — add routes
- **Details:**
  - `POST /auth/merchant/wizard/complete` — sets `wizard_completed_at = now()` on authenticated user's merchant
  - `POST /customer/my/wizard/complete` — sets `wizard_completed_at = now()` on authenticated user's customer
  - Both return 200 with updated resource
  - No validation needed — just a timestamp set
- **Routes:** Inside existing auth middleware groups, no new permissions needed (self-service only)

### Phase 2: Admin Frontend — Merchant Wizard

#### Step 2.1: Add merchant service method + hook
- **Files:**
  - `frontend/services/merchantService.ts` — add `completeWizard()` API call
  - `frontend/hooks/useMerchants.ts` — add `useCompleteWizard()` mutation hook
- **Details:** `POST /auth/merchant/wizard/complete`, invalidates auth query on success

#### Step 2.2: Create MerchantWelcomeModal component
- **Files:** `frontend/components/merchant-welcome-modal.tsx`
- **Details:**
  - Uses shadcn/ui `Dialog` component
  - Shows when: `isMerchantUser()` AND `user?.merchant?.wizard_completed_at === null` AND NOT `hasRole('admin')` AND NOT `hasRole('super-admin')`
  - Content: Welcome heading + 3-4 feature cards in a grid (Manage Services, Accept Bookings, Track Orders, Grow with Loyalty)
  - Cards show icon + title + brief description
  - "Get Started" button closes modal (localStorage flag `merchant-welcome-seen`)
  - "Skip" link also closes
  - **Knowledge note:** Check `isLoading` from auth store before rendering — avoid flash during rehydration
- **Capability-aware cards:** Only show "Accept Bookings" if `can_take_bookings`, "Track Orders" if `can_sell_products`, etc.

#### Step 2.3: Enhance OnboardingDashboard with descriptions
- **Files:** `frontend/app/(system)/(my-store)/my-store/onboarding-dashboard.tsx`
- **Details:**
  - Add descriptive subtitle to each checklist item explaining WHY it matters:
    - "Business Type Selected" → "Defines what capabilities your store has"
    - "Capabilities Configured" → "Choose whether you take bookings, sell products, or rent units"
    - "Business Details Completed" → "Customers see this when they find your store"
    - "Logo Uploaded" → "Your brand identity on the marketplace"
    - "Documents Uploaded" → "Required for admin verification and approval"
  - Add capability-conditional bonus steps (non-blocking, informational):
    - If `can_take_bookings`: "Set Up Booking Slots" → `/my-store/booking-slots`
    - If `can_sell_products`: "Add Your First Service/Product" → `/my-store/services`
    - If `can_rent_units`: "Create Unit Types" (link to relevant page)
  - Add "Dismiss Getting Started Guide" button → calls `completeWizard()` API
  - When merchant status becomes `active`/`approved`, auto-complete wizard if not already

#### Step 2.4: Integrate WelcomeModal into My Store page
- **Files:** `frontend/app/(system)/(my-store)/my-store/page.tsx`
- **Details:**
  - Import and render `<MerchantWelcomeModal />` alongside the dashboard
  - Modal shows once (localStorage gated), onboarding dashboard shows persistently until completed/dismissed
  - No changes to ActiveDashboard — wizard only shows during onboarding phase

#### Step 2.5: Update TypeScript types
- **Files:** `frontend/types/api.ts`
- **Details:** Add `wizard_completed_at: string | null` to Merchant interface

### Phase 3: Customer Portal — Customer Wizard

#### Step 3.1: Add customer service method + hook
- **Files:**
  - `frontend-customer-portal/services/customerProfileService.ts` — add `completeWizard()` API call
  - `frontend-customer-portal/hooks/useCustomerProfile.ts` — add `useCompleteWizard()` mutation hook
- **Details:** `POST /customer/my/wizard/complete`, invalidates customer profile query

#### Step 3.2: Create CustomerWelcomeModal component
- **Files:** `frontend-customer-portal/components/customer-welcome-modal.tsx`
- **Details:**
  - Uses shadcn/ui `Dialog` component
  - Shows when: `isCustomer()` AND user's customer `wizard_completed_at === null` AND localStorage `customer-welcome-seen` is not set
  - Content: Welcome heading + 4 feature cards:
    1. Browse Merchants (Store icon) — "Discover local businesses and services"
    2. Book & Reserve (Calendar icon) — "Schedule appointments or reserve units"
    3. Order Products (ShoppingBag icon) — "Shop from merchant catalogs"
    4. Earn Rewards (Gift icon) — "Join loyalty programs and collect stamps"
  - "Explore Now" button → `router.push('/merchants')` + close
  - "Maybe Later" → close modal, stay on dashboard
  - **Knowledge note:** Check `isLoading` from auth store before rendering

#### Step 3.3: Create CustomerGettingStartedCard component
- **Files:** `frontend-customer-portal/components/customer-getting-started-card.tsx`
- **Details:**
  - Collapsible card with progress indicator (X of Y steps)
  - Steps with auto-completion detection:
    1. **Complete Your Profile** → `/profile` — auto-complete if user has address or phone set
    2. **Browse Merchants** → `/merchants` — auto-complete via localStorage flag `customer-browsed-merchants` (set on storefront visit)
    3. **Make Your First Booking** → `/merchants` — auto-complete if stats.bookings.total > 0 OR stats.reservations.total > 0 OR stats.orders.total > 0
    4. **Leave a Review** → `/reviews` — auto-complete if user has any reviews
  - Each step: checkbox icon (filled/empty) + title + description + link button (if incomplete)
  - Progress bar at top
  - "Dismiss" button → calls `completeWizard()` API → hides card permanently
  - Uses stats from `useMyStats()` hook (already on dashboard) for auto-completion
  - **Knowledge note:** Auth race condition — guard rendering with `isLoading` check

#### Step 3.4: Integrate into Customer Dashboard
- **Files:** `frontend-customer-portal/app/(customer)/dashboard/page.tsx`
- **Details:**
  - Import `CustomerWelcomeModal` and `CustomerGettingStartedCard`
  - Render `<CustomerWelcomeModal />` (modal, overlays page)
  - Render `<CustomerGettingStartedCard />` before the stats grid (only if `wizard_completed_at === null`)
  - Getting Started card fills the "empty state" visual gap for new users with 0 bookings/orders

#### Step 3.5: Update TypeScript types
- **Files:** `frontend-customer-portal/types/api.ts`
- **Details:** Add `wizard_completed_at: string | null` to Customer interface

#### Step 3.6: Set localStorage flag on storefront visit
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/page.tsx`
- **Details:** Add `useEffect` that sets `localStorage.setItem('customer-browsed-merchants', 'true')` on mount
- Used by Step 3.3 to auto-complete "Browse Merchants" step

### Phase 4: Testing & Verification

#### Step 4.1: Backend tests
- **Files:** `backend/tests/Feature/Api/V1/WizardTest.php`
- **Details:**
  - Test merchant wizard complete endpoint: sets `wizard_completed_at`, returns updated resource
  - Test customer wizard complete endpoint: same
  - Test endpoints require authentication
  - Test idempotent (calling twice doesn't error)

#### Step 4.2: Frontend build verification
- **Details:**
  - `cd frontend && npm run build` — verify no TypeScript errors
  - `cd frontend-customer-portal && npm run build` — verify no TypeScript errors
  - Manual test: register new merchant → verify welcome modal appears → verify enhanced checklist
  - Manual test: register new customer → verify welcome modal appears → verify getting started card

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Auth store flash — wizard briefly appears then disappears | High | Guard all wizard components with `isLoading` check from Zustand store |
| Merchant OnboardingDashboard regression | Medium | Enhancement only — add descriptions/steps, don't restructure existing checklist |
| Customer auto-completion inaccurate | Low | Use actual API stats (bookings > 0) for reliable detection; localStorage only for "browsed merchants" |
| Welcome modal annoying on every device | Low | `wizard_completed_at` in DB prevents showing after completion; localStorage prevents showing before API call completes |
| Admin users seeing wizard | Low | Explicit role check: skip if `hasRole('super-admin')` or `hasRole('admin')` |

## Testing Strategy

- [ ] Migration up/down works correctly
- [ ] `POST /auth/merchant/wizard/complete` — sets timestamp, returns 200
- [ ] `POST /customer/my/wizard/complete` — sets timestamp, returns 200
- [ ] Both endpoints require authentication (401 without token)
- [ ] Both endpoints are idempotent
- [ ] Merchant welcome modal shows for new merchant, not for admin
- [ ] Merchant welcome modal doesn't show after localStorage flag set
- [ ] Enhanced onboarding checklist shows descriptions
- [ ] Capability-conditional steps only show when relevant flags are true
- [ ] Customer welcome modal shows for new customer
- [ ] Customer getting started card auto-completes steps based on stats
- [ ] Dismiss button calls API and hides card permanently
- [ ] TypeScript builds pass on both frontends
- [ ] No auth flash/flicker during page load

## Open Questions

- [ ] Should "Browse Merchants" auto-complete use localStorage (simple) or track server-side (robust)?
  - **Recommendation:** localStorage — it's a soft UX hint, not a hard requirement
- [ ] Should dismissed wizard be accessible from a "Help" menu?
  - **Recommendation:** Defer to v2 — reset `wizard_completed_at` to null from a help menu
- [ ] Exact copy/wording for welcome modal and step descriptions?
  - **Recommendation:** Use placeholder copy for now, refine with product input later
