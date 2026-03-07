# Module: Customer Favorites (Customer Portal Frontend)

## Service

- **File:** `frontend-customer-portal/services/customerFavoriteService.ts`
- **Key methods:**
  - `toggleFavorite(merchantId)` — `POST /customer/my/favorite-merchants/{merchantId}` — Toggles favorite state, returns `{ is_favorited: boolean }`
  - `getMyFavorites(params?)` — `GET /customer/my/favorite-merchants` — Paginated list of favorited merchants

- **Param interfaces:**
  - `MyFavoriteParams` — page, per_page, `filter[search]`, sort

## Hooks

- **File:** `frontend-customer-portal/hooks/useFavorites.ts`
- **Queries:**
  - `useMyFavorites(params?)` — query key: `['customer', 'favorites', params]`, uses `keepPreviousData`
- **Mutations:**
  - `useToggleFavorite()` — invalidates both `['customer', 'favorites']` and `['storefront', 'merchants']` on success (keeps storefront merchant cards in sync)

## Types

- **Key interfaces (from `types/api.ts`):**
  - `Merchant` — full merchant object returned in favorites list (same interface as storefront merchant)

## Pages

- **Favorites:** `frontend-customer-portal/app/(customer)/favorites/page.tsx` — Route: `/favorites`
  - Responsive grid layout (1-4 columns depending on viewport)
  - Debounced search input (300ms) with `useDebounce` hook
  - Pagination with Previous/Next buttons
  - Empty state with prompt to browse merchants
  - Reuses `MerchantCard` component from storefront

## Components

- **FavoriteButton:** `frontend-customer-portal/components/storefront/favorite-button.tsx`
  - Renders a heart icon button; toggles fill color (red when favorited, gray when not)
  - Only renders when user is authenticated (returns `null` otherwise)
  - Prevents event propagation on click (safe to use inside clickable cards)
  - Props: `merchantId`, `isFavorited` (default false), `size` ('sm' | 'default')
  - Used on `MerchantCard` in storefront listing and merchant detail pages
- **MerchantCard:** `frontend-customer-portal/components/storefront/merchant-card.tsx`
  - Shared card component displaying merchant info; includes FavoriteButton overlay

## Gotchas / Notes

- Toggle is a single POST endpoint that flips the state server-side (not separate add/remove endpoints)
- The mutation invalidates both the favorites list and the storefront merchants list, ensuring `is_favorited` state stays consistent across both views
- Search resets page to 1 when input changes
- The FavoriteButton component checks `isAuthenticated` from Zustand auth store and hides itself for unauthenticated users (no redirect to login)
