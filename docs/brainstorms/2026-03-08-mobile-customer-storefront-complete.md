# Brainstorm: Mobile Customer Storefront — Complete Feature Parity

**Date:** 2026-03-08
**Status:** Draft

## Knowledge Context

### What's Already Built (Mobile)
The Flutter app at `/mobile` has a solid foundation with Clean Architecture + BLoC:
- **Auth:** Login, Register, OTP verification, token persistence (flutter_secure_storage)
- **Storefront:** Merchant list (infinite scroll, search, geo-filter), merchant detail
- **Favorites:** Toggle + list page
- **Reviews:** View merchant reviews, write/edit own reviews
- **Profile:** View/edit profile, avatar upload, address with cascading geographic selectors
- **Infrastructure:** ApiClient (Dio), AuthInterceptor, DI (get_it + injectable), GoRouter, error handling (Either<Failure, T>)

### What Needs to Be Built
All remaining customer portal features from the web frontend-customer-portal, using the same API endpoints:

| Feature | API Prefix | Priority | Complexity |
|---------|-----------|----------|------------|
| Customer Dashboard | `/customer/my/stats` | High | Low |
| Booking Flow | `/storefront/*/booking-availability` + `/customer/merchants/*/bookings` | High | High |
| Reservation Flow | `/storefront/*/reservation-availability` + `/customer/merchants/*/reservations` | High | High |
| Order Flow | `/customer/merchants/*/orders` | High | Medium |
| Transaction History | `/customer/my/bookings`, `/reservations`, `/orders` | High | Medium |
| Loyalty Program | `/customer/loyalty-cards`, `/customer/loyalty/scan` | Medium | High (QR) |
| Coupons | `/customer/coupons/*`, `/storefront/merchants/*/coupons` | Medium | Low |
| Referrals | `/customer/referral-codes`, `/customer/referrals/*` | Medium | Medium |
| Messaging | `/customer/my/conversations/*` | Medium | High (real-time) |
| Advertisements | `/storefront/advertisements` | Low | Low |
| Payment Status | `/payments/*` | Low | Low |

### Critical Backend Nuances (from knowledge base)
- **customer_id distinction:** Booking/Reservation/Order use `User.id`, but LoyaltyCard/Review use FK to `customers` table
- **Organization merchants:** `type='organization'` should show "View Branches" instead of booking forms
- **Booking availability:** Two-tier system — MerchantBookingSlot OR service schedule-based fallback
- **Status workflows:** All status fields are VARCHAR (safe for Dart enums with fallback)
- **Auth middleware tiers:** Storefront = public, Customer actions = `auth:api + ensure.verified`

## Problem / Goal

Build the complete mobile customer storefront app with all features from the web portal, optimized for mobile UX patterns (bottom sheets, swipe gestures, native feel). The app must use the same backend API endpoints — no backend changes needed.

**Target users:** Customers browsing merchants, making bookings/reservations/orders, earning loyalty stamps, and managing their account.

## Architecture Decisions

### Decision 1: Feature Organization
Follow the existing Clean Architecture pattern established in the codebase:
```
lib/features/
  ├─ auth/           ✅ EXISTS
  ├─ storefront/     ✅ EXISTS (extend with booking/reservation/order flows)
  ├─ favorites/      ✅ EXISTS
  ├─ reviews/        ✅ EXISTS
  ├─ profile/        ✅ EXISTS
  ├─ dashboard/      🆕 Customer dashboard + stats
  ├─ transactions/   🆕 Bookings, Reservations, Orders (history + detail)
  ├─ loyalty/        🆕 Cards, stamps, QR scan, rewards
  ├─ referrals/      🆕 Codes, referrals, rewards
  ├─ coupons/        🆕 Browse, claim, my coupons
  ├─ messaging/      🆕 Transaction-scoped chat
  └─ ads/            🆕 Advertisement banners (lightweight, no separate feature)
```

### Decision 2: Navigation Structure
Keep the existing 4-tab bottom navigation but fill in the stubs:

| Tab | Icon | Content |
|-----|------|---------|
| **Explore** | compass | Merchant browsing (exists) + enhanced with ads |
| **Transactions** | receipt | Tabbed: Bookings / Reservations / Orders (currently stub) |
| **Rewards** | gift | Tabbed: Loyalty Cards / Coupons / Referrals (currently stub) |
| **Me** | user | Profile + Dashboard stats + Favorites + Reviews (exists, extend) |

### Decision 3: Booking/Reservation/Order Flow (Mobile-First UX)
Instead of separate pages like the web portal, use a **bottom sheet wizard pattern**:
1. User taps "Book Now" / "Reserve" / "Order" on merchant detail
2. Full-screen bottom sheet slides up with step-by-step flow
3. Steps: Select Service → Pick Date/Time → Confirm Details → Submit
4. Success screen with booking reference + "View My Bookings" CTA

This is more natural on mobile than navigating to separate pages.

### Decision 4: Transaction History
The Transactions tab shows 3 sub-tabs with pull-to-refresh lists:
- **Bookings:** Status chips (pending/confirmed/completed/cancelled), tap for detail sheet
- **Reservations:** Date ranges, unit info, status
- **Orders:** Order number, items, status progression

Each detail opens a bottom sheet (not a new page) with full info + cancel action + chat button.

### Decision 5: Loyalty Program
- **Cards list:** Visual stamp card UI (grid of filled/empty stamp circles)
- **QR Scanner:** Use `mobile_scanner` package (modern, maintained) for scanning loyalty QR codes
- **Rewards:** Carousel of available rewards with "Redeem" action
- **Handle edge cases:** 409 (already scanned), 410 (expired QR), daily vs single-use modes

### Decision 6: Messaging
- **5-second polling** (same as web portal) — no Echo/WebSocket integration initially
- **Chat embedded in transaction detail** — "Message Merchant" button opens chat bottom sheet
- **Unread badge** on transaction cards that have unread messages
- Message deduplication by ID (handle polling race conditions)

### Decision 7: State Management
Continue with **BLoC pattern** for all new features (consistent with existing codebase):
- One BLoC per feature domain (DashboardBloc, BookingBloc, LoyaltyBloc, etc.)
- Sub-BLoCs for complex flows (BookingFormBloc for the wizard, separate from BookingListBloc)
- Use `Equatable` for all events and states

### Decision 8: Ads Integration
Lightweight — no separate feature module:
- `AdBanner` widget placed at top of Explore page and merchant detail
- Carousel auto-scroll with impression tracking
- Tap → open URL or navigate to merchant
- Data fetched once and cached (low priority, non-blocking)

### Decision 9: UI/UX Design Principles
- **Bottom sheets over new pages** for detail views and forms (faster, less disorienting)
- **Skeleton/shimmer loading** (already established pattern) for all new list pages
- **Pull-to-refresh** on all list views
- **Empty states** with illustrations and CTAs (e.g., "No bookings yet — Explore merchants")
- **Status chips** with color coding consistent across all transaction types
- **Haptic feedback** on key actions (booking confirmed, QR scanned, favorite toggled)
- **Snackbar notifications** for success/error states (not dialogs)

### Decision 10: New Dependencies
```yaml
# Add to pubspec.yaml
mobile_scanner: ^6.0.0          # QR code scanning (replaces deprecated qr_code_scanner)
flutter_animate: ^4.5.0         # Smooth micro-animations
intl: ^0.19.0                   # Date/time formatting (may already be transitive)
```

No need for additional state management, HTTP, or DI packages — everything is already in place.

## Implementation Phases

### Phase 1: Dashboard + Transaction History (Foundation)
- DashboardBloc + DashboardPage (stats cards, recent activity)
- BookingListBloc + BookingsPage (list, filter by status, detail sheet)
- ReservationListBloc + ReservationsPage (list, detail sheet)
- OrderListBloc + OrdersPage (list, detail sheet)
- Cancel actions on pending transactions
- Wire up Transactions tab (replace placeholder)

### Phase 2: Booking Flow (Core Transaction)
- BookingFormBloc (multi-step wizard state machine)
- BookingAvailability data source + repository + use case
- Calendar date picker widget
- Time slot grid / merchant slot picker widget
- Service selector (from merchant services)
- Booking confirmation + fee display
- Success screen with reference number

### Phase 3: Reservation + Order Flows
- ReservationFormBloc (date range picker, unit type selector, guest count)
- Reservation availability data source + use case
- OrderFormBloc (product selector, quantity, notes)
- Both follow same bottom-sheet wizard pattern as booking

### Phase 4: Loyalty Program
- LoyaltyBloc (cards, stamps, rewards)
- LoyaltyCardsPage (visual stamp card grid)
- LoyaltyDetailPage (specific card with stamp history)
- QR Scanner page (mobile_scanner integration)
- Reward list + redemption
- Handle QR modes (single_use vs daily) and error states

### Phase 5: Coupons + Referrals
- CouponsBloc (browse merchant coupons, claim, my coupons)
- CouponsPage (available vs claimed tabs)
- ReferralsBloc (generate codes, view referrals, accept, rewards)
- ReferralsPage (my codes, sent/received, rewards)

### Phase 6: Messaging
- MessagingBloc (conversations, messages, send, mark read)
- ChatBottomSheet widget (embedded in transaction detail)
- 5-second polling for new messages
- Unread indicators on transaction cards
- Message deduplication logic

### Phase 7: Polish + Ads
- AdBanner widget with auto-carousel
- Impression/click tracking
- Empty state illustrations
- Micro-animations (flutter_animate)
- Haptic feedback on key interactions
- Performance optimization (lazy loading, image caching)

## Open Questions

- None — all decisions made. Implementation can begin immediately.

## Next Steps

- [ ] Create implementation plan with `/plan` for Phase 1
- [ ] Each phase is independently deployable (no cross-phase dependencies except Phase 1 foundation)
- [ ] Estimated effort: 7 phases, each self-contained
