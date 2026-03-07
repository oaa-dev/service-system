---
problem_type: state_issue
component: layout
root_cause: state_leak
severity: high
resolution_type: code_fix
module: customer-portal
tags: [auth, zustand, race-condition, redirect, localStorage, rehydration]
---

# Auth Race Condition in Customer Portal Layout

## Symptom
Authenticated users in the customer portal are immediately redirected to `/login` on page load, even though they have valid credentials stored in localStorage. The redirect happens before the auth store finishes rehydrating.

## Root Cause
The customer portal layout (`frontend-customer-portal/app/(customer)/layout.tsx`) checked `isAuthenticated` without waiting for the Zustand store to finish rehydrating from localStorage. On initial render, Zustand's persisted state hasn't loaded yet, so `isAuthenticated` is `false`, triggering an immediate redirect.

## Investigation
- Confirmed credentials exist in localStorage under `customer-auth-storage`
- The redirect fires in useEffect before Zustand's `persist` middleware completes rehydration
- Same pattern existed in the admin frontend but was already handled with `isLoading`

## Solution
Added `isLoading` from `useAuthStore` to gate the redirect and render:

```tsx
// Before (broken)
const { isAuthenticated } = useAuthStore();

useEffect(() => {
  if (!isAuthenticated) {
    router.push('/login');
  }
}, [isAuthenticated]);

if (!isAuthenticated) return null;

// After (fixed)
const { isAuthenticated, isLoading } = useAuthStore();

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/login');
  }
}, [isLoading, isAuthenticated]);

if (isLoading || !isAuthenticated) return null;
```

## Prevention
- Any layout or page that gates on auth state from a persisted Zustand store MUST check `isLoading` before acting on `isAuthenticated`
- This applies to both `useEffect` redirects and render guards
- The admin frontend already follows this pattern -- always check it as reference when building new auth-gated layouts

## Files Changed
- `frontend-customer-portal/app/(customer)/layout.tsx`
