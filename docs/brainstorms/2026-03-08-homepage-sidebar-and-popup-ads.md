# Brainstorm: Homepage Sidebar & Popup Ads

**Date:** 2026-03-08
**Status:** Draft

## Knowledge Context

- Backend advertisement module is fully implemented (model, service, controller, routes, tests)
- `popup` type and `homepage_sidebar` placement exist in backend validation but have no frontend rendering
- Customer portal `AdBanner` component supports 5 variants (grid, marquee, carousel, horizontal, vertical) with impression/click tracking
- Radix UI `Dialog` component available for popup implementation
- `useActiveAds(placement)` hook fetches ads with 5-min staleTime cache
- Existing placements already rendered: homepage_hero, storefront_banner, merchant_listing, merchant_detail, dashboard_banner

## Problem / Goal

Two ad features defined in the backend are not rendered in the customer portal frontend:
1. **`homepage_sidebar` placement** — no component renders ads for this placement anywhere
2. **`popup` ad type** — no modal/dialog implementation exists to show popup ads

Both need frontend-only implementation since the backend API already serves the correct data.

## Approaches Considered

### Homepage Sidebar

#### Approach A: Right column sidebar (CHOSEN)
- **Description:** Restructure the homepage sections below the hero into a 2-column layout. Main content (capabilities grid, final CTA) on the left, sticky `<AdBanner placement="homepage_sidebar" variant="vertical" />` on the right. Desktop only — stacks below content on mobile.
- **Pros:** True sidebar layout matches the placement name, reuses existing `vertical` variant with `tower` size, consistent with merchant detail page pattern
- **Cons:** Changes homepage layout structure, needs responsive handling

#### Approach B: Inline between sections
- **Description:** Place ads horizontally between capabilities and final CTA sections
- **Pros:** Simpler, no layout restructure
- **Cons:** "sidebar" name misleading, less visual impact

### Popup Ads

#### Approach C: Simple session-based popup (CHOSEN)
- **Description:** New `<AdPopup />` component using Radix Dialog. Shows after 3s delay on page load. Uses `sessionStorage` to prevent re-showing during same session. Dismiss via close button or overlay click.
- **Pros:** Simple implementation, non-aggressive, good UX
- **Cons:** Only once per session, doesn't persist across sessions

#### Approach D: Smart with localStorage frequency cap
- **Description:** Per-ad-ID tracking in localStorage with 24h cooldown
- **Pros:** Better for returning users
- **Cons:** More complex, overkill for initial implementation

## Decision

1. **Homepage sidebar:** Right column sticky sidebar (Approach A)
   - 2-column layout wrapping capabilities grid + final CTA
   - `variant="vertical"` for tower-style ads
   - Hidden on mobile (md breakpoint), content goes full-width
   - Sticky positioning like merchant detail sidebar

2. **Popup ads:** Simple session-based (Approach C)
   - New `<AdPopup />` component using Radix UI Dialog
   - Fetches ads with `useActiveAds('homepage_hero')` filtered to `type === 'popup'` — OR a dedicated popup placement query
   - 3-second delay before showing
   - `sessionStorage` key per placement to show once per session
   - Close button + overlay dismiss
   - Tracks impression on open, click on CTA

3. **Trigger pages:** Homepage + merchant listing
   - Place `<AdPopup />` in homepage (`page.tsx`) and merchant listing (`merchants/page.tsx`)
   - Each page triggers independently (sessionStorage keyed per page/placement)

## Open Questions

- Should popup ads use a dedicated placement (e.g., `popup_homepage`, `popup_merchant_listing`) or filter by `type === 'popup'` on existing placements?
  - **Decision:** Filter existing placements by type. Admin creates a popup ad with `placement=homepage_hero` and `type=popup`. The `<AdPopup>` component fetches the same placement but only renders popup-type ads. This avoids adding new placements to the backend.
  - **Update:** Actually, simpler to just query by placement and let any ad type be shown as a popup if the admin sets it. The `type` field is more about visual style in the grid/banner context. For popups, we'll query a specific placement and show all results as popup dialogs.

## Next Steps

- [ ] Create `/plan` from this brainstorm
- [ ] Implement `<AdPopup />` component
- [ ] Restructure homepage layout for sidebar column
- [ ] Test with demo ad data
