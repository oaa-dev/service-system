# Brainstorm: Migrate from Leaflet to Google Maps API

**Date:** 2026-02-27
**Status:** Draft

## Knowledge Context

- **Backend is map-agnostic**: The `addresses` table stores `latitude`/`longitude` as plain decimal columns. The API endpoints (`/storefront/merchants`, `/storefront/merchants/map`, `/storefront/merchants/{slug}`) return coordinates via `AddressResource`. No backend changes needed.
- **Leaflet SSR workaround**: We currently use `dynamic(() => import(...), { ssr: false })` for all Leaflet components due to Leaflet's `window` dependency. Google Maps via `@vis.gl/react-google-maps` has the same SSR limitation — the `<APIProvider>` and `<Map>` components access browser APIs, so dynamic imports with `ssr: false` are still required.
- **Leaflet icon fix**: The `leaflet-setup.ts` files in both frontends exist solely to fix Leaflet's broken default marker icons. Google Maps has no such issue — these files can be deleted.

## Problem / Goal

Replace Leaflet + OpenStreetMap with Google Maps JavaScript API for better visual quality:
- Higher-quality map tiles with satellite/terrain options
- Smoother pan/zoom animations
- Better mobile touch handling
- Professional Google Maps branding
- Potential for future Google features (Street View, Places autocomplete)

## Scope

**No backend changes.** Pure frontend migration across two apps:
1. **Admin frontend** (`frontend/`) — MapLocationPicker component (draggable pin in merchant edit)
2. **Customer portal** (`frontend-customer-portal/`) — MerchantMiniMap (detail sidebar), MerchantMapView (listing page map), radius filtering

## Approach: Direct Library Swap

### Library: `@vis.gl/react-google-maps`
- **Why**: Official Google-maintained React library (replaces deprecated `@react-google-maps/api`). Modern hooks-based API, TypeScript-first, actively maintained.
- **Key components**: `<APIProvider>`, `<Map>`, `<AdvancedMarker>`, `<InfoWindow>`, `<Pin>`, `useMap()`
- **Requires**: Google Maps JavaScript API key + Map ID (for AdvancedMarker)

### API Key Configuration
- Env var: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in both frontends
- Optional: `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` for styled maps / AdvancedMarker
- API key must have **Maps JavaScript API** enabled in Google Cloud Console
- Restrict key to frontend domains in production

### Component Migration Map

| Current (Leaflet) | New (Google Maps) | Location |
|---|---|---|
| `frontend/lib/leaflet-setup.ts` | **DELETE** | Admin |
| `frontend/components/map-location-picker.tsx` | Rewrite with `<Map>` + `<AdvancedMarker draggable>` | Admin |
| `frontend-customer-portal/lib/leaflet-setup.ts` | **DELETE** | Portal |
| `frontend-customer-portal/components/storefront/merchant-mini-map.tsx` | Rewrite with `<Map>` + `<AdvancedMarker>` | Portal |
| `frontend-customer-portal/components/storefront/merchant-map-view.tsx` | Rewrite with `<Map>` + multiple `<AdvancedMarker>` + `<InfoWindow>` + `<Circle>` | Portal |
| `frontend-customer-portal/app/globals.css` (leaflet CSS import) | Remove `@import "leaflet/dist/leaflet.css"` | Portal |

### Package Changes

**Admin frontend (`frontend/`):**
- Remove: `leaflet`, `react-leaflet`, `@types/leaflet`
- Add: `@vis.gl/react-google-maps`

**Customer portal (`frontend-customer-portal/`):**
- Remove: `leaflet`, `react-leaflet`, `@types/leaflet`
- Add: `@vis.gl/react-google-maps`

### Unchanged Files
- `frontend-customer-portal/lib/geo-utils.ts` — Haversine utility (no Leaflet dependency)
- `frontend-customer-portal/hooks/useGeolocation.ts` — Browser geolocation (no Leaflet dependency)
- `frontend-customer-portal/hooks/useStorefront.ts` — React Query hooks (no Leaflet dependency)
- `frontend-customer-portal/services/storefrontService.ts` — API calls (no Leaflet dependency)
- `frontend-customer-portal/components/storefront/search-filters.tsx` — Radius dropdown (no Leaflet dependency)
- `frontend-customer-portal/app/(storefront)/merchants/page.tsx` — Map/List toggle (only the dynamic import path changes)
- `frontend-customer-portal/components/storefront/merchant-sidebar.tsx` — Only the dynamic import path changes
- `frontend/app/(system)/(merchants)/merchants/[id]/edit/merchant-details-tab.tsx` — Only the dynamic import path changes
- `frontend/app/(system)/(my-store)/my-store/settings/my-store-details-tab.tsx` — Only the dynamic import path changes
- All backend files — completely untouched

## Technical Details

### APIProvider Placement
The `<APIProvider apiKey={...}>` wrapper needs to be placed high enough in the component tree to wrap all map components. Two options:
1. **Per-component**: Each map component wraps itself in `<APIProvider>`. Simpler, no layout changes.
2. **Layout-level**: Add `<APIProvider>` to the storefront layout / system layout. Cleaner if multiple maps are on one page.

**Decision**: Per-component is safer — each dynamically-imported map component wraps itself, avoiding SSR issues with the provider.

### MapLocationPicker (Admin) — Key Differences
| Feature | Leaflet | Google Maps |
|---|---|---|
| Click to place | `useMapEvents({ click })` | `<Map onClick={...}>` |
| Draggable marker | `<Marker draggable eventHandlers={{ dragend }}>` | `<AdvancedMarker draggable onDragEnd={...}>` |
| Fit/zoom | `map.setView([lat, lng], zoom)` | `useMap()` + `map.panTo()` / `map.setZoom()` |
| Tiles | OpenStreetMap (free) | Google Maps (API key, usage-based billing) |

### MerchantMapView (Portal) — Key Differences
| Feature | Leaflet | Google Maps |
|---|---|---|
| Markers | `<Marker>` + `<Popup>` | `<AdvancedMarker>` + `<InfoWindow>` |
| Fit bounds | `L.latLngBounds` + `map.fitBounds()` | `useMap()` + `map.fitBounds(new google.maps.LatLngBounds(...))` |
| User circle | `<Circle center={...} radius={...}>` | Need custom overlay or `google.maps.Circle` |
| Radius circle | Same | Same approach |

### Google Maps Circle for Radius
`@vis.gl/react-google-maps` doesn't have a built-in `<Circle>` component. Options:
1. Use `useMap()` + `new google.maps.Circle(...)` imperatively
2. Use `useMapsLibrary('maps')` to access the Circle class
3. Skip the visual circle — just filter markers by radius without drawing it

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| API key exposed in client bundle | Certain (it's a public key) | Restrict API key to specific domains + APIs in Google Cloud Console |
| Google Maps billing costs | Low for dev/demo | Free tier: 28,000 map loads/month ($200 credit). Demo usage well within limits |
| SSR crash with `<APIProvider>` | High without dynamic import | Same `ssr: false` pattern used for Leaflet applies to Google Maps |
| `<Circle>` not available as React component | Medium | Use imperative `google.maps.Circle` via `useMap()` hook |
| AdvancedMarker requires Map ID | Medium | Create a Map ID in Google Cloud Console, or fall back to `<Marker>` (deprecated but still works) |

## Open Questions

- None — all decisions made

## Next Steps

- [ ] Create implementation plan with `/knowledge-garden:plan`
- [ ] Implement: swap packages, rewrite 3 map components, update env vars
- [ ] Test: verify all map features work with Google Maps
