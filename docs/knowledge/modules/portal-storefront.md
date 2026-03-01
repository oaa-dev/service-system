# Portal Storefront Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend-customer-portal/app/(storefront)/layout.tsx` | Layout | Public storefront layout with header nav, footer, glass effect header |
| `frontend-customer-portal/app/(storefront)/merchants/page.tsx` | Page | Browse merchants grid with search, pagination |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx` | Page | Merchant detail with services, business hours, payment methods, capability tabs |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/page.tsx` | Page | Booking form: select service, date/time, schedule-aware time slots |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/page.tsx` | Page | Reservation form: select service/unit, check-in/out dates, quantity |
| `frontend-customer-portal/app/(storefront)/merchants/[slug]/order/page.tsx` | Page | Order form: select service, quantity, unit label, delivery notes |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/storefrontService.ts` | Public API: getMerchants, getMerchantBySlug, getMerchantServices, getServiceDetail |
| Service | `services/customerActionService.ts` | Authenticated API: createBooking, createReservation, createOrder |
| Hook | `hooks/useStorefront.ts` | useStorefrontMerchants, useMerchantBySlug, useMerchantServices, useServiceDetail |
| Hook | `hooks/useCustomerActions.ts` | useCreateBooking, useCreateReservation, useCreateOrder |
| Hook | `hooks/useDebounce.ts` | useDebounce (for search input debouncing) |
| Type | `types/api.ts` | StorefrontMerchant, Service, ServiceSchedule, MerchantBusinessHour, PaymentMethod |
| Store | `stores/authStore.ts` | isAuthenticated (for AuthGate conditional rendering) |
| Component | `components/storefront/storefront-nav.tsx` | Navigation bar with auth-aware links (login/register or dashboard/logout) |
| Component | `components/storefront/merchant-card.tsx` | Merchant grid card with logo, capabilities, business type |
| Component | `components/storefront/merchant-header.tsx` | Merchant detail page header with logo, description, badges |
| Component | `components/storefront/service-card.tsx` | Service card with image, price, capability badges |
| Component | `components/storefront/search-filters.tsx` | Search input with debounce for merchant/service filtering |
| Component | `components/booking/auth-gate.tsx` | Auth check wrapper: shows login prompt for unauthenticated users |
| Component | `components/booking/booking-summary.tsx` | Order/booking/reservation summary card before submission |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- Storefront is public (no auth required for browsing); booking/ordering requires authentication via AuthGate
- Merchants are accessed by slug (not ID) in URLs: `/merchants/[slug]`
- Merchant detail page uses tabs to separate bookable services, orderable services, and rentable services based on capability flags
- Booking page is schedule-aware: loads service schedules to show available time slots per day
- Reserve page calculates total cost based on check-in/out date range and nightly price
- Order page supports quantity selection with custom unit labels (pcs, kg, etc.)
- All action pages (book, reserve, order) use the AuthGate pattern: unauthenticated users see a login/register prompt
- BookingSummary component displays a confirmation card before form submission
- Currency formatting uses Philippine Peso (PHP) format
- Layout uses a glass-effect sticky header with warm color theme
