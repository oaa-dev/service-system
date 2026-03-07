---
problem_type: authorization_issue
component: controller
root_cause: logic_error
severity: medium
resolution_type: code_fix
module: coupon
tags: [permission, branch-merchant, frontend-backend-mismatch, coupon-management]
---

# Frontend-Backend Permission Flag Mismatch for Branch Coupon Management

## Symptom
Branch merchants see coupon management buttons in the UI but API calls fail (or vice versa), because the frontend and backend check different sources for the `allow_branch_coupon_management` permission flag.

## Root Cause
The backend `MerchantCouponController` was updated to check the branch merchant's own `allow_branch_coupon_management` flag, but the frontend coupons page still checked the parent merchant's flag (`user?.merchant?.parent?.allow_branch_coupon_management`). This created a full-stack authorization mismatch.

## Investigation
- Backend controller (`MerchantCouponController.php` line 37) checked `$merchant->allow_branch_coupon_management` directly
- Frontend page (`my-store/coupons/page.tsx` line 92) checked `user?.merchant?.parent?.allow_branch_coupon_management`
- The parent merchant had the flag disabled in the database, but the branch could have it set independently

## Solution
Updated frontend to match backend authorization source:

```tsx
// Before (checking parent's flag)
const branchCanManageCoupons = isBranchMerchant
  && user?.merchant?.parent?.allow_branch_coupon_management;

// After (checking branch's own flag)
const branchCanManageCoupons = isBranchMerchant
  && user?.merchant?.allow_branch_coupon_management;
```

## Prevention
- When changing authorization logic on the backend, ALWAYS check if the same logic exists on the frontend for UI gating
- Permission flags that control UI visibility must mirror the backend authorization check exactly
- Search for the flag name across the entire codebase before changing its check location:
  ```
  grep -r "allow_branch_coupon_management" frontend/ backend/
  ```

## Files Changed
- `backend/app/Http/Controllers/Api/V1/MerchantCouponController.php`
- `frontend/app/(system)/(my-store)/my-store/coupons/page.tsx`
