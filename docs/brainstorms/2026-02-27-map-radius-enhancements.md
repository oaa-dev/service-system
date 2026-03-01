# Brainstorm: Map & Radius Search Enhancements

**Date:** 2026-02-27
**Status:** Draft

## Knowledge Context

- Backend is map-agnostic — `addresses` table stores `latitude`/`longitude` as `DECIMAL(10,8)` / `DECIMAL(11,8)`. The `AddressResource` already returns coordinates. The polymorphic address relationship is via `HasAddress` trait.
- Frontend uses `@vis.gl/react-google-maps` (just migrated from Leaflet). Map components are dynamically imported with `ssr: false`.
- `geo-utils.ts` has a client-side Haversine implementation already used for radius filtering.
- `useGeolocation` hook uses `getCurrentPosition` (one-shot), not `watchPosition`.
- `RadiusCircle` is imperative (`google.maps.Circle` via `useMap()`) since the library has no declarative `<Circle>` component.
- Eager load + Resource = atomic pair pattern: when adding relations to `->with()`, always add matching `whenLoaded()` in Resource.

## Problem / Goal

The customer portal's merchant map already has the core features (user location, radius circle, radius filtering, merchant markers with popups). Four enhancements are needed:

1. **Distance in popup** — Show "2.3 km away" in the merchant InfoWindow
2. **Person icon for user location** — Replace the blue pin with a person/GPS-style icon
3. **Backend distance filtering** — Server-side Haversine query on the `/storefront/merchants/map` endpoint so we don't fetch ALL merchants client-side
4. **Live location tracking** — Use `watchPosition` instead of `getCurrentPosition` so the map updates as the user moves

Additionally: **Radius filter should only apply in map view**, not the list view (card grid).

## Existing Implementation

| File | What It Does |
|------|-------------|
| `frontend-customer-portal/hooks/useGeolocation.ts` | One-shot `getCurrentPosition` with `refresh()` callback |
| `frontend-customer-portal/lib/geo-utils.ts` | `haversineDistance()` + `filterByRadius()` — pure client-side math |
| `frontend-customer-portal/components/storefront/merchant-map-view.tsx` | Google Maps with `AdvancedMarker`, `InfoWindow`, `FitBounds`, `RadiusCircle` |
| `frontend-customer-portal/components/storefront/search-filters.tsx` | Radius dropdown (1/3/5/10/25/50 km), disabled when no geolocation |
| `frontend-customer-portal/app/(storefront)/merchants/page.tsx` | Orchestrates everything — `filterByRadius` applied to both list and map merchants |
| `backend/app/Services/StorefrontService.php` | `getAllActiveMerchants()` returns ALL active merchants (no distance filter) |
| `backend/routes/api.php` | `GET /storefront/merchants/map` — calls `mapMerchants()` controller method |

## Enhancement Details

### 1. Distance in InfoWindow Popup

**Current:** InfoWindow shows merchant name, business type, "View details" link.
**Goal:** Add a line like "2.3 km away" when user location is available.

**Approach:** Calculate distance client-side using existing `haversineDistance()` from `geo-utils.ts`. Pass `userLocation` into the InfoWindow render logic.

- No backend changes needed — the distance is ephemeral (depends on user's current position)
- Format: `< 1 km` → "X m away", `>= 1 km` → "X.X km away"
- Only show when `userLocation` is available
- Add to `MerchantMapView` component — compute distance when rendering InfoWindow content

### 2. Person Icon for User Location

**Current:** Blue `<Pin>` component (`background="#3b82f6"`)
**Goal:** Custom HTML marker with a person/GPS icon

**Approach:** Replace `<Pin>` child of the user location `<AdvancedMarker>` with custom HTML:
```tsx
<AdvancedMarker position={...}>
  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 border-2 border-white shadow-lg">
    <svg><!-- person or GPS dot icon --></svg>
  </div>
</AdvancedMarker>
```

Options:
- **Pulsing blue dot** (Google Maps style) — a blue dot with a pulsing ring animation. Clean, familiar.
- **Person icon** — lucide `User` icon in a blue circle. More distinctive but less conventional.
- **GPS crosshair** — lucide `Crosshair` icon. Technical feel.

**Decision:** Pulsing blue dot — it's the universally recognized "you are here" indicator.

### 3. Backend Distance Filtering

**Current:** `GET /storefront/merchants/map` returns ALL active merchants. Client filters with `filterByRadius()`.
**Goal:** Pass `lat`, `lng`, `radius` query params so the API returns only nearby merchants + their distance.

**Approach:** Add Haversine formula to the SQL query in `StorefrontService::getAllActiveMerchants()`.

```php
// New method signature:
public function getNearbyMerchants(float $lat, float $lng, float $radiusKm)

// SQL using Haversine:
$haversine = "(6371 * acos(cos(radians(?)) * cos(radians(addresses.latitude)) * cos(radians(addresses.longitude) - radians(?)) + sin(radians(?)) * sin(radians(addresses.latitude))))";

Merchant::where('status', 'active')
    ->join('addresses', function ($join) {
        $join->on('addresses.addressable_id', '=', 'merchants.id')
             ->where('addresses.addressable_type', '=', Merchant::class);
    })
    ->whereNotNull('addresses.latitude')
    ->whereNotNull('addresses.longitude')
    ->selectRaw("merchants.*, {$haversine} AS distance", [$lat, $lng, $lat])
    ->having('distance', '<=', $radiusKm)
    ->orderBy('distance')
    ->with([...])
    ->get();
```

**Key decisions:**
- **Keep existing client-side filter as fallback** when no lat/lng params provided (the map endpoint without params still returns all merchants)
- **Add `distance` field to response** — computed per-request, not stored. Frontend can display it directly instead of recalculating
- **Validation:** lat between -90/90, lng between -180/180, radius between 0.1 and 100
- **Performance:** For the current scale (demo app, < 1000 merchants), raw Haversine SQL is fine. No spatial index needed. If scale grows, add `SPATIAL INDEX` on a `POINT` column later.
- **Polymorphic join:** Since addresses are polymorphic (`addressable_type` + `addressable_id`), the join must filter by `addressable_type = Merchant::class`

**API change:**
```
GET /storefront/merchants/map                          → all active merchants (existing)
GET /storefront/merchants/map?lat=X&lng=Y&radius=10    → nearby merchants within 10km, sorted by distance
```

Response adds `distance` field (km, 2 decimal places) when lat/lng provided.

### 4. Live Location Tracking

**Current:** `useGeolocation` calls `getCurrentPosition` once on mount + exposes `refresh()`.
**Goal:** Use `watchPosition` so the map auto-updates as the user moves.

**Approach:** Modify `useGeolocation` hook:
```tsx
// Add option for continuous tracking
export function useGeolocation(options?: { watch?: boolean }) {
  // If watch mode, use navigator.geolocation.watchPosition
  // Return cleanup via clearWatch in useEffect cleanup
  // Throttle/debounce updates to avoid excessive re-renders (e.g., max 1 update per 5 seconds)
}
```

**Key decisions:**
- **Default to `watch: false`** for backward compatibility. The merchants page opts in with `useGeolocation({ watch: true })`.
- **Throttle updates** — GPS can fire many times per second. Throttle to every 5 seconds to avoid re-rendering the map constantly.
- **Battery consideration** — `enableHighAccuracy: true` with `watchPosition` uses more battery. Acceptable for a map page but should stop when user leaves.
- **Cleanup** — `clearWatch()` in useEffect cleanup to stop tracking when component unmounts.
- **Re-fetch nearby merchants** — When user location changes significantly (> 100m), the frontend should re-query the backend `/map?lat=...&lng=...&radius=...` endpoint.

### 5. Radius Filter — Map View Only

**Current:** `filterByRadius` applies to both list view merchants and map view merchants in `merchants/page.tsx`.
**Goal:** Radius filter only affects map view. List view always shows all paginated results.

**Approach:** In `merchants/page.tsx`:
- Remove the `filterByRadius` call from the `merchants` useMemo (list view data)
- Keep it in the `mapMerchants` useMemo (or better: rely on backend filtering when params are provided)
- The radius dropdown should still be visible in both views (so user can set it before switching to map) but only applied in map mode

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Haversine SQL performance at scale | Low (demo app) | Fine for < 10k merchants. Add spatial index if needed later |
| `watchPosition` battery drain | Medium | Throttle to 5s intervals, `clearWatch` on unmount |
| Polymorphic join complexity | Low | Well-understood pattern, tested |
| Distance accuracy near poles | Negligible | Haversine is accurate enough for km-level filtering |
| Excessive API calls from live tracking | Medium | Only re-fetch when location changes > 100m |

## Open Questions

- None — all decisions made

## Next Steps

- [ ] Create implementation plan with `/plan`
- [ ] Implement: backend distance query, frontend enhancements, hook upgrade
- [ ] Test: verify all map features work end-to-end
