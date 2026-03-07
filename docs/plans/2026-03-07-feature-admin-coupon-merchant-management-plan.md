# Plan: Admin Coupon Management for Merchants

**Date:** 2026-03-07
**Type:** feature
**Status:** Draft
**Brainstorm:** [../brainstorms/2026-03-07-admin-coupon-management-for-merchants.md](../brainstorms/2026-03-07-admin-coupon-management-for-merchants.md)

## Knowledge Context

### Relevant Learnings
- `CouponService::createCoupon()` already accepts `$merchantId`, `$createdBy`, `$targetMerchantId` -- service layer is ready
- `CouponController::store()` currently hardcodes `null` for merchantId -- only creates platform coupons
- `CouponResource` already includes `merchant` and `targetMerchant` via `whenLoaded`
- `getAllCoupons()` already loads `merchant` and `targetMerchant` relations and filters by `merchant_id`
- Form dialog already supports `branches` prop for target branch selector

### Known Gotchas
- DTO fields must use `string|Optional` pattern (Spatie Laravel Data)
- `target_merchant_id` validation: must verify target is a branch of the selected merchant (already done in `CouponService::createCoupon` line 144-148)
- On update, need to pass merchant_id and target_merchant_id through to service (currently `updateCoupon` doesn't handle these)
- Frontend types `CreateCouponRequest` and `UpdateCouponRequest` are missing `merchant_id`, `target_merchant_id`, `is_claimable`, `claim_validity_hours`, `valid_schedule`, `reset_period` fields

### Critical Patterns Applied
- Service-Repository pattern: controller passes data, service handles business logic
- Permission middleware on routes: `permission:coupons.create/update/delete`
- `CouponData` DTO with Optional fields for partial updates

## Overview

Extend the admin `/coupons` page so super-admin can create, edit, and delete coupons for any merchant (individual, organization, or branch). Add merchant selector to the form dialog and merchant column/filter to the table.

## Implementation Steps

### Step 1: Backend -- Add `merchant_id` to request validation and DTO

- **Files:**
  - `backend/app/Http/Requests/Api/V1/Coupon/StoreCouponRequest.php`
  - `backend/app/Http/Requests/Api/V1/Coupon/UpdateCouponRequest.php`
  - `backend/app/Data/CouponData.php`
- **Details:**
  - Add `'merchant_id' => ['nullable', 'integer', 'exists:merchants,id']` to both request classes
  - Add `public int|null|Optional $merchant_id = new Optional` to CouponData

### Step 2: Backend -- Update CouponController to pass merchant context

- **Files:**
  - `backend/app/Http/Controllers/Api/V1/CouponController.php`
  - `backend/app/Services/CouponService.php`
- **Details:**
  - `store()`: Pass `$request->merchant_id` and `$request->target_merchant_id` to `createCoupon()`
  - `update()`: Update to handle `merchant_id` and `target_merchant_id` changes
  - `CouponService::updateCoupon()`: Add validation for `target_merchant_id` (must be branch of `merchant_id`), update `merchant_id` and `target_merchant_id` in attributes

### Step 3: Frontend -- Add `merchant_id` to types and validation schema

- **Files:**
  - `frontend/types/api.ts`
  - `frontend/lib/validations.ts`
- **Details:**
  - Add `merchant_id?: number | null` and `target_merchant_id?: number | null` to `CreateCouponRequest` and `UpdateCouponRequest`
  - Add missing fields to both interfaces: `is_claimable`, `claim_validity_hours`, `valid_schedule`, `reset_period`
  - Add `merchant_id: z.number().nullable().optional()` to `createCouponSchema`

### Step 4: Frontend -- Enhance coupon form dialog with merchant selector

- **Files:**
  - `frontend/components/coupon-form-dialog.tsx`
- **Details:**
  - Add "Scope" radio group at top of form: "Platform" vs "Merchant"
  - When "Merchant" selected, show searchable merchant dropdown (use existing merchant hooks)
  - When selected merchant is `type: 'organization'`, show branch selector (fetch branches for that merchant)
  - Pass `merchant_id` and `target_merchant_id` in form submission
  - On edit: pre-populate scope/merchant/branch from existing coupon data
  - New props: accept optional `merchants` data or fetch internally

### Step 5: Frontend -- Add merchant column and filter to coupons table

- **Files:**
  - `frontend/app/(system)/(settings)/coupons/page.tsx`
- **Details:**
  - Add "Merchant" column to table showing `coupon.merchant?.name || 'Platform'`
  - Add merchant filter to `DataTableFilters` (use merchant dropdown or text search)
  - Pass merchant list to form dialog for create/edit

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `updateCoupon` doesn't validate target_merchant_id on update | Medium | Add same validation as `createCoupon` to the update method |
| Merchant dropdown performance with many merchants | Low | Use `/merchants/all` endpoint which returns lightweight data; add search |
| Code uniqueness conflict (merchant coupon code = platform code) | Low | Keep global uniqueness -- simpler and prevents confusion |

## Testing Strategy

- [ ] Admin creates platform coupon (merchant_id = null) -- existing behavior preserved
- [ ] Admin creates coupon for individual merchant
- [ ] Admin creates coupon for organization merchant (no target branch)
- [ ] Admin creates coupon for organization merchant targeting specific branch
- [ ] Admin edits a merchant-created coupon (changing merchant_id)
- [ ] Admin deletes a merchant-created coupon
- [ ] Validation: target_merchant_id rejected when merchant is not organization
- [ ] Validation: target_merchant_id rejected when not a branch of merchant_id
- [ ] Table shows merchant name column with correct data
- [ ] Table filter by merchant_id works
- [ ] Edit dialog pre-populates merchant and branch selectors

## Open Questions

None -- all decisions made in brainstorm.
