# Plan: Customer Storefront Redesign

**Date:** 2026-02-27
**Type:** feature
**Status:** Draft
**Brainstorm:** `docs/brainstorms/2026-02-27-customer-storefront-redesign.md`

## Knowledge Context

### Relevant Learnings
- No prior solutions in knowledge base for storefront design
- Backend API already returns all required data — no new endpoints needed
- Social links relation in StorefrontService.getMerchantBySlug loads `socialLinks` but NOT `socialLinks.socialPlatform` (MerchantService does load it)
- AddressResource `city` field falls back to string when `geoCity` not eager-loaded — listing endpoint only loads `address`, not `address.geoCity`
- PSGC geographic data may not be loaded (seeder warned "No PSGC city data found") — address display must handle null gracefully

### Known Gotchas
- `AddressResource.city` returns `GeoReference|null` when `geoCity` loaded, but falls back to plain string when not loaded — type mismatch risk on frontend. Fix: add `address.geoCity` to listing eager load.
- Listing API doesn't load `businessHours` — needed for "Open Now" badge. Fix: add to eager load.
- Social platform icons: 7 platforms (facebook, instagram, twitter-x, tiktok, youtube, linkedin, whatsapp). Use lucide-react icons where available, fallback to Globe icon.
- Tailwind v4 uses `@theme inline` syntax, not `theme.extend` in config

### Critical Patterns Applied
- OKLch warm color theme with `shadow-warm`, `hover-lift`, `glass` utilities
- `animate-fade-in-up` with staggered `delay-*` classes for list animations
- React Query hooks with `keepPreviousData` for pagination
- StorefrontService params use `filter[key]` format for Spatie QueryBuilder

## Overview

Redesign the customer-facing storefront at `frontend-customer-portal/` to be visually engaging with modern marketplace patterns:
1. **Merchant listing** (`/merchants`): Image-first vertical cards, expanded filters, xl:4-col grid
2. **Merchant detail** (`/merchants/[slug]`): Full-width cover hero, two-column layout with sticky sidebar (CTAs, hours, contact, social links, payment methods, Google Maps)

No new backend endpoints needed. Minor backend changes to eager loading only.

## Implementation Steps

### Step 1: Backend — Update StorefrontService eager loading
- **Files:** `backend/app/Services/StorefrontService.php`
- **Details:**
  - `getActiveMerchants()`: Change `.with(['businessType', 'media', 'address'])` to `.with(['businessType', 'media', 'address.geoCity', 'address.province', 'businessHours'])`
  - `getMerchantBySlug()`: Change `'socialLinks'` to `'socialLinks.socialPlatform'` in the with array
- **Why:** Listing needs business hours for "Open Now" badge and geo city/province for location display. Detail needs social platform name/slug for icon mapping.
- **Risk:** Slightly more data per merchant on listing. Mitigated by only adding 3 small relations.

### Step 2: Shared utility — `isOpenNow` helper and social icon mapping
- **Files:** `frontend-customer-portal/lib/storefront-utils.ts` (NEW)
- **Details:**
  - `isOpenNow(businessHours: MerchantBusinessHour[]): { isOpen: boolean; label: string }` — computes from current day/time, returns "Open Now" / "Closed" / "Opens at X" / "Closes at X"
  - `formatFullAddress(address: Address | null | undefined): string` — builds "Street, Barangay, City, Province" string for map query
  - `getSocialIcon(slug: string): LucideIcon` — maps social platform slugs to lucide-react icons (Facebook→Facebook icon, Instagram→Instagram icon, etc., fallback→Globe)
  - `formatTime(time: string): string` — convert HH:MM to 12h AM/PM (extract from existing duplicate in [slug]/page.tsx and merchant-header.tsx)
- **Why:** Avoids duplicating isOpen logic in card and header. Centralizes formatTime which is currently duplicated.

### Step 3: Merchant Card redesign — image-first layout
- **Files:** `frontend-customer-portal/components/storefront/merchant-card.tsx`
- **Details:**
  - Replace avatar-based layout with image-first vertical card:
    ```
    [Cover Image 4:3] — merchant.logo?.preview, with fallback gradient
    [Logo 40px overlay bottom-left of image]
    [Open Now/Closed badge top-right of image]
    Merchant Name (line-clamp-1)
    Business Type
    📍 City, Province
    [Bookings] [Products] [Rentals] capability badges
    ```
  - Cover image: Use `merchant.logo?.preview` in `aspect-[4/3]` container with `object-cover`. Fallback: warm gradient with merchant initials centered.
  - Logo overlay: 40px rounded-full with ring-2 ring-white, absolute positioned at bottom-left of image (-translate-y-1/2)
  - Open Now badge: Use `isOpenNow()` helper, green pill for open, muted for closed, positioned absolute top-right of image
  - Keep `hover-lift` class and Link wrapper
- **Dependencies:** Step 2 (isOpenNow helper)

### Step 4: Search Filters expansion
- **Files:** `frontend-customer-portal/components/storefront/search-filters.tsx`
- **Details:**
  - Keep existing search input
  - Add optional props for expanded mode:
    - `businessTypes?: BusinessType[]` — dropdown/select filter
    - `onBusinessTypeChange?: (id: number | undefined) => void`
    - `capabilities?: { canSellProducts?: boolean; canTakeBookings?: boolean; canRentUnits?: boolean }`
    - `onCapabilityChange?: (key: string, value: boolean | undefined) => void`
    - `sort?: string`
    - `onSortChange?: (sort: string) => void`
  - Layout: Search input full-width on top row; filters row below with Business Type select, capability chip toggles, sort select
  - Mobile: Filters collapse into a "Filters" button that opens a Sheet/Drawer
  - Use existing shadcn Select component for dropdowns
  - Capability chips: toggle buttons styled as pills (active = primary bg, inactive = muted outline)
- **Note:** Filter bar is used on listing page only; detail page services use separate category chips

### Step 5: Merchants listing page update
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/page.tsx`
- **Details:**
  - Fetch business types for filter dropdown: add `useBusinessTypes()` hook call or inline fetch from `/storefront/business-types`... actually, we need to check if there's a public business types endpoint. If not, we'll use the merchant data itself to extract unique business types.
  - Actually, there's no public business types endpoint. Two options:
    1. Extract unique business types from loaded merchants (limited to current page)
    2. Add a simple endpoint — but we said no new endpoints
  - **Decision:** Extract unique business type names from already-loaded merchants for the filter. This is a "good enough" approach for now. The filter will pass `filter[business_type_id]` to the API.
  - Actually, better approach: since the API supports `filter[business_type_id]`, we need the IDs. Let's add a simple public endpoint for active business types.
  - **Backend addition:** Add `GET /storefront/business-types` endpoint returning active business types (name + id). Tiny controller method.
  - Update grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - Pass filter state to `useStorefrontMerchants` params
  - Update per_page from 12 to 16 (4-column grid)
  - Skeleton count: 8 (was 6)
- **Dependencies:** Steps 3 (new card), 4 (new filters)

### Step 6: Merchant Header redesign — cover hero
- **Files:** `frontend-customer-portal/components/storefront/merchant-header.tsx`
- **Details:**
  - Full-width cover image section:
    - Use `merchant.logo?.preview` as cover image with `object-cover` in `h-48 md:h-64 lg:h-72` container
    - Apply `blur-sm scale-110` transform + dark gradient overlay (black/50 at bottom) for blurred-logo-as-cover effect
    - Alternative: if no logo, use gradient-mesh background
  - Logo avatar: 96px (h-24 w-24), rounded-xl, ring-4 ring-white, shadow-lg, positioned to overlap the cover/content boundary (negative margin -mt-12 from content section)
  - Below cover: merchant name (text-2xl md:text-3xl font-bold), business type, capability badges, Open Now badge
  - Full description paragraph (no truncation)
  - Remove the old contact info row from the header (moved to sidebar)
- **Dependencies:** Step 2 (formatTime, isOpenNow)

### Step 7: Sidebar components (NEW)
- **Files:** `frontend-customer-portal/components/storefront/merchant-sidebar.tsx` (NEW)
- **Details:**
  - Single component `MerchantSidebar` that renders all sidebar sections:

  **7a. CTA Buttons section:**
  - "Book a Service" (if can_take_bookings) — primary button, Calendar icon
  - "Make a Reservation" (if can_rent_units) — outline button, Home icon
  - "Place an Order" (if can_sell_products) — outline button, ShoppingBag icon
  - Link to `/merchants/{slug}/book`, `/reserve`, `/order`

  **7b. Business Hours section:**
  - Card with "Business Hours" heading
  - Today's hours highlighted prominently at top: "Open Now · Closes at 9:00 PM" or "Closed · Opens Monday at 9:00 AM"
  - Collapsible full 7-day schedule below (default collapsed on mobile, expanded on desktop)
  - Use isOpenNow() helper for status
  - Day names, 12h time format

  **7c. Contact Info section:**
  - Card with phone, email, website links
  - Icons for each (Phone, Mail, Globe from lucide-react)
  - Website opens in new tab

  **7d. Social Links section:**
  - Horizontal row of icon buttons
  - Each icon mapped via getSocialIcon() helper
  - Opens in new tab with rel="noopener noreferrer"
  - Hover effect: bg-muted → bg-primary/10 + text-primary

  **7e. Payment Methods section:**
  - "Accepted Payments" heading
  - Chips/badges for each payment method name
  - Warm-colored pills (bg-warm-100 text-warm-700)

  **7f. Location / Map section:**
  - Full address text (Street, Barangay, City, Province)
  - Google Maps iframe embed:
    ```
    src={`https://maps.google.com/maps?q=${encodeURIComponent(formatFullAddress(address))}&output=embed`}
    ```
  - `h-40 rounded-xl overflow-hidden` container
  - `loading="lazy"` for performance
  - Only render if address exists with at least a city

### Step 8: Service Card upgrade — image-dominant
- **Files:** `frontend-customer-portal/components/storefront/service-card.tsx`
- **Details:**
  - Replace avatar layout with image-first card (matching merchant card style):
    ```
    [Service Image 4:3] — service.image?.preview, fallback gradient
    [Service Type badge top-right of image]
    Service Name (line-clamp-1)
    Category name (if exists)
    Duration / Stock info (type-specific)
    ₱ Price (bold)
    ```
  - Image: `aspect-[4/3]` container with service.image?.preview, object-cover
  - Fallback: warm gradient with service initials
  - Keep service type badge colors (same scheme)
  - Add duration for bookable, stock for sellable
  - Keep onClick handler
  - Keep hover-lift animation

### Step 9: Merchant Detail page — two-column layout
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx`
- **Details:**
  - Replace current single-column tab layout with two-column grid:
    ```
    md:grid-cols-[1fr_320px] gap-8
    ```
  - **Left column:**
    - MerchantHeader (hero cover + info)
    - Category filter chips (extracted from merchant.serviceCategories): horizontal scrollable chip bar
    - Services grid: `grid-cols-1 sm:grid-cols-2` with upgraded ServiceCards
    - Service pagination
  - **Right column (sticky):**
    - `MerchantSidebar` component (from Step 7)
    - `sticky top-20` positioning
  - **Mobile (below md):**
    - Single column: Header → Services → Sidebar sections stacked
    - Sticky bottom CTA bar: fixed bottom-0, shows primary action button only
    - Show/hide sticky bar using IntersectionObserver on the main CTA section
  - Remove old Tabs structure (Services/Info) — all info is now in the sidebar
  - Category filter: client-side filtering by service_category_id using the API `filter[service_category_id]` param
  - Search filters stay above the services grid (left column only)
- **Dependencies:** Steps 6 (header), 7 (sidebar), 8 (service card)

### Step 10: Backend — Add public business types endpoint
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/StorefrontController.php`
  - `backend/app/Services/StorefrontService.php`
  - `backend/app/Services/Contracts/StorefrontServiceInterface.php`
  - `backend/routes/api.php`
  - `frontend-customer-portal/services/storefrontService.ts`
  - `frontend-customer-portal/hooks/useStorefront.ts`
- **Details:**
  - Backend: Add `getBusinessTypes()` method to StorefrontService returning `BusinessType::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug'])`
  - Add `businessTypes()` action to StorefrontController
  - Add route: `GET /storefront/business-types` (public, no auth)
  - Frontend: Add `getBusinessTypes()` to storefrontService.ts
  - Frontend: Add `useStorefrontBusinessTypes()` hook
- **Why:** Filter dropdown on listing page needs business type list with IDs

### Step 11: Build verification and responsive polish
- **Files:** All modified files
- **Details:**
  - Run `npm run build` to verify TypeScript compilation
  - Run `npm run lint` to check for lint errors
  - Visual review at all breakpoints: mobile (375px), tablet (768px), desktop (1024px), wide (1280px)
  - Verify animations and transitions are smooth
  - Test with no merchant data (empty states)
  - Test with merchants that have no logo, no address, no social links (graceful fallbacks)
  - Test Google Maps iframe loads correctly with Philippine addresses

## Execution Waves

### Wave 1: Backend + Utilities (2 tasks, parallel)
- **Task 1A:** Backend eager loading + business types endpoint (Steps 1, 10 backend parts)
- **Task 1B:** Shared utility functions (Step 2)

### Wave 2: Components (4 tasks, parallel — zero file overlap)
- **Task 2A:** Merchant Card redesign (Step 3) → `merchant-card.tsx`
- **Task 2B:** Search Filters expansion (Step 4) → `search-filters.tsx`
- **Task 2C:** Merchant Header redesign (Step 6) → `merchant-header.tsx`
- **Task 2D:** Sidebar + Service Card (Steps 7, 8) → `merchant-sidebar.tsx` (new), `service-card.tsx`

### Wave 3: Pages + Frontend hooks (2 tasks, parallel — different files)
- **Task 3A:** Merchants listing page (Step 5) → `merchants/page.tsx`, `storefrontService.ts`, `useStorefront.ts`
- **Task 3B:** Merchant detail page (Step 9) → `merchants/[slug]/page.tsx`

### Wave 4: Verification (serial)
- **Task 4:** Build, lint, responsive review (Step 11)

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Blurred logo as cover image looks bad for some logos | Medium | Add fallback gradient-mesh when logo is very small or missing |
| Google Maps iframe blocked by CSP | Low | Add `maps.google.com` to next.config.js CSP if needed; iframe embed doesn't require API key |
| "Open Now" time zone mismatch | Medium | Use client browser time (all merchants are Philippines-based, same timezone as most users) |
| PSGC data not loaded — addresses all null | High (dev) | All address/map sections gracefully hide when address is null |
| Business types endpoint adds backend scope | Low | Minimal addition — single query, no auth needed, reuses existing model |

## Testing Strategy

- [ ] Build passes (`npm run build` from frontend-customer-portal/)
- [ ] Lint passes (`npm run lint` from frontend-customer-portal/)
- [ ] Backend tests still pass (`php artisan test` from backend/)
- [ ] Merchant listing: cards display with image, logo overlay, Open Now badge, capability badges
- [ ] Merchant listing: filter by business type, capability chips, sort dropdown all work
- [ ] Merchant listing: responsive grid (1→2→3→4 columns)
- [ ] Merchant detail: cover hero with blurred logo, logo overlay at boundary
- [ ] Merchant detail: two-column layout on desktop, single column on mobile
- [ ] Merchant detail: sidebar shows CTAs, hours, contact, social links, payment methods, map
- [ ] Merchant detail: category filter chips filter services
- [ ] Merchant detail: service cards show images, prices, type badges
- [ ] Merchant detail: sticky bottom CTA on mobile
- [ ] Edge case: merchant with no logo — gradient fallback
- [ ] Edge case: merchant with no address — map section hidden
- [ ] Edge case: merchant with no social links — section hidden
- [ ] Edge case: merchant with no business hours — hours section hidden

## Open Questions

- Should we install `react-icons` for branded social icons (colored Facebook, Instagram, etc.) or stick with lucide-react monochrome? Lucide has Facebook and Instagram icons but not all platforms.
- Gallery tab: placeholder only for now, or add `gallery` media collection to merchants? (Deferred per brainstorm)
