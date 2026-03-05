# Plan: Branch Filtering, Inheritance & Edit Access Control

**Date:** 2026-03-02
**Type:** feature
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- [Eager-loaded relation missing from API response](../knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md): When adding `->with()` in a Service, MUST add matching `whenLoaded()` in the Resource or data is silently omitted. Treat eager load + Resource as atomic pair.

### Known Gotchas
- **Eager loading + Resource sync**: Adding parent relation to `StorefrontService::getMerchantBySlug()` requires matching `MerchantResource::whenLoaded('parent', ...)` — currently parent only returns `id` and `name`. Must expand to include media, address, gallery, description for inheritance.
- **Branch visibility leakage**: Filtering must be in backend (`StorefrontService`), not frontend, to prevent organizations from appearing in map view, nearby search, or other API consumers.
- **Permission middleware order**: Gallery routes need `merchant.active` AND `allow_branch_self_edit` check. Check active status first, then permission.
- **TypeScript optional chaining**: All frontend code accessing parent data must use `branch.parent?.field`, not `branch.parent.field`.

### Critical Patterns Applied
- Service-Repository pattern for all backend changes
- `$attributes` array for model defaults (`allow_branch_self_edit` default true)
- Spatie QueryBuilder for filtered list endpoints
- Eager load + Resource `whenLoaded()` atomic pair

## Overview

Four sub-features that improve how branches are displayed, managed, and controlled:

1. **Storefront filter** — Hide organizations from `/merchants` listing, show only individuals + branches
2. **Branch inheritance** — Branch detail pages fall back to parent org's logo, description, gallery, and address when the branch hasn't set its own
3. **Org edits branch** — Organization owner can edit any branch's full settings and gallery from `/my-store/branches`
4. **Branch self-edit control** — Organization toggle (`allow_branch_self_edit`) controls whether branch owners can edit their own settings

## Implementation Steps

### Phase 1: Backend — Storefront Filter + Migration

#### Step 1.1: Filter organizations from storefront listings
- **Files:** `backend/app/Services/StorefrontService.php`
- **Details:**
  - Add `->where('type', '!=', 'organization')` to `getActiveMerchants()` query (line ~25)
  - Add `->where('type', '!=', 'organization')` to `getAllActiveMerchants()` query (line ~118)
  - Add `->where('type', '!=', 'organization')` to `getNearbyMerchants()` query (line ~133)
  - Remove `->withCount('children')` from `getActiveMerchants()` since only branches/individuals are returned (children_count is always 0 for these types)
- **Knowledge note:** Single source of truth — all API consumers get correct data

#### Step 1.2: Migration — add `allow_branch_self_edit` to merchants
- **Files:** `backend/database/migrations/2026_03_02_300000_add_allow_branch_self_edit_to_merchants_table.php`
- **Details:**
  - Add `allow_branch_self_edit` boolean column, default `true`
  - Only meaningful on organizations, but stored on all merchants for simplicity

#### Step 1.3: Update Merchant model
- **Files:** `backend/app/Models/Merchant.php`
- **Details:**
  - Add `allow_branch_self_edit` to `$fillable`
  - Add `'allow_branch_self_edit' => 'boolean'` to `casts()`
  - Add `$attributes['allow_branch_self_edit'] = true`

#### Step 1.4: Update DTOs and Form Requests
- **Files:**
  - `backend/app/Data/MerchantData.php` — add `allow_branch_self_edit: bool|Optional`
  - `backend/app/Http/Requests/Api/V1/Merchant/UpdateMyMerchantRequest.php` — add `allow_branch_self_edit` as optional boolean rule
- **Details:** Only organizations should be able to set this field. Validation: `sometimes|boolean`

#### Step 1.5: Update MerchantResource — expand parent relation
- **Files:** `backend/app/Http/Resources/Api/V1/MerchantResource.php`
- **Details:**
  - Expand the existing `parent` `whenLoaded()` block to include full data: logo, description, gallery_feature, address, business_hours (not just id/name)
  - Add `allow_branch_self_edit` to the base output fields
  - Parent block should return a mini-merchant object with: id, name, slug, description, logo (thumb/preview), gallery collections, address, business_hours
- **Knowledge note:** CRITICAL — must match eager loading in Step 2.1

### Phase 2: Backend — Branch Inheritance + Permission Control

#### Step 2.1: Eager-load parent with full data for branch detail
- **Files:** `backend/app/Services/StorefrontService.php`
- **Details:**
  - In `getMerchantBySlug()`, add conditional parent eager loading:
    ```
    ->with([
        'parent.media',
        'parent.address.region',
        'parent.address.province',
        'parent.address.geoCity',
        'parent.address.barangay',
        'parent.businessHours',
    ])
    ```
  - This loads the parent org's media (logo, gallery), address, and business hours so the frontend can use fallback logic
- **Knowledge note:** Must pair with MerchantResource `whenLoaded('parent', ...)` from Step 1.5

#### Step 2.2: Add branch self-edit permission check to MyMerchantController
- **Files:** `backend/app/Http/Controllers/Api/V1/MyMerchantController.php`
- **Details:**
  - Create a private helper method `checkBranchSelfEditPermission(Merchant $merchant): ?JsonResponse`
  - Logic: if `$merchant->parent_id` is not null, load parent and check `$merchant->parent->allow_branch_self_edit`. If false, return `$this->forbiddenResponse('Branch self-edit is disabled by your organization')`
  - Call this check at the start of: `update()`, `uploadLogo()`, `deleteLogo()`, `updateBusinessHours()`, `syncPaymentMethods()`, `syncSocialLinks()`, `uploadDocument()`, `deleteDocument()`, `uploadGalleryImage()`, `deleteGalleryImage()`
  - Do NOT apply to read-only methods: `show()`, `stats()`, `getGallery()`, `onboardingChecklist()`
- **Knowledge note:** Check happens after merchant resolution but before any mutation

#### Step 2.3: Add organization branch management endpoints for settings/gallery
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/MyMerchantController.php`
  - `backend/routes/api.php`
- **Details:**
  - Add methods to MyMerchantController for managing a specific branch's full data:
    - `showBranchDetail(Request, int $branchId)` — returns branch with full relations (for settings page)
    - `updateBranchDetails(UpdateMyMerchantRequest, int $branchId)` — updates branch merchant data
    - `uploadBranchLogo(UploadMerchantLogoRequest, int $branchId)` — uploads branch logo
    - `deleteBranchLogo(Request, int $branchId)` — deletes branch logo
    - `getBranchGallery(Request, int $branchId)` — returns branch gallery
    - `uploadBranchGalleryImage(UploadMerchantGalleryImageRequest, int $branchId, string $collection)` — uploads to branch gallery
    - `deleteBranchGalleryImage(Request, int $branchId, int $media)` — deletes branch gallery image
    - `updateBranchBusinessHours(UpdateBusinessHoursRequest, int $branchId)` — updates branch hours
    - `syncBranchPaymentMethods(SyncPaymentMethodsRequest, int $branchId)` — syncs branch payment methods
    - `syncBranchSocialLinks(SyncSocialLinksRequest, int $branchId)` — syncs branch social links
  - Each method must verify the authenticated merchant is the parent (`$request->user()->merchant->id === $branch->parent_id`)
  - Routes: under `auth/merchant/branches/{branch}/` prefix:
    ```
    GET    /auth/merchant/branches/{branch}/detail     (showBranchDetail)
    PUT    /auth/merchant/branches/{branch}/detail     (updateBranchDetails)
    POST   /auth/merchant/branches/{branch}/logo       (uploadBranchLogo)
    DELETE /auth/merchant/branches/{branch}/logo       (deleteBranchLogo)
    GET    /auth/merchant/branches/{branch}/gallery     (getBranchGallery)
    POST   /auth/merchant/branches/{branch}/gallery/{collection}  (uploadBranchGalleryImage)
    DELETE /auth/merchant/branches/{branch}/gallery/{media}       (deleteBranchGalleryImage)
    PUT    /auth/merchant/branches/{branch}/business-hours  (updateBranchBusinessHours)
    POST   /auth/merchant/branches/{branch}/payment-methods (syncBranchPaymentMethods)
    POST   /auth/merchant/branches/{branch}/social-links    (syncBranchSocialLinks)
    ```
  - All methods reuse existing `MerchantService` methods by passing the branch's merchant ID

### Phase 3: Backend Tests

#### Step 3.1: Tests for storefront filtering + branch inheritance + permission control
- **Files:** `backend/tests/Feature/Api/V1/BranchAccessTest.php`
- **Details:**
  - Storefront filter tests:
    - `it filters out organization merchants from storefront listing`
    - `it shows individual and branch merchants in storefront listing`
    - `it filters organizations from nearby merchants`
    - `it filters organizations from all active merchants`
  - Branch inheritance tests:
    - `it loads parent relation for branch in merchant detail`
    - `it does not load parent for individual merchants`
  - Branch self-edit permission tests:
    - `it allows branch self-edit when organization permits`
    - `it blocks branch self-edit when organization disables`
    - `it does not apply self-edit check to individual merchants`
    - `it does not apply self-edit check to organization merchants`
  - Organization branch management tests:
    - `it allows organization to update branch details`
    - `it prevents non-parent from updating branch`
    - `it allows organization to manage branch gallery`

### Phase 4: Frontend — Customer Portal (Storefront)

#### Step 4.1: Update CP types for parent inheritance
- **Files:** `frontend-customer-portal/types/api.ts`
- **Details:**
  - Expand `Merchant.parent` type from `{ id: number; name: string } | null` to include:
    ```typescript
    parent?: {
      id: number;
      name: string;
      slug: string;
      description: string | null;
      logo?: { url: string; thumb: string; preview: string };
      gallery_feature?: { thumb: string; preview: string };
      gallery_photos?: Array<{ id: number; thumb: string; preview: string }>;
      gallery_interiors?: Array<{ id: number; thumb: string; preview: string }>;
      gallery_exteriors?: Array<{ id: number; thumb: string; preview: string }>;
      address?: Address;
      business_hours?: BusinessHour[];
    } | null;
    ```
  - Add `allow_branch_self_edit` to Merchant interface

#### Step 4.2: Update merchant-card — remove org-specific UI
- **Files:** `frontend-customer-portal/components/storefront/merchant-card.tsx`
- **Details:**
  - Since organizations no longer appear in listings, remove the `type === 'organization'` badge and "View Branches" badge from merchant card
  - The card will now only show individual/branch merchants with capability badges and ratings

#### Step 4.3: Update merchant detail page — branch inheritance fallback
- **Files:**
  - `frontend-customer-portal/components/storefront/merchant-header.tsx`
  - `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx`
- **Details:**
  - In MerchantHeader: use `merchant.logo ?? merchant.parent?.logo` for logo display
  - In MerchantHeader: use `merchant.description ?? merchant.parent?.description` for description
  - In merchant detail page: use `merchant.gallery_feature ?? merchant.parent?.gallery_feature` for gallery feature
  - Use `merchant.address ?? merchant.parent?.address` for sidebar address
  - Show inherited data seamlessly (no label)

#### Step 4.4: Update branch selection page with parent data fallback
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/branches/page.tsx`
- **Details:**
  - Branches page still works for deep-linking (direct URL to `/merchants/{org-slug}/branches`)
  - Logo fallback already exists (`branch.logo?.thumb ?? parentMerchant.logo?.thumb`)
  - No change needed if organizations are still accessible by direct slug URL

### Phase 5: Frontend — Admin (Branch Settings/Gallery from Org)

#### Step 5.1: Update admin types
- **Files:** `frontend/types/api.ts`
- **Details:**
  - Add `allow_branch_self_edit` to Merchant interface
  - Update parent type to include expanded fields (same as Step 4.1)

#### Step 5.2: Add branch management service functions + hooks
- **Files:**
  - `frontend/services/myMerchantService.ts`
  - `frontend/hooks/useMyMerchant.ts`
- **Details:**
  - Add service functions:
    - `getBranchDetail(branchId)` — GET `/auth/merchant/branches/{id}/detail`
    - `updateBranchDetails(branchId, data)` — PUT `/auth/merchant/branches/{id}/detail`
    - `uploadBranchLogo(branchId, file)` — POST `/auth/merchant/branches/{id}/logo`
    - `deleteBranchLogo(branchId)` — DELETE `/auth/merchant/branches/{id}/logo`
    - `getBranchGallery(branchId)` — GET `/auth/merchant/branches/{id}/gallery`
    - `uploadBranchGalleryImage(branchId, collection, file)` — POST
    - `deleteBranchGalleryImage(branchId, mediaId)` — DELETE
    - `updateBranchBusinessHours(branchId, hours)` — PUT
    - `syncBranchPaymentMethods(branchId, ids)` — POST
    - `syncBranchSocialLinks(branchId, links)` — POST
  - Add matching React Query hooks with cache invalidation on `['my-branches']` + `['branch-detail', branchId]`

#### Step 5.3: Refactor my-store settings tabs to accept merchantId prop
- **Files:**
  - `frontend/app/(system)/(my-store)/my-store/settings/my-store-details-tab.tsx`
  - `frontend/app/(system)/(my-store)/my-store/settings/my-store-business-hours-tab.tsx`
  - `frontend/app/(system)/(my-store)/my-store/settings/my-store-payment-methods-tab.tsx`
  - `frontend/app/(system)/(my-store)/my-store/settings/my-store-social-links-tab.tsx`
  - `frontend/app/(system)/(my-store)/my-store/settings/my-store-documents-tab.tsx`
- **Details:**
  - Each tab currently uses `useUpdateMyMerchant()`, `useUploadMyMerchantLogo()`, etc. (hooks that call `/auth/merchant/` endpoints)
  - Add an optional `branchId?: number` prop to each tab component
  - When `branchId` is provided, use the new branch-scoped hooks instead of own-merchant hooks
  - The `merchant` prop already provides the data — just need to switch the mutation hooks
  - This allows the same tab components to work for both self-service AND org-managing-branch

#### Step 5.4: Refactor gallery page to accept merchantId prop
- **Files:** `frontend/app/(system)/(my-store)/my-store/gallery/page.tsx`
- **Details:**
  - Extract gallery UI into a `GalleryContent` component that accepts optional `branchId`
  - When `branchId` is provided, use branch-scoped gallery hooks
  - Gallery page imports `GalleryContent` with no branchId (self-service mode)

#### Step 5.5: Create branch settings + gallery pages
- **Files:**
  - `frontend/app/(system)/(my-store)/my-store/branches/[branchId]/settings/page.tsx`
  - `frontend/app/(system)/(my-store)/my-store/branches/[branchId]/gallery/page.tsx`
- **Details:**
  - Branch settings page: fetches branch via `getBranchDetail(branchId)`, renders settings tabs with `branchId` prop and a "Back to Branches" link
  - Branch gallery page: fetches branch via `getBranchDetail(branchId)`, renders `GalleryContent` with `branchId` prop
  - Both pages verify the user is an organization merchant before rendering

#### Step 5.6: Update branches table — add settings/gallery actions
- **Files:** `frontend/app/(system)/(my-store)/my-store/branches/page.tsx`
- **Details:**
  - Add "Settings" and "Gallery" items to the branch row dropdown menu (alongside existing Edit/Delete)
  - "Settings" → navigates to `/my-store/branches/{branchId}/settings`
  - "Gallery" → navigates to `/my-store/branches/{branchId}/gallery`
  - Add toggle for `allow_branch_self_edit` in the page header area (global org setting)

#### Step 5.7: Hide self-service nav for restricted branches
- **Files:** `frontend/components/layout/app-sidebar.tsx`
- **Details:**
  - For branch-merchant users (user has `parent_id` on their merchant): check `user.merchant.parent?.allow_branch_self_edit`
  - If false, hide "Manage Store" (settings) and "Gallery" sidebar items
  - Branch user can still see Dashboard, Bookings, Orders, Reservations, Messages, Profile

### Phase 6: Frontend Lint + Verification

#### Step 6.1: Verify CP lint clean
- **Files:** Customer portal frontend
- **Details:** Run `docker compose exec nextjs-customer npm run lint` — zero new errors from review files

#### Step 6.2: Verify Admin lint clean
- **Files:** Admin frontend
- **Details:** Run `docker compose exec nextjs npm run lint` — zero new errors from review files

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| MerchantResource parent expansion missing fields | Medium | Follow eager-load + whenLoaded atomic pair pattern. Add both in same step. |
| Organization slug still accessible by direct URL | Low | Acceptable — org detail page still shows "View Branches" gate. Not a bug, just a direct-link path. |
| Branch settings tabs using wrong hooks when branchId provided | Medium | Add integration test that verifies branch-scoped mutations hit correct endpoint. Manual QA flow. |
| Gallery fallback showing org photos as branch photos | Low | Seamless display per decision — customers don't need to distinguish. |
| Large refactor of settings tabs breaking self-service flow | Medium | Refactor incrementally — add optional branchId prop, default behavior unchanged when not provided. Test self-service after each tab change. |

## Testing Strategy

- [ ] Backend: Organization merchants filtered from storefront listing
- [ ] Backend: Individual and branch merchants visible in storefront listing
- [ ] Backend: Branch detail includes parent data when parent exists
- [ ] Backend: Branch self-edit blocked when org disables `allow_branch_self_edit`
- [ ] Backend: Branch self-edit allowed when org permits
- [ ] Backend: Org can update branch details/gallery via new endpoints
- [ ] Backend: Non-parent org cannot edit unrelated branch
- [ ] Frontend: Merchant card no longer shows organization badges
- [ ] Frontend: Branch detail page shows inherited logo/description/gallery when branch has none
- [ ] Frontend: Org owner can navigate to branch settings from branches table
- [ ] Frontend: Org owner can toggle `allow_branch_self_edit`
- [ ] Frontend: Branch owner sidebar hides settings/gallery when self-edit disabled
- [ ] Frontend: Both lint checks pass with zero new errors

## Open Questions

- None — all decisions resolved during brainstorm phase.
