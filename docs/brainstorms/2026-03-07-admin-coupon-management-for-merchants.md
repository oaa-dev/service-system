# Brainstorm: Super Admin Coupon Management for Merchants

**Date:** 2026-03-07
**Status:** Draft

## Knowledge Context

- Existing `CouponController` (admin) only creates platform-wide coupons (`merchant_id = null`)
- `MerchantCouponController` handles merchant self-service with branch inheritance
- `CouponService::createCoupon()` already accepts `$merchantId`, `$createdBy`, `$targetMerchantId` params
- `StoreCouponRequest` already has `target_merchant_id` validation but no `merchant_id` field
- Merchant types: individual, organization (with branches). Branches inherit org coupons
- `CouponData` DTO has `target_merchant_id` but no `merchant_id`
- The coupon form dialog already supports `branches` prop for target branch selection

## Problem / Goal

Super admin needs to create and manage coupons for any merchant from the admin `/coupons` page. Currently admin can only create platform-wide coupons. The goal is to:

1. Let admin create coupons scoped to a specific merchant (individual, organization, or branch)
2. For organization merchants, optionally target a specific branch
3. Let admin edit/delete any coupon (including merchant-created ones)
4. Show all coupons (platform + merchant) in one unified view with merchant filter

## Approaches Considered

### Approach A: Extend Existing Admin Coupons Page (Selected)
- **Description:** Add a `merchant_id` field to `StoreCouponRequest`, `CouponData`, and `CouponController::store/update`. On the frontend, add a scope selector (Platform vs Merchant) and merchant dropdown to the coupon form dialog. Add a merchant column + filter to the coupons table.
- **Pros:** Single page for all coupon management. Minimal new backend code (service already supports merchant_id param). Reuses existing form dialog with conditional fields.
- **Cons:** Form becomes slightly more complex with conditional merchant/branch selectors.

### Approach B: Nested Under Merchant Detail Page
- **Description:** Add coupon management as a tab on each merchant's detail page.
- **Pros:** Clear merchant context. Consistent with services/categories pattern.
- **Cons:** No global overview. Can't create platform coupons from there. Admin must navigate to each merchant separately.

### Approach C: Both Global + Per-Merchant
- **Description:** Keep global page + add per-merchant tab.
- **Pros:** Best of both worlds.
- **Cons:** Two entry points managing same data, higher maintenance.

## Decision

**Approach A: Extend existing admin coupons page.** Simplest implementation with the most value. The service layer already supports merchant-scoped coupon creation. Main work is adding `merchant_id` to the request/DTO and enhancing the frontend form.

## Implementation Notes

### Backend Changes
1. Add `merchant_id` field to `StoreCouponRequest` and `UpdateCouponRequest` (nullable, exists:merchants,id)
2. Add `merchant_id` to `CouponData` DTO
3. Update `CouponController::store()` to pass `merchant_id` and `target_merchant_id` from request
4. Update `CouponController::update()` to handle `merchant_id` and `target_merchant_id` changes
5. Validation: if `target_merchant_id` is set, `merchant_id` must be set and merchant must be organization type
6. Admin has full control: can edit/delete any coupon regardless of `created_by`

### Frontend Changes
1. Add scope selector to coupon form dialog: "Platform" (merchant_id=null) vs "Merchant" (select merchant)
2. Add merchant search/select dropdown (use `/merchants/all` endpoint for dropdown data)
3. When merchant is organization type, show target branch selector (fetch branches for that merchant)
4. Add "Merchant" column to coupons table (show merchant name or "Platform" for null)
5. Add merchant filter to table filters
6. On edit: pre-populate merchant and branch selectors from coupon data

### Code uniqueness
- Current `StoreCouponRequest` has `unique:coupons,code` globally
- Consider: should code be unique per-merchant or globally? Keep global for simplicity (codes like SAVE10 shouldn't conflict)

## Open Questions

- None remaining after decisions above

## Next Steps

- [ ] `/plan` to create implementation plan from this brainstorm
- [ ] Implement backend changes (merchant_id in request/DTO/controller)
- [ ] Implement frontend changes (form dialog + table enhancements)
