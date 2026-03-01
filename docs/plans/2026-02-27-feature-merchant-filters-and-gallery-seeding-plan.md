# Plan: Merchant Listing Filters & Gallery Seeding

**Date:** 2026-02-27
**Type:** feature
**Status:** Draft
**Brainstorm:** [2026-02-27-merchant-listing-filters-and-gallery-seeding.md](../brainstorms/2026-02-27-merchant-listing-filters-and-gallery-seeding.md)

## Knowledge Context

### Relevant Learnings
- [Eager-Loaded Relation Missing from API Response](../knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md): When adding a relation to eager-load, always add the matching `whenLoaded()` in the Resource class. Applied to: paymentMethods on list endpoint, gallery media on detail endpoint.

### Critical Patterns Applied
- **Eager load + Resource = atomic pair**: Every new `->with()` addition gets a corresponding `whenLoaded()` in MerchantResource

## Overview

Add three new features to the merchant listing storefront:
1. **Open Now toggle** — client-side filter using already-loaded business hours
2. **Payment method dropdown** — new backend eager-load + public endpoint + client-side filter
3. **Gallery image seeding** — populate demo merchants with Lorem Picsum images via `addMediaFromUrl()`

Plus wire gallery data into the merchant detail API response and frontend display.

## Implementation Steps

### Step 1: Backend — Payment Methods on List Endpoint + Public Endpoint
- **Files:**
  - `backend/app/Services/StorefrontService.php`
  - `backend/app/Services/Contracts/StorefrontServiceInterface.php`
  - `backend/app/Http/Controllers/Api/V1/StorefrontController.php`
  - `backend/routes/api.php`
- **Details:**
  - Add `'paymentMethods'` to the eager-load array in `getActiveMerchants()` (currently: `['businessType', 'media', 'address.geoCity', 'address.province', 'businessHours']`)
  - Add `getActivePaymentMethods()` method to StorefrontService — returns `PaymentMethod::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug'])`
  - Add method signature to StorefrontServiceInterface
  - Add `paymentMethods()` action to StorefrontController
  - Add `GET /storefront/payment-methods` route
- **Knowledge note:** `payment_methods` already has `whenLoaded()` in MerchantResource — no Resource change needed (verified)

### Step 2: Backend — Gallery Media in Merchant Detail Response
- **Files:**
  - `backend/app/Services/StorefrontService.php`
  - `backend/app/Http/Resources/Api/V1/MerchantResource.php`
- **Details:**
  - The `media` relation is already eager-loaded on both list and detail endpoints (Spatie Media Library uses a single `media` morphMany)
  - Add gallery fields to MerchantResource using `$this->when($this->hasMedia(...))` pattern (same as existing `logo` field):
    ```php
    'gallery_feature' => $this->when($this->hasMedia('gallery_feature'), fn () => [
        'url' => $this->getFirstMediaUrl('gallery_feature'),
        'thumb' => $this->getFirstMediaUrl('gallery_feature', 'thumb'),
        'preview' => $this->getFirstMediaUrl('gallery_feature', 'preview'),
    ]),
    'gallery_photos' => $this->when($this->getMedia('gallery_photos')->isNotEmpty(), fn () =>
        $this->getMedia('gallery_photos')->map(fn ($m) => [
            'id' => $m->id,
            'url' => $m->getUrl(),
            'thumb' => $m->getUrl('thumb'),
            'preview' => $m->getUrl('preview'),
            'name' => $m->file_name,
        ])->values()
    ),
    // Same for gallery_interiors, gallery_exteriors
    ```
  - No StorefrontService change needed — `media` is already loaded

### Step 3: Gallery Image Seeding in DemoMerchantSeeder
- **Files:**
  - `backend/database/seeders/DemoMerchantSeeder.php`
- **Details:**
  - After creating each active merchant (first 40), add gallery images:
    - 1 `gallery_feature` image: `addMediaFromUrl('https://picsum.photos/seed/merchant-{id}-feature/800/600')->toMediaCollection('gallery_feature')`
    - 3-5 `gallery_photos`: `addMediaFromUrl('https://picsum.photos/seed/merchant-{id}-photo-{n}/800/600')->toMediaCollection('gallery_photos')`
    - 2-3 `gallery_interiors`: `addMediaFromUrl('https://picsum.photos/seed/merchant-{id}-interior-{n}/800/600')->toMediaCollection('gallery_interiors')`
    - 2-3 `gallery_exteriors`: `addMediaFromUrl('https://picsum.photos/seed/merchant-{id}-exterior-{n}/800/600')->toMediaCollection('gallery_exteriors')`
  - Use deterministic seeds (merchant index + collection + index) for reproducible images
  - Wrap in try-catch so network failures don't break the full seeder

### Step 4: Frontend — Payment Methods Hook + Service Method
- **Files:**
  - `frontend-customer-portal/services/storefrontService.ts`
  - `frontend-customer-portal/hooks/useStorefront.ts`
- **Details:**
  - Add `getPaymentMethods()` to storefrontService: `GET /storefront/payment-methods`
  - Add `useStorefrontPaymentMethods()` hook with `staleTime: Infinity` (reference data)

### Step 5: Frontend — Open Now Toggle + Payment Method Dropdown in SearchFilters
- **Files:**
  - `frontend-customer-portal/components/storefront/search-filters.tsx`
- **Details:**
  - Add new optional props:
    - `isOpenNowFilter?: boolean` — current toggle state
    - `onOpenNowToggle?: (value: boolean) => void`
    - `paymentMethods?: PaymentMethod[]` — list for dropdown
    - `selectedPaymentMethod?: number` — selected payment method ID
    - `onPaymentMethodChange?: (id: number | undefined) => void`
  - Add "Open Now" toggle chip (styled like capability chips) in the filter row
  - Add Payment Method dropdown (styled like Business Type dropdown) after the business type dropdown
  - Backward compatible — optional props, renders nothing if not provided

### Step 6: Frontend — Wire Filters into Listing Page
- **Files:**
  - `frontend-customer-portal/app/(storefront)/merchants/page.tsx`
- **Details:**
  - Add state: `isOpenNow` (boolean), `selectedPaymentMethodId` (number | undefined)
  - Fetch payment methods via `useStorefrontPaymentMethods()`
  - Client-side filter logic (applied after API data, before rendering):
    - Open Now: filter merchants where `isOpenNow(merchant.business_hours).isOpen === true`
    - Payment Method: filter merchants where `merchant.payment_methods?.some(pm => pm.id === selectedPaymentMethodId)`
  - Pass new props to SearchFilters
  - Update "Clear all filters" to reset new filters too
  - Update `hasActiveFilters` check to include new filters

### Step 7: Frontend — Gallery Section on Merchant Detail Page
- **Files:**
  - `frontend-customer-portal/types/api.ts`
  - `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx`
  - `frontend-customer-portal/components/storefront/merchant-header.tsx` (or new gallery component)
- **Details:**
  - Add gallery fields to Merchant TypeScript interface: `gallery_feature`, `gallery_photos`, `gallery_interiors`, `gallery_exteriors`
  - Add a gallery section below the MerchantHeader on the detail page
  - Simple grid layout: feature image full-width, then photos/interiors/exteriors in a masonry-style grid
  - Click to enlarge could be a future enhancement — for now just display the grid
  - Use `preview` URLs for display, `thumb` for any thumbnail strips

### Step 8: Backend Tests
- **Files:**
  - `backend/tests/Feature/Api/V1/StorefrontControllerTest.php`
- **Details:**
  - Add test: `GET /storefront/payment-methods` returns active payment methods
  - Add test: `GET /storefront/merchants` response includes `payment_methods` array per merchant
  - Add test: merchant detail response includes gallery fields when media exists

## Dependency Graph

```
Step 1 (backend payment methods) ──┐
Step 2 (backend gallery resource)  ├── Step 4 (frontend hooks) ── Step 5 (search filters) ── Step 6 (listing page)
Step 3 (gallery seeding)           │                                                          Step 7 (detail gallery)
                                   └── Step 8 (tests)
```

**Wave 1** (parallel — no dependencies):
- Step 1: Backend payment methods endpoint + eager-load
- Step 2: Backend gallery media in MerchantResource
- Step 3: Gallery image seeding

**Wave 2** (parallel — depends on Wave 1):
- Step 4: Frontend payment methods hook/service
- Step 5: SearchFilters expansion (Open Now + Payment Method)
- Step 7: Gallery section on detail page (depends on Step 2)
- Step 8: Backend tests (depends on Steps 1 & 2)

**Wave 3** (depends on Wave 2):
- Step 6: Wire everything into listing page (depends on Steps 4 & 5)

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Lorem Picsum unavailable during seeding | Low | Wrap in try-catch, log warning, skip gallery |
| Client-side filter reduces visible items below per_page | Medium | Acceptable for MVP; show "N merchants open now" count |
| Seeder timeout with many image downloads | Medium | Limit gallery images per merchant; use smaller dimensions if needed |

## Testing Strategy

- [ ] `GET /storefront/payment-methods` returns 200 with active payment methods
- [ ] `GET /storefront/merchants` includes `payment_methods` in each merchant object
- [ ] Merchant detail includes gallery fields when media is present
- [ ] Open Now toggle filters merchants client-side correctly
- [ ] Payment method dropdown filters merchants client-side correctly
- [ ] Gallery grid renders on detail page with seeded images
- [ ] All existing 13 storefront tests still pass
- [ ] TypeScript clean (0 errors), ESLint clean

## Open Questions

- None — all decisions made in brainstorm
