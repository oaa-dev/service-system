# Plan: Migrate from Leaflet to Google Maps API

**Date:** 2026-02-27
**Type:** migration
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- Backend is map-agnostic — `addresses` table stores `latitude`/`longitude` as plain decimal columns. API endpoints return coordinates via `AddressResource`. No backend changes needed.
- Leaflet SSR workaround uses `dynamic(() => import(...), { ssr: false })`. Google Maps via `@vis.gl/react-google-maps` has the same SSR limitation — dynamic imports with `ssr: false` still required.
- `leaflet-setup.ts` files exist solely to fix Leaflet's broken default marker icons. Google Maps has no such issue — these files can be deleted.

### Known Gotchas
- `@vis.gl/react-google-maps` does NOT have a built-in `<Circle>` component — must use imperative `google.maps.Circle` via `useMap()` hook
- `<AdvancedMarker>` requires a Map ID from Google Cloud Console. Fall back to basic `<Marker>` (deprecated but functional) if no Map ID is provided
- `<APIProvider>` accesses browser APIs — must be inside dynamically imported components (per-component wrapping), not at layout level
- Pre-existing build errors in both frontends (`/_global-error` in portal, `/register/merchant` in admin) are unrelated to this migration

### Critical Patterns Applied
- Per-component `<APIProvider>` wrapping (each map component wraps itself, avoiding SSR crashes)
- Same `ssr: false` dynamic import pattern already used for Leaflet
- Env var pattern: `NEXT_PUBLIC_*` for client-accessible config

## Overview

Replace Leaflet + OpenStreetMap with Google Maps JavaScript API across both frontends. No backend changes. Pure frontend library swap: 3 map components rewritten, 2 icon-fix files deleted, packages swapped, env vars added.

## Implementation Steps

### Phase 1: Admin Frontend — Package Swap & MapLocationPicker

#### Step 1: Swap npm packages (admin)
- **Files:** `frontend/package.json`
- **Details:** Remove `leaflet`, `react-leaflet`, `@types/leaflet`. Add `@vis.gl/react-google-maps`.
- **Commands:**
  ```bash
  docker compose exec nextjs npm uninstall leaflet react-leaflet @types/leaflet
  docker compose exec nextjs npm install @vis.gl/react-google-maps
  ```

#### Step 2: Add env var (admin)
- **Files:** `frontend/.env.local`
- **Details:** Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>`. Optionally add `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` for styled maps.

#### Step 3: Delete leaflet-setup.ts (admin)
- **Files:** `frontend/lib/leaflet-setup.ts`
- **Details:** DELETE this file. Google Maps has no broken icon issue.

#### Step 4: Rewrite MapLocationPicker
- **Files:** `frontend/components/map-location-picker.tsx`
- **Details:** Replace Leaflet imports and components with Google Maps equivalents:
  - `<MapContainer>` → `<APIProvider>` + `<Map>`
  - `<TileLayer>` → removed (Google Maps provides tiles)
  - `<Marker draggable>` → `<AdvancedMarker draggable onDragEnd={...}>`
  - `useMapEvents({ click })` → `<Map onClick={...}>`
  - `leaflet/dist/leaflet.css` import → removed
  - `@/lib/leaflet-setup` import → removed
  - Keep: Card wrapper, coordinate display, clear button, all props/callbacks
  - Philippines center default: `{ lat: 12.8797, lng: 121.774 }`
  - `key` prop on MapContainer replaced with `key` on `<Map>` for re-centering
- **No changes to parent files** — dynamic import path and props stay the same

### Phase 2: Customer Portal — Package Swap & Map Components

#### Step 5: Swap npm packages (portal)
- **Files:** `frontend-customer-portal/package.json`
- **Details:** Remove `leaflet`, `react-leaflet`, `@types/leaflet`. Add `@vis.gl/react-google-maps`.
- **Commands:**
  ```bash
  docker compose exec nextjs-customer npm uninstall leaflet react-leaflet @types/leaflet
  docker compose exec nextjs-customer npm install @vis.gl/react-google-maps
  ```

#### Step 6: Add env var (portal)
- **Files:** `frontend-customer-portal/.env.local`
- **Details:** Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>`.

#### Step 7: Delete leaflet-setup.ts (portal)
- **Files:** `frontend-customer-portal/lib/leaflet-setup.ts`
- **Details:** DELETE this file.

#### Step 8: Remove Leaflet CSS import
- **Files:** `frontend-customer-portal/app/globals.css`
- **Details:** Remove the `@import "leaflet/dist/leaflet.css"` line.

#### Step 9: Rewrite MerchantMiniMap
- **Files:** `frontend-customer-portal/components/storefront/merchant-mini-map.tsx`
- **Details:** Replace Leaflet with Google Maps:
  - `<MapContainer>` → `<APIProvider>` + `<Map>`
  - `<TileLayer>` → removed
  - `<Marker>` + `<Popup>` → `<AdvancedMarker>` + `<InfoWindow>` (or just AdvancedMarker with title)
  - Keep: height h-48, zoom 15, non-interactive (disable zoom/pan controls), rounded corners
  - Map options: `disableDefaultUI: true`, `zoomControl: false`, `gestureHandling: 'none'`

#### Step 10: Rewrite MerchantMapView
- **Files:** `frontend-customer-portal/components/storefront/merchant-map-view.tsx`
- **Details:** Most complex rewrite — multiple markers, popups, auto-fit bounds, user location, radius circle:
  - `<MapContainer>` → `<APIProvider>` + `<Map>`
  - `<TileLayer>` → removed
  - `<Marker>` + `<Popup>` per merchant → `<AdvancedMarker>` with `onClick` to toggle `<InfoWindow>`
  - `FitBounds` component → `useMap()` hook + `map.fitBounds(new google.maps.LatLngBounds(...))` in useEffect
  - `L.latLngBounds(points)` → `new google.maps.LatLngBounds()` with `.extend()` per point
  - `<Circle>` → imperative `new google.maps.Circle(...)` created/updated via `useMap()` + `useMapsLibrary('maps')` in useEffect
  - User location marker → `<AdvancedMarker>` with custom pin color (blue) to distinguish from merchant markers
  - Keep: h-[600px] height, scrollWheelZoom, merchant card popup with name/type/link
  - Remove `import L from 'leaflet'` — no longer needed
- **No changes to parent page** — dynamic import path stays the same

### Phase 3: Verification

#### Step 11: TypeScript check (admin)
- **Commands:** `docker compose exec nextjs npx tsc --noEmit`
- **Details:** Verify no type errors after removing Leaflet types and adding Google Maps types.

#### Step 12: TypeScript check (portal)
- **Commands:** `docker compose exec nextjs-customer npx tsc --noEmit`
- **Details:** Same verification for customer portal.

#### Step 13: Build check (admin)
- **Commands:** `docker compose exec nextjs npm run build`
- **Details:** Verify build succeeds. Pre-existing `/register/merchant` error is expected and unrelated.

#### Step 14: Build check (portal)
- **Commands:** `docker compose exec nextjs-customer npm run build`
- **Details:** Verify build succeeds. Pre-existing `/_global-error` error is expected and unrelated.

## Unchanged Files

These files have NO Leaflet dependency and need zero changes:
- `frontend-customer-portal/lib/geo-utils.ts` — Haversine math (pure JS)
- `frontend-customer-portal/hooks/useGeolocation.ts` — Browser Geolocation API (pure JS)
- `frontend-customer-portal/hooks/useStorefront.ts` — React Query hooks
- `frontend-customer-portal/services/storefrontService.ts` — API calls
- `frontend-customer-portal/components/storefront/search-filters.tsx` — Radius dropdown UI
- `frontend-customer-portal/components/storefront/merchant-sidebar.tsx` — Only has dynamic import (path unchanged)
- `frontend-customer-portal/app/(storefront)/merchants/page.tsx` — Only has dynamic import (path unchanged)
- `frontend/app/(system)/(merchants)/merchants/[id]/edit/merchant-details-tab.tsx` — Only has dynamic import (path unchanged)
- `frontend/app/(system)/(my-store)/my-store/settings/my-store-details-tab.tsx` — Only has dynamic import (path unchanged)
- All backend files — completely untouched

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| API key exposed in client bundle | Certain (public key) | Restrict to domains + Maps JavaScript API in Google Cloud Console |
| Google Maps billing | Low for dev/demo | Free tier: 28,000 loads/month ($200 credit) |
| SSR crash with `<APIProvider>` | High without dynamic import | Same `ssr: false` pattern already in use |
| `<Circle>` not a React component | Certain | Imperative `google.maps.Circle` via `useMap()` hook |
| AdvancedMarker requires Map ID | Medium | Works without Map ID using default pin; Map ID adds custom styling |

## Testing Strategy

- [ ] Admin: MapLocationPicker renders, click places pin, drag repositions, clear removes
- [ ] Admin: Coordinate values update in form when pin changes
- [ ] Portal: MerchantMiniMap shows single pin at correct location
- [ ] Portal: MerchantMapView shows multiple merchant markers with popups
- [ ] Portal: Auto-fit bounds adjusts view to show all visible markers
- [ ] Portal: User location marker appears when geolocation is granted
- [ ] Portal: Radius circle renders around user location when radius filter is active
- [ ] Portal: Clicking marker popup "View details" navigates to merchant page
- [ ] TypeScript clean in both frontends
- [ ] Builds succeed in both frontends (ignoring pre-existing errors)

## Open Questions

- None — all decisions made in brainstorm
