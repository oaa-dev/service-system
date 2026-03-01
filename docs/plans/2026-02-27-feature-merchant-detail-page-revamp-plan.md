# Plan: Merchant Detail Page Revamp

**Date:** 2026-02-27
**Type:** feature
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- None from knowledge garden for this specific area.

### Known Gotchas
- **InfoWindow must be a sibling of AdvancedMarker, not a child** (just fixed today). When adding InfoWindow to `MerchantMiniMap`, render it outside the marker, with `position` prop only — NOT nested inside `<AdvancedMarker>` children.
- **Next.js 16 searchParams is a Promise**: reading `searchParams.service` requires `use(searchParams)` just like `use(params)`.

### Critical Patterns Applied
- `use(searchParams)` for pre-selecting service from URL query param on action pages.
- InfoWindow sibling pattern in all Google Maps components.

## Overview

Four changes to the merchant detail page and downstream action pages:

1. **Gallery** — remove hero/feature image, keep thumbnail grid + tabs only.
2. **Sidebar right column** — replace Book/Place/Reserve CTA buttons with an interactive mini map (pin + merchant name popup + zoom controls).
3. **Service cards** — add per-card action button ("Book" / "Place Order" / "Reserve") that navigates to the action page with `?service=<id>`.
4. **Action pages** (book / reserve / order) — convert from single-column to 2-column: left = service detail panel, right = form. Read `?service=<id>` from URL to pre-select the service.

## Implementation Steps

### Step 1: Remove hero image from MerchantGallery
- **File:** `frontend-customer-portal/components/storefront/merchant-gallery.tsx`
- **Details:**
  - Remove the entire "Feature Image" JSX block (the `{feature && (...)}` block with aspect-[21/9] and the Star badge).
  - Update `hasGallery` to only check `allImages.length > 0` (remove `|| feature`).
  - Remove the `feature` variable assignment and unused `Star` import.
  - The tab filters + grid remain untouched.

### Step 2: Enhance MerchantMiniMap — InfoWindow + zoom controls
- **File:** `frontend-customer-portal/components/storefront/merchant-mini-map.tsx`
- **Details:**
  - Import `AdvancedMarker`, `InfoWindow` from `@vis.gl/react-google-maps` (replace `Marker`).
  - Add `useState<boolean>(true)` for InfoWindow visibility (open by default, user can close/reopen by clicking marker).
  - Render `AdvancedMarker` at merchant position with `onClick` to toggle InfoWindow.
  - Render `InfoWindow` as a **sibling** (NOT child) of `AdvancedMarker` with `position` and `headerDisabled`. Content: just merchant name as a small label.
  - Enable zoom controls: remove `disableDefaultUI={true}`, add `zoomControl={true}` and `gestureHandling="cooperative"`.
  - Increase height to `h-56` for more usable interactive map.
  - **Knowledge note:** InfoWindow must be a sibling of AdvancedMarker, not nested inside it (would render as pin HTML, not popup balloon).

### Step 3: Refactor MerchantSidebar — remove CTA card, promote map
- **File:** `frontend-customer-portal/components/storefront/merchant-sidebar.tsx`
- **Details:**
  - Remove the entire "CTA Buttons" Card block (the first `<Card>` with Book/Place/Reserve buttons).
  - Move `MerchantMiniMap` to the **top** of the sidebar as a standalone first item (currently it's at the bottom inside the Location card).
  - Wrap it in its own card-like container with `overflow-hidden rounded-xl`:
    ```tsx
    {/* Mini Map — top of sidebar */}
    {merchant.address?.latitude != null && merchant.address?.longitude != null && (
      <div className="overflow-hidden rounded-xl border border-warm-200/30 shadow-warm">
        <MerchantMiniMap latitude={...} longitude={...} merchantName={merchant.name} />
      </div>
    )}
    ```
  - Remove `MerchantMiniMap` from inside the Location card (it was rendered there at the bottom).
  - Location card still shows address text; just no longer embeds the map.
  - Remove unused imports: `Calendar`, `Home`, `ShoppingBag`, `Link` (if not used elsewhere in sidebar).

### Step 4: Add action button to ServiceCard
- **Files:** `frontend-customer-portal/components/storefront/service-card.tsx`, `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx`
- **Details (service-card.tsx):**
  - Add `merchantSlug` prop: `interface ServiceCardProps { service: Service; merchantSlug: string; onClick?: () => void; }`
  - Define action config per service type:
    ```ts
    const ACTION_CONFIG = {
      bookable:    { label: 'Book',         path: 'book'    },
      sellable:    { label: 'Place Order',  path: 'order'   },
      reservation: { label: 'Reserve',      path: 'reserve' },
    };
    ```
  - At the bottom of the Card's info section, add a `<Link>` button:
    ```tsx
    <Link
      href={`/merchants/${merchantSlug}/${action.path}?service=${service.id}`}
      className="..."
      onClick={(e) => e.stopPropagation()}
    >
      {action.label}
    </Link>
    ```
  - Style as a full-width outlined button inside the card.
  - Stop propagation so the outer `onClick` doesn't also fire.
- **Details (page.tsx):**
  - Pass `merchantSlug={slug}` to each `<ServiceCard service={service} merchantSlug={slug} />`.
  - Remove unused `Calendar`, `Home`, `ShoppingBag` imports from page.tsx if no longer needed (they were for `primaryCTA`).
  - Keep the `primaryCTA` mobile sticky bar for now (it still provides a useful mobile CTA).

### Step 5: Book page — 2-column layout + service pre-selection
- **File:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/page.tsx`
- **Details:**
  - Accept `searchParams: Promise<{ service?: string }>` prop.
  - `const { service: serviceParam } = use(searchParams);`
  - Initialize: `const [selectedServiceId, setSelectedServiceId] = useState<number | null>(serviceParam ? Number(serviceParam) : null);`
  - Change container from `max-w-2xl` to `max-w-5xl`.
  - Change layout from single column `space-y-6` to `grid grid-cols-1 lg:grid-cols-2 gap-8`.
  - **Left column (sticky):** `ServiceDetailPanel` component (inline or extracted):
    - Shows service image, name, category, type badge, description, price, duration.
    - Uses `selectedService` from `useServiceDetail` hook.
    - If no service selected: placeholder card "Select a service to see details".
  - **Right column:** the existing form (service selector + date/time/party/notes + submit).
  - Move `BookingSummary` into the left column below service details (when service + time selected).

### Step 6: Reserve page — 2-column layout + service pre-selection
- **File:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/page.tsx`
- **Details:**
  - Same pattern as Step 5.
  - Initialize `selectedServiceId` from `searchParams.service`.
  - Left column: unit image, name, description, price_per_night, max_capacity, floor info.
  - Add `useServiceDetail` import + hook call (currently reserve page doesn't use it).
  - Right column: the existing form.
  - Move `BookingSummary` to left column.

### Step 7: Order page — 2-column layout + service pre-selection
- **File:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/order/page.tsx`
- **Details:**
  - Same pattern as Step 5.
  - Initialize `selectedServiceId` from `searchParams.service`.
  - Left column: product image, name, description, price, stock info.
  - Add `useServiceDetail` import + hook call.
  - Right column: the existing form.
  - Move `BookingSummary` to left column.

## Execution Waves

**Wave 1** (all parallel — no file overlap):
- Step 1: `merchant-gallery.tsx`
- Step 2: `merchant-mini-map.tsx`
- Steps 4a+4b: `service-card.tsx` + `merchants/[slug]/page.tsx` (same task, consecutive files)

**Wave 2** (parallel — all after Wave 1 completes):
- Step 3: `merchant-sidebar.tsx` (uses MerchantMiniMap — safe after Step 2)
- Step 5: `book/page.tsx`
- Step 6: `reserve/page.tsx`
- Step 7: `order/page.tsx`

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| InfoWindow in MiniMap renders as marker pin HTML | Medium | Use sibling pattern (not child of AdvancedMarker) per today's fix |
| `searchParams` not a Promise in older Next.js | Low | Next.js 16 — already uses `use(params)` pattern, same for searchParams |
| Service detail API call fails when `serviceId = 0` | Low | `useServiceDetail` with `enabled: selectedServiceId != null && selectedServiceId > 0` to skip |
| Mobile sticky CTA on detail page still shows even without sidebar buttons | Low | Keep sticky CTA — it's a separate UX element, not removed by spec |
| ServiceCard `onClick` prop conflicts with Link button inside | Medium | Use `e.stopPropagation()` on the Link's click handler |

## Testing Strategy

- [ ] Gallery shows only thumbnail grid (no large hero image) at `/merchants/azure-lagoon-resort`,
- [ ] Gallery still shows tabs and lightbox on thumbnail click add pagination or infinite scroll
- [ ] Sidebar shows mini map at top (no Book/Place/Reserve buttons)
- [ ] Mini map shows zoom controls, merchant name popup, and responds to zoom gestures
- [ ] Each service card shows an action button ("Book", "Place Order", or "Reserve") based on type
- [ ] Clicking service card action button navigates to correct action page with `?service=<id>` in URL
- [ ] Action page pre-selects the service from URL param (service detail shown in left column)
- [ ] Action page still works when navigated directly without `?service=` param
- [ ] 2-column layout on action pages collapses to 1-column on mobile (`lg:` breakpoint)
- [ ] TypeScript: no new errors (`docker compose exec nextjs-customer npx tsc --noEmit`)

## Open Questions

- None — spec is clear on all points.
