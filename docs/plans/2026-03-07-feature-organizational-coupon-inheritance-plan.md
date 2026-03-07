# Plan: Organizational Coupon Inheritance for Branch Merchants

**Date:** 2026-03-07
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-03-07-organizational-coupon-inheritance.md](../brainstorms/2026-03-07-organizational-coupon-inheritance.md)

## Knowledge Context

### Relevant Learnings
- Merchant model has `parent_id` self-referential FK, `type` enum (individual/organization), `getAccessibleMerchantIds()` helper
- Branch merchants have `branch-merchant` role; only `organization` type can have branches
- `inherit_from_parent` flag exists on Merchant (default true) - useful for future opt-out
- Coupon model has `merchant_id` (nullable, null = platform-wide), `CouponService` handles validation/claiming/usage
- `MerchantCouponController` is self-service (resolves merchant from `$request->user()->merchant`)
- `CouponController` is admin (platform coupons, merchant_id=null)
- Factory states: `platformWide()`, `forMerchant()`, `claimable()`, `withSchedule()`, etc.
- Convention: DTOs use `Spatie\LaravelData\Optional` pattern; services reject Optional values before persisting
- Convention: `destroy()` in controllers uses try-catch with 422 (not 404)
- Convention: FormRequests always `authorize(): true` — permission checks in route middleware

### Known Gotchas
- `$request->user()->merchant` returns the user's merchant — for branch-merchant users, this IS the branch, not the parent org
- `verifyOwnership()` currently checks `$coupon->merchant_id !== $merchantId` — must be updated for org hierarchy
- `getPublicCouponsForMerchant()` currently queries `merchant_id = $merchantId OR merchant_id IS NULL` — needs org inheritance
- `validateCoupon()` line 170: `$coupon->merchant_id !== $merchantId` — must handle org-wide coupons valid at branches
- Coupon `createCoupon()` takes `?int $merchantId` as second param — this already supports null (platform) vs merchant

## Overview

Add `target_merchant_id` column to coupons table. Organization merchants create coupons owned by them (`merchant_id = org.id`), with optional `target_merchant_id` for branch-specific coupons (NULL = org-wide). Branch merchants see inherited coupons read-only. Storefront and validation logic updated for inheritance.

## Implementation Steps

### Step 1: Database Migration
- **Files:** `backend/database/migrations/2026_03_07_100400_add_target_merchant_id_to_coupons_table.php`
- **Details:**
  - Add `target_merchant_id` FK nullable, constrained to merchants, nullOnDelete
  - Add index on `target_merchant_id`
- **No data migration needed** — existing coupons with `target_merchant_id = NULL` work correctly

### Step 2: Update Coupon Model
- **Files:** `backend/app/Models/Coupon.php`
- **Details:**
  - Add `target_merchant_id` to `$fillable`
  - Add `targetMerchant()` BelongsTo relationship
  - Add helper method `isValidForMerchant(int $merchantId): bool` encapsulating the org-hierarchy validation logic:
    ```php
    public function isValidForMerchant(int $merchantId): bool
    {
        if ($this->merchant_id === null) return true; // platform coupon
        if ($this->target_merchant_id !== null) {
            return $this->target_merchant_id === $merchantId;
        }
        // Org-wide or individual: valid for owner or owner's branches
        if ($this->merchant_id === $merchantId) return true;
        $merchant = \App\Models\Merchant::find($merchantId);
        return $merchant && $merchant->parent_id === $this->merchant_id;
    }
    ```
  - Add scope `scopeVisibleToMerchant(Builder $query, int $merchantId, ?int $parentId): Builder` for branch query pattern

### Step 3: Update CouponData DTO
- **Files:** `backend/app/Data/CouponData.php`
- **Details:**
  - Add `public int|null|Optional $target_merchant_id = new Optional`

### Step 4: Update CouponFactory
- **Files:** `backend/database/factories/CouponFactory.php`
- **Details:**
  - Add `target_merchant_id => null` to `definition()`
  - Add `forBranch(int $branchMerchantId)` factory state setting `target_merchant_id`
  - Add `orgWide()` factory state (explicit null target, for readability in tests)

### Step 5: Update FormRequests
- **Files:**
  - `backend/app/Http/Requests/Api/V1/Coupon/StoreCouponRequest.php`
  - `backend/app/Http/Requests/Api/V1/Coupon/UpdateCouponRequest.php`
- **Details:**
  - Add `'target_merchant_id' => ['nullable', 'integer', 'exists:merchants,id']` to both
  - The merchant ownership validation (target must be a child of org) happens in the controller/service, not FormRequest

### Step 6: Update CouponResource
- **Files:** `backend/app/Http/Resources/Api/V1/CouponResource.php`
- **Details:**
  - Add `'target_merchant_id' => $this->target_merchant_id`
  - Add `'target_merchant' => $this->whenLoaded('targetMerchant', fn () => ['id' => ..., 'name' => ..., 'slug' => ...])`
  - Add `'is_inherited' => false` (default) — overridden in controller when listing for branch merchants

### Step 7: Update CouponService
- **Files:**
  - `backend/app/Services/CouponService.php`
  - `backend/app/Services/Contracts/CouponServiceInterface.php`
- **Details:**

  **a) `getMerchantCoupons()`** — no change needed (org lists own coupons by `merchant_id = orgId`)

  **b) New method `getBranchInheritedCoupons(int $parentMerchantId, int $branchMerchantId, Request $request): LengthAwarePaginator`**
  ```php
  // Coupons where merchant_id = parentId AND (target IS NULL OR target = branchId)
  QueryBuilder::for(
      Coupon::where('merchant_id', $parentMerchantId)
          ->where(fn ($q) => $q->whereNull('target_merchant_id')
              ->orWhere('target_merchant_id', $branchMerchantId))
  )->allowedFilters([...])->paginate(...)
  ```

  **c) `validateCoupon()`** — replace line 170 merchant check:
  ```php
  // OLD: if ($coupon->merchant_id !== null && $coupon->merchant_id !== $merchantId)
  // NEW:
  if (!$coupon->isValidForMerchant($merchantId)) {
      throw new ApiException('Coupon is not valid for this merchant', 422);
  }
  ```

  **d) `getPublicCouponsForMerchant()`** — update query to include parent org coupons for branches:
  ```php
  $merchant = Merchant::find($merchantId);
  $query->where(function ($q) use ($merchantId, $merchant) {
      $q->where('merchant_id', $merchantId)
          ->orWhereNull('merchant_id'); // platform coupons
      if ($merchant && $merchant->parent_id) {
          $q->orWhere(function ($sub) use ($merchantId, $merchant) {
              $sub->where('merchant_id', $merchant->parent_id)
                  ->where(fn ($s) => $s->whereNull('target_merchant_id')
                      ->orWhere('target_merchant_id', $merchantId));
          });
      }
  });
  ```

  **e) `createCoupon()`** — add `target_merchant_id` validation:
  ```php
  public function createCoupon(CouponData $data, ?int $merchantId, int $createdBy, ?int $targetMerchantId = null): Coupon
  ```
  - Validate `targetMerchantId` is a child of `merchantId` if provided
  - Set `$attributes['target_merchant_id'] = $targetMerchantId`

### Step 8: Update MerchantCouponController
- **Files:** `backend/app/Http/Controllers/Api/V1/MerchantCouponController.php`
- **Details:**

  **a) Detect merchant type:**
  ```php
  private function getMerchant(Request $request): Merchant
  {
      return $request->user()->merchant;
  }

  private function isBranchMerchant(Merchant $merchant): bool
  {
      return $merchant->parent_id !== null;
  }
  ```

  **b) `index()`:**
  - If org/individual: current behavior (list own coupons), eager load `targetMerchant`
  - If branch: call `getBranchInheritedCoupons($merchant->parent_id, $merchant->id, $request)`

  **c) `store()`:**
  - If branch: return `$this->forbiddenResponse('Branch merchants cannot create coupons')`
  - If org: accept optional `target_merchant_id`, validate it's a child merchant, pass to service
  - If individual: current behavior (no target_merchant_id)

  **d) `update()` and `destroy()`:**
  - If branch: return 403 forbidden
  - If org/individual: current behavior

  **e) `show()`:**
  - If branch: verify coupon is visible (inherited from parent, targeting this branch or org-wide)
  - If org: verify ownership (`merchant_id === org.id`)

  **f) `verifyOwnership()`** — update to also check branch visibility when caller is a branch

### Step 9: Update Admin CouponController
- **Files:** `backend/app/Http/Controllers/Api/V1/CouponController.php`
- **Details:**
  - `getAllCoupons()` — add eager loading for `targetMerchant` relation
  - No other changes needed (admin always passes `merchant_id = null` for platform coupons)

### Step 10: Update StorefrontController
- **Files:** `backend/app/Http/Controllers/Api/V1/StorefrontController.php`
- **Details:**
  - `merchantCoupons()` — pass merchant to `getPublicCouponsForMerchant()` (service handles parent lookup internally)
  - No controller change needed if service handles it

### Step 11: Update Frontend TypeScript Types
- **Files:**
  - `frontend/types/api.ts`
  - `frontend-customer-portal/types/api.ts`
- **Details:**
  - Add `target_merchant_id: number | null` to `Coupon` interface
  - Add `target_merchant?: { id: number; name: string; slug: string }` to `Coupon` interface
  - Add `is_inherited?: boolean` to `Coupon` interface

### Step 12: Update Frontend Zod Validation
- **Files:** `frontend/lib/validations.ts`
- **Details:**
  - Add `target_merchant_id: z.number().nullable().optional()` to `createCouponSchema`

### Step 13: Update Admin Coupon Form
- **Files:** `frontend/components/coupon-form-dialog.tsx`
- **Details:**
  - Accept optional `branches` prop (list of org's branches)
  - If `branches` is provided and non-empty, show "Target Branch" dropdown:
    - "All Branches (Organization-wide)" = null
    - Each branch as an option
  - Pass `target_merchant_id` in form submission

### Step 14: Update Admin My-Store Coupons Page
- **Files:** `frontend/app/(system)/(my-store)/my-store/coupons/page.tsx`
- **Details:**
  - Detect if merchant is org (has branches) vs branch vs individual
  - If org: show target branch column in table, pass branches to form dialog
  - If branch: hide create/edit/delete buttons, show "Inherited" badge on org-wide coupons
  - If individual: current behavior

### Step 15: Update Customer Portal Storefront Coupons
- **Files:** `frontend-customer-portal/components/storefront/coupons-section.tsx`
- **Details:**
  - No change needed if API response already includes inherited coupons (service layer handles it)
  - Optionally show "Organization coupon" badge for coupons where `merchant_id !== current merchant`

### Step 16: Write Backend Tests
- **Files:** `backend/tests/Feature/Api/V1/CouponTest.php`
- **Details:**
  New test describe block: `'Organizational Coupon Inheritance'`

  **Tests to add:**
  1. `it('allows org merchant to create org-wide coupon (no target)')` — target_merchant_id = null
  2. `it('allows org merchant to create branch-specific coupon')` — target_merchant_id = branch.id
  3. `it('rejects org merchant creating coupon targeting non-child merchant')` — 422/403
  4. `it('blocks branch merchant from creating coupons')` — 403
  5. `it('blocks branch merchant from updating coupons')` — 403
  6. `it('blocks branch merchant from deleting coupons')` — 403
  7. `it('allows branch merchant to list inherited org-wide coupons')` — sees parent's coupons
  8. `it('allows branch merchant to list branch-targeted coupons')` — sees coupons targeting them
  9. `it('hides coupons targeted to other branches from branch merchant')` — can't see sibling's coupons
  10. `it('validates org-wide coupon at branch merchant storefront')` — coupon code works at branch
  11. `it('validates branch-targeted coupon only at targeted branch')` — fails at other branches
  12. `it('shows inherited coupons on branch storefront')` — public endpoint includes org coupons
  13. `it('individual merchant coupons work unchanged')` — backward compatibility

### Step 17: Run Migration and Tests
- **Command:** `docker compose exec app php artisan migrate && docker compose exec app php artisan test --filter=CouponTest`
- **Details:** Verify all existing tests still pass + new tests pass

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Breaking existing coupon validation for individual merchants | Low | `isValidForMerchant()` returns true when `merchant_id === $merchantId` (unchanged path) |
| Performance: extra query in `isValidForMerchant()` to look up parent | Low | Only triggered when `merchant_id !== $merchantId` AND `target_merchant_id` is null — rare path; single find by PK |
| Branch merchant accessing `$request->user()->merchant->parent_id` being null | Medium | Guard with `isBranchMerchant()` check before accessing parent_id |
| Frontend my-store page breaking for branch-merchant role | Medium | Test with both org and branch-merchant users; add role-based conditional rendering |

## Testing Strategy

- [ ] All 13+ existing coupon tests still pass (backward compatibility)
- [ ] 13 new organizational inheritance tests pass
- [ ] Storefront public coupons endpoint returns inherited coupons for branches
- [ ] Coupon validation accepts org-wide coupons at branch merchants
- [ ] Branch merchants get 403 on create/update/delete
- [ ] Individual merchants unaffected (no regression)
- [ ] Frontend admin TypeScript builds cleanly
- [ ] Frontend customer portal TypeScript builds cleanly

## Open Questions

- Should `inherit_from_parent = false` on a branch exclude it from org-wide coupons? (Deferred — not implementing now, but the model flag exists for future use)

## Execution Order Summary

1. Migration (Step 1)
2. Model + DTO + Factory + FormRequests + Resource (Steps 2-6) — can be parallel
3. Service layer (Step 7) — depends on model
4. Controllers (Steps 8-10) — depends on service
5. Frontend types + validations (Steps 11-12) — can be parallel with backend
6. Frontend UI (Steps 13-15) — depends on types
7. Tests (Step 16) — after all backend changes
8. Verify (Step 17) — final
