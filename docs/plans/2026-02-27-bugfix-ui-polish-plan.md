# Plan: UI Polish & Bug Fixes (Auth, Map ID, Service Cards, Action Pages)

**Date:** 2026-02-27
**Type:** bugfix
**Status:** Draft

## Knowledge Context

### Root Causes Found
1. **Gradient-mesh opacity bug**: `.gradient-mesh` uses `background:` shorthand which resets `background-color`, overriding Tailwind's `bg-primary`. The left panel of auth layout uses both `bg-primary gradient-mesh`, so the primary color is lost and replaced by transparent gradients → washed-out look.
2. **Map ID warning**: `merchant-mini-map.tsx` uses `AdvancedMarker` but the `Map` component has no `mapId` set. Google Maps logs "map initialized without a valid Map ID" when AdvancedMarkers are used without one.
3. **Service card button**: Action button already at correct position (below price, full width) but needs stronger visual treatment.
4. **Action pages image**: No merchant branding shown at top of book/reserve/order pages; users lose context of which merchant they're booking.

### Known Gotchas
- `gradient-mesh` is used in 5 places. Fixing it globally (change `background:` → `background-image:`) is safe — all other usages are absolute-positioned overlay divs that only need the gradient overlay, not a background-color.
- `useServiceDetail` already has `enabled: !!slug && !!serviceId` guard — no fix needed there.

### Critical Patterns Applied
- CSS fix targets the global `.gradient-mesh` class, not individual usages — one change fixes all instances.

## Overview

Four small focused fixes:
1. Auth left panel opacity → fix `gradient-mesh` CSS to not override `bg-primary`
2. Google Maps Map ID warning → add `mapId` to `MerchantMiniMap`
3. Service card → slightly smaller + more prominent action button styling
4. Action pages → add compact merchant identity bar at top (logo + name)

## Implementation Steps

### Step 1: Fix gradient-mesh opacity in auth layout
- **File:** `frontend-customer-portal/app/globals.css`
- **Details:** Change line `background:` to `background-image:` inside `.gradient-mesh`. Using the shorthand `background:` resets `background-color` to transparent, overriding Tailwind's `bg-primary`. Using `background-image:` only adds the gradient layers without touching background-color.
- **Before:**
  ```css
  .gradient-mesh {
    background:
      radial-gradient(ellipse at 20% 50%, oklch(...) 0%, transparent 50%),
      ...
  }
  ```
- **After:**
  ```css
  .gradient-mesh {
    background-image:
      radial-gradient(ellipse at 20% 50%, oklch(...) 0%, transparent 50%),
      ...
  }
  ```

### Step 2: Add mapId to MerchantMiniMap
- **File:** `frontend-customer-portal/components/storefront/merchant-mini-map.tsx`
- **Details:** Add `mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}` prop to the `<Map>` component. AdvancedMarker requires a Map ID; without it Google Maps logs a warning and markers may not render correctly.

### Step 3: Service card resize + button polish
- **File:** `frontend-customer-portal/components/storefront/service-card.tsx`
- **Details:**
  - Reduce image aspect from `aspect-[4/3]` to `aspect-[3/2]` (slightly shorter image).
  - Reduce info section padding from `p-4` to `p-3`.
  - Reduce `space-y-1.5` to `space-y-1` inside info section.
  - Make action button more prominent: change from bordered/ghost style to solid primary button style (`bg-primary text-primary-foreground hover:bg-primary/90`).

### Step 4: Add merchant identity bar to action pages
- **Files:** `book/page.tsx`, `reserve/page.tsx`, `order/page.tsx`
- **Details:** Below the back link and above the page title, add a compact merchant identity row:
  ```tsx
  {/* Merchant identity */}
  <div className="flex items-center gap-3 mb-4 animate-fade-in">
    <Avatar className="h-10 w-10 rounded-lg">
      <AvatarImage src={merchant.logo?.preview} alt={merchant.name} className="object-cover" />
      <AvatarFallback className="rounded-lg text-sm font-bold bg-primary/10 text-primary">
        {getInitials(merchant.name)}
      </AvatarFallback>
    </Avatar>
    <div>
      <p className="text-xs text-muted-foreground">at</p>
      <p className="font-semibold leading-tight">{merchant.name}</p>
    </div>
  </div>
  ```
  - Import `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar` and `getInitials` from `@/lib/utils` in all three action pages.

## Execution Waves

**Wave 1** (all parallel — no file overlap):
- Step 1: `globals.css`
- Step 2: `merchant-mini-map.tsx`
- Step 3: `service-card.tsx`

**Wave 2** (parallel — all identical pattern):
- Step 4a: `book/page.tsx`
- Step 4b: `reserve/page.tsx`
- Step 4c: `order/page.tsx`

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Changing gradient-mesh breaks other pages | Low | All 4 other usages are overlay divs — they only need the gradient layer, not background-color |
| Avatar/getInitials import missing in action pages | Low | Both are already used in merchant-header.tsx — imports are stable |
| mapId env var not set → 'DEMO_MAP_ID' fallback | Low | Fallback 'DEMO_MAP_ID' is the same used in merchant-map-view.tsx; silences the warning |

## Testing Strategy

- [ ] Auth left panel at `/login` and `/register` shows solid primary color (not washed-out)
- [ ] Mini map in merchant sidebar loads without console Map ID warning
- [ ] Service cards appear slightly smaller with solid action button
- [ ] Book/Reserve/Order pages show merchant logo + name below back button
- [ ] TypeScript: no new errors
