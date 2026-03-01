# Plan: Fix Merchant Map Popup Not Showing in Radius Mode

**Date:** 2026-02-27
**Type:** bugfix
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- None directly applicable from knowledge garden (first map bug of this kind).

### Root Cause
`InfoWindow` is rendered as a **child** of `AdvancedMarker` in the radius-mode render path (lines 207–219 of `merchant-map-view.tsx`). In `@vis.gl/react-google-maps`, children of `AdvancedMarker` are rendered as the marker's DOM content (i.e., they *replace* the default pin with custom HTML). They are **not** treated as Google Maps InfoWindow balloon overlays. As a result, the InfoWindow either renders invisibly inside the marker element or not at all — it never appears as a popup above the pin.

The no-radius click mode (lines 225–238) already uses the correct pattern: `InfoWindow` rendered **outside and after** the markers loop with a `position` prop only.

### Critical Patterns Applied
- InfoWindow must be a sibling of `AdvancedMarker` (not a child), rendered with a `position` prop to float above the map at that coordinate.

## Overview

Move radius-mode `InfoWindow` components out of the `AdvancedMarker` children and render them after the markers loop, mirroring the working no-radius pattern.

## Implementation Steps

### Step 1: Refactor `merchant-map-view.tsx`
- **File:** `frontend-customer-portal/components/storefront/merchant-map-view.tsx`
- **Change:** Remove the conditional `InfoWindow` block from inside `AdvancedMarker` (lines 207–219). Instead, render a second `.map()` loop **after** the markers loop that emits one `InfoWindow` per merchant that should be shown (`radiusActive && !closedIds.has(merchant.id)`).
- **Result:** Both modes (radius and no-radius) use the same sibling pattern.

**Before (broken):**
```tsx
<AdvancedMarker key={merchant.id} position={position} onClick={() => handleMarkerClick(merchant)}>
  {showInfoWindow && (
    <InfoWindow anchor={undefined} position={position} onCloseClick={...} headerDisabled>
      <MerchantInfoWindowContent ... />
    </InfoWindow>
  )}
</AdvancedMarker>
```

**After (fixed):**
```tsx
{/* Markers loop — no InfoWindow inside */}
{merchantsWithCoords.map((merchant) => (
  <AdvancedMarker key={merchant.id} position={...} onClick={() => handleMarkerClick(merchant)} />
))}

{/* Radius mode: one InfoWindow per visible merchant */}
{radiusActive &&
  merchantsWithCoords
    .filter((m) => !closedIds.has(m.id))
    .map((merchant) => (
      <InfoWindow
        key={`iw-${merchant.id}`}
        position={{ lat: merchant.address!.latitude as number, lng: merchant.address!.longitude as number }}
        onCloseClick={() => handleInfoWindowClose(merchant)}
        headerDisabled
      >
        <MerchantInfoWindowContent merchant={merchant} userLocation={userLocation} />
      </InfoWindow>
    ))}

{/* No-radius mode: single InfoWindow on click */}
{!radiusActive && selectedMerchant && (
  <InfoWindow ... />
)}
```

### Step 2: Remove unused `showInfoWindow` local variable
- **File:** same file
- **Change:** Delete `const showInfoWindow = ...` since the conditional is now handled by the filter in Step 1.

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `AdvancedMarker` loses custom pin style by removing children | Low | Default pin is fine; children were only used for InfoWindow (which was wrong) |
| Multiple InfoWindows still overlap on dense maps | Low (accepted) | Per brainstorm decision, user accepted overlap; each has its own close button |

## Testing Strategy

- [ ] Open merchant map page in customer portal (port 3001)
- [ ] Enable geolocation and set a radius — pins inside the radius should show popup balloons automatically
- [ ] Close a popup — it should disappear, pin stays
- [ ] Click the closed pin — popup should re-open
- [ ] Change the radius value — all popups should reset (all re-appear)
- [ ] Disable radius — no popups auto-shown; click a pin → single popup appears
- [ ] Click "View Store →" in popup → navigates to merchant detail page

## Open Questions

- None
