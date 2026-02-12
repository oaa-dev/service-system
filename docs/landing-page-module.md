# Landing Page & Merchant Self-Registration

## Context

The platform currently has no public-facing pages — the root URL (`/`) just redirects to `/login` or `/dashboard`. We need a marketing landing page that showcases the platform's capabilities and a public merchant self-registration flow where anyone can sign up as a merchant (pending admin approval).

**Current state:** Only `(auth)` and `(system)` route groups exist. Merchant creation is admin-only via `POST /merchants` with `merchants.create` permission. No public landing page exists.

---

## Phase 1: Backend — Merchant Self-Registration Endpoint

New public `POST /auth/register-merchant` endpoint that creates user + merchant in one transaction.

### Files

| # | File | Action |
|---|------|--------|
| 1 | `backend/app/Http/Requests/Api/V1/Auth/RegisterMerchantRequest.php` | Create |
| 2 | `backend/app/Http/Controllers/Api/V1/AuthController.php` | Modify (add `registerMerchant()`, inject `MerchantServiceInterface`) |
| 3 | `backend/routes/api.php` | Modify (add 1 public route) |
| 4 | `backend/app/Models/Merchant.php` | Modify (slug dedup in `booted()`) |
| 5 | `backend/tests/Feature/Api/V1/AuthMerchantRegisterTest.php` | Create |

### RegisterMerchantRequest

```
Rules:
  name                  → required|string|max:255
  email                 → required|email|max:255|unique:users,email
  password              → required|string|min:8|confirmed
  password_confirmation → required
  business_name         → required|string|max:255
  business_type_id      → nullable|integer|exists:business_types,id
  contact_phone         → nullable|string|max:20
```

### AuthController::registerMerchant()

- Add `MerchantServiceInterface` to constructor (alongside existing `UserServiceInterface`)
- Method logic (same pattern as existing `register()` + `MerchantController::store()`):
  1. `DB::transaction`:
     - Create User (name, email, hashed password), assign 'user' role
     - Copy capability flags from BusinessType if provided
     - Create Merchant via `MerchantService::createMerchantForUser()` — status=pending, contact_email=user email
  2. Generate access token, return `{ user, access_token, token_type }` with 201

### Route

```php
Route::post('auth/register-merchant', [AuthController::class, 'registerMerchant']);
```

### Merchant Slug Dedup

Fix `Merchant::booted()` creating callback to append `-N` suffix on collision:
```php
$baseSlug = Str::slug($merchant->name);
$slug = $baseSlug;
$counter = 1;
while (static::where('slug', $slug)->exists()) {
    $slug = $baseSlug . '-' . $counter++;
}
$merchant->slug = $slug;
```

### Tests (8 tests)

- `can register as a merchant` — happy path: user + merchant created, token returned, status=pending
- `validates required fields` — empty body → 422
- `validates unique email` — duplicate → 422
- `validates password confirmation` — mismatch → 422
- `copies capability flags from business type` — flags inherited correctly
- `creates merchant without business type` — business_type_id nullable
- `generates unique slugs for same business name` — two same-name registrations → different slugs
- `assigns user role` — verify 'user' role

---

## Phase 2: Frontend — Merchant Registration Page

New page at `/register/merchant` under `(auth)` route group (uses existing auth gradient layout).

### Files

| # | File | Action |
|---|------|--------|
| 6 | `frontend/types/api.ts` | Modify (add `RegisterMerchantRequest`) |
| 7 | `frontend/lib/validations.ts` | Modify (add `registerMerchantSchema`) |
| 8 | `frontend/services/authService.ts` | Modify (add `registerMerchant()`) |
| 9 | `frontend/hooks/useAuth.ts` | Modify (add `useRegisterMerchant()`) |
| 10 | `frontend/app/(auth)/register/merchant/page.tsx` | Create |

### Registration Page Fields

**Account section:** Name, Email, Password, Confirm Password
**Business section:** Business Name, Business Type (select from `useActiveBusinessTypes()`), Contact Phone

- Follows existing register page pattern (react-hook-form + Zod + field-level errors)
- On success → redirect to `/dashboard`
- Links: "Already have an account? Sign in" + "Just need a regular account? Register here"

---

## Phase 3: Frontend — Landing Page

Replace redirect-only `app/page.tsx` with content-rich marketing landing page.

### Files

| # | File | Action |
|---|------|--------|
| 11 | `frontend/app/page.tsx` | Replace (landing page composition) |
| 12 | `frontend/app/_components/landing-header.tsx` | Create |
| 13 | `frontend/app/_components/landing-hero.tsx` | Create |
| 14 | `frontend/app/_components/landing-about.tsx` | Create |
| 15 | `frontend/app/_components/landing-services.tsx` | Create |
| 16 | `frontend/app/_components/landing-how-it-works.tsx` | Create |
| 17 | `frontend/app/_components/landing-features.tsx` | Create |
| 18 | `frontend/app/_components/landing-pricing.tsx` | Create |
| 19 | `frontend/app/_components/landing-faq.tsx` | Create |
| 20 | `frontend/app/_components/landing-testimonials.tsx` | Create |
| 21 | `frontend/app/_components/landing-contact.tsx` | Create |
| 22 | `frontend/app/_components/landing-footer.tsx` | Create |

### Section Breakdown

| Section | Content |
|---------|---------|
| **Header** | Sticky nav: logo, anchor links (About/Services/Features/Pricing/FAQ/Contact), "Sign In" + "Get Started" CTA. Auth-aware: show "Dashboard" if logged in |
| **Hero** | Headline + subheadline + 2 CTAs ("Register Your Business" → `/register/merchant`, "Learn More" → `#about`). CSS gradient/pattern background |
| **About** | Platform overview, 3-4 stat counters (placeholder), mission statement |
| **Services** | 4-card grid: Bookings (appointments/time-slots), Reservations (date-range rentals), Service Orders (job tracking), Products & Inventory (catalog/stock) |
| **How It Works** | 3 steps: Register → Set up services → Start accepting bookings |
| **Features** | Grid: multi-business types, availability management, customer management, flexible pricing, platform fees, geographic addresses, status workflows, RBAC |
| **Pricing** | 3-tier placeholder: Starter (Free), Professional, Enterprise. "Coming Soon" CTAs |
| **Testimonials** | 3 placeholder testimonial cards |
| **FAQ** | 6-8 questions using shadcn Accordion (getting started, pricing, approval, business types, etc.) |
| **Contact** | Contact info (email/phone placeholders) + simple form (name, email, message — frontend only, no backend) |
| **Footer** | Multi-column: brand, quick links, legal links, social icons, copyright |

### Design

- Use existing Tailwind theme variables for color consistency
- Alternating section backgrounds (white / muted) for separation
- Mobile-first responsive (grids collapse to single column)
- lucide-react icons, no external images
- shadcn/ui components: Accordion (FAQ), Card (features/services), Button (CTAs)

---

## Phase 4: Cross-linking

| # | File | Action |
|---|------|--------|
| 23 | `frontend/app/(auth)/register/page.tsx` | Modify (add "Register as a merchant" link) |
| 24 | `frontend/app/(auth)/login/page.tsx` | Modify (add "Register your business" link) |

---

## File Summary

| Phase | New Files | Modified Files | Total |
|-------|-----------|----------------|-------|
| Phase 1 (Backend) | 2 | 3 | 5 |
| Phase 2 (Registration FE) | 1 | 4 | 5 |
| Phase 3 (Landing Page) | 12 | 0 | 12 |
| Phase 4 (Cross-links) | 0 | 2 | 2 |
| **Total** | **15** | **9** | **24** |

---

## Verification

```bash
# Phase 1 — Backend
docker compose exec app php artisan migrate
docker compose exec app php artisan test --filter=AuthMerchantRegisterTest

# Phase 2+3+4 — Frontend
docker compose exec nextjs npx tsc --noEmit
docker compose exec nextjs npm run lint
```
