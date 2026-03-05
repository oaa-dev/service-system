# Plan: Flutter Mobile App — Phase 1 (Storefront, Profile, Favorites, Reviews)

**Date:** 2026-03-05
**Type:** feature
**Status:** Draft
**Brainstorm:** `docs/brainstorms/2026-03-05-flutter-mobile-customer-portal.md`

## Knowledge Context

### Known Gotchas
- **FK Distinction on Reviews (CRITICAL):** `Review.customer_id` → `customers.id` (NOT `users.id`). Verified purchase check uses `User.id`. Don't create Review entity with user_id — the API resolves Customer internally. Just POST to the review endpoint with the review body; backend handles the FK mapping.
- **Eager-loading is Silent:** If a relation is eager-loaded in the service layer but missing a `whenLoaded()` in the Resource class, it is silently omitted from the JSON. If any field returns null unexpectedly, check the Resource first.
- **Organization Merchants:** `type === 'organization'` merchants cannot be booked/reserved directly. On merchant detail, check `merchant.type` and show "View Branches" instead of booking CTAs. (Phase 1 only shows merchant info; booking CTAs come in Phase 2, but the branch navigation needs routing now.)
- **Payment Preference Gate:** Payment method selection is locked behind `email_verified_at !== null`. Show a "Verify your email to manage payment preferences" banner if null.
- **Storefront is Public:** All `/storefront/*` endpoints require NO auth. The merchant list, detail, services, and reviews are public. Only favorites toggle and review creation require auth.
- **Avatar is on UserProfile:** The avatar media collection is on the `UserProfile` model, not on `Customer` or `User` directly. Avatar URL comes from `user.profile.avatar_url`.

### Critical Patterns Applied
- Clean Architecture + BLoC for every feature (mirrors auth feature structure)
- `freezed` + `json_serializable` for all models
- `injectable` for DI registration
- `fpdart` `Either<Failure, T>` for all repository returns
- `infinite_scroll_pagination` for all list pages
- `ShellRoute` in go_router for bottom nav shell

## Overview

Phase 1 builds the core browsing and identity experience on top of the already-complete auth skeleton. It covers:
1. **Infrastructure** — new packages, bottom nav shell route, custom brand theme
2. **Storefront** — merchant list (search, filter, GPS near-me, map view), merchant detail
3. **Favorites** — toggle on merchant cards, dedicated favorites list (in Me tab)
4. **Reviews** — display on merchant detail (public), write/edit/delete own reviews (authenticated)
5. **Profile** — view/edit personal info, avatar upload, change password, payment method preference

## Implementation Steps

---

### Step 1: Update pubspec.yaml — Add Phase 1 Dependencies

- **File:** `mobile/pubspec.yaml`
- **Details:** Add the following under `dependencies`:

```yaml
# Maps & Location
google_maps_flutter: ^2.9.0
geolocator: ^13.0.2
permission_handler: ^11.3.1

# Image handling
image_picker: ^1.1.2

# Pagination
infinite_scroll_pagination: ^4.1.0

# Star ratings
flutter_rating_bar: ^4.0.1

# HTTP multipart (for avatar upload)
http: ^1.2.2
```

Run: `/home/betrnk/flutter/bin/flutter pub get`

---

### Step 2: Configure Android for Maps + Location Permissions

- **Files:**
  - `mobile/android/app/src/main/AndroidManifest.xml`
  - `mobile/android/app/build.gradle` (or `build.gradle.kts`)

- **Details:**
  - Add Google Maps API key in `AndroidManifest.xml` inside `<application>`:
    ```xml
    <meta-data android:name="com.google.android.geo.API_KEY"
               android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
    ```
  - Add location permissions in `AndroidManifest.xml`:
    ```xml
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    ```
  - Set `minSdkVersion` to 21 in `build.gradle` (required by google_maps_flutter)

---

### Step 3: Update Core Theme — Custom Brand Design

- **Files:**
  - `mobile/lib/core/theme/app_colors.dart`
  - `mobile/lib/core/theme/app_typography.dart`
  - `mobile/lib/core/theme/app_theme.dart`

- **Details:** Define a custom color palette and Material 3 theme. Suggested palette (adjust to final brand):
  ```dart
  // app_colors.dart
  class AppColors {
    static const Color primary = Color(0xFF4F46E5);      // indigo-600
    static const Color primaryDark = Color(0xFF3730A3);  // indigo-800
    static const Color secondary = Color(0xFFF59E0B);    // amber-500
    static const Color surface = Color(0xFFFAFAFA);
    static const Color background = Color(0xFFFFFFFF);
    static const Color error = Color(0xFFEF4444);
    static const Color success = Color(0xFF22C55E);
    static const Color warning = Color(0xFFF59E0B);
    static const Color textPrimary = Color(0xFF111827);
    static const Color textSecondary = Color(0xFF6B7280);
    static const Color border = Color(0xFFE5E7EB);
  }
  ```
  - Use `GoogleFonts.inter()` for body and `GoogleFonts.plusJakartaSans()` for headings (or pick brand fonts)
  - Build `ThemeData.from(colorScheme: ColorScheme.fromSeed(...))` with Material 3

---

### Step 4: Add API Constants for Phase 1 Endpoints

- **File:** `mobile/lib/core/constants/api_constants.dart`
- **Details:** Add all Phase 1 endpoints:
  ```dart
  // Storefront (public)
  static const String storefrontMerchants = '/storefront/merchants';
  static String storefrontMerchant(String slug) => '/storefront/merchants/$slug';
  static String merchantServices(String slug) => '/storefront/merchants/$slug/services';
  static String merchantReviews(String slug) => '/storefront/merchants/$slug/reviews';

  // Customer - Favorites (auth required)
  static const String myFavorites = '/customer/my/favorites';
  static String toggleFavorite(int merchantId) => '/customer/my/favorites/$merchantId';

  // Customer - Reviews (auth required)
  static String createReview(int merchantId) => '/customer/merchants/$merchantId/reviews';
  static const String myReviews = '/customer/reviews';
  static String updateReview(int reviewId) => '/customer/reviews/$reviewId';
  static String deleteReview(int reviewId) => '/customer/reviews/$reviewId';

  // Customer - Profile (auth required)
  static const String myProfile = '/profile';
  static const String uploadAvatar = '/profile/avatar';
  static const String changePassword = '/profile/change-password';
  static const String myPaymentMethods = '/customer/my/payment-methods';
  static const String paymentPreferences = '/customer/my/payment-preferences';
  ```

---

### Step 5: Update Router — Add Bottom Nav Shell Route

- **File:** `mobile/lib/config/router.dart`
- **Details:**
  - Create `MainShell` widget (bottom nav with 4 tabs: Explore, Transactions, Rewards, Me)
  - Replace the current `/home` GoRoute with a `ShellRoute`
  - Add placeholder pages for Transactions and Rewards (will be filled in Phase 2 and 5)
  - Keep all auth routes (login, register, verify-otp) as top-level GoRoutes (outside the shell)

  ```dart
  // New routes inside ShellRoute:
  static const String explore = '/explore';
  static const String transactions = '/transactions';
  static const String rewards = '/rewards';
  static const String me = '/me';
  // Sub-routes
  static const String merchantDetail = '/merchants/:slug';
  static const String favorites = '/me/favorites';
  static const String myReviews = '/me/reviews';
  static const String editProfile = '/me/profile/edit';
  ```

  - Update redirect: `AuthAuthenticated` → `/explore` (was `/home`)
  - Remove the `/home` route and `HomePage`

- **New file:** `mobile/lib/core/widgets/main_shell.dart`
  - `StatefulWidget` with `BottomNavigationBar` (4 items)
  - Uses `context.go()` for tab switching via go_router shell index

---

### Step 6: Scaffold Storefront Feature

Follow the auth feature structure exactly. Create this directory tree:

```
mobile/lib/features/storefront/
  data/
    datasources/storefront_remote_data_source.dart
    models/merchant_model.dart
    models/merchant_model.g.dart          (generated)
    models/service_model.dart
    models/service_model.g.dart           (generated)
    repositories/storefront_repository_impl.dart
  domain/
    entities/merchant_entity.dart
    entities/service_entity.dart
    repositories/storefront_repository.dart
    usecases/get_merchants_use_case.dart
    usecases/get_merchant_detail_use_case.dart
    usecases/get_merchant_services_use_case.dart
  presentation/
    bloc/merchant_list/
      merchant_list_bloc.dart
      merchant_list_event.dart
      merchant_list_state.dart
    bloc/merchant_detail/
      merchant_detail_bloc.dart
      merchant_detail_event.dart
      merchant_detail_state.dart
    pages/
      explore_page.dart
      merchant_detail_page.dart
      merchant_map_page.dart
    widgets/
      merchant_card.dart
      search_bar_widget.dart
      filter_sheet.dart
      business_hours_widget.dart
      merchant_gallery_widget.dart
```

**Key model fields (MerchantModel):**
```dart
@freezed
class MerchantModel with _$MerchantModel {
  const factory MerchantModel({
    required int id,
    required String name,
    required String slug,
    required String type,       // 'individual' | 'organization'
    required String status,
    String? logoUrl,
    String? description,
    double? averageRating,
    int? reviewCount,
    int? childrenCount,         // branches (org merchants)
    int? parentId,
    @Default(false) bool isFavorited,
    // ... address, businessHours, capabilities, socialLinks
  }) = _MerchantModel;
  factory MerchantModel.fromJson(Map<String, dynamic> json) => _$MerchantModelFromJson(json);
}
```

**MerchantListBloc events:** `LoadMerchants`, `SearchMerchants(query)`, `FilterMerchants(filters)`, `LoadMoreMerchants`, `UseCurrentLocation`

**MerchantListBloc state:** `MerchantListInitial`, `MerchantListLoading`, `MerchantListLoaded(merchants, hasMore, location?)`, `MerchantListError`

**ExplorePage layout:**
- Search bar at top
- Filter chips row (business type, "Near Me" toggle)
- Toggle between List view and Map view (icon button in AppBar)
- List: `PagedListView` via `infinite_scroll_pagination`
- Map: `GoogleMap` with merchant pins + bottom sheet card on pin tap

**Knowledge note:** All storefront endpoints are public — do NOT add auth headers for these. The `ApiClient` should have a separate method or optional auth override for public calls, OR the auth interceptor should gracefully skip adding the Bearer token when no token is stored.

---

### Step 7: Implement GPS Near-Me Filtering

- **File:** `mobile/lib/features/storefront/data/datasources/storefront_remote_data_source.dart`
- **Details:**
  - Use `geolocator` to get `Position` when user toggles "Near Me"
  - Pass `lat` + `lng` + `radius` (default 10km) as query params to `GET /storefront/merchants`
  - The backend `StorefrontService::getActiveMerchants()` supports `lat`/`lng`/`radius` filter via Spatie QueryBuilder
  - Handle `LocationServiceDisabledException` and `PermissionDeniedException` with user-friendly error states
  - Use `permission_handler` to request `Permission.locationWhenInUse` before calling geolocator

---

### Step 8: Scaffold Favorites Feature

```
mobile/lib/features/favorites/
  data/
    datasources/favorites_remote_data_source.dart
    repositories/favorites_repository_impl.dart
  domain/
    repositories/favorites_repository.dart
    usecases/toggle_favorite_use_case.dart
    usecases/get_my_favorites_use_case.dart
  presentation/
    bloc/
      favorites_bloc.dart
      favorites_event.dart
      favorites_state.dart
    pages/favorites_page.dart
    widgets/favorite_button.dart
```

- **FavoriteButton widget:** Takes `merchantId` + `isFavorited` bool + optional callback. Renders heart icon (filled/outlined). On tap, calls `ToggleFavoriteUseCase`, optimistically updates UI, reverts on error.
- **FavoritesBloc events:** `LoadFavorites`, `ToggleFavorite(merchantId)`, `LoadMoreFavorites`
- **API:** `POST /customer/my/favorites/{merchantId}` (toggle — adds if not favorited, removes if favorited). Returns updated `is_favorited` boolean.
- **Placement:** `FavoriteButton` is embedded in `MerchantCard` and `MerchantDetailPage` AppBar. `FavoritesPage` is accessible from the Me tab.
- **Auth guard:** Show login prompt if user taps favorite button while unauthenticated (same "AuthGate" pattern as web portal — show dialog, not route redirect).

---

### Step 9: Scaffold Reviews Feature

```
mobile/lib/features/reviews/
  data/
    datasources/reviews_remote_data_source.dart
    models/review_model.dart
    models/review_model.g.dart
    repositories/reviews_repository_impl.dart
  domain/
    entities/review_entity.dart
    repositories/reviews_repository.dart
    usecases/get_merchant_reviews_use_case.dart
    usecases/create_review_use_case.dart
    usecases/update_review_use_case.dart
    usecases/delete_review_use_case.dart
    usecases/get_my_reviews_use_case.dart
  presentation/
    bloc/reviews/
      reviews_bloc.dart
      reviews_event.dart
      reviews_state.dart
    bloc/write_review/
      write_review_bloc.dart
      write_review_event.dart
      write_review_state.dart
    pages/my_reviews_page.dart
    widgets/
      review_card.dart
      review_summary_widget.dart    (average rating + count bar chart)
      star_rating_display.dart      (read-only, fractional stars)
      star_rating_input.dart        (interactive, uses flutter_rating_bar)
      write_review_sheet.dart       (bottom sheet form)
```

**Key model fields (ReviewModel):**
```dart
@freezed
class ReviewModel with _$ReviewModel {
  const factory ReviewModel({
    required int id,
    required int rating,       // 1-5
    String? title,
    String? comment,
    required bool isVerified,
    required bool isPublished,
    String? merchantReply,
    String? merchantRepliedAt,
    required String createdAt,
    ReviewCustomerModel? customer,    // has user.name, user.avatar_url
  }) = _ReviewModel;
}
```

**Write review flow:**
1. User taps "Write a Review" on merchant detail page
2. Bottom sheet opens with `StarRatingInput` (flutter_rating_bar) + optional title + optional comment TextFields
3. On submit → `CreateReviewUseCase` → `POST /customer/merchants/{merchantId}/reviews`
4. Handle 403 (no completed transaction) → show "You need to complete a booking first" message
5. Handle 409 (duplicate) → show "You've already reviewed this merchant" message
6. On success → close sheet, refresh merchant detail reviews

**Knowledge note:** `Review.customer_id` is FK to `customers.id`, NOT `users.id`. This is handled entirely on the backend — the mobile app just sends the review body and the bearer token. The backend resolves the Customer record internally.

---

### Step 10: Scaffold Profile Feature

```
mobile/lib/features/profile/
  data/
    datasources/profile_remote_data_source.dart
    models/customer_profile_model.dart
    models/customer_profile_model.g.dart
    models/payment_method_model.dart
    models/payment_method_model.g.dart
    repositories/profile_repository_impl.dart
  domain/
    entities/customer_profile_entity.dart
    entities/payment_method_entity.dart
    repositories/profile_repository.dart
    usecases/get_profile_use_case.dart
    usecases/update_profile_use_case.dart
    usecases/upload_avatar_use_case.dart
    usecases/change_password_use_case.dart
    usecases/get_payment_methods_use_case.dart
    usecases/update_payment_preference_use_case.dart
  presentation/
    bloc/profile/
      profile_bloc.dart
      profile_event.dart
      profile_state.dart
    pages/
      me_page.dart                    (root Me tab: avatar, name, nav items)
      edit_profile_page.dart
    widgets/
      personal_info_tab.dart
      account_tab.dart
      payment_tab.dart
      avatar_picker_widget.dart       (image_picker + crop)
      identity_status_badge.dart
```

**MePage layout (Me tab root):**
- Avatar + name + email header (tappable → edit profile)
- List tiles: Edit Profile, My Favorites, My Reviews, Payment Methods, Change Password, Logout

**Avatar upload flow:**
1. Tap avatar → `ImagePicker.pickImage(source: ImageSource.gallery)` or camera option
2. Basic crop (crop image package or manual `imageRect` selection — keep simple for Phase 1)
3. Upload as `multipart/form-data` → `POST /profile/avatar` with `avatar` field
4. Backend validates via `ImageRule::avatar()` (jpeg, png, webp, 5MB max, 100x100 min)
5. Response includes new `avatar_url`; update profile bloc state

**Payment tab:**
- On load: check `profile.email_verified_at !== null`
- If null: show lock banner "Verify your email to manage payment preferences"
- If verified: `GET /customer/my/payment-methods` → radio list of methods
- On select: `PUT /customer/my/payment-preferences` with `{ payment_method_id: id }`

**APIs:**
```
GET  /api/v1/profile                         → profile + avatar_url
PUT  /api/v1/profile                         → update personal info
POST /api/v1/profile/avatar                  → upload avatar (multipart)
DELETE /api/v1/profile/avatar                → remove avatar
POST /api/v1/profile/change-password         → { current_password, password, password_confirmation }
GET  /api/v1/customer/my/payment-methods     → list available payment methods
PUT  /api/v1/customer/my/payment-preferences → { payment_method_id }
```

---

### Step 11: Register All New Features in DI

- **File:** `mobile/lib/config/injection.dart` (and regenerate `injection.config.dart`)
- **Details:** Annotate all new repositories and data sources with `@LazySingleton`. Annotate all new BLoCs with `@injectable` (factory). Run `build_runner` to regenerate.

  ```bash
  cd mobile
  /home/betrnk/flutter/bin/dart run build_runner build --delete-conflicting-outputs
  ```

---

### Step 12: Wire BLoCs into Router / Pages

- **File:** `mobile/lib/config/router.dart`
- **Details:**
  - Each page that needs a BLoC gets it via `BlocProvider` in the router `builder` (using `context.read<GetIt>()` or `sl<BlocType>()`)
  - Pattern from auth: `BlocProvider(create: (_) => sl<MerchantListBloc>()..add(LoadMerchantsEvent()), child: ExplorePage())`
  - Shared BLoCs (e.g., FavoritesBloc, ProfileBloc) should be provided at the shell level so they persist across tab navigation

---

### Step 13: Update HomePage → Remove, Replace with Shell

- **File:** `mobile/lib/features/auth/presentation/pages/home_page.dart`
- **Action:** Delete `home_page.dart`. The router's auth redirect will now point to `/explore` (the shell). The shell's `ExplorePage` becomes the landing page.

---

### Step 14: Integration Testing Checklist

Run the app on Android emulator against the local backend (API at `http://10.0.2.2:8090/api/v1`):

- [ ] Merchant list loads with pagination
- [ ] Search filters merchants by name in real-time
- [ ] "Near Me" toggle requests GPS permission, filters by location
- [ ] Map view shows merchant pins; tapping pin shows bottom card
- [ ] Merchant detail loads: name, logo, services list, business hours, reviews
- [ ] Organization merchant shows "View Branches" instead of booking CTA
- [ ] Favorite button toggles heart icon; requires auth (shows login prompt if not)
- [ ] Favorites page loads authenticated user's favorites
- [ ] Star rating displays correctly on merchant cards (fractional support)
- [ ] Public reviews load on merchant detail without auth
- [ ] Write review bottom sheet opens; submission returns 403 if no completed transaction
- [ ] Duplicate review returns 409 with readable message
- [ ] My Reviews page shows user's reviews with edit/delete
- [ ] Profile loads personal info and avatar
- [ ] Avatar upload picks image, uploads, updates UI
- [ ] Change password validates current password correctly
- [ ] Payment tab shows lock banner when email not verified
- [ ] Payment tab shows method list when email verified; selection saves
- [ ] Bottom nav switches between tabs, maintaining state per tab
- [ ] Auth redirect works: unauthenticated → /login; authenticated → /explore

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Google Maps API key not set up for Android | Medium | Follow Step 2 exactly; test on emulator with real key |
| GPS permission denied by user | Medium | Show graceful fallback (manual search only) instead of error screen |
| Review FK confusion (customer vs user id) | Low | All handled on backend; mobile just sends bearer token |
| Avatar upload fails silent (eager-load missing) | Low | Test `/profile` response includes `avatar_url` field; if null, check `UserProfile` Media Resource |
| Payment tab unintentionally accessible without email verification | Medium | Check `email_verified_at` in PaymentTab widget before rendering method list |
| `infinite_scroll_pagination` v4 API changes vs v3 | Low | Confirm package version; check `PagingController` constructor API |
| `freezed` v3 breaking changes vs auth model pattern | Low | Auth models use freezed 3.x already; follow same pattern |

## Open Questions

- Map library resolved: `google_maps_flutter` (same API key as web portal)
- GPS near-me: Yes, use `geolocator` + `permission_handler`
- Payment processing (PayMongo) deferred to later phase — Phase 1 only saves preference
- Push notifications deferred — not in Phase 1 scope
- Android-only for Phase 1; iOS config can be added later (no major code changes, just plist + provisioning)

## File Count Estimate

| Feature | New Files |
|---------|-----------|
| pubspec + Android config | 2 |
| Theme (colors, typography, theme) | 3 |
| Router + MainShell | 2 |
| Storefront | ~20 |
| Favorites | ~10 |
| Reviews | ~15 |
| Profile | ~16 |
| **Total** | **~68 new files** |

(Plus generated `.g.dart` files from build_runner — do not edit manually)
