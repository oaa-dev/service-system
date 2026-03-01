# Brainstorm: Map Merchant Popup Auto-Open on Radius

**Date:** 2026-02-27
**Status:** Decided

## Knowledge Context

- `merchant-map-view.tsx` uses `@vis.gl/react-google-maps` with `AdvancedMarker` + `InfoWindow`
- Currently: single `selectedMerchant: Merchant | null` state, click-to-open
- The `merchants` prop is already filtered to in-range merchants (backend Haversine query returns only nearby merchants when `lat/lng/radius` params are passed)
- `InfoWindow` in `@vis.gl/react-google-maps` is a React component — multiple can be rendered simultaneously
- Navigation: use Next.js `<Link>` inside InfoWindow content (renders correctly in Google Maps overlay)

## Problem / Goal

When a radius filter is active and merchants are within range, their map pins should automatically display a popup card with merchant info and a direct link to the store. The user chose "show all simultaneously" so every in-range merchant gets its own open InfoWindow.

## Approaches Considered

### Approach A: Replace single state with per-merchant open/closed tracking
- **Description:** Replace `selectedMerchant: Merchant | null` with `closedMerchantIds: Set<number>`. When radius active, render InfoWindow for every merchant NOT in the closed set. When no radius, keep click-to-open single popup behavior.
- **Pros:** Satisfies "show all simultaneously" requirement. User can close individual popups. Switching radius resets state.
- **Cons:** Many merchants = many overlapping InfoWindows (user accepted this).

### Approach B: Side panel list instead of map popups
- **Description:** Show a scrollable list panel next to the map with in-range merchants.
- **Pros:** No overlap, cleaner.
- **Cons:** User rejected this option.

## Decision

**Approach A** — per-merchant open/closed tracking.

**State design:**
```tsx
// When radius active: InfoWindow shown for all merchants except closed ones
const [closedIds, setClosedIds] = useState<Set<number>>(new Set());

// Reset when radius changes
useEffect(() => { setClosedIds(new Set()); }, [radiusKm]);

// Render: show InfoWindow when radius active and not closed
{radiusKm && merchantsWithCoords.map(merchant => (
  !closedIds.has(merchant.id) && (
    <InfoWindow key={merchant.id} position={...} onCloseClick={() => setClosedIds(prev => new Set(prev).add(merchant.id))}>
      ...
    </InfoWindow>
  )
))}

// When no radius: single click-to-open InfoWindow (existing behavior)
{!radiusKm && selectedMerchant && <InfoWindow ...>}
```

**Popup content (minimal):**
- Merchant name (bold)
- Distance (e.g. "2.3 km away") — only when userLocation available
- "View Store →" button → `<Link href={/merchants/${slug}}>` styled as a button

**Marker click when radius active:** clicking a closed marker re-opens it (removes from closedIds).

## Open Questions

- None

## Next Steps

- [x] Implement in `merchant-map-view.tsx`
