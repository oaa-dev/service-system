# Brainstorm: Branch Filtering, Inheritance & Edit Access Control

**Date:** 2026-03-02
**Status:** Draft

## Knowledge Context

### Current Architecture
- **Merchant types**: `individual`, `organization` (stored in `type` column, default `individual`)
- **Branch relationship**: Self-referential `parent_id` FK. `organization` → many branches (children). Branches are separate merchant records with own user accounts
- **StorefrontService::getActiveMerchants()**: Currently returns ALL active merchants including organizations. Applies `withCount('children')` for the `children_count` field
- **StorefrontService::getAllActiveMerchants()**: Same — no type filter. Used by map view
- **Branch page in CP**: `/merchants/{slug}/branches` exists — shows branches of an organization. Already has logo fallback: `branch.logo?.thumb ?? parentMerchant.logo?.thumb`
- **MyMerchantController**: Self-service at `/auth/merchant/` — resolves from `$request->user()->merchant`. Works for both org and branch merchants already. No permission gating for branch vs organization
- **Merchant detail page in CP**: Organization gate already exists — hides CTAs/sidebar, shows "View Branches" callout. But currently organizations still appear in the merchant listing grid

### Relevant Patterns
- Capability inheritance: Branches inherit `business_type_id` and capability flags from parent at creation time, independently editable after
- Merchant active middleware: Gallery endpoints require `merchant.active` middleware — branches must have `active` status to manage gallery
- Dual controller: admin (`MerchantController`) and self-service (`MyMerchantController`) share `MerchantService`

## Problem / Goal

Four interconnected improvements:

1. **Storefront listing filter** — At `/merchants` (customer portal), don't show organization parent merchants. Show only branches and individuals. Organizations are containers, not bookable entities
2. **Branch detail inheritance** — At `/merchants/<slug>` (customer portal), if a branch has incomplete setup (no logo, no description, no gallery, no address), fall back to the parent organization's data so the branch page doesn't look empty
3. **Branch edit access from org panel** — At `/my-store/branches` (admin), add edit buttons so the organization owner can redirect to edit a branch's store details (`/my-store/settings`) and gallery (`/my-store/gallery`)
4. **Organization permission control** — Organization can toggle whether branch owners have self-service access to edit their own store details and gallery

## Approaches Considered

### Sub-feature 1: Storefront Listing Filter

#### Approach A: Backend query filter (Recommended)
- **Description:** Add `->where('type', '!=', 'organization')` to `getActiveMerchants()` and `getAllActiveMerchants()` in `StorefrontService`
- **Pros:** Single-source-of-truth, all consumers get correct data, no frontend logic needed
- **Cons:** None significant — organizations shouldn't appear in browse results
- **Scope:** ~4 lines changed in `StorefrontService.php`

### Sub-feature 2: Branch Detail Inheritance

#### Approach A: Backend eager-load parent + frontend fallback (Recommended)
- **Description:** In `StorefrontService::getMerchantBySlug()`, if the merchant has `parent_id`, eager-load the `parent` relation with its media, address, business hours. Frontend then uses fallback logic: `branch.field ?? branch.parent?.field` for logo, description, gallery, address
- **Pros:** Backend just provides the data, frontend has full control over what to inherit. No mutation of the branch data — clearly shows what's "inherited" vs "own"
- **Cons:** Slightly larger response for branch detail endpoint

#### Approach B: Backend merge
- **Description:** In the backend, before returning the resource, merge missing branch fields from the parent. The API response always looks "complete"
- **Pros:** Simpler frontend — no fallback logic needed
- **Cons:** Harder to tell what's "own" vs "inherited", complicates editing, resource becomes non-transparent

### Sub-feature 3: Branch Edit from Organization Panel

#### Approach A: Redirect to admin merchant edit page (Recommended)
- **Description:** On the `/my-store/branches` table, add "Edit Details" and "Edit Gallery" action buttons. "Edit Details" navigates to `/merchants/{branchId}/edit` (the existing admin merchant edit page). "Edit Gallery" navigates to `/merchants/{branchId}/gallery` or similar
- **Pros:** Reuses existing admin edit pages. Org owner uses their admin-level access to edit branch details
- **Cons:** Requires admin-level merchant permissions to access — but org users already have `merchant` role. Need to check if admin merchant edit routes are accessible to merchant-role users editing their own children
- **Note:** May need a new route pattern like `/my-store/branches/{branchId}/settings` that shows the same tabs as `/my-store/settings` but scoped to the selected branch

#### Approach B: Dedicated branch settings page
- **Description:** New page at `/my-store/branches/{branchId}/settings` with full settings tabs (details, hours, payment methods, social links, documents, gallery) — essentially a copy of `/my-store/settings` but operating on a specific branch instead of the auth user's own merchant
- **Pros:** Clean UX within the my-store area, no cross-navigation to admin pages
- **Cons:** Significant duplication of the settings components unless they're made generic (accept merchantId prop)
- **Recommendation:** Make existing my-store settings tabs accept an optional `merchantId` override. If provided, operate on that merchant instead of auth user's merchant

### Sub-feature 4: Organization Permission Control

#### Approach A: Simple global toggle on organization (Recommended)
- **Description:** Add `allow_branch_self_edit` boolean column to `merchants` table (default `true`, only meaningful on organizations). In `MyMerchantController::update()`, `uploadLogo()`, gallery routes, etc.: if the authenticated merchant is a branch (`parent_id IS NOT NULL`), check `parent.allow_branch_self_edit`. If false, return 403
- **Pros:** Simple to implement and understand. One toggle, all branches follow
- **Cons:** No per-branch granularity

#### Approach B: Per-branch toggle
- **Description:** Add `can_self_edit` boolean on each branch merchant record. Organization can toggle per branch
- **Pros:** More granular — can allow some branches to self-edit while restricting others
- **Cons:** More UI complexity, harder to manage at scale

#### Approach C: No restriction
- **Description:** Branch owners can always edit. No organizational control
- **Pros:** Simplest implementation
- **Cons:** Doesn't meet the stated requirement

## Decision

**Recommended approach:**
1. Backend query filter (`where type != organization`) — simplest, correct
2. Backend eager-load parent + frontend fallback — clean separation of concerns
3. Make my-store settings tabs accept merchantId override + new `/my-store/branches/{branchId}/settings` and `/my-store/branches/{branchId}/gallery` routes — cleanest UX
4. Simple global toggle (`allow_branch_self_edit`) — meets requirement without over-engineering

## Open Questions

- Should the branch detail page in the CP visually indicate which data is "inherited from parent" (e.g., subtle "From organization" label) or just show it seamlessly?
- For the gallery fallback — should the branch's gallery page show the parent's photos as a starting point, or only show them on the storefront detail page?
- When the organization disables `allow_branch_self_edit`, should the branch owner still see the settings page in read-only mode, or should the nav items be hidden entirely?
- Does the organization also need control over whether branches can manage their own services/bookings/orders, or only store details + gallery?

## Next Steps

- [ ] `/plan` to create the implementation plan from this brainstorm
- [ ] Review the open questions above and decide on behavior
