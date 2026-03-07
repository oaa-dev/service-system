# Module: Customer Dashboard (Customer Portal Frontend)

## Service

- **File:** `frontend-customer-portal/services/customerDashboardService.ts`
- **Key methods:**
  - `getMyStats()` — `GET /customer/my/stats` — Returns aggregated stats (bookings total/upcoming, reservations total/active, orders total/active)
  - `getMyBookings(params?)` — `GET /customer/my/bookings` — Paginated booking list with filter/sort params
  - `getMyBooking(id)` — `GET /customer/my/bookings/{id}` — Single booking detail
  - `cancelMyBooking(id)` — `PATCH /customer/my/bookings/{id}/cancel`
  - `getMyReservations(params?)` — `GET /customer/my/reservations` — Paginated reservation list
  - `getMyReservation(id)` — `GET /customer/my/reservations/{id}` — Single reservation detail
  - `cancelMyReservation(id)` — `PATCH /customer/my/reservations/{id}/cancel`
  - `getMyOrders(params?)` — `GET /customer/my/orders` — Paginated order list
  - `getMyOrder(id)` — `GET /customer/my/orders/{id}` — Single order detail
  - `cancelMyOrder(id)` — `PATCH /customer/my/orders/{id}/cancel`

- **Param interfaces:**
  - `MyBookingParams` — page, per_page, `filter[status]`, `filter[date_from]`, `filter[date_to]`, sort
  - `MyReservationParams` — same as MyBookingParams
  - `MyOrderParams` — same as MyBookingParams plus `filter[search]`
  - `CustomerStats` — `{ bookings: { total, upcoming }, reservations: { total, active }, orders: { total, active } }`

## Hooks

- **File:** `frontend-customer-portal/hooks/useCustomerDashboard.ts`
- **Queries:**
  - `useMyStats()` — query key: `['customer', 'stats']`
  - `useMyBookings(params?)` — query key: `['customer', 'bookings', params]`, uses `keepPreviousData`
  - `useMyBooking(id)` — query key: `['customer', 'bookings', id]`, enabled when `!!id`
  - `useMyReservations(params?)` — query key: `['customer', 'reservations', params]`, uses `keepPreviousData`
  - `useMyReservation(id)` — query key: `['customer', 'reservations', id]`, enabled when `!!id`
  - `useMyOrders(params?)` — query key: `['customer', 'orders', params]`, uses `keepPreviousData`
  - `useMyOrder(id)` — query key: `['customer', 'orders', id]`, enabled when `!!id`
- **Mutations:**
  - `useCancelBooking()` — invalidates all `['customer']` queries on success
  - `useCancelReservation()` — invalidates all `['customer']` queries on success
  - `useCancelOrder()` — invalidates all `['customer']` queries on success

## Types

- **Key interfaces (from `types/api.ts`):**
  - `Booking` — id, booking_date, start_time, end_time, party_size, status, service_price, discount_amount, fee_rate, fee_amount, total_amount, payment_status, notes, service, merchant, coupon, payment
  - `BookingStatus` — `'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'`
  - `Reservation` — id, check_in, check_out, nights, guest_count, status, total_amount, payment_status, unit, merchant
  - `ReservationStatus` — `'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'`
  - `ServiceOrder` — id, order_number, quantity, unit_label, status, total_amount, payment_status, service, merchant
  - `ServiceOrderStatus` — `'pending' | 'received' | 'processing' | 'ready' | 'delivering' | 'completed' | 'cancelled'`

## Pages

- **Dashboard:** `frontend-customer-portal/app/(customer)/dashboard/page.tsx` — Route: `/dashboard`
  - Displays 3 stat cards (Bookings, Reservations, Orders) with totals and active/upcoming counts
  - Links to each sub-page; shows personalized greeting from auth store user name
- **Bookings:** `frontend-customer-portal/app/(customer)/bookings/page.tsx` — Route: `/bookings`
  - Paginated card list sorted by `-booking_date`; cancel button on pending/confirmed bookings
  - Click-to-open detail sheet; status and payment status badges with color coding
- **Booking Detail:** `frontend-customer-portal/app/(customer)/bookings/booking-detail-sheet.tsx`
  - Side sheet with service image, schedule, pricing breakdown (service price, discount, platform fee, total)
  - Payment section with checkout URL "Pay Now" button for pending payments
  - Merchant info with Google Maps embed, ChatPanel integration, ReviewForm for completed bookings
- **Reservations:** `frontend-customer-portal/app/(customer)/reservations/page.tsx` — Route: `/reservations`
  - Paginated card list sorted by `-check_in`; cancel button on pending/confirmed
  - Shows unit name, check-in/check-out dates, nights count
- **Reservation Detail:** `frontend-customer-portal/app/(customer)/reservations/reservation-detail-sheet.tsx`
  - Side sheet similar to booking detail; ChatPanel and ReviewForm integration
- **Orders:** `frontend-customer-portal/app/(customer)/orders/page.tsx` — Route: `/orders`
  - Paginated card list sorted by `-created_at`; cancel button only on pending orders
  - Shows order number, quantity, unit label
- **Order Detail:** `frontend-customer-portal/app/(customer)/orders/order-detail-sheet.tsx`
  - Side sheet similar to booking detail; ChatPanel and ReviewForm integration

## Components

- Detail sheets use `@/components/chat/chat-panel.tsx` for in-context messaging
- Detail sheets use `@/components/reviews/review-form.tsx` for post-completion reviews
- All detail sheets use Google Maps (`@vis.gl/react-google-maps`) for merchant location display
- Uses `formatPrice()` from `@/lib/storefront-utils` for Philippine Peso formatting

## Gotchas / Notes

- All cancel mutations broadly invalidate the entire `['customer']` query key namespace, which refreshes stats and all entity lists
- `useMyBooking` and `useMyOrder` accept `number`, while `useMyReservation` accepts `number | null` (slightly inconsistent signatures)
- Booking cancellation is allowed for both `pending` and `confirmed` statuses; order cancellation only for `pending`
- Date formatting uses `en-PH` locale throughout (Philippine format)
- Currency formatting shows Philippine Peso symbol with 2 decimal places
- Detail sheets check for existing reviews via `useMyReviews` to pass `existingReview` prop to ReviewForm (prevents duplicate reviews)
- The dashboard page uses Zustand auth store directly for user name display
