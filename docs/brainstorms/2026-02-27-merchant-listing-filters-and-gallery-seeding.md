# Brainstorm: Merchant Listing Filters & Gallery Seeding

**Date:** 2026-02-27
**Status:** Draft

## Knowledge Context

- **Eager load + Resource = atomic pair**: When adding a relation to `->with([...])` in a service, always add the matching `whenLoaded()` in the Resource class. Missing it silently omits the data from API responses. (Documented in `docs/knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md`)

## Problem / Goal

Enhance the merchant listing page at `http://localhost:3001/merchants` with additional filter capabilities and seed gallery images for demo merchants.

### Current State
- Listing page already has: search by name, business type dropdown, capability chip toggles, sort dropdown
- Backend `StorefrontService.getActiveMerchants()` already eager-loads `businessHours` on the list endpoint
- Merchant model has 4 gallery media collections: `gallery_photos`, `gallery_interiors`, `gallery_exteriors`, `gallery_feature`
- Payment methods are a `belongsToMany` relationship on Merchant but NOT currently eager-loaded on the list endpoint
- `isOpenNow()` utility already exists in `lib/storefront-utils.ts`

### Goals
1. Add "Open Now" filter toggle to merchant listing
2. Add payment method filter dropdown
3. Seed gallery images on demo merchants using Lorem Picsum
4. Wire gallery data into frontend display (detail page)

## Approaches Decided

### 1. Open Now Filter — Client-Side Filter
- **Decision:** Client-side filtering using already-loaded `business_hours` data
- **How:** Add a toggle/chip in the filter bar. When active, filter the `merchants` array client-side using `isOpenNow()` from `storefront-utils.ts`
- **Pros:** No backend changes, instant toggle, business hours already eager-loaded
- **Cons:** Pagination mismatch (filtering 16 results could yield fewer visible cards); acceptable for MVP
- **Implementation:** Filter applied after API data arrives, before rendering the grid

### 2. Gallery Seeding — Lorem Picsum URLs
- **Decision:** Use `addMediaFromUrl('https://picsum.photos/seed/{unique}/800/600')` in DemoMerchantSeeder
- **How:** For each merchant, add 3-5 gallery_photos, 2-3 gallery_interiors, 2-3 gallery_exteriors, 1 gallery_feature
- **Pros:** Realistic image variety via seeded URLs, no local files needed, deterministic with seed param
- **Cons:** Seeder depends on external network; acceptable for dev environment
- **Note:** Must also ensure MerchantResource includes gallery media in whenLoaded and StorefrontService eager-loads media (already loads `media` on list)

### 3. Payment Method Filter — Dropdown in Filter Bar
- **Decision:** Add a dropdown next to the existing Business Type dropdown
- **How:**
  - **Backend:** Add `paymentMethods` to eager-load on `getActiveMerchants()`, add a new `getActivePaymentMethods()` method on StorefrontService, add route `GET /storefront/payment-methods`
  - **Frontend:** Fetch payment methods, render as dropdown in SearchFilters, filter client-side (check if merchant's `payment_methods` array includes selected ID)
  - **Resource:** Ensure `payment_methods` has `whenLoaded` in MerchantResource (already exists)
- **Pros:** Consistent UI with business type dropdown, no complex backend filter query needed
- **Cons:** Client-side filtering has same pagination caveat as Open Now

## Open Questions

- Should gallery images be displayed on the listing card or only on the detail page? (Likely detail page only, cards use logo/cover)
- Should we add a gallery section/lightbox to the merchant detail page? (Future enhancement)

## Next Steps

- [ ] Create implementation plan with `/knowledge-garden:plan`
- [ ] Implement backend changes (eager-load paymentMethods on list, payment methods endpoint, gallery seeding)
- [ ] Implement frontend changes (Open Now toggle, payment method dropdown, gallery display on detail)
- [ ] Verify all changes with tests and build
