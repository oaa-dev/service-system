# Brainstorm: Flutter Mobile App — Customer Portal Feature Parity

**Date:** 2026-03-05
**Status:** Draft

## Knowledge Context

The mobile app (`mobile/`) already has a complete foundation:
- Core infrastructure: Dio networking, auth interceptor, secure storage, DI (get_it + injectable), go_router, BLoC, app theme
- Auth feature (complete): Login, Register, OTP verification, logout — Clean Architecture + BLoC

The customer portal (`frontend-customer-portal/`) has 10 modules to port.

### Critical FK Distinctions (from knowledge base)
- `Booking.customer_id`, `Reservation.customer_id`, `ServiceOrder.customer_id` → `users.id`
- `Review.customer_id`, `LoyaltyCard.customer_id`, `LoyaltyStampQrCode.scanned_by` → `customers.id`
- Verified purchase check uses `User.id`; `ReviewService` resolves to `Customer.id` internally
- Do NOT confuse these in mobile entity definitions — this has caused bugs in the web implementation

### Booking Slot Architecture (from portal-storefront module doc)
- Tier 1: date-specific slots from `booking-availability?date=YYYY-MM-DD` (merchant booking slots)
- Tier 2 fallback: schedule-based time grid from `booking-availability?month=YYYY-MM`
- Organization-type merchants hide booking CTA; show "View Branches" instead

### Loyalty QR Code Architecture
- `LoyaltyStampQrCode` has `token`, `mode` ('single-use' or 'daily'), `expires_at`
- Mobile gets native camera advantage over web — use `mobile_scanner` package
- Auto-reward creation when `current_stamps >= required_stamps`

### Messaging Decision
- Deferred entirely. Not in current roadmap.
- Customer portal uses 5-second polling as fallback (reference if/when implemented)

## Problem / Goal

Build a Flutter mobile app (Android-first) that mirrors the customer-facing features of the web customer portal. The mobile app should give customers a native experience for browsing merchants, making transactions (bookings/reservations/orders), engaging with loyalty/referral programs, and managing their profile.

## Navigation Structure

4-tab bottom navigation:

```
┌────────┬──────────┬───────┬─────┐
│   Explore  │ Transactions │ Rewards │ Me  │
└────────┴──────────┴───────┴─────┘
```

- **Explore** — Storefront: merchant list, search, filter, map, merchant detail
- **Transactions** — All customer transactions: Bookings, Reservations, Orders (tabbed within screen)
- **Rewards** — Loyalty cards, stamp history, reward redemption, referral code & history
- **Me** — Profile, favorites, reviews, account settings, payment methods

## Phased Roadmap

### Phase 1 — MVP (Storefront + Profile + Favorites + Reviews)
Auth is already done. This phase completes the baseline experience.

**Storefront:**
- Merchant list with search, filter (business type, capability flags)
- Merchant detail: info, services, business hours, photos, reviews, map pin
- Favorites toggle button on merchant cards + dedicated favorites list

**Profile:**
- View/edit personal info (name, email, phone, avatar)
- Account settings (change password)
- Payment method preference (with email verification gate)
- Identity document status display

**Reviews:**
- Star rating + optional title/comment form (verified purchase gate → 409/403 handled)
- View own reviews + edit/delete
- Merchant review display on merchant detail page

### Phase 2 — Bookings
- Browse bookable services on merchant detail
- Booking form: two-tier slot strategy (slot picker → time grid fallback)
- Party size picker (default 1)
- Booking history list with status badges
- Booking detail + cancel (status workflow: pending/confirmed/completed/no_show/cancelled)
- Chat CTA deferred (messaging skipped)

### Phase 3 — Orders (Service Orders)
- Browse sellable products/services
- Order form with quantity, payment method selection
- Order history list + order detail + cancel
- Auto-generated order number display (ORD-YYYYMMDD-NNN)

### Phase 4 — Reservations
- Browse rentable units
- Reservation form: date-range picker, unit selection
- Reservation history + detail + cancel
- Status workflow: pending/confirmed/checked_in/checked_out/cancelled

### Phase 5 — Loyalty
- Loyalty card per merchant (current_stamps, required_stamps, tier display)
- QR scanner screen using `mobile_scanner` package (decode token → POST scan endpoint)
- Stamp history list
- Rewards list (available/redeemed/expired tabs)
- Reward redemption: select redemption target (booking/reservation/order)

### Phase 6 — Referrals
- Referral code display with share functionality
- Referral history (who you referred + reward status)
- Earnings summary

## Approaches Considered

### Approach A: Feature-by-feature Clean Architecture (Recommended)
Each feature gets its own `lib/features/{feature}/` directory with:
- `data/` — Models (json_annotation), DataSources (remote), Repository impl
- `domain/` — Entities, Repository interface, UseCases
- `presentation/` — BLoC (events/states), Pages, Widgets

**Pros:**
- Matches existing auth feature structure (easy for team to follow)
- Testable at every layer
- Each phase can be built and shipped independently
- Dependency inversion allows easy swapping of data sources

**Cons:**
- More boilerplate per module (mitigated by code generation: build_runner + injectable)
- Slower initial setup; pays off long-term

### Approach B: Simplified MVVM without Domain Layer
- Skip domain layer (no use cases, no repository interface)
- ViewModel (ChangeNotifier or BLoC) calls service directly

**Pros:** Less boilerplate, faster initial development

**Cons:**
- Inconsistent with existing auth structure (would need to refactor or have two patterns)
- Harder to test; tightly coupled to API client
- Not recommended given Clean Architecture is already established

### Approach C: Feature-first with Riverpod instead of BLoC
Replace BLoC with Riverpod for state management.

**Pros:** Less verbose than BLoC, strong community support

**Cons:** Requires rearchitecting existing auth feature; two state management paradigms is worse than one

## Decision

**Approach A** — Continue the Clean Architecture + BLoC pattern established by the auth feature. Build phase by phase in the order defined above.

## Visual Design

**Custom brand design** — new color palette and typography separate from the web portal. The web uses `DM Sans` + `Bricolage Grotesque`; the mobile app should establish its own brand identity using platform-native font choices and a fresh color system defined in `lib/core/theme/`.

Design token structure:
- `app_colors.dart` — brand primary, secondary, semantic colors (success, warning, error, info)
- `app_typography.dart` — text styles using `GoogleFonts` or bundled assets
- `app_theme.dart` — Material 3 `ThemeData` with custom `ColorScheme`

## Key Technical Decisions

| Concern | Decision |
|---------|----------|
| State management | BLoC (flutter_bloc) — already in use |
| Navigation | go_router — already wired |
| DI | get_it + injectable — already wired |
| HTTP | Dio + auth interceptor — already wired |
| Storage | flutter_secure_storage (tokens), shared_preferences (user prefs) |
| Images | cached_network_image |
| QR scanning | mobile_scanner (Phase 5) |
| Maps | google_maps_flutter or flutter_map (Storefront map view, Phase 1) |
| Forms | flutter_form_builder + form_builder_validators |
| Date pickers | table_calendar or date_range_picker (Reservations, Phase 4) |
| Image upload | image_picker + http multipart |
| Pagination | infinite_scroll_pagination |
| Real-time | Deferred (messaging skipped) |

## Open Questions

- Which map library: `google_maps_flutter` (requires API key, same as web) or `flutter_map` (OSM, free)? Web portal already has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Should storefront search use device GPS for "near me" filtering, or manual location input?
- Payment flow: does mobile need to integrate PayMongo for in-app payments, or just record payment method preference?
- Push notifications: defer or build alongside loyalty (stamp earned, reward available) and bookings (confirmed, reminder)?
- Should the app target Android-only initially, or Android + iOS from the start?

## Next Steps

- [ ] Run `/knowledge-garden:plan` to create a detailed implementation plan for Phase 1
- [ ] Decide map library (Google Maps vs flutter_map)
- [ ] Design custom color palette and typography for mobile brand
- [ ] Scaffold `lib/features/storefront/` following auth feature structure
- [ ] Scaffold `lib/features/profile/`, `lib/features/favorites/`, `lib/features/reviews/`
- [ ] Update `lib/config/router.dart` to add bottom nav shell route with 4 tabs
- [ ] Update `pubspec.yaml` with Phase 1 dependencies (cached_network_image, infinite_scroll_pagination, image_picker, map library)
