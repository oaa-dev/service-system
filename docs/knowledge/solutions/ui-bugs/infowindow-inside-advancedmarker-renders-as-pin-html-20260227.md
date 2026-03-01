---
title: "InfoWindow inside AdvancedMarker renders as custom pin HTML, not as popup balloon"
date: 2026-02-27
problem_type: ui_bug
component: component
module: frontend-customer-portal/components/storefront
severity: high
resolution_type: code_fix
tags: [google-maps, vis.gl, react-google-maps, AdvancedMarker, InfoWindow, map-popup]
---

## Symptom

Merchant pin popup (InfoWindow) does not appear as a balloon above the map pin when using `@vis.gl/react-google-maps`. The popup is invisible, or appears incorrectly embedded inside the marker element rather than floating above it.

## Context

- Library: `@vis.gl/react-google-maps`
- Components involved: `AdvancedMarker`, `InfoWindow`
- Files: `frontend-customer-portal/components/storefront/merchant-map-view.tsx`, `merchant-mini-map.tsx`

## Root Cause

In `@vis.gl/react-google-maps`, children of `<AdvancedMarker>` are rendered as the marker's **custom DOM content** — they replace the default red pin with custom HTML. They are **not** treated as Google Maps InfoWindow balloon overlays.

Placing `<InfoWindow>` as a child of `<AdvancedMarker>` renders the InfoWindow component as the marker's HTML element, not as a popup balloon above the map.

```tsx
// WRONG — InfoWindow is rendered as the marker's visual HTML, not as a popup
<AdvancedMarker position={position}>
  <InfoWindow position={position} anchor={undefined}>
    popup content
  </InfoWindow>
</AdvancedMarker>
```

## Solution

Render `InfoWindow` as a **sibling** of `AdvancedMarker` (never as a child), using the `position` prop to float it above the map at the target coordinate:

```tsx
// CORRECT — InfoWindow is a sibling, not child of AdvancedMarker
<AdvancedMarker
  position={position}
  onClick={() => handleMarkerClick(merchant)}
/>

<InfoWindow
  key={`iw-${merchant.id}`}
  position={position}
  onCloseClick={() => handleInfoWindowClose(merchant)}
  headerDisabled
>
  popup content
</InfoWindow>
```

For a mini-map with a single marker:

```tsx
<AdvancedMarker position={position} onClick={() => setInfoOpen(v => !v)} />

{infoOpen && (
  <InfoWindow position={position} onCloseClick={() => setInfoOpen(false)} headerDisabled>
    <p className="text-xs font-semibold">{merchantName}</p>
  </InfoWindow>
)}
```

## Prevention

- **Never nest `<InfoWindow>` inside `<AdvancedMarker>` children.** Only use `AdvancedMarker` children for custom pin visuals (e.g., styled div, SVG icon).
- Use two separate render strategies:
  - **Per-merchant open/closed tracking** (radius mode): filter map array, render InfoWindows after markers loop
  - **Single selected state** (click mode): render one InfoWindow with `selectedMerchant` state, placed after the markers map

## Related Files

- `frontend-customer-portal/components/storefront/merchant-map-view.tsx`
- `frontend-customer-portal/components/storefront/merchant-mini-map.tsx`
