# Brainstorm: Organizational Coupon Inheritance for Branch Merchants

**Date:** 2026-03-07
**Status:** Decided

## Knowledge Context

- Merchant model has `parent_id` self-referential FK. `type` = `individual` | `organization`. Branches have `parent_id` pointing to org.
- `getAccessibleMerchantIds()` exists on Merchant — returns `[self.id, ...children.ids]` for organizations.
- Current coupon ownership: `Coupon.merchant_id` (nullable — null = platform coupon). 1:1 with a single merchant.
- `MerchantCouponController` uses `$request->user()->merchant->id` to scope — no org/branch awareness.
- `inherit_from_parent` flag exists on Merchant model (default `true`).
- Branch merchants have role `branch-merchant`. Only `organization` type merchants can have branches.
- Branches inherit business_type_id and capability flags from parent.

## Problem / Goal

When a merchant is an organization with branches:
1. Organization merchants should create coupons that are either **org-wide** (apply to all branches) or **branch-specific** (target one branch)
2. Branch merchants should **automatically inherit** org-wide coupons (read-only, no edit/create/delete)
3. Branch merchants **cannot create** their own coupons — only the parent organization can
4. Organization can also create coupons scoped to a specific branch

## Approaches Considered

### Approach A: scope + target_merchant_id (Two Columns)

Add `scope ENUM('organization','branch')` + `target_merchant_id FK nullable`.

- **Pros:** Most explicit semantic meaning
- **Cons:** Two new columns, slightly over-engineered for the need

### Approach B: No Schema Change (Query Logic Only)

Use existing `merchant_id` + parent hierarchy queries. ALL org coupons cascade automatically.

- **Pros:** Zero schema changes
- **Cons:** No branch-specific coupons possible, no distinction between org-wide and org-only, ownership ambiguity

### Approach C: Hybrid — target_merchant_id Only (CHOSEN)

Add `target_merchant_id FK nullable` to coupons.

- `merchant_id` = the **owner/creator** (always the org for org-type merchants)
- `target_merchant_id = NULL` = org-wide (applies to org + all branches)
- `target_merchant_id = branch.id` = branch-specific
- Individual merchants: `merchant_id = self.id`, `target_merchant_id = NULL` (backward compatible)

**Pros:** Minimal schema change (1 column), clear semantics, backward compatible
**Cons:** Slight column waste for individual merchants (always NULL)

## Decision

**Approach C: Hybrid with `target_merchant_id`**

### Key Decisions

1. **Branch access:** Completely read-only. Branch merchants can view inherited coupons but cannot modify, toggle, or create.
2. **Backward compatibility:** Existing coupons continue working. `target_merchant_id = NULL` means "applies to this merchant" for individuals and "org-wide" for organizations.
3. **Org-only coupons:** Not supported. Org coupons always cascade to all branches (org-wide).
4. **Storefront display:** Branch storefronts show both inherited org-wide coupons and branch-specific coupons.

### Schema Change

```sql
ALTER TABLE coupons ADD COLUMN target_merchant_id BIGINT UNSIGNED NULL;
ALTER TABLE coupons ADD CONSTRAINT fk_coupons_target_merchant FOREIGN KEY (target_merchant_id) REFERENCES merchants(id) ON DELETE SET NULL;
```

### Query Patterns

**Org merchant — list their coupons:**
```sql
SELECT * FROM coupons WHERE merchant_id = :orgId
```

**Branch merchant — list visible coupons (inherited + targeted):**
```sql
SELECT * FROM coupons
WHERE merchant_id = :parentId
  AND (target_merchant_id IS NULL OR target_merchant_id = :branchId)
```

**Storefront — public coupons for a branch:**
```sql
SELECT * FROM coupons
WHERE is_public = true AND is_active = true
  AND starts_at <= NOW() AND (expires_at IS NULL OR expires_at >= NOW())
  AND (
    (merchant_id = :branchMerchantId)  -- coupons directly owned by this merchant
    OR (merchant_id = :parentId AND (target_merchant_id IS NULL OR target_merchant_id = :branchMerchantId))  -- inherited from org
    OR merchant_id IS NULL  -- platform coupons
  )
```

**Coupon validation — check if coupon applies to merchant:**
```php
if ($coupon->merchant_id !== null) {
    $merchant = Merchant::find($merchantId);
    $validIds = [$coupon->merchant_id];

    // If coupon has a target, it must match
    if ($coupon->target_merchant_id !== null) {
        if ($coupon->target_merchant_id !== $merchantId) {
            throw new ApiException('Coupon is not valid for this merchant', 422);
        }
    } else {
        // Org-wide or individual: must be the merchant or one of its branches
        if ($merchant->parent_id === $coupon->merchant_id || $coupon->merchant_id === $merchantId) {
            // Valid
        } else {
            throw new ApiException('Coupon is not valid for this merchant', 422);
        }
    }
}
```

### Access Control Changes

| Actor | Create | Read | Update | Delete |
|-------|--------|------|--------|--------|
| Admin/Super-admin | Platform coupons (merchant_id=NULL) | All coupons | All coupons | All coupons |
| Organization merchant | Own coupons (org-wide or branch-targeted) | Own coupons | Own coupons | Own coupons |
| Branch merchant | BLOCKED | Inherited coupons (read-only) | BLOCKED | BLOCKED |
| Individual merchant | Own coupons | Own coupons | Own coupons | Own coupons |

### MerchantCouponController Changes

- `getMerchantId()` → detect if org or branch
- If branch: `index()` returns inherited coupons (read-only); `store/update/destroy` return 403
- If org: `index()` returns all org coupons; `store()` accepts optional `target_merchant_id`; validate target is a child merchant
- Org `store()`: validate `target_merchant_id` (if provided) is a child of the org

### Frontend Changes

- Org coupon form: add optional "Target Branch" dropdown (populated from org's branches)
- Branch coupon list: show inherited coupons with "Inherited" badge, no action buttons
- Storefront: update `getPublicCouponsForMerchant` to include parent org coupons for branches

## Open Questions

- Should `target_merchant_id` validation also check `inherit_from_parent` flag on the branch? (i.e., if branch has `inherit_from_parent = false`, skip org-wide coupons?)

## Next Steps

- [ ] Create implementation plan with `/plan`
- [ ] Migration: add `target_merchant_id` to coupons table
- [ ] Backend: update CouponService, MerchantCouponController, StorefrontController
- [ ] Backend: update coupon validation logic
- [ ] Frontend admin: update coupon form with target branch dropdown for org merchants
- [ ] Frontend admin: update branch merchant coupon list (read-only view)
- [ ] Frontend customer portal: update storefront coupon display for branches
- [ ] Tests: org coupon inheritance, branch read-only, validation across hierarchy
