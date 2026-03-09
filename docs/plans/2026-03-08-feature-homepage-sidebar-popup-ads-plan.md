# Plan: Homepage Sidebar & Popup Ads

**Date:** 2026-03-08
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-03-08-homepage-sidebar-and-popup-ads.md](../brainstorms/2026-03-08-homepage-sidebar-and-popup-ads.md)

## Knowledge Context

### Relevant Learnings
- Backend advertisement module fully implemented — model, service, controller, routes, tests all done
- Storefront endpoint `GET /storefront/advertisements?placement=X` returns all active/valid ads for a placement (no type filter server-side)
- `AdBanner` component already has `vertical` variant with `tower` size — perfect for sidebar
- Merchant detail page already uses the same sidebar + AdBanner pattern we need for homepage

### Known Gotchas
- The homepage (`page.tsx`) is a **server component by default** (no `'use client'` directive). AdBanner is a client component, so it can be embedded directly. But the new `<AdPopup>` must also be a client component since it uses state/effects.
- `useActiveAds` returns `Advertisement[]` directly (not wrapped in `{data: ...}`), so popup filtering is straightforward: `ads.filter(a => a.type === 'popup')`
- The `AdBanner` component already filters out popup-type ads from banner rendering? **No** — it renders all ads returned. So we need the `<AdPopup>` to consume popup-type ads and `<AdBanner>` to exclude them, OR we use separate placements. **Decision:** Keep it simple — `<AdPopup>` fetches from the same placement, filters to `type === 'popup'`. `<AdBanner>` already renders all ads (including popups as banners), which is acceptable since admins control what they create.

### Critical Patterns Applied
- Reuse existing `useActiveAds` hook and `advertisementService` — no backend changes needed
- Follow merchant detail page pattern for sidebar layout (sticky, hidden on mobile)
- Use Radix UI Dialog (via shadcn `dialog.tsx`) for popup — consistent with project patterns

## Overview

Frontend-only implementation adding two missing ad features to the customer portal:
1. **Homepage sidebar** — restructure homepage into 2-column layout with sticky ad sidebar
2. **Popup ads** — new `<AdPopup />` dialog component shown on homepage + merchant listing

No backend changes required. No new API endpoints. Pure frontend work.

## Implementation Steps

### Step 1: Create `<AdPopup />` Component

**Files:**
- `frontend-customer-portal/components/ad-popup.tsx` (new)

**Details:**
- Client component (`'use client'`)
- Props: `placement: string` (which placement to fetch popup ads from)
- Uses `useActiveAds(placement)` to fetch ads, filters to `type === 'popup'`
- Shows only the first popup ad found (highest sort_order priority)
- 3-second delay via `setTimeout` in `useEffect` before opening dialog
- `sessionStorage` key: `ad-popup-dismissed-{placement}` — if set, don't show
- On dismiss: set sessionStorage key, close dialog
- Uses shadcn `Dialog` (DialogOverlay, DialogContent) for the modal
- Renders ad image (full-width in dialog), title, description, link button
- Tracks impression via `advertisementService.trackImpression(ad.id)` when dialog opens
- Tracks click via `advertisementService.trackClick(ad.id)` when CTA link clicked
- Close button (X) in top-right corner
- "Ad" badge like AdBanner's existing pattern
- Max width: `sm:max-w-lg` for the dialog

**Component structure:**
```tsx
export function AdPopup({ placement }: { placement: string }) {
  const { data: allAds } = useActiveAds(placement);
  const [open, setOpen] = useState(false);
  const impressionFired = useRef(false);

  // Filter to popup type
  const popupAd = allAds?.find(a => a.type === 'popup');

  // Delay + sessionStorage check
  useEffect(() => {
    if (!popupAd) return;
    const key = `ad-popup-dismissed-${placement}`;
    if (sessionStorage.getItem(key)) return;
    const timer = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(timer);
  }, [popupAd, placement]);

  // Track impression on open
  useEffect(() => {
    if (open && popupAd && !impressionFired.current) {
      impressionFired.current = true;
      advertisementService.trackImpression(popupAd.id);
    }
  }, [open, popupAd]);

  // Dismiss handler
  const handleDismiss = () => {
    setOpen(false);
    sessionStorage.setItem(`ad-popup-dismissed-${placement}`, '1');
  };

  // Render Dialog with ad content
}
```

### Step 2: Integrate `<AdPopup />` on Homepage

**Files:**
- `frontend-customer-portal/app/page.tsx` (modify)

**Details:**
- Add `<AdPopup placement="homepage_hero" />` at the bottom of the page (before closing `</div>`)
- The popup fetches from `homepage_hero` placement and filters to `type === 'popup'`
- This means admins create a popup ad with `placement=homepage_hero` and `type=popup`
- The existing `<AdBanner placement="homepage_hero" />` will also receive this ad but render it as a grid item — acceptable behavior

### Step 3: Integrate `<AdPopup />` on Merchant Listing

**Files:**
- `frontend-customer-portal/app/(storefront)/merchants/page.tsx` (modify)

**Details:**
- Add `<AdPopup placement="merchant_listing" />` at the bottom of the page
- Same pattern: fetches merchant_listing placement, filters to popup type
- sessionStorage keyed separately (`ad-popup-dismissed-merchant_listing`) so each page triggers independently

### Step 4: Restructure Homepage for Sidebar Layout

**Files:**
- `frontend-customer-portal/app/page.tsx` (modify)

**Details:**
- Wrap the capabilities grid section + final CTA section in a 2-column flex layout
- Left column: existing capabilities grid + CTA (flex-1)
- Right column: `<AdBanner placement="homepage_sidebar" variant="vertical" />` in a sticky container
- Right column: `hidden md:block w-72 flex-shrink-0` (same pattern as merchant detail page sidebar)
- Sticky: `sticky top-20` on the inner container
- Mobile: sidebar hidden, content full-width (no layout change on small screens)
- The homepage is a server component but `AdBanner` is a client component — this is fine, Next.js handles client components inside server components

**Layout change (capabilities + CTA sections only):**
```
Before:
  <section> Capabilities Grid </section>
  <section> Final CTA </section>

After:
  <div className="flex flex-col md:flex-row gap-6">
    <div className="flex-1 min-w-0">
      <section> Capabilities Grid </section>
      <section> Final CTA </section>
    </div>
    <div className="hidden md:block w-72 flex-shrink-0">
      <div className="sticky top-20">
        <AdBanner placement="homepage_sidebar" variant="vertical" />
      </div>
    </div>
  </div>
```

- Hero section and footer remain full-width (outside the 2-column wrapper)
- The `homepage_hero` and `storefront_banner` AdBanner placements remain in their current positions

### Step 5: Add Demo Popup Ad to Seeder

**Files:**
- `backend/database/seeders/DemoAdvertisementSeeder.php` (modify)

**Details:**
- Add 1-2 popup-type demo ads for `homepage_hero` and `merchant_listing` placements
- Add 2-3 `homepage_sidebar` placement ads for the sidebar
- This allows testing without manually creating ads via admin panel
- Example popup ad: title "Limited Time Offer!", description, link_url, type=popup, placement=homepage_hero
- Example sidebar ads: type=banner, placement=homepage_sidebar, with images if possible

### Step 6: Verify & Test

**Details:**
- Run `npm run build` in customer portal to verify TypeScript + compilation
- Run `npm run lint` to check for lint errors
- Seed demo ads: `docker compose exec app php artisan db:seed --class=DemoAdvertisementSeeder`
- Manually verify:
  - Homepage loads with sidebar ads on desktop
  - Homepage sidebar hidden on mobile
  - Popup appears after 3s on homepage (first visit)
  - Popup doesn't reappear after dismissing (same session)
  - Popup appears independently on merchant listing
  - Impression tracked when popup opens
  - Click tracked when CTA clicked
  - Close button and overlay dismiss both work

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Homepage layout shift on desktop | Medium | Use fixed sidebar width (w-72), test at various viewport sizes |
| Popup ad blocks initial page interaction | Low | 3s delay gives user time to orient; sessionStorage prevents repeat annoyance |
| AdBanner shows popup-type ads as banners too | Low | Acceptable — admin controls what type they create per placement. Could add client-side type filter to AdBanner later if needed |
| No popup ads in DB for testing | Medium | Step 5 adds demo seeder data |

## Testing Strategy

- [ ] Homepage sidebar renders on desktop (md+)
- [ ] Homepage sidebar hidden on mobile
- [ ] Sidebar ads use vertical/tower variant
- [ ] Popup dialog appears after 3s delay on homepage
- [ ] Popup dialog appears after 3s delay on merchant listing
- [ ] Popup does not reappear after dismiss (same session)
- [ ] Popup does not show if no popup-type ads exist for placement
- [ ] Impression tracked on popup open
- [ ] Click tracked on popup CTA
- [ ] Close button dismisses popup
- [ ] Overlay click dismisses popup
- [ ] TypeScript compiles cleanly (`npm run build`)
- [ ] Lint passes (`npm run lint`)

## Open Questions

- None — all decisions made in brainstorm. Pure frontend implementation with existing backend support.
