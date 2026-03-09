# Brainstorm: Wizard Guide/Tutorial for New Registered Users

**Date:** 2026-03-07
**Status:** Draft

## Knowledge Context

- Merchant already has an `OnboardingDashboard` component with 9-step checklist + progress bar (shown when status is "pending")
- Customer has zero post-registration guidance — lands on empty dashboard with stats cards
- Auth race condition known: must check `isLoading` before `isAuthenticated` on Zustand persisted stores
- Axios Content-Type gotcha: don't hardcode if wizard involves file uploads
- Admin/super-admin bypass all middleware — wizard must exclude them
- Capability flags (`can_sell_products`, `can_take_bookings`, `can_rent_units`) should gate merchant wizard steps
- Existing onboarding middleware enforces email verification + merchant type selection (backend already handles this)

### Relevant Modules
- `frontend-auth` — Login, register, verify-email, onboarding pages
- `frontend-my-store` — OnboardingDashboard, ActiveDashboard, settings tabs
- `portal-auth` — Customer portal auth pages, separate auth store
- `portal-customer` — Customer dashboard, bookings, reservations, orders, favorites, reviews, profile
- `portal-storefront` — Public merchant browsing, booking/ordering flows

## Problem / Goal

New users (both merchant and customer) have no guided introduction to the platform after registration. Merchants have a checklist but no contextual explanations. Customers have nothing — they land on an empty dashboard and must discover features on their own. We need a wizard/tutorial system that:

1. Welcomes new users and explains what they can do
2. Guides them through essential setup steps (links, not inline)
3. Persists progress so it doesn't nag completed users
4. Works for both merchant (admin frontend) and customer (customer portal) roles

## Approaches Considered

### Approach A: Lightweight Welcome Modal
- **Description:** One-time modal after first login explaining key features with cards
- **Pros:** Minimal code, fast to build, non-intrusive
- **Cons:** Limited guidance depth, easy to dismiss and forget

### Approach B: Multi-Step Guided Tour (Tooltips)
- **Description:** Step-by-step tooltip tour highlighting UI elements (react-joyride style)
- **Pros:** Contextual, teaches by showing actual UI
- **Cons:** Fragile to layout changes, maintenance burden, can feel annoying

### Approach C: Interactive Wizard Pages
- **Description:** Dedicated multi-step setup pages before main app access
- **Pros:** Ensures completeness, professional feel
- **Cons:** Heaviest to build, adds friction, some users want to skip

### Approach D: Hybrid (Welcome Modal + Persistent Sidebar Checklist) -- SELECTED
- **Description:** Brief welcome modal on first visit + persistent "Getting Started" widget that stays visible until all steps are done
- **Pros:** Balanced — guides without blocking, persistent reminder, gamification potential, builds on existing merchant onboarding dashboard
- **Cons:** More UI complexity, needs to gracefully disappear when done

## Decision

**Approach D: Hybrid** — Welcome modal + persistent checklist/card

- **Depth:** Explain features + link to setup pages (not inline setup)
- **Roles:** Both merchant and customer
- **Scope:** UI/UX enhancement only — no new backend API endpoints needed beyond tracking completion

## Design Details

### Data Model
- Add `wizard_completed_at` nullable timestamp to `merchants` table
- Add `wizard_completed_at` nullable timestamp to `customers` table
- Track individual step completion via JSON column or localStorage (TBD)

### Merchant Wizard Flow (Admin Frontend)

**Welcome Modal** (shown once on first `/my-store` visit when `wizard_completed_at` is null):
- "Welcome to [Platform]! Let's get your store set up."
- 3-4 feature cards: Manage Services, Accept Bookings, Track Orders, Grow with Loyalty
- "Get Started" button dismisses modal, shows checklist

**Persistent Getting Started Card** (on onboarding dashboard, enhances existing checklist):
- Existing 9-step checklist already covers setup steps
- Enhancement: Add brief descriptions to each step explaining WHY
- Each incomplete step links to the relevant settings page/tab
- Progress bar already exists — keep it
- When all steps done + admin approved → set `wizard_completed_at`, hide card
- "Dismiss" option to hide early (still tracks in DB)

**Conditional Steps Based on Capabilities:**
- If `can_take_bookings`: "Set Up Booking Slots" step
- If `can_sell_products`: "Add Your First Product" step
- If `can_rent_units`: "Create Unit Types" step

### Customer Wizard Flow (Customer Portal)

**Welcome Modal** (shown once on first `/dashboard` visit when `wizard_completed_at` is null):
- "Welcome to [Platform]! Here's what you can do."
- Feature cards:
  1. Browse Merchants — Discover local businesses and services
  2. Book & Reserve — Schedule appointments or reserve units
  3. Order Products — Shop from merchant catalogs
  4. Earn Rewards — Join loyalty programs and collect stamps
- "Explore Now" button → redirects to `/merchants` (storefront)
- "Maybe Later" → stays on dashboard

**Getting Started Card** (persistent on dashboard until completed or dismissed):
- Steps (explain + link):
  1. Complete Your Profile → `/profile` (address, preferences)
  2. Browse Merchants → `/merchants`
  3. Make Your First Booking/Order → contextual based on what's available
  4. Leave a Review → `/reviews` (after first completed transaction)
  5. Join a Loyalty Program → shown after browsing a merchant with loyalty
- Progress indicator (X of Y)
- "Dismiss" to hide permanently → sets `wizard_completed_at`
- Auto-completes steps based on actual user activity (has profile? has booking? has review?)

### UI Components Needed

**Shared:**
- `WelcomeModal` — Reusable modal with feature cards grid, dismiss/CTA buttons
- `GettingStartedCard` — Collapsible card with step list, progress bar, step descriptions + links

**Merchant-specific:**
- Enhance existing `OnboardingDashboard` component (not a new component)
- Add capability-conditional steps

**Customer-specific:**
- New `CustomerWelcomeModal` component
- New `CustomerGettingStartedCard` component on dashboard

### Exclusions
- Admin/super-admin users: no wizard (check role before showing)
- Branch merchants: follow same flow as regular merchants
- Guest users: not applicable (must be authenticated)

## Known Risks

1. **Auth race condition** — Wizard components must check `isLoading` before reading auth state
2. **Content-Type header** — Already fixed in customer portal axios, but verify if wizard adds upload steps later
3. **Frontend/backend permission mismatch** — If wizard checks flags, ensure same source as backend
4. **Empty state confusion** — Customer dashboard shows "0 bookings" which is correct but feels broken for new users; wizard card should fill this visual gap

## Open Questions

- [ ] Should step auto-completion be tracked in backend (DB) or frontend (localStorage)?
  - DB: survives device changes, consistent, but needs API endpoints
  - localStorage: simpler, no backend changes, but lost on device switch
  - Recommendation: `wizard_completed_at` in DB, individual step tracking in localStorage (hybrid)
- [ ] Should the welcome modal have an animated illustration or keep it simple with icons?
- [ ] Should dismissed wizard be accessible from a "Help" menu item for users who want to revisit?
- [ ] What copy/branding should the welcome messages use? Need copywriting input.

## Next Steps

- [ ] Create implementation plan with `/plan`
- [ ] Design welcome modal mockup (or describe layout for frontend-design skill)
- [ ] Decide on step auto-completion tracking approach
- [ ] Write migrations for `wizard_completed_at` columns
- [ ] Implement merchant wizard enhancements
- [ ] Implement customer wizard (modal + getting started card)
- [ ] Test both flows end-to-end
