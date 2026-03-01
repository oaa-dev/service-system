# Brainstorm: Merchant Maps & Radius Search

**Date:** 2026-02-27
**Status:** Draft (updated: switched from Google Maps to Leaflet)

## Knowledge Context

- **Eager load + Resource = atomic pair**: When adding lat/lng to AddressResource, ensure the address relation is already eager-loaded in StorefrontService (confirmed: both list and detail endpoints already load `address.geoCity`, `address.province`).
- Existing iframe map on merchant detail sidebar works via text-geocode (`?q=address&output=embed`). It's imprecise for PH addresses and cannot support multi-marker maps.
- No latitude/longitude exists anywhere in the database currently. The `addresses` table has FK references to PSGC geographic hierarchy (Region → Province → City → Barangay) but no coordinates.
- No mapping library is currently installed.

## Problem / Goal

### Feature 1: Merchant Detail Mini-Map
- Upgrade the existing iframe map on `/merchants/<slug>` sidebar to use a proper Leaflet map with a pin based on stored lat/lng coordinates
- Move to the **left column** (main content area) instead of the sidebar, for better visibility

### Feature 2: Merchant Listing Map View
- Add a Map/List toggle to `/merchants` that switches between the current card grid and a full-screen interactive map
- Map shows markers for all merchants in the current filter results
- User's current location shown via browser Geolocation API
- Radius circle filter: user sets a radius (e.g., 1km, 3km, 5km, 10km) and only merchants within that radius are shown
- Filters: business type, open now, radius — all apply to the map view
- Clicking a marker shows a popup with merchant name, type, and link to detail page

## Approaches Decided

### Map Library: Leaflet + OpenStreetMap
- **Packages:** `leaflet`, `react-leaflet`, `@types/leaflet`
- **Why:** Completely free, no API key required, no usage limits, open-source. Good marker/circle/popup support. Well-maintained React bindings.
- **Tile provider:** OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- **Tradeoff:** Slightly less polished than Google Maps, but fully functional for markers, circles, popups, and geolocation. No geocoding needed since we'll store coordinates directly.

### Coordinate Storage: On addresses table
- **Migration:** Add `latitude DECIMAL(10,8)` and `longitude DECIMAL(11,8)` nullable columns to `addresses` table
- **Benefits:** All addressable models (merchants, customers) get coordinates
- **Updates needed:** Address model `$fillable`, AddressResource, AddressData DTO, TypeScript Address type, DemoMerchantSeeder
- **Seeding:** Generate realistic coordinates per Philippine region (Metro Manila: ~14.5°N, 121.0°E; Cebu: ~10.3°N, 123.9°E; etc.) with small random offsets

### Listing Map Layout: Toggle Button (List / Map)
- Toggle button in the page header switches between grid view and map view
- Map view: full-width Leaflet map with markers, user location dot, radius circle
- Filters bar stays visible in both views
- Shared filter state between list and map views
- Map view loads all merchants (no pagination) for the current filters — radius filter applied client-side based on distance from user location

### Mini-Map on Detail Page
- Replace iframe with Leaflet `<MapContainer>` + `<Marker>` + `<TileLayer>`
- Position in the left column (main content) below the gallery section, above services
- Compact card with address text + interactive map (~250px height)

## Technical Details

### Backend Changes
1. **Migration:** `add_coordinates_to_addresses_table`
   - `$table->decimal('latitude', 10, 8)->nullable()`
   - `$table->decimal('longitude', 11, 8)->nullable()`
2. **Address model:** Add `latitude`, `longitude` to `$fillable` and `$casts` (as float)
3. **AddressResource:** Add `'latitude' => $this->latitude`, `'longitude' => $this->longitude`
4. **AddressData DTO:** Add `latitude`, `longitude` fields
5. **DemoMerchantSeeder:** Generate coordinates based on Philippine city regions with random offsets
6. **StorefrontService:** For map view, add a `getAllActiveMerchants()` method (no pagination) that returns minimal merchant data with coordinates

### Frontend Changes
1. **Install:** `leaflet react-leaflet @types/leaflet`
2. **CSS:** Import Leaflet CSS in layout or component (`leaflet/dist/leaflet.css`)
3. **Types:** Add `latitude`, `longitude` to `Address` TypeScript interface
4. **New components (all dynamic-imported with `ssr: false` since Leaflet requires `window`):**
   - `MerchantMapView` — full map with markers, user location, radius circle (`<MapContainer>`, `<TileLayer>`, `<Marker>`, `<Circle>`, `<Popup>`)
   - `MerchantMiniMap` — compact map for detail page
5. **Listing page:** Add List/Map toggle, conditionally render grid or map
6. **Detail page:** Add mini-map section in left column
7. **Hooks:** Add `useStorefrontMerchantsAll()` for unpaginated map data; add `useGeolocation()` for browser location

### Leaflet SSR Handling
Leaflet accesses `window` directly, which breaks Next.js SSR. Solution:
```tsx
import dynamic from 'next/dynamic';
const MerchantMapView = dynamic(() => import('@/components/storefront/merchant-map-view'), { ssr: false });
```

### Radius Filtering
- Client-side distance calculation using Haversine formula
- User selects radius from dropdown: 1km, 3km, 5km, 10km, 25km, 50km
- Only merchants within the radius of user's GPS position are shown
- If geolocation denied, radius filter is disabled (greyed out)

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Leaflet SSR crash in Next.js | High | Use `dynamic(() => import(...), { ssr: false })` for all map components |
| Browser geolocation denied | Medium | Show all merchants without radius; disable radius filter with helpful message |
| Large number of markers on map | Low | Only 40 active demo merchants. For production, use `react-leaflet-cluster` |
| PSGC data not loaded (no addresses) | Medium | Already handled: seeder skips addresses when PSGC data missing; map handles null coordinates gracefully |
| OpenStreetMap tile accuracy for PH | Low | OSM has good coverage in the Philippines; tiles are adequate for marker display |

## Open Questions

- None — all decisions made

## Next Steps

- [ ] Create implementation plan with `/knowledge-garden:plan`
- [ ] Implement backend (migration, model, resource, seeder)
- [ ] Implement frontend (map components, toggle, radius filter)
