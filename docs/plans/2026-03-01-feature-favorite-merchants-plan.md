# Plan: Customer Favorite Merchants

**Date:** 2026-03-01
**Type:** feature
**Status:** Draft

## Knowledge Context

### Critical Patterns Applied
- **Eager load + Resource = atomic pair**: When adding `is_favorited` to merchant responses, pair `->with()` in service with `whenLoaded()` in Resource.

### Known Gotchas
- `customer_id` on transactions points to `User.id`, but the Customer model has its own `id`. Favorites pivot should use `Customer.id` (not User.id) since this is a customer-specific feature.
- Storefront queries must not break for unauthenticated users — `is_favorited` should be `null`/absent when no user is logged in.

## Overview

Simple many-to-many relationship: Customer can favorite/unfavorite merchants. Favorites appear as a heart icon on merchant cards and detail pages. Customer can view their favorited merchants list. No new service/repository needed — add methods to existing CustomerPortalService.

## Data Model

### Table: `customer_favorite_merchants` (pivot)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| customer_id | FK → customers | |
| merchant_id | FK → merchants | |
| created_at | timestamp | When favorited |

**Unique constraint:** `[customer_id, merchant_id]`

No `updated_at` needed — this is a simple toggle (insert/delete).

## Implementation Steps

### Step 1: Migration
- **File:** `backend/database/migrations/YYYY_MM_DD_HHMMSS_create_customer_favorite_merchants_table.php`
- **Details:** Create pivot table with customer_id + merchant_id FKs, unique constraint, cascadeOnDelete for both FKs.

### Step 2: Model Relationships
- **Files:** `backend/app/Models/Customer.php`, `backend/app/Models/Merchant.php`
- **Details:**
  - Customer: `favoriteMerchants()` → `belongsToMany(Merchant::class, 'customer_favorite_merchants')->withTimestamps(false)->withPivot('created_at')`
  - Merchant: `favoritedByCustomers()` → `belongsToMany(Customer::class, 'customer_favorite_merchants')`

### Step 3: Service Methods
- **File:** `backend/app/Services/CustomerPortalService.php` + Interface
- **Details:** Add 3 methods:
  - `toggleFavoriteMerchant(int $merchantId): bool` — Toggle favorite. Returns `true` if favorited, `false` if unfavorited. Uses `Customer::where('user_id', auth()->id())` to get customer, then `toggle([$merchantId])`.
  - `getMyFavoriteMerchants(Request $request): LengthAwarePaginator` — Paginated list of favorited merchants (active only). Use QueryBuilder with filters/sorts.
  - `isMerchantFavorited(int $merchantId): bool` — Check if current customer has favorited this merchant.

### Step 4: Controller Endpoints
- **File:** `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php`
- **Details:** Add methods:
  - `toggleFavoriteMerchant(int $merchantId)` — POST, returns `{ is_favorited: true/false }`
  - `getMyFavoriteMerchants(Request $request)` — GET, returns paginated merchants
- **Routes in `routes/api.php`:**
  ```
  POST   /customer/merchants/{merchant}/favorite   → toggleFavoriteMerchant
  GET    /customer/favorite-merchants               → getMyFavoriteMerchants
  ```

### Step 5: Storefront Integration — Add `is_favorited` to Merchant Response
- **File:** `backend/app/Http/Resources/Api/V1/MerchantResource.php`
- **Details:** Add conditional field:
  ```php
  'is_favorited' => $this->when(auth('api')->check(), function () {
      $user = auth('api')->user();
      $customer = Customer::where('user_id', $user->id)->first();
      return $customer ? $customer->favoriteMerchants()->where('merchant_id', $this->id)->exists() : false;
  }),
  ```
  **Optimization note:** For list endpoints, this creates N+1. Better approach: in StorefrontService, after fetching merchants, batch-check favorites:
  ```php
  // In service, after fetching merchants paginator:
  if (auth('api')->check()) {
      $customer = Customer::where('user_id', auth('api')->id())->first();
      if ($customer) {
          $merchantIds = $merchants->pluck('id');
          $favoritedIds = $customer->favoriteMerchants()->whereIn('merchant_id', $merchantIds)->pluck('merchant_id');
          $merchants->each(fn($m) => $m->is_favorited = $favoritedIds->contains($m->id));
      }
  }
  ```
  Then in Resource: `'is_favorited' => $this->is_favorited ?? false`

### Step 6: Backend Tests
- **File:** `backend/tests/Feature/Api/V1/CustomerFavoriteMerchantTest.php`
- **Test cases:**
  - Customer can favorite a merchant
  - Customer can unfavorite a merchant (toggle)
  - Customer cannot favorite same merchant twice (toggle idempotent)
  - Customer can list favorited merchants
  - Favorited merchants list only shows active merchants
  - `is_favorited` appears in storefront merchant response when authenticated
  - `is_favorited` absent when unauthenticated
  - Non-customer user gets appropriate error

### Step 7: Frontend Types + Service
- **Files:**
  - `frontend-customer-portal/types/api.ts` — Add `is_favorited?: boolean` to Merchant interface
  - `frontend-customer-portal/services/customerFavoriteService.ts` — New service:
    - `toggleFavorite(merchantId): Promise<{ is_favorited: boolean }>`
    - `getMyFavorites(params): Promise<PaginatedResponse<Merchant>>`

### Step 8: Frontend Hook
- **File:** `frontend-customer-portal/hooks/useFavorites.ts`
- **Details:**
  - `useToggleFavorite()` — mutation, invalidates merchant queries + favorites list
  - `useMyFavorites(params)` — query for favorites list page
  - Optimistic update on toggle: immediately flip heart icon, revert on error

### Step 9: Frontend UI — Heart Icon on Merchant Cards + Detail Page
- **Files:**
  - `frontend-customer-portal/components/favorite-button.tsx` — Reusable heart icon button (filled red when favorited, outline when not). Takes `merchantId` + `isFavorited` props.
  - Update merchant card component to include `<FavoriteButton>`
  - Update merchant detail page to include `<FavoriteButton>` in header

### Step 10: Frontend UI — Favorites Page
- **File:** `frontend-customer-portal/app/(customer)/favorites/page.tsx`
- **Details:** Grid of favorited merchant cards with unfavorite option. Link from customer dashboard/sidebar.

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| N+1 on storefront merchant list | High | Batch-check favorites in service (Step 5 optimization) |
| Unauthenticated users see errors | Medium | Conditional `is_favorited` field, only when `auth('api')->check()` |
| Stale heart icon after toggle | Low | Optimistic update in React Query mutation |

## Testing Strategy

- [ ] Toggle favorite creates pivot row
- [ ] Toggle again deletes pivot row
- [ ] List favorites returns only active merchants
- [ ] `is_favorited` field in storefront response (authenticated vs unauthenticated)
- [ ] Customer without Customer record handles gracefully
- [ ] Favoriting non-existent merchant returns 404

## Open Questions

None — this is a straightforward feature.
