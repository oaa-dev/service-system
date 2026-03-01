# Plan: Merchant Maps & Radius Search (Leaflet)

**Date:** 2026-02-27
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-02-27-merchant-maps-and-radius-search.md](../brainstorms/2026-02-27-merchant-maps-and-radius-search.md)

## Knowledge Context

### Relevant Learnings
- [Eager load + Resource = atomic pair](../knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md): When adding fields to AddressResource, ensure they serialize correctly. Lat/lng are plain columns (not relations), so they flow through automatically once added to the resource — no `whenLoaded()` needed.

### Known Gotchas
- **Leaflet SSR crash**: Leaflet accesses `window` directly. All map components must use `dynamic(() => import(...), { ssr: false })` in Next.js.
- **Coordinates are nullable**: Existing addresses have no lat/lng. Frontend must handle `null` gracefully (hide map, show "Location not available").
- **Client-side filtering after server pagination**: The current listing page applies some filters client-side on a paginated page. For radius filtering, we need an unpaginated endpoint to avoid filtering a subset.

### Critical Patterns Applied
- Service-Repository pattern for new StorefrontService method
- AddressResource always serializes lat/lng (no eager-load dependency since they're columns, not relations)
- `$fillable` + `$casts` on Address model for new columns
- Spatie `Optional` pattern on AddressData DTO

## Overview

Add interactive Leaflet maps across the platform:
1. **Coordinate storage** — `latitude`/`longitude` on the `addresses` table
2. **Merchant management location picker** — Map-based pin placement in the admin/self-service merchant edit form so merchants can set their exact location
3. **Merchant detail mini-map** — Replace the Google iframe embed in the sidebar with a Leaflet map showing the merchant's pin
4. **Merchant listing map view** — Map/List toggle on the merchants page; map shows all merchants as markers with popups
5. **Radius filtering** — Browser geolocation + radius dropdown filters merchants by distance (Haversine, client-side)

## Implementation Steps

### Phase 1: Backend — Coordinate Storage

#### Step 1.1: Migration
- **Files:** `backend/database/migrations/YYYY_MM_DD_HHMMSS_add_coordinates_to_addresses_table.php`
- **Details:**
  - `$table->decimal('latitude', 10, 8)->nullable()->after('barangay_id')`
  - `$table->decimal('longitude', 11, 8)->nullable()->after('latitude')`
  - Down: drop both columns

#### Step 1.2: Address Model
- **Files:** `backend/app/Models/Address.php`
- **Details:**
  - Add `'latitude'`, `'longitude'` to `$fillable`
  - Add `protected $casts = ['latitude' => 'float', 'longitude' => 'float']`

#### Step 1.3: AddressData DTO
- **Files:** `backend/app/Data/AddressData.php`
- **Details:**
  - Add `public float|Optional|null $latitude = new Optional()`
  - Add `public float|Optional|null $longitude = new Optional()`

#### Step 1.4: AddressResource
- **Files:** `backend/app/Http/Resources/Api/V1/AddressResource.php`
- **Details:**
  - Add `'latitude' => $this->latitude` and `'longitude' => $this->longitude` to `toArray()`
  - These are plain columns, not relations — no `whenLoaded()` needed
- **Knowledge note:** Eager load + Resource atomic pair pattern confirmed — no additional eager loading changes needed in StorefrontService since coordinates are columns on the already-loaded `address` relation

#### Step 1.5: DemoMerchantSeeder
- **Files:** `backend/database/seeders/DemoMerchantSeeder.php`
- **Details:**
  - In `seedAddress()`, add coordinates based on Philippine geography:
    - Look up the region name from the selected region_id
    - Use a region→coordinate center mapping (Metro Manila: 14.5995/120.9842, Cebu: 10.3157/123.8854, Davao: 7.1907/125.4553, etc.)
    - Add small random offset (±0.01-0.05 degrees) for variety
  - Ensures all demo merchants have realistic coordinates for map testing

#### Step 1.6: Backend Validation Rules
- **Files:**
  - `backend/app/Http/Requests/Api/V1/Merchant/UpdateMerchantRequest.php`
  - `backend/app/Http/Requests/Api/V1/Merchant/UpdateMyMerchantRequest.php`
  - `backend/app/Http/Requests/Api/V1/Profile/UpdateProfileRequest.php`
- **Details:**
  - Add to all three request files (inside the `address.*` rules):
    - `'address.latitude' => ['nullable', 'numeric', 'between:-90,90']`
    - `'address.longitude' => ['nullable', 'numeric', 'between:-180,180']`
  - No changes to `HasAddress::updateOrCreateAddress()` — it already passes the full `$data` array to `updateOrCreate()`, so lat/lng flow through automatically once they're in `$fillable`
  - No changes to `MerchantService::updateMerchant()` — the address DTO captures lat/lng via AddressData, which already gets passed to `updateOrCreateAddress($addressData->toArray())`

#### Step 1.7: StorefrontService — Unpaginated Endpoint
- **Files:**
  - `backend/app/Services/StorefrontService.php`
  - `backend/app/Services/Contracts/StorefrontServiceInterface.php`
  - `backend/app/Http/Controllers/Api/V1/StorefrontController.php`
  - `backend/routes/api.php`
- **Details:**
  - Add `getAllActiveMerchants()` method to StorefrontService — returns all active merchants with address + businessType + media (no pagination)
  - Lean eager-loading for map: `['businessType', 'media', 'address.geoCity', 'address.province']` (same as list)
  - Add `mapMerchants()` controller method returning the collection
  - Route: `GET /storefront/merchants/map` (public, no auth)
  - Returns minimal data sufficient for markers: id, name, slug, logo, business_type, address (with lat/lng), business_hours (for "open now")

#### Step 1.8: Backend Tests
- **Files:** `backend/tests/Feature/Api/V1/StorefrontControllerTest.php`
- **Details:**
  - Test: merchant list response includes `latitude`/`longitude` in address
  - Test: merchant detail response includes `latitude`/`longitude` in address
  - Test: `GET /storefront/merchants/map` returns all active merchants (unpaginated) with coordinates
  - Test: map endpoint excludes inactive/pending merchants

### Phase 2: Admin Frontend — Merchant Location Picker

#### Step 2.1: Install Leaflet in Admin Frontend
- **Files:** `frontend/package.json`
- **Details:**
  - `cd frontend && npm install leaflet react-leaflet && npm install -D @types/leaflet`
  - Same packages as customer portal but separate install (different Next.js app)

#### Step 2.2: Leaflet Icon Fix + CSS (Admin)
- **Files:** `frontend/lib/leaflet-setup.ts`
- **Details:**
  - Same Leaflet default icon fix as customer portal (marker-icon path resolution for bundlers)
  - Import Leaflet CSS in the component or a shared layout

#### Step 2.3: Admin TypeScript Types
- **Files:** `frontend/types/api.ts`
- **Details:**
  - Add `latitude: number | null` and `longitude: number | null` to `Address` interface (read shape)
  - Add `latitude?: number | null` and `longitude?: number | null` to `AddressInput` interface (write shape)

#### Step 2.4: Admin Validation Schema
- **Files:** `frontend/lib/validations.ts`
- **Details:**
  - Add to `addressSchema`:
    ```ts
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    ```

#### Step 2.5: MapLocationPicker Component
- **Files:** `frontend/components/map-location-picker.tsx`
- **Details:**
  - Interactive Leaflet map with a **draggable marker** for pinning a location
  - Props:
    - `latitude: number | null` — current lat value
    - `longitude: number | null` — current lng value
    - `onChange: (lat: number | null, lng: number | null) => void` — callback when pin is moved
    - `disabled?: boolean`
  - Features:
    - Map renders at ~300px height with OpenStreetMap tiles
    - If lat/lng provided: shows marker at that position, map centered there
    - If no lat/lng: centers on Philippines (lat 12.8797, lng 121.7740, zoom 6) with a prompt "Click to place a pin"
    - User clicks the map → places/moves the marker → calls `onChange(lat, lng)`
    - Marker is draggable — dragging calls `onChange` with new position
    - Shows coordinate text below the map: "Lat: 14.5995, Lng: 120.9842" (read-only display)
    - Optional: "Clear pin" button to reset to null
  - **Must be dynamically imported with `ssr: false`** in the parent component
  - Uses `useMapEvents` hook from react-leaflet for click handling
  - Uses `Marker` with `draggable={true}` and `eventHandlers={{ dragend }}` for drag

#### Step 2.6: Update AddressFormFields Component
- **Files:** `frontend/components/address-form-fields.tsx`
- **Details:**
  - Add two hidden `<input>` fields for `{namePrefix}.latitude` and `{namePrefix}.longitude` (controlled by the map picker, not manually editable)
  - These are registered with the form via `control` but not rendered as visible text inputs
  - The `MapLocationPicker` reads/writes these fields via `form.watch()` and `form.setValue()`

#### Step 2.7: Integrate Map into Merchant Details Tab
- **Files:** `frontend/app/(system)/(merchants)/merchants/[id]/edit/merchant-details-tab.tsx`
- **Details:**
  - After the `<AddressFormFields>` component (and before the Submit button), add the dynamically-imported `MapLocationPicker`
  - Wire it to the form:
    ```tsx
    const MapLocationPicker = dynamic(() => import('@/components/map-location-picker'), { ssr: false });

    // In the JSX, after <AddressFormFields>:
    <MapLocationPicker
      latitude={form.watch('address.latitude')}
      longitude={form.watch('address.longitude')}
      onChange={(lat, lng) => {
        form.setValue('address.latitude', lat, { shouldDirty: true });
        form.setValue('address.longitude', lng, { shouldDirty: true });
      }}
      disabled={updateMutation.isPending}
    />
    ```
  - Update form default values to include: `latitude: merchant.address?.latitude || null`, `longitude: merchant.address?.longitude || null`
  - Update onSubmit cleaning to include lat/lng in the `addressInput` object:
    ```tsx
    latitude: data.address.latitude ?? undefined,
    longitude: data.address.longitude ?? undefined,
    ```
  - The map picker sits visually below the cascading address dropdowns, providing a visual confirmation of the location

#### Step 2.8: Self-Service Merchant Edit (My Store)
- **Files:** `frontend/app/(system)/(my-store)/my-store/settings/page.tsx` (or equivalent self-service edit page)
- **Details:**
  - Apply the same `MapLocationPicker` integration as the admin edit page
  - Self-service merchants use `PUT /auth/merchant` (via `UpdateMyMerchantRequest`) — validation rules already added in Step 1.6
  - Same form wiring pattern as Step 2.7

#### Step 2.9: Admin Frontend Build Check
- **Details:** `cd frontend && npm run build` — ensure no SSR errors from Leaflet dynamic imports

### Phase 3: Customer Portal Frontend — Package Setup & Types

#### Step 3.1: Install Leaflet Packages
- **Files:** `frontend-customer-portal/package.json`
- **Details:**
  - `npm install leaflet react-leaflet`
  - `npm install -D @types/leaflet`

#### Step 3.2: Leaflet CSS Import
- **Files:** `frontend-customer-portal/app/(storefront)/layout.tsx`
- **Details:**
  - Add `import 'leaflet/dist/leaflet.css'` in the storefront layout
  - This ensures CSS is available for all map components

#### Step 3.3: TypeScript Types
- **Files:** `frontend-customer-portal/types/api.ts`
- **Details:**
  - Add `latitude: number | null` and `longitude: number | null` to `Address` interface

### Phase 4: Customer Portal — Map Components

#### Step 4.1: Leaflet Default Icon Fix
- **Files:** `frontend-customer-portal/lib/leaflet-setup.ts`
- **Details:**
  - Leaflet's default marker icon breaks with bundlers (missing image paths). Create a setup file that fixes the default icon:
    ```ts
    import L from 'leaflet';
    import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
    import markerIcon from 'leaflet/dist/images/marker-icon.png';
    import markerShadow from 'leaflet/dist/images/marker-shadow.png';
    // Fix default icon
    L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x.src, iconUrl: markerIcon.src, shadowUrl: markerShadow.src });
    ```
  - Import this setup file in each map component

#### Step 4.2: Geolocation Hook
- **Files:** `frontend-customer-portal/hooks/useGeolocation.ts`
- **Details:**
  - Custom hook returning `{ latitude, longitude, error, loading, refresh }`
  - Uses `navigator.geolocation.getCurrentPosition()` on mount
  - Returns `null` coords if permission denied (with `error` message)
  - `refresh()` re-requests location

#### Step 4.3: Haversine Utility
- **Files:** `frontend-customer-portal/lib/geo-utils.ts`
- **Details:**
  - `haversineDistance(lat1, lng1, lat2, lng2): number` — returns distance in km
  - `filterByRadius(merchants, userLat, userLng, radiusKm): Merchant[]` — filters merchant array by distance
  - Used by both map view and list view when radius filter is active

#### Step 4.4: MerchantMiniMap Component
- **Files:** `frontend-customer-portal/components/storefront/merchant-mini-map.tsx`
- **Details:**
  - Small map card (h-48) with single marker at merchant's coordinates
  - Uses `MapContainer`, `TileLayer`, `Marker`, `Popup` from react-leaflet
  - Popup shows merchant name
  - Zoom level ~15 (street level)
  - Props: `latitude: number, longitude: number, merchantName: string`
  - If coordinates are null, render nothing (handled by parent)
  - **Must be dynamically imported with `ssr: false`**

#### Step 4.5: MerchantMapView Component
- **Files:** `frontend-customer-portal/components/storefront/merchant-map-view.tsx`
- **Details:**
  - Full-width map showing multiple merchant markers
  - Props: `merchants: Merchant[], userLocation?: {lat, lng}, radiusKm?: number`
  - Each marker: custom popup with merchant name, business type, "View" link to `/merchants/{slug}`
  - If `userLocation` provided: show a distinct marker/circle for user position
  - If `radiusKm` provided: draw a `Circle` component around user location
  - Auto-fit bounds to show all visible markers
  - **Must be dynamically imported with `ssr: false`**

#### Step 4.6: Dynamic Import Wrappers
- **Files:** Used in parent components (merchants page, merchant detail sidebar)
- **Details:**
  - In each parent that renders a map:
    ```tsx
    const MerchantMiniMap = dynamic(() => import('@/components/storefront/merchant-mini-map'), { ssr: false });
    const MerchantMapView = dynamic(() => import('@/components/storefront/merchant-map-view'), { ssr: false });
    ```

### Phase 5: Customer Portal — Merchant Detail Mini-Map

#### Step 5.1: Replace Iframe in Sidebar
- **Files:** `frontend-customer-portal/components/storefront/merchant-sidebar.tsx`
- **Details:**
  - Remove the existing Google Maps iframe embed (lines ~225-246)
  - Replace with dynamically-imported `MerchantMiniMap` component
  - Show only when `merchant.address?.latitude && merchant.address?.longitude`
  - Keep the address text above the map
  - Fallback: if no coordinates, show address text only (no map)

### Phase 6: Customer Portal — Merchant Listing Map View

#### Step 6.1: Storefront Hook for Map Data
- **Files:** `frontend-customer-portal/hooks/useStorefront.ts`, `frontend-customer-portal/services/storefrontService.ts`
- **Details:**
  - Add `getMapMerchants()` to storefrontService (calls `GET /storefront/merchants/map`)
  - Add `useStorefrontMapMerchants()` hook — `useQuery` with `staleTime: 60000`
  - Returns all active merchants (unpaginated) for map rendering

#### Step 6.2: Map/List Toggle UI
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/page.tsx`
- **Details:**
  - Add toggle button group (List icon / Map icon) in the page header, next to existing sort controls
  - State: `viewMode: 'list' | 'map'` (default `'list'`)
  - When `'map'`: render `MerchantMapView` instead of the card grid
  - When `'list'`: render existing card grid (unchanged)
  - Filters bar stays visible in both views

#### Step 6.3: Radius Filter Integration
- **Files:**
  - `frontend-customer-portal/components/storefront/search-filters.tsx`
  - `frontend-customer-portal/app/(storefront)/merchants/page.tsx`
- **Details:**
  - Add radius dropdown to search filters: Off, 1km, 3km, 5km, 10km, 25km, 50km
  - Radius filter only enabled when geolocation is available (greyed out + tooltip otherwise)
  - When radius is set: use `useGeolocation()` for user position, filter merchants via `filterByRadius()`
  - Radius filtering applies to both map and list views
  - Map view additionally shows the radius circle and user location marker

### Phase 7: Verification

#### Step 7.1: Run Backend Tests
- **Details:** `docker compose exec app php artisan test --filter=StorefrontControllerTest`

#### Step 7.2: Admin Frontend Build Check
- **Details:** `cd frontend && npm run build` — ensure no SSR errors from Leaflet dynamic imports

#### Step 7.3: Customer Portal Frontend Build Check
- **Details:** `cd frontend-customer-portal && npm run build` — ensure no SSR errors from Leaflet

#### Step 7.4: Visual Verification
- **Details:**
  - Admin: Edit a merchant, set coordinates via map picker, save, verify lat/lng persisted
  - Customer portal: Check merchants page in both list and map views
  - Customer portal: Verify mini-map on detail page shows the saved pin
  - Customer portal: Test radius filter with geolocation

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Leaflet SSR crash in Next.js | High (certain without `ssr: false`) | All map components use `dynamic(() => import(...), { ssr: false })` |
| Leaflet default icon broken with bundlers | High | Custom icon setup file fixes paths for marker-icon/shadow PNGs |
| Browser geolocation denied | Medium | Radius filter disabled with helpful message; all merchants shown without radius |
| Large marker count on map (production) | Low (40 demo merchants) | For production: add `react-leaflet-cluster` for marker clustering |
| Null coordinates on some merchants | Medium | Frontend checks `latitude && longitude` before rendering map; fallback to address text only |
| OpenStreetMap tile loading latency | Low | Tiles are cached by browser; lazy-load map components |
| Admin: merchant saves without placing pin | Low | Coordinates are nullable; storefront handles null gracefully (no map shown) |
| Admin: Leaflet SSR crash in admin frontend | High (certain without `ssr: false`) | MapLocationPicker dynamically imported with `ssr: false` |

## Testing Strategy

- [ ] Backend: `GET /storefront/merchants` returns `latitude`/`longitude` in address
- [ ] Backend: `GET /storefront/merchants/{slug}` returns coordinates in address
- [ ] Backend: `GET /storefront/merchants/map` returns all active merchants unpaginated
- [ ] Backend: Map endpoint excludes inactive merchants
- [ ] Backend: `PUT /merchants/{id}` accepts and saves lat/lng in address
- [ ] Backend: `PUT /merchants/{id}` validates lat range (-90 to 90) and lng range (-180 to 180)
- [ ] Admin frontend: `npm run build` succeeds (no SSR errors)
- [ ] Admin frontend: MapLocationPicker renders in merchant edit details tab
- [ ] Admin frontend: Clicking map places a draggable pin
- [ ] Admin frontend: Saving merchant persists coordinates to DB
- [ ] Admin frontend: Editing merchant with existing coordinates shows pin at saved location
- [ ] Customer portal: `npm run build` succeeds (no SSR errors)
- [ ] Customer portal: Mini-map renders on merchant detail page with correct pin location
- [ ] Customer portal: Map/List toggle works on merchants page
- [ ] Customer portal: Markers appear for all merchants on map view
- [ ] Customer portal: Clicking marker popup navigates to merchant detail
- [ ] Customer portal: Radius filter works when geolocation is granted
- [ ] Customer portal: Radius filter gracefully disabled when geolocation denied
- [ ] Customer portal: Map view with no coordinates shows empty map (no crash)

## Open Questions

- None — all decisions made in brainstorm phase

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `backend/database/migrations/*_add_coordinates_to_addresses_table.php` | Add lat/lng columns |
| `frontend/lib/leaflet-setup.ts` | Fix Leaflet default icon paths (admin) |
| `frontend/components/map-location-picker.tsx` | Interactive map with draggable pin for setting coordinates |
| `frontend-customer-portal/lib/leaflet-setup.ts` | Fix Leaflet default icon paths (customer portal) |
| `frontend-customer-portal/lib/geo-utils.ts` | Haversine distance + radius filter |
| `frontend-customer-portal/hooks/useGeolocation.ts` | Browser geolocation hook |
| `frontend-customer-portal/components/storefront/merchant-mini-map.tsx` | Detail page mini-map |
| `frontend-customer-portal/components/storefront/merchant-map-view.tsx` | Listing page full map |

### Modified Files
| File | Change |
|------|--------|
| `backend/app/Models/Address.php` | Add lat/lng to `$fillable` + `$casts` |
| `backend/app/Data/AddressData.php` | Add lat/lng fields |
| `backend/app/Http/Resources/Api/V1/AddressResource.php` | Add lat/lng to output |
| `backend/app/Http/Requests/Api/V1/Merchant/UpdateMerchantRequest.php` | Add lat/lng validation rules |
| `backend/app/Http/Requests/Api/V1/Merchant/UpdateMyMerchantRequest.php` | Add lat/lng validation rules |
| `backend/app/Http/Requests/Api/V1/Profile/UpdateProfileRequest.php` | Add lat/lng validation rules |
| `backend/database/seeders/DemoMerchantSeeder.php` | Seed coordinates |
| `backend/app/Services/StorefrontService.php` | Add `getAllActiveMerchants()` |
| `backend/app/Services/Contracts/StorefrontServiceInterface.php` | Add interface method |
| `backend/app/Http/Controllers/Api/V1/StorefrontController.php` | Add `mapMerchants()` |
| `backend/routes/api.php` | Add `/storefront/merchants/map` route |
| `backend/tests/Feature/Api/V1/StorefrontControllerTest.php` | Add coordinate + map tests |
| `frontend/types/api.ts` | Add lat/lng to Address + AddressInput types |
| `frontend/lib/validations.ts` | Add lat/lng to addressSchema |
| `frontend/components/address-form-fields.tsx` | Add hidden lat/lng form fields |
| `frontend/app/(system)/(merchants)/merchants/[id]/edit/merchant-details-tab.tsx` | Add MapLocationPicker + form wiring |
| `frontend/app/(system)/(my-store)/my-store/settings/page.tsx` | Add MapLocationPicker for self-service |
| `frontend-customer-portal/types/api.ts` | Add lat/lng to Address type |
| `frontend-customer-portal/hooks/useStorefront.ts` | Add `useStorefrontMapMerchants()` |
| `frontend-customer-portal/services/storefrontService.ts` | Add `getMapMerchants()` |
| `frontend-customer-portal/app/(storefront)/layout.tsx` | Import Leaflet CSS |
| `frontend-customer-portal/app/(storefront)/merchants/page.tsx` | Add map/list toggle + radius state |
| `frontend-customer-portal/components/storefront/merchant-sidebar.tsx` | Replace iframe with mini-map |
| `frontend-customer-portal/components/storefront/search-filters.tsx` | Add radius dropdown |
