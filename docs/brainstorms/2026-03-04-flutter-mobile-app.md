# Brainstorm: Flutter Mobile App (Customer Portal)

**Date:** 2026-03-04
**Status:** Draft

## Knowledge Context

- Backend is a Laravel 12 REST API at `/api/v1` with OAuth2 (Laravel Passport) Bearer token auth
- WebSocket via Laravel Reverb for real-time messaging and notifications
- Customer portal web app (Next.js) exists at `frontend-customer-portal/` — Flutter app mirrors this
- Auth flow: register (with `role=customer`) → verify email OTP → login → Bearer token
- Auth store persists token to localStorage on web; Flutter will use secure storage
- API response format: `{ success, message, data, meta: { pagination } }`
- Existing customer portal features: storefront browse, booking, reservation, orders, messaging, loyalty, referrals, reviews, favorites, profile, notifications

## Problem / Goal

Build a Flutter mobile app (iOS + Android) that provides full parity with the customer portal web app. Consumers the same Laravel API. Lives in the monorepo at `mobile/`.

## Decisions

### Target: Customer Portal
- Browse merchants (list, map, search, filters)
- View merchant detail (gallery, services, reviews, loyalty program, referral)
- Book services (time slot selection, checkout)
- Make reservations (date range, unit selection)
- Place orders (product selection, quantity)
- Messaging (real-time chat with merchants)
- Loyalty cards (QR scan, stamp tracking, rewards)
- Reviews (write, edit, view)
- Referrals (generate code, share, track)
- Favorites (save merchants)
- Profile management (edit details, address, avatar)
- Notifications (push + in-app)
- Coupon code entry at checkout (when coupon module is built)

### Architecture: Clean Architecture + BLoC

```
mobile/
├── lib/
│   ├── core/                    # Shared utilities
│   │   ├── constants/           # API URLs, keys, enums
│   │   ├── error/               # Failure classes, exceptions
│   │   ├── network/             # Dio client, interceptors, auth
│   │   ├── storage/             # Secure storage wrapper
│   │   ├── theme/               # App theme, colors, typography
│   │   ├── utils/               # Formatters, validators, helpers
│   │   └── widgets/             # Shared widgets (buttons, inputs, cards)
│   │
│   ├── features/                # Feature modules
│   │   ├── auth/
│   │   │   ├── data/            # Models, data sources, repositories impl
│   │   │   ├── domain/          # Entities, repository interfaces, use cases
│   │   │   └── presentation/    # BLoC, pages, widgets
│   │   ├── storefront/
│   │   ├── booking/
│   │   ├── reservation/
│   │   ├── order/
│   │   ├── messaging/
│   │   ├── loyalty/
│   │   ├── referral/
│   │   ├── review/
│   │   ├── favorite/
│   │   ├── profile/
│   │   └── notification/
│   │
│   ├── config/                  # Routes, DI setup (get_it)
│   └── main.dart
│
├── test/                        # Unit + widget tests
├── integration_test/            # Integration tests
├── pubspec.yaml
└── README.md
```

### Key Packages

| Category | Package | Purpose |
|----------|---------|---------|
| State management | `flutter_bloc` | BLoC pattern |
| HTTP | `dio` | API client with interceptors |
| DI | `get_it` + `injectable` | Dependency injection |
| Routing | `go_router` | Declarative routing |
| Storage | `flutter_secure_storage` | Token persistence |
| WebSocket | `web_socket_channel` + custom | Reverb/Echo compatibility |
| Maps | `google_maps_flutter` | Merchant map view |
| QR | `mobile_scanner` | Loyalty QR scanning |
| Push notifications | `firebase_messaging` | FCM push |
| Local notifications | `flutter_local_notifications` | In-app notifications |
| Image | `cached_network_image` | Image caching |
| Forms | `formz` or reactive_forms | Form validation |
| Freezed | `freezed` + `json_serializable` | Immutable models + JSON |
| Equatable | `equatable` | Value equality for BLoC |
| Functional | `dartz` or `fpdart` | Either type for error handling |

### API Client Architecture

```dart
// Dio interceptor handles:
// 1. Add Bearer token from secure storage
// 2. 401 response → clear auth, navigate to login
// 3. Refresh token (if implemented)
// 4. Request/response logging in debug

class ApiClient {
  final Dio dio;

  // All API calls return Either<Failure, T>
  // Failure types: ServerFailure, NetworkFailure, AuthFailure, ValidationFailure
}
```

### WebSocket Strategy

Laravel Reverb uses a Pusher-compatible protocol. Options:
1. **`pusher_channels_flutter`** — Official Pusher SDK, works with Reverb out of the box
2. **`laravel_echo_null`** + custom WebSocket — More control, but more work

**Decision: Use `pusher_channels_flutter`** since Reverb is Pusher-compatible. Configure with Reverb host/port/key.

Channels needed:
- `private-App.Models.User.{id}` — notifications
- `private-conversation.{id}` — chat messages
- `presence-merchant.{merchantId}` — online status

### Push Notifications

- Backend: Add FCM channel to Laravel notification system
- Mobile: `firebase_messaging` for FCM token registration
- API endpoint: `POST /auth/devices` to register FCM token on login
- Backend stores device tokens, sends push via FCM when notification created
- Deep linking: push notification payload includes route to navigate to

### Offline Support (Future)

- Cache merchant list, services, bookings/reservations/orders in local SQLite (drift/sqflite)
- Sync queue for actions taken offline
- Not in MVP — build online-first, add offline later

## Project Structure in Monorepo

```
laravel-react-template/
├── backend/                    # Laravel API (existing)
├── frontend/                   # Admin Next.js (existing)
├── frontend-customer-portal/   # Customer Next.js (existing)
├── mobile/                     # Flutter app (new)
│   ├── android/
│   ├── ios/
│   ├── lib/
│   ├── test/
│   ├── pubspec.yaml
│   └── README.md
├── CLAUDE.md                   # Updated with mobile commands
└── docs/
```

### Development Commands (for CLAUDE.md)

```bash
# From mobile/ directory:
flutter pub get                  # Install dependencies
flutter run                      # Run on connected device/emulator
flutter build apk               # Build Android APK
flutter build ios                # Build iOS
flutter test                     # Run unit tests
flutter test integration_test/   # Run integration tests
flutter analyze                  # Static analysis
dart run build_runner build      # Generate freezed/json_serializable code
```

## Feature Parity Mapping (Web → Mobile)

| Web (Customer Portal) | Mobile Screen | Notes |
|----------------------|---------------|-------|
| `/merchants` | MerchantsListPage + MerchantsMapPage | Tab view: list + map |
| `/merchants/[slug]` | MerchantDetailPage | Scrollable with gallery, services, reviews |
| `/merchants/[slug]/book` | BookingPage | Date/slot picker, checkout |
| `/merchants/[slug]/reserve` | ReservationPage | Date range, unit, checkout |
| `/merchants/[slug]/order` | OrderPage | Product, quantity, checkout |
| `/merchants/[slug]/branches` | BranchListPage | For organization merchants |
| `/bookings` | BookingsListPage | Customer's bookings |
| `/reservations` | ReservationsListPage | Customer's reservations |
| `/orders` | OrdersListPage | Customer's orders |
| `/favorites` | FavoritesPage | Saved merchants |
| `/loyalty` | LoyaltyCardsPage | Stamp cards |
| `/loyalty/[id]` | LoyaltyCardDetailPage | Card + stamps + rewards |
| `/loyalty/scan/[token]` | QrScanPage | Camera-based QR scanner |
| `/reviews` | MyReviewsPage | Customer's reviews |
| `/referrals` | ReferralsPage | Referral codes + stats |
| `/profile` | ProfilePage | Edit details, address, avatar |
| Messages (sheet) | MessagesPage + ChatPage | Conversation list + chat |
| Login/Register | AuthPages | Login, register, OTP verify |

## Open Questions

- Should the Flutter app be a separate Docker service for development? → No, Flutter runs natively; just needs API URL pointing to backend container
- iOS development requires macOS — plan for this?
- App name and bundle ID?
- Google Maps API key — reuse `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or separate?
- Firebase project setup for FCM?
- App store distribution strategy (TestFlight, Play Console)?

## Next Steps

- [ ] Set up Flutter project in `mobile/` with Clean Architecture skeleton
- [ ] Implement core layer (Dio client, auth interceptor, secure storage, theme)
- [ ] Implement auth feature (login, register, OTP, token management)
- [ ] Implement storefront feature (merchant list, detail, services)
- [ ] Implement booking/reservation/order checkout flows
- [ ] Implement messaging with WebSocket
- [ ] Implement loyalty, reviews, referrals, favorites
- [ ] Push notifications (requires backend FCM integration)
- [ ] `/plan` for detailed implementation phases
