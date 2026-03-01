# Brainstorm: Customer Storefront Redesign

**Date:** 2026-02-27
**Status:** Decided

## Knowledge Context

No prior solutions relevant. The backend API already returns all necessary data (social links, payment methods, full address with geo FKs, business hours, media/logos) — the frontend simply doesn't render most of it yet.

## Problem / Goal

The customer-facing storefront at `frontend-customer-portal/` has functional but visually lean pages:
- **Merchant listing** (`/merchants`): Text-heavy cards with small avatar, basic search only
- **Merchant detail** (`/merchants/[slug]`): Logo + gradient header, Services/Info tabs — missing gallery, social links, map, payment methods, description prominence

**Goal:** Make both pages visually engaging ("eye-catchy"), display all available merchant data (gallery, social links, payment methods, location with map, logo, feature image), and follow modern marketplace design patterns (Airbnb, Yelp, GrabFood).

## Approaches Considered

### Approach A: Two-column detail + image-first cards (CHOSEN)
- **Description:** Merchant listing uses image-dominant vertical cards (4:3 cover image, logo overlay, Open Now badge). Detail page uses two-column layout with sticky right sidebar containing CTAs, hours, contact, social links, payment methods, and map. Google Maps via simple iframe embed.
- **Pros:** Maximum visual impact. Sticky CTAs always visible for conversion. Sidebar consolidates all merchant info. Image-first cards match user expectations from Airbnb/GrabFood.
- **Cons:** More complex responsive behavior (two-column collapses to single on mobile). Sticky sidebar needs IntersectionObserver or CSS sticky.

### Approach B: Single column with expanded tabs
- **Description:** Full-width single-column layout. Cover hero, then tabbed content (Services / About / Gallery). All merchant info in About tab.
- **Pros:** Simpler responsive behavior. Familiar tab pattern.
- **Cons:** CTAs scroll away. About tab hides important info behind a click. Less visual density on desktop.

### Approach C: Horizontal cards with view toggle
- **Description:** Both grid and list view options for merchant listing. Detail page single-column.
- **Pros:** User choice. List view more compact.
- **Cons:** More code to maintain. Most users won't use the toggle.

## Decision

**Approach A** — Two-column detail page with sticky sidebar + image-first vertical cards.

### Merchant Listing Page (`/merchants`)

**Card redesign (`merchant-card.tsx`):**
```
+---------------------------+
|                           |
|  [Cover Image 4:3]        |  <- merchant.logo?.preview or blurred logo
|                           |
|  [Logo 40px]  [Open Now]  |  <- logo overlay bottom-left, status top-right
+---------------------------+
|  Merchant Name             |
|  Business Type             |
|  📍 City, Province         |
|  [Bookings] [Products]     |  <- capability badges
+---------------------------+
```

**Filter bar expansion (`search-filters.tsx`):**
- Business Type dropdown filter
- Capability chip filters (Has Bookings, Has Products, Has Rentals)
- Sort dropdown (Newest, Name A-Z)
- "Open Now" toggle (future, needs client-side hours logic)

**Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

### Merchant Detail Page (`/merchants/[slug]`)

**Hero section:**
- Full-width cover image (use blurred logo preview as fallback)
- Dark gradient overlay at bottom for text legibility
- Logo (96px, rounded-xl, ring-4 ring-white) overlapping cover/content boundary

**Two-column layout (md+):**
```
Left column (flex-1):              Right column (w-80, sticky):
- Merchant name, type, badges     - CTA buttons (Book/Reserve/Order)
- Full description                - Today's hours + Open Now badge
- Category filter chips           - Contact info (phone, email, website)
- Services grid (2 cols)          - Social links (icon buttons)
                                  - Payment methods (chips)
                                  - Google Maps iframe embed
```

**Mobile:** Single column, sidebar content stacks below services. Sticky bottom CTA bar.

**Service cards upgrade:**
- Image-dominant (4:3 ratio using service.image?.preview)
- Name, category, duration/stock info, price
- Category filter chips above the grid

**New sections to add:**
- Social links: Icon buttons (Facebook, Instagram, etc.) with branded hover colors
- Payment methods: Chip/badge display (Cash, GCash, Credit Card, etc.)
- Google Maps: Simple iframe embed using address string, `loading="lazy"`
- Gallery: Placeholder section for future media collection

**Google Maps integration:**
```html
<iframe
  src="https://maps.google.com/maps?q={address_string}&output=embed"
  class="w-full h-40 rounded-xl border-0"
  loading="lazy"
/>
```

### Data Already Available (no backend changes needed)

| Data | API Field | Currently Displayed | After Redesign |
|------|-----------|-------------------|----------------|
| Logo | `merchant.logo.preview/thumb` | Small avatar | Cover fallback + overlay avatar |
| Description | `merchant.description` | Truncated 2 lines | Full paragraph |
| Social links | `merchant.social_links[]` | Not shown | Icon button row |
| Payment methods | `merchant.payment_methods[]` | Info tab only | Sidebar chips |
| Full address | `merchant.address.region/province/city/barangay` | City only | Full address + map |
| Business hours | `merchant.business_hours[]` | Info tab list | Sidebar with Open Now badge |
| Capability badges | `can_sell_products/take_bookings/rent_units` | Small badges | Prominent badges |
| Service images | `service.image.preview` | Small thumb | Large card image |
| Service categories | `service.service_category.name` | Not used | Filter chips |

## Open Questions

- Should we add a `cover_image` media collection to merchants for a dedicated cover photo (vs using blurred logo)?
- Should the "Open Now" logic be computed client-side from business hours or added as an API field?
- Do we want infinite scroll on mobile listing or keep pagination?
- Gallery section: placeholder only, or add a `gallery` media collection to merchants now?

## Next Steps

- [ ] `/plan` to create implementation plan from this brainstorm
- [ ] Implement merchant card redesign
- [ ] Implement merchant detail two-column layout with sidebar
- [ ] Add social links, payment methods, map sections
- [ ] Add filter bar expansion to listing page
- [ ] Add category chips to detail page services
- [ ] Mobile responsive pass (sticky CTA, collapsed sidebar)
