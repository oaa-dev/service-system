# Module: Customer Actions (Customer Portal Frontend)

## Service

- **File:** `frontend-customer-portal/services/customerActionService.ts`
- **Key methods:**
  - `createBooking(slug, data)` — `POST /customer/merchants/{slug}/bookings` — Creates a booking for a merchant's service
  - `createReservation(slug, data)` — `POST /customer/merchants/{slug}/reservations` — Creates a reservation
  - `createOrder(slug, data)` — `POST /customer/merchants/{slug}/orders` — Creates a service order
  - `claimCoupon(couponId)` — `POST /customer/coupons/{couponId}/claim` — Claims a coupon, returns `{ claimed_at, expires_at }`
  - `getClaimedCoupons()` — `GET /customer/coupons/claimed` — Returns array of claimed Coupon objects
  - `getMyCoupons()` — `GET /customer/my/coupons` — Returns array of MyCouponItem objects (active, used, expired)

- **Payload interfaces:**
  - `CreateBookingPayload` — service_id, booking_date, start_time (optional), booking_slot_id (optional), party_size, notes (optional), loyalty_reward_id (optional), coupon_code (optional)
  - `CreateReservationPayload` — service_id, check_in, check_out, guest_count (optional), notes (optional), special_requests (optional), loyalty_reward_id (optional), coupon_code (optional)
  - `CreateOrderPayload` — service_id, quantity, unit_label, notes (optional), loyalty_reward_id (optional), coupon_code (optional)

## Hooks

- **File:** `frontend-customer-portal/hooks/useCustomerActions.ts`
- **Mutations:**
  - `useCreateBooking(slug)` — takes merchant slug as parameter, mutation receives `CreateBookingPayload`
  - `useCreateReservation(slug)` — takes merchant slug, mutation receives `CreateReservationPayload`
  - `useCreateOrder(slug)` — takes merchant slug, mutation receives `CreateOrderPayload`

- **Additional hooks in `frontend-customer-portal/hooks/useStorefront.ts`:**
  - `useClaimCoupon()` — mutation wrapping `customerActionService.claimCoupon`, invalidates `['storefront']` queries
  - `useMyCoupons()` — query key: `['customer', 'coupons']`, wraps `customerActionService.getMyCoupons()`
  - `useValidateCoupon()` — mutation wrapping `storefrontService.validateCoupon` (validates coupon code before applying)

## Types

- **Key interfaces (from `types/api.ts`):**
  - `Booking` — returned after successful booking creation
  - `Reservation` — returned after successful reservation creation
  - `ServiceOrder` — returned after successful order creation
  - `Coupon` — coupon details including code, discount_type, discount_value, min_order_amount, applicable_to, valid_schedule, description
  - `MyCouponItem` — id, coupon (nested Coupon), status ('active' | 'used' | 'expired'), claimed_at, expires_at, used_at, used_on_type, used_on_id, discount_amount

## Pages

- **Coupons:** `frontend-customer-portal/app/(customer)/coupons/page.tsx` — Route: `/coupons`
  - Tabbed view: All, Active, Used, Expired (with counts in tab labels)
  - Three card variants: ActiveCouponCard (with copy-to-clipboard and countdown timer), UsedCouponCard (shows savings and usage details), ExpiredCouponCard
  - `useCountdown` custom hook for live expiry countdown (updates every minute)
  - Empty state links to merchant browsing

## Components

- **AuthGate:** `frontend-customer-portal/components/booking/auth-gate.tsx`
  - Wraps booking/reservation/order forms on storefront pages
  - Shows sign-in/register prompt if user is not authenticated
  - Passes current pathname as redirect parameter to login/register links
- **BookingSummary:** `frontend-customer-portal/components/booking/booking-summary.tsx`
  - Reusable pricing summary card showing line items and optional total with separator
  - Used in booking/reservation/order creation forms on storefront pages
- **CouponInput:** `frontend-customer-portal/components/checkout/coupon-input.tsx`
  - Input field for applying coupon codes during checkout
  - Validates coupon via `useValidateCoupon` mutation before applying
  - Auto-uppercases input; shows applied state with discount amount and remove button
  - Props: merchantSlug, transactionType ('booking' | 'reservation' | 'sell_product'), subtotal, onApply callback, onRemove callback
- **CouponsSection:** `frontend-customer-portal/components/storefront/coupons-section.tsx`
  - Displays available coupons on merchant storefront detail page
  - Uses `useMerchantCoupons` and `useClaimCoupon` hooks
  - Copy-to-clipboard functionality for coupon codes

## Gotchas / Notes

- All three creation payloads support optional `loyalty_reward_id` and `coupon_code` fields for discount integration
- The create mutations in `useCustomerActions.ts` do NOT invalidate any queries on success — the calling component is responsible for navigation or cache updates after creation
- Coupon-related hooks are split across two files: creation mutations in `useCustomerActions.ts`, but claim/validate/list hooks live in `useStorefront.ts` (because coupons span both storefront browsing and customer actions)
- The `claimCoupon` mutation invalidates `['storefront']` queries (not `['customer']`), while `getMyCoupons` uses `['customer', 'coupons']` query key
- Booking creation routes use merchant **slug** (not ID) as the URL parameter: `/customer/merchants/{slug}/bookings`
- The AuthGate component is used on public storefront pages to gate the booking/ordering forms, not on the authenticated `/coupons` page
- CouponInput validates the coupon server-side before calling the `onApply` callback, ensuring discount amounts are calculated by the backend
- The coupons page `useCountdown` hook re-renders every 60 seconds to update remaining time display
