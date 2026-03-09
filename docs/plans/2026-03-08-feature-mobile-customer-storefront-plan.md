# Plan: Mobile Customer Storefront — Complete Feature Parity

**Date:** 2026-03-08
**Type:** feature
**Status:** Draft
**Brainstorm:** [2026-03-08-mobile-customer-storefront-complete.md](../brainstorms/2026-03-08-mobile-customer-storefront-complete.md)

## Knowledge Context

### Relevant Learnings
- **Portal Customer Module** (`docs/knowledge/modules/portal-customer.md`): All transaction list endpoints use Spatie QueryBuilder with `sort`, `filter[]`, `page`, `per_page` params. Dashboard stats at `/customer/my/stats`.
- **Portal Storefront Module** (`docs/knowledge/modules/portal-storefront.md`): Two-tier booking availability — MerchantSlotPicker (`?date=YYYY-MM-DD`) vs schedule-based fallback. Organization merchants gate booking behind branch selection.
- **Booking Module** (`docs/knowledge/modules/booking.md`): `booking_slot_id` overrides DTO start/end times. Capacity check via `count(pending+confirmed) vs max_capacity`.
- **Reservation Module** (`docs/knowledge/modules/reservation.md`): Overlap check: `where('check_in', '<', $checkOut)->where('check_out', '>', $checkIn)`. Calendar counts active reservations per day.
- **Loyalty Program Module** (`docs/knowledge/modules/loyalty-program.md`): `LoyaltyCard.customer_id` = FK to **customers** table. QR modes: single_use (2-min expiry) vs daily (end-of-day, multi-scan).
- **Messaging Module** (`docs/knowledge/modules/messaging.md`): Idempotent `getOrCreateConversation()`. Morph aliases: `'booking'`, `'reservation'`, `'service_order'`. Poll every 5s with deduplication.

### Known Gotchas
- **customer_id distinction:** Booking/Reservation/Order use `User.id` as customer_id. LoyaltyCard/Review use FK to `customers` table. Mobile must NOT confuse these.
- **Organization merchant gate:** `type='organization'` merchants cannot be booked directly — must select branch first.
- **Dio Content-Type:** Don't hardcode `Content-Type` header — let Dio auto-detect for multipart (already correctly handled in existing ApiClient).
- **Auth state:** Mobile uses flutter_secure_storage + BLoC (not Zustand), so the web auth race condition doesn't apply. But ensure auth guard checks `AuthAuthenticated` state before loading protected data.

### Critical Patterns Applied
- **Clean Architecture:** Domain (Entity/UseCase/RepoInterface) → Data (Model/DataSource/RepoImpl) → Presentation (BLoC/Page/Widget)
- **BLoC event sourcing:** sealed Event + sealed State classes, `@injectable` BLoC, `@lazySingleton` for everything else
- **Either<Failure, T>:** All data layer returns wrapped in fpdart Either
- **ApiConstants:** All endpoints in centralized constants file
- **Code generation:** Models use `@JsonSerializable()` + `.g.dart`, DI uses `@injectable` + `injection.config.dart`

## Overview

Build 7 phases of mobile features to achieve full parity with the customer portal web app. Each phase is independently deployable. All features use the same backend API endpoints — zero backend changes needed.

**Existing infrastructure (no changes needed):**
- ApiClient (Dio + AuthInterceptor)
- SecureStorage for auth tokens
- GoRouter with auth redirects
- DI via get_it + injectable
- Theme system (AppColors, AppTypography)
- Core widgets (AppButton, AppTextField, ShimmerLoading, MainShell)

---

## Phase 1: Dashboard + Transaction History

**Goal:** Replace Transactions tab placeholder with real data. Add dashboard stats to Me tab.

### Step 1.1: Add Dependencies

- **File:** `mobile/pubspec.yaml`
- **Details:** Add `intl: ^0.19.0` for date/time formatting across all transaction displays. Run `flutter pub get`.

### Step 1.2: Add API Constants

- **File:** `mobile/lib/core/constants/api_constants.dart`
- **Details:** Add endpoint constants for all customer portal APIs:
  ```dart
  // Dashboard
  static const String customerStats = '/customer/my/stats';

  // Bookings
  static const String myBookings = '/customer/my/bookings';
  static String myBookingDetail(int id) => '/customer/my/bookings/$id';
  static String cancelBooking(int id) => '/customer/my/bookings/$id/cancel';

  // Reservations
  static const String myReservations = '/customer/my/reservations';
  static String myReservationDetail(int id) => '/customer/my/reservations/$id';
  static String cancelReservation(int id) => '/customer/my/reservations/$id/cancel';

  // Orders
  static const String myOrders = '/customer/my/orders';
  static String myOrderDetail(int id) => '/customer/my/orders/$id';
  static String cancelOrder(int id) => '/customer/my/orders/$id/cancel';
  ```

### Step 1.3: Dashboard Feature — Domain Layer

- **Files:**
  - `mobile/lib/features/dashboard/domain/entities/dashboard_stats_entity.dart`
  - `mobile/lib/features/dashboard/domain/repositories/dashboard_repository.dart`
  - `mobile/lib/features/dashboard/domain/usecases/get_dashboard_stats_use_case.dart`
- **Details:**
  - `DashboardStatsEntity`: totalBookings, totalReservations, totalOrders, pendingBookings, confirmedBookings, activeReservations, pendingOrders (all `int`)
  - Repository: `Future<Either<Failure, DashboardStatsEntity>> getStats()`
  - UseCase: simple pass-through

### Step 1.4: Dashboard Feature — Data Layer

- **Files:**
  - `mobile/lib/features/dashboard/data/models/dashboard_stats_model.dart`
  - `mobile/lib/features/dashboard/data/datasources/dashboard_remote_data_source.dart`
  - `mobile/lib/features/dashboard/data/repositories/dashboard_repository_impl.dart`
- **Details:**
  - Model: `@JsonSerializable()` with `@JsonKey(name: 'snake_case')` mapping
  - DataSource: `GET /customer/my/stats` → parse `json['data']`
  - RepoImpl: `@LazySingleton(as: DashboardRepository)`, maps model → entity

### Step 1.5: Dashboard Feature — Presentation Layer

- **Files:**
  - `mobile/lib/features/dashboard/presentation/bloc/dashboard_bloc.dart`
  - `mobile/lib/features/dashboard/presentation/bloc/dashboard_event.dart`
  - `mobile/lib/features/dashboard/presentation/bloc/dashboard_state.dart`
  - `mobile/lib/features/dashboard/presentation/widgets/stats_card.dart`
- **Details:**
  - Events: `LoadDashboardStatsEvent`
  - States: `DashboardInitial`, `DashboardLoading`, `DashboardLoaded(stats)`, `DashboardError(message)`
  - `StatsCard` widget: icon + count + label, used in a grid on the Me page
  - Integrate into existing `MePage` — add stats section above menu items

### Step 1.6: Transactions Feature — Domain Layer (Shared Entities)

- **Files:**
  - `mobile/lib/features/transactions/domain/entities/booking_entity.dart`
  - `mobile/lib/features/transactions/domain/entities/reservation_entity.dart`
  - `mobile/lib/features/transactions/domain/entities/service_order_entity.dart`
  - `mobile/lib/features/transactions/domain/repositories/transactions_repository.dart`
  - `mobile/lib/features/transactions/domain/usecases/get_my_bookings_use_case.dart`
  - `mobile/lib/features/transactions/domain/usecases/get_my_reservations_use_case.dart`
  - `mobile/lib/features/transactions/domain/usecases/get_my_orders_use_case.dart`
  - `mobile/lib/features/transactions/domain/usecases/get_booking_detail_use_case.dart`
  - `mobile/lib/features/transactions/domain/usecases/get_reservation_detail_use_case.dart`
  - `mobile/lib/features/transactions/domain/usecases/get_order_detail_use_case.dart`
  - `mobile/lib/features/transactions/domain/usecases/cancel_booking_use_case.dart`
  - `mobile/lib/features/transactions/domain/usecases/cancel_reservation_use_case.dart`
  - `mobile/lib/features/transactions/domain/usecases/cancel_order_use_case.dart`
- **Details:**
  - `BookingEntity`: id, merchantName, serviceName, bookingDate, startTime, endTime, partySize, status, servicePrice, feeAmount, totalAmount, notes, createdAt
  - `ReservationEntity`: id, merchantName, unitTypeName, unitName, checkIn, checkOut, guestCount, status, servicePrice, feeAmount, totalAmount, notes, createdAt
  - `ServiceOrderEntity`: id, orderNumber, merchantName, serviceName, quantity, status, servicePrice, feeAmount, totalAmount, notes, createdAt
  - Repository: `getMyBookings({page, sort, status})`, `getMyReservations(...)`, `getMyOrders(...)`, `getBookingDetail(id)`, `getReservationDetail(id)`, `getOrderDetail(id)`, `cancelBooking(id)`, `cancelReservation(id)`, `cancelOrder(id)`
  - Status values — Booking: pending/confirmed/completed/no_show/cancelled; Reservation: pending/confirmed/checked_in/checked_out/cancelled; Order: pending/received/processing/ready/delivering/completed/cancelled

### Step 1.7: Transactions Feature — Data Layer

- **Files:**
  - `mobile/lib/features/transactions/data/models/booking_model.dart`
  - `mobile/lib/features/transactions/data/models/reservation_model.dart`
  - `mobile/lib/features/transactions/data/models/service_order_model.dart`
  - `mobile/lib/features/transactions/data/datasources/transactions_remote_data_source.dart`
  - `mobile/lib/features/transactions/data/repositories/transactions_repository_impl.dart`
- **Details:**
  - Models: `@JsonSerializable()` with all API fields. Nested merchant/service as `Map<String, dynamic>?` with getter extraction
  - DataSource: list endpoints accept `{page, sort, status}` query params. Detail endpoints return single object. Cancel endpoints use PATCH
  - RepoImpl: maps models → entities, handles pagination metadata
  - **Knowledge note:** Sort param format: `-booking_date` (descending), `booking_date` (ascending). Status filter: `filter[status]=pending`

### Step 1.8: Transactions Feature — Presentation Layer

- **Files:**
  - `mobile/lib/features/transactions/presentation/bloc/bookings/bookings_bloc.dart`
  - `mobile/lib/features/transactions/presentation/bloc/bookings/bookings_event.dart`
  - `mobile/lib/features/transactions/presentation/bloc/bookings/bookings_state.dart`
  - `mobile/lib/features/transactions/presentation/bloc/reservations/reservations_bloc.dart`
  - `mobile/lib/features/transactions/presentation/bloc/reservations/reservations_event.dart`
  - `mobile/lib/features/transactions/presentation/bloc/reservations/reservations_state.dart`
  - `mobile/lib/features/transactions/presentation/bloc/orders/orders_bloc.dart`
  - `mobile/lib/features/transactions/presentation/bloc/orders/orders_event.dart`
  - `mobile/lib/features/transactions/presentation/bloc/orders/orders_state.dart`
  - `mobile/lib/features/transactions/presentation/pages/transactions_page.dart`
  - `mobile/lib/features/transactions/presentation/pages/bookings_tab.dart`
  - `mobile/lib/features/transactions/presentation/pages/reservations_tab.dart`
  - `mobile/lib/features/transactions/presentation/pages/orders_tab.dart`
  - `mobile/lib/features/transactions/presentation/widgets/transaction_card.dart`
  - `mobile/lib/features/transactions/presentation/widgets/status_chip.dart`
  - `mobile/lib/features/transactions/presentation/widgets/booking_detail_sheet.dart`
  - `mobile/lib/features/transactions/presentation/widgets/reservation_detail_sheet.dart`
  - `mobile/lib/features/transactions/presentation/widgets/order_detail_sheet.dart`
- **Details:**
  - `TransactionsPage`: `DefaultTabController` with 3 tabs (Bookings, Reservations, Orders)
  - Each tab: pull-to-refresh list with status filter chips at top, infinite scroll pagination
  - `StatusChip`: color-coded by status (pending=amber, confirmed=blue, completed=green, cancelled=red)
  - Detail sheets: `showModalBottomSheet` with full transaction info + cancel button (only for pending status) + "Message Merchant" button (Phase 6)
  - Cancel confirmation: `showDialog` with "Are you sure?" before dispatching cancel event
  - Empty states: icon + message + "Explore Merchants" CTA button

### Step 1.9: Wire Up Router + DI

- **File:** `mobile/lib/config/router.dart`
- **Details:**
  - Replace `PlaceholderTabPage` for transactions with `TransactionsPage`
  - Add `BlocProvider`s for `BookingsBloc`, `ReservationsBloc`, `OrdersBloc` in `ShellRoute`
  - Add `DashboardBloc` to `MultiBlocProvider` in `ShellRoute`
  - Add route for booking/reservation/order detail pages (if needed as separate routes)

- **File:** `mobile/lib/core/constants/api_constants.dart` — already done in Step 1.2

- **Details:** After all files created, run `dart run build_runner build --delete-conflicting-outputs` to generate `.g.dart` and `injection.config.dart`

### Step 1.10: Integrate Dashboard into MePage

- **File:** `mobile/lib/features/profile/presentation/pages/me_page.dart`
- **Details:**
  - Add `DashboardBloc` listener/builder at top of MePage
  - Show 4 stat cards in a 2x2 grid: Total Bookings, Active Reservations, Pending Orders, Completed
  - Cards tap → navigate to respective Transactions tab
  - Load stats on page init alongside profile data

---

## Phase 2: Booking Flow

**Goal:** Enable customers to create bookings from merchant detail page via bottom sheet wizard.

### Step 2.1: Booking Availability — Domain Layer

- **Files:**
  - `mobile/lib/features/storefront/domain/entities/booking_availability_entity.dart`
  - `mobile/lib/features/storefront/domain/entities/booking_slot_entity.dart`
  - `mobile/lib/features/storefront/domain/usecases/get_booking_availability_use_case.dart`
  - `mobile/lib/features/storefront/domain/usecases/create_booking_use_case.dart`
- **Details:**
  - `BookingAvailabilityEntity`: date, hasSlots, slots (list of `BookingSlotEntity`), scheduleSlots (list of time ranges from service schedules)
  - `BookingSlotEntity`: id, startTime, endTime, maxCapacity, currentBookings, isAvailable
  - `CreateBookingUseCase`: takes slug, serviceId, date, startTime, endTime, partySize, notes, bookingSlotId (optional)
  - **Knowledge note:** Two-tier availability system. If merchant has booking slots defined, use those. Otherwise fall back to service schedule time ranges.

### Step 2.2: Booking Availability — Data Layer

- **Files:**
  - `mobile/lib/features/storefront/data/models/booking_availability_model.dart`
  - `mobile/lib/features/storefront/data/models/booking_slot_model.dart`
  - Extend existing `StorefrontRemoteDataSource` and `StorefrontRepository`
- **Details:**
  - Add to API constants: `static String bookingAvailability(String slug) => '/storefront/merchants/$slug/booking-availability'`
  - DataSource method: `getBookingAvailability(slug, {month, date})` — `?month=YYYY-MM` for calendar view, `?date=YYYY-MM-DD` for slot detail
  - Add to API constants: `static String createBooking(String slug) => '/customer/merchants/$slug/bookings'`
  - DataSource method: `createBooking(slug, data)` — POST with body

### Step 2.3: Booking Form BLoC

- **Files:**
  - `mobile/lib/features/storefront/presentation/bloc/booking_form/booking_form_bloc.dart`
  - `mobile/lib/features/storefront/presentation/bloc/booking_form/booking_form_event.dart`
  - `mobile/lib/features/storefront/presentation/bloc/booking_form/booking_form_state.dart`
- **Details:**
  - Multi-step wizard state machine:
    ```
    BookingFormState {
      step: 1|2|3|4  // Select Service → Pick Date → Pick Time/Slot → Confirm
      selectedService: ServiceEntity?
      selectedDate: DateTime?
      selectedSlot: BookingSlotEntity?  // or custom time
      selectedStartTime: String?
      selectedEndTime: String?
      partySize: int (default 1)
      notes: String?
      availability: BookingAvailabilityEntity?
      services: List<ServiceEntity>
      isSubmitting: bool
      error: String?
    }
    ```
  - Events: `SelectServiceEvent`, `SelectDateEvent`, `LoadAvailabilityEvent`, `SelectSlotEvent`, `SetPartySizeEvent`, `SetNotesEvent`, `SubmitBookingEvent`, `GoBackEvent`
  - On `SelectDateEvent`: auto-dispatch `LoadAvailabilityEvent` for that date
  - On `SubmitBookingEvent`: call `createBooking`, emit `BookingFormSuccess` or `BookingFormError`
  - **Knowledge note:** If `booking_slot_id` is provided, the backend overrides start/end times from the slot definition. Send slot_id when using merchant-defined slots.

### Step 2.4: Booking Wizard UI

- **Files:**
  - `mobile/lib/features/storefront/presentation/widgets/booking/booking_wizard_sheet.dart`
  - `mobile/lib/features/storefront/presentation/widgets/booking/service_selector.dart`
  - `mobile/lib/features/storefront/presentation/widgets/booking/date_picker_step.dart`
  - `mobile/lib/features/storefront/presentation/widgets/booking/slot_picker_step.dart`
  - `mobile/lib/features/storefront/presentation/widgets/booking/booking_confirm_step.dart`
  - `mobile/lib/features/storefront/presentation/widgets/booking/booking_success.dart`
- **Details:**
  - `BookingWizardSheet`: Full-height `DraggableScrollableSheet` with step indicator at top (4 dots)
  - Step 1 — `ServiceSelector`: List of bookable services (`is_bookable=true`) with radio selection. Shows name, price, duration
  - Step 2 — `DatePickerStep`: Calendar widget (use Flutter's built-in `TableCalendar` or custom). Highlighted dates with available slots. Min date = today
  - Step 3 — `SlotPickerStep`: Grid of time slots (merchant slots if available, else schedule-based). Each slot shows time + remaining capacity. Disabled if full. Party size input with +/- stepper
  - Step 4 — `BookingConfirmStep`: Summary card (service, date, time, party size, price breakdown: service_price + fee = total). Notes text field. "Confirm Booking" button
  - Success: Animated checkmark + booking reference + "View My Bookings" button
  - **Knowledge note:** Organization merchants (`type='organization'`) — hide "Book Now" button on merchant detail, show "View Branches" instead. Each branch is bookable individually.

### Step 2.5: Integrate into Merchant Detail

- **File:** `mobile/lib/features/storefront/presentation/pages/merchant_detail_page.dart`
- **Details:**
  - Add floating "Book Now" button at bottom (only if `merchant.canTakeBookings == true` AND `merchant.type != 'organization'`)
  - On tap: `showModalBottomSheet` → `BookingWizardSheet` with `BlocProvider` for `BookingFormBloc`
  - Pass merchant slug and services to the wizard
  - For organization merchants: show "View Branches" button instead → navigate to branches list

---

## Phase 3: Reservation + Order Flows

**Goal:** Enable reservations (unit bookings) and product orders using the same wizard pattern.

### Step 3.1: Reservation Flow — Domain + Data

- **Files:**
  - `mobile/lib/features/storefront/domain/entities/reservation_availability_entity.dart`
  - `mobile/lib/features/storefront/domain/entities/unit_type_entity.dart`
  - `mobile/lib/features/storefront/domain/usecases/get_reservation_availability_use_case.dart`
  - `mobile/lib/features/storefront/domain/usecases/create_reservation_use_case.dart`
  - `mobile/lib/features/storefront/data/models/reservation_availability_model.dart`
  - `mobile/lib/features/storefront/data/models/unit_type_model.dart`
  - Extend `StorefrontRemoteDataSource` and `StorefrontRepository`
- **Details:**
  - API: `GET /storefront/merchants/{slug}/reservation-availability?month=YYYY-MM` returns daily availability counts
  - `ReservationAvailabilityEntity`: date, availableUnits (count), unitTypes (list with available units)
  - `UnitTypeEntity`: id, name, description, pricePerNight, units (list of available units for selected dates)
  - Create: `POST /customer/merchants/{slug}/reservations` with unitTypeId, unitId (optional), checkIn, checkOut, guestCount, notes
  - **Knowledge note:** Overlap check is backend-enforced. Frontend should show "unavailable" dates but doesn't need to duplicate the overlap logic.

### Step 3.2: Reservation Form BLoC + UI

- **Files:**
  - `mobile/lib/features/storefront/presentation/bloc/reservation_form/reservation_form_bloc.dart` (+ event + state)
  - `mobile/lib/features/storefront/presentation/widgets/reservation/reservation_wizard_sheet.dart`
  - `mobile/lib/features/storefront/presentation/widgets/reservation/unit_type_selector.dart`
  - `mobile/lib/features/storefront/presentation/widgets/reservation/date_range_picker_step.dart`
  - `mobile/lib/features/storefront/presentation/widgets/reservation/reservation_confirm_step.dart`
- **Details:**
  - 4 steps: Select Unit Type → Pick Check-in/Check-out → Set Guest Count → Confirm
  - Date range picker: two-tap selection (check-in, then check-out). Unavailable dates greyed out
  - Guest count: +/- stepper
  - Confirmation: unit type, dates, nights count, price per night × nights + fee = total
  - Only show "Reserve" button if `merchant.canRentUnits == true`

### Step 3.3: Order Flow — Domain + Data

- **Files:**
  - `mobile/lib/features/storefront/domain/usecases/create_order_use_case.dart`
  - Extend `StorefrontRemoteDataSource` and `StorefrontRepository`
- **Details:**
  - Uses existing services list (filter `is_sellable=true`)
  - Create: `POST /customer/merchants/{slug}/orders` with serviceId, quantity, notes
  - No availability check needed — just stock validation (backend returns 422 if out of stock)

### Step 3.4: Order Form BLoC + UI

- **Files:**
  - `mobile/lib/features/storefront/presentation/bloc/order_form/order_form_bloc.dart` (+ event + state)
  - `mobile/lib/features/storefront/presentation/widgets/order/order_wizard_sheet.dart`
  - `mobile/lib/features/storefront/presentation/widgets/order/product_selector.dart`
  - `mobile/lib/features/storefront/presentation/widgets/order/order_confirm_step.dart`
- **Details:**
  - 3 steps: Select Product → Set Quantity → Confirm
  - Product selector: list of sellable services with image, name, price, stock count
  - Quantity: +/- stepper (max = stock_quantity if track_stock)
  - Confirmation: product, quantity × unit_price + fee = total
  - Only show "Order" button if `merchant.canSellProducts == true`

### Step 3.5: Merchant Detail — Action Buttons

- **File:** `mobile/lib/features/storefront/presentation/pages/merchant_detail_page.dart`
- **Details:**
  - Dynamic action buttons based on capabilities:
    - `canTakeBookings` → "Book Now" button
    - `canRentUnits` → "Reserve" button
    - `canSellProducts` → "Order" button
  - Organization merchants → "View Branches" instead of all action buttons
  - Multiple capabilities → show a row of buttons or a bottom action bar

---

## Phase 4: Loyalty Program

**Goal:** Loyalty cards, stamps, QR scanning, rewards.

### Step 4.1: Add QR Scanner Dependency

- **File:** `mobile/pubspec.yaml`
- **Details:** Add `mobile_scanner: ^6.0.0` for QR code scanning. Run `flutter pub get`.

### Step 4.2: Loyalty — Domain Layer

- **Files:**
  - `mobile/lib/features/loyalty/domain/entities/loyalty_card_entity.dart`
  - `mobile/lib/features/loyalty/domain/entities/loyalty_program_entity.dart`
  - `mobile/lib/features/loyalty/domain/entities/loyalty_reward_entity.dart`
  - `mobile/lib/features/loyalty/domain/entities/scan_result_entity.dart`
  - `mobile/lib/features/loyalty/domain/repositories/loyalty_repository.dart`
  - `mobile/lib/features/loyalty/domain/usecases/get_my_loyalty_cards_use_case.dart`
  - `mobile/lib/features/loyalty/domain/usecases/get_loyalty_card_detail_use_case.dart`
  - `mobile/lib/features/loyalty/domain/usecases/get_my_rewards_use_case.dart`
  - `mobile/lib/features/loyalty/domain/usecases/scan_qr_code_use_case.dart`
- **Details:**
  - `LoyaltyCardEntity`: id, merchantName, merchantLogo, programName, currentStamps, requiredStamps, totalStampsEarned, totalRewardsEarned, status
  - `LoyaltyRewardEntity`: id, name, description, type (free_product/discount_percentage/discount_fixed), value, status (available/redeemed/expired), expiresAt
  - `ScanResultEntity`: success, message, stampsAdded, currentStamps, rewardUnlocked (nullable)
  - Repository: `getMyCards()`, `getCardDetail(id)`, `getMyRewards()`, `scanQrCode(token)`
  - **Knowledge note:** `customer_id` on LoyaltyCard = FK to customers table. The scan endpoint uses auth token to resolve the customer, so mobile just needs to POST the QR token.

### Step 4.3: Loyalty — Data Layer

- **Files:**
  - `mobile/lib/features/loyalty/data/models/loyalty_card_model.dart`
  - `mobile/lib/features/loyalty/data/models/loyalty_reward_model.dart`
  - `mobile/lib/features/loyalty/data/models/scan_result_model.dart`
  - `mobile/lib/features/loyalty/data/datasources/loyalty_remote_data_source.dart`
  - `mobile/lib/features/loyalty/data/repositories/loyalty_repository_impl.dart`
- **Details:**
  - API endpoints:
    - `GET /customer/loyalty-cards` — list with pagination
    - `GET /customer/loyalty-cards/{id}` — detail with stamps and rewards
    - `GET /customer/loyalty-rewards` — all rewards across cards
    - `POST /customer/loyalty/scan` — body: `{ token: "qr-code-value" }`
  - Scan error handling: 409 → "Already scanned today", 410 → "QR code expired", 404 → "Invalid QR code", 422 → validation error

### Step 4.4: Loyalty — Presentation Layer

- **Files:**
  - `mobile/lib/features/loyalty/presentation/bloc/loyalty_cards/loyalty_cards_bloc.dart` (+ event + state)
  - `mobile/lib/features/loyalty/presentation/bloc/qr_scanner/qr_scanner_bloc.dart` (+ event + state)
  - `mobile/lib/features/loyalty/presentation/pages/loyalty_cards_page.dart`
  - `mobile/lib/features/loyalty/presentation/pages/loyalty_card_detail_page.dart`
  - `mobile/lib/features/loyalty/presentation/pages/qr_scanner_page.dart`
  - `mobile/lib/features/loyalty/presentation/widgets/stamp_card.dart`
  - `mobile/lib/features/loyalty/presentation/widgets/stamp_grid.dart`
  - `mobile/lib/features/loyalty/presentation/widgets/reward_card.dart`
  - `mobile/lib/features/loyalty/presentation/widgets/scan_result_dialog.dart`
- **Details:**
  - `LoyaltyCardsPage`: List of cards with visual stamp progress (circular progress or stamp grid)
  - `StampGrid`: Grid of circles — filled for earned stamps, empty for remaining. e.g., 7/10 stamps = 7 filled + 3 empty
  - `LoyaltyCardDetailPage`: Full card view with stamp history, available rewards, merchant info
  - `QrScannerPage`: Full-screen camera with `MobileScanner` widget. On scan → `POST /customer/loyalty/scan` → show result dialog
  - `ScanResultDialog`: Animated success (stamp added + confetti-like feedback) or error (already scanned / expired)
  - `RewardCard`: Reward type icon + name + value + expiry + "Available"/"Redeemed" badge
  - FAB on loyalty cards page → navigate to QR scanner

### Step 4.5: Wire Up Rewards Tab

- **File:** `mobile/lib/config/router.dart`
- **Details:**
  - Replace `PlaceholderTabPage` for rewards with `RewardsTabPage` (a `DefaultTabController` with sub-tabs)
  - Sub-tabs: Loyalty Cards | Coupons (Phase 5) | Referrals (Phase 5)
  - For now, Coupons and Referrals show placeholder content
  - Add routes: `/rewards/loyalty/:id` for card detail, `/rewards/scan` for QR scanner
  - Register BLoCs in router

---

## Phase 5: Coupons + Referrals

**Goal:** Browse/claim coupons and manage referral codes.

### Step 5.1: Coupons — Full Stack

- **Files (Domain):**
  - `mobile/lib/features/coupons/domain/entities/coupon_entity.dart`
  - `mobile/lib/features/coupons/domain/repositories/coupons_repository.dart`
  - `mobile/lib/features/coupons/domain/usecases/get_merchant_coupons_use_case.dart`
  - `mobile/lib/features/coupons/domain/usecases/claim_coupon_use_case.dart`
  - `mobile/lib/features/coupons/domain/usecases/get_my_coupons_use_case.dart`
- **Files (Data):**
  - `mobile/lib/features/coupons/data/models/coupon_model.dart`
  - `mobile/lib/features/coupons/data/datasources/coupons_remote_data_source.dart`
  - `mobile/lib/features/coupons/data/repositories/coupons_repository_impl.dart`
- **Files (Presentation):**
  - `mobile/lib/features/coupons/presentation/bloc/coupons_bloc.dart` (+ event + state)
  - `mobile/lib/features/coupons/presentation/pages/coupons_page.dart`
  - `mobile/lib/features/coupons/presentation/widgets/coupon_card.dart`
- **Details:**
  - API: `GET /storefront/merchants/{slug}/coupons` (browse), `POST /customer/coupons/{id}/claim` (claim), `GET /customer/coupons/claimed` (my coupons)
  - `CouponEntity`: id, code, description, discountType (percentage/fixed), discountValue, minPurchaseAmount, maxUses, currentUses, startsAt, expiresAt, merchantName, isClaimed
  - CouponsPage: Two tabs — "Available" (merchant coupons from storefront) and "My Coupons" (claimed)
  - CouponCard: Ticket-style card with dashed border, discount amount prominently displayed, "Claim" button, expiry countdown

### Step 5.2: Referrals — Full Stack

- **Files (Domain):**
  - `mobile/lib/features/referrals/domain/entities/referral_code_entity.dart`
  - `mobile/lib/features/referrals/domain/entities/referral_entity.dart`
  - `mobile/lib/features/referrals/domain/entities/referral_reward_entity.dart`
  - `mobile/lib/features/referrals/domain/repositories/referrals_repository.dart`
  - `mobile/lib/features/referrals/domain/usecases/get_my_referral_codes_use_case.dart`
  - `mobile/lib/features/referrals/domain/usecases/generate_referral_code_use_case.dart`
  - `mobile/lib/features/referrals/domain/usecases/get_my_referrals_use_case.dart`
  - `mobile/lib/features/referrals/domain/usecases/get_my_referral_rewards_use_case.dart`
  - `mobile/lib/features/referrals/domain/usecases/accept_referral_use_case.dart`
- **Files (Data):**
  - `mobile/lib/features/referrals/data/models/referral_code_model.dart`
  - `mobile/lib/features/referrals/data/models/referral_model.dart`
  - `mobile/lib/features/referrals/data/models/referral_reward_model.dart`
  - `mobile/lib/features/referrals/data/datasources/referrals_remote_data_source.dart`
  - `mobile/lib/features/referrals/data/repositories/referrals_repository_impl.dart`
- **Files (Presentation):**
  - `mobile/lib/features/referrals/presentation/bloc/referrals_bloc.dart` (+ event + state)
  - `mobile/lib/features/referrals/presentation/pages/referrals_page.dart`
  - `mobile/lib/features/referrals/presentation/widgets/referral_code_card.dart`
  - `mobile/lib/features/referrals/presentation/widgets/referral_reward_card.dart`
- **Details:**
  - API: `GET /customer/referral-codes`, `POST /customer/referrals/generate/{merchantId}`, `GET /customer/referrals`, `GET /customer/referral-rewards`, `POST /customer/referrals/accept`
  - ReferralsPage: Three sub-sections — My Codes (with share button), Referrals Sent/Received, Rewards Earned
  - Share button → `Share.share()` with referral link
  - Referral code card: code prominently displayed, merchant name, copy-to-clipboard, share button

### Step 5.3: Wire Up Rewards Tab (Complete)

- **File:** `mobile/lib/config/router.dart`
- **Details:**
  - Replace placeholder sub-tabs with real CouponsPage and ReferralsPage
  - Register new BLoCs in router

---

## Phase 6: Messaging

**Goal:** Transaction-scoped chat with 5-second polling.

### Step 6.1: Messaging — Full Stack

- **Files (Domain):**
  - `mobile/lib/features/messaging/domain/entities/message_entity.dart`
  - `mobile/lib/features/messaging/domain/entities/conversation_entity.dart`
  - `mobile/lib/features/messaging/domain/repositories/messaging_repository.dart`
  - `mobile/lib/features/messaging/domain/usecases/get_messages_use_case.dart`
  - `mobile/lib/features/messaging/domain/usecases/send_message_use_case.dart`
  - `mobile/lib/features/messaging/domain/usecases/mark_conversation_read_use_case.dart`
- **Files (Data):**
  - `mobile/lib/features/messaging/data/models/message_model.dart`
  - `mobile/lib/features/messaging/data/models/conversation_model.dart`
  - `mobile/lib/features/messaging/data/datasources/messaging_remote_data_source.dart`
  - `mobile/lib/features/messaging/data/repositories/messaging_repository_impl.dart`
- **Details:**
  - API endpoints (customer portal side):
    - `GET /customer/my/conversations/{type}/{id}/messages` where type ∈ {bookings, reservations, orders}
    - `POST /customer/my/conversations/{type}/{id}/messages` body: `{ body: "..." }`
    - `PATCH /customer/my/conversations/{type}/{id}/read`
  - `MessageEntity`: id, body, senderId, senderName, senderAvatar, isMe, readAt, createdAt
  - `ConversationEntity`: not needed as separate concept — conversations are implicit from transaction type + id
  - **Knowledge note:** Morph type mapping for URLs: `bookings` → booking, `reservations` → reservation, `orders` → service_order. The URL uses plural form.

### Step 6.2: Messaging — Presentation Layer

- **Files:**
  - `mobile/lib/features/messaging/presentation/bloc/chat/chat_bloc.dart` (+ event + state)
  - `mobile/lib/features/messaging/presentation/widgets/chat_bottom_sheet.dart`
  - `mobile/lib/features/messaging/presentation/widgets/message_bubble.dart`
  - `mobile/lib/features/messaging/presentation/widgets/message_input.dart`
- **Details:**
  - `ChatBloc`:
    - Events: `LoadMessagesEvent(type, id)`, `SendMessageEvent(type, id, body)`, `PollMessagesEvent`, `MarkReadEvent`
    - State: messages list, isLoading, isSending, error
    - 5-second polling: start `Timer.periodic` on `LoadMessagesEvent`, cancel on bloc close
    - Deduplication: maintain Set of message IDs, only add new messages
    - Optimistic send: add message to list immediately with temp ID, replace on server response
  - `ChatBottomSheet`: `DraggableScrollableSheet` with message list + input field
    - Messages scroll to bottom on load and new message
    - Message bubbles: right-aligned (me, blue) / left-aligned (merchant, grey)
    - Input: `TextField` with send button, disabled while sending
  - `MessageBubble`: body text, timestamp, read indicator (double-check for read messages)
  - Auto-mark-read on open: dispatch `MarkReadEvent` when sheet opens

### Step 6.3: Integrate Chat into Transaction Detail Sheets

- **Files:**
  - `mobile/lib/features/transactions/presentation/widgets/booking_detail_sheet.dart`
  - `mobile/lib/features/transactions/presentation/widgets/reservation_detail_sheet.dart`
  - `mobile/lib/features/transactions/presentation/widgets/order_detail_sheet.dart`
- **Details:**
  - Add "Message Merchant" button to each detail sheet
  - On tap: open `ChatBottomSheet` with `BlocProvider` for `ChatBloc`, passing transaction type + id
  - Show unread indicator (dot badge) on the message button if there are unread messages

---

## Phase 7: Polish + Ads

**Goal:** Advertisement banners, empty states, micro-animations, performance.

### Step 7.1: Advertisements

- **Files:**
  - `mobile/lib/features/ads/domain/entities/advertisement_entity.dart`
  - `mobile/lib/features/ads/data/models/advertisement_model.dart`
  - `mobile/lib/features/ads/data/datasources/ads_remote_data_source.dart`
  - `mobile/lib/features/ads/presentation/widgets/ad_banner_carousel.dart`
- **Details:**
  - Lightweight — no repository/usecase layer (overkill for a simple GET + display)
  - DataSource: `GET /storefront/advertisements`, `POST /advertisements/{id}/impression`, `POST /advertisements/{id}/click`
  - `AdBannerCarousel` widget: auto-scrolling `PageView` with dot indicators, `CachedNetworkImage` for ad images
  - Track impression on first display (use `VisibilityDetector` or `onPageChanged`)
  - Track click on tap → open URL with `url_launcher` or navigate to merchant
  - Place at top of `ExplorePage` (above merchant list) and optionally on merchant detail

### Step 7.2: Add flutter_animate Dependency

- **File:** `mobile/pubspec.yaml`
- **Details:** Add `flutter_animate: ^4.5.0`. Run `flutter pub get`.

### Step 7.3: Micro-Animations + Haptics

- **Files:** Various existing + new widget files
- **Details:**
  - Add `HapticFeedback.mediumImpact()` on: booking confirmed, QR scanned, favorite toggled, order placed
  - Add subtle `FadeIn` + `SlideIn` animations on list items loading (using flutter_animate's `.animate().fadeIn().slideY()`)
  - Add scale animation on favorite heart toggle
  - Add confetti/celebration animation on scan success (loyalty stamp earned)

### Step 7.4: Empty States Polish

- **Files:** All list pages (transactions, loyalty, coupons, referrals, favorites)
- **Details:**
  - Each empty state: large icon (outlined style), title, subtitle, CTA button
  - Consistent pattern across all pages:
    ```dart
    Column(
      children: [
        Container(icon, circular background),
        SizedBox(height: 24),
        Text(title, style: headlineSmall),
        SizedBox(height: 8),
        Text(subtitle, style: bodyMedium, grey),
        SizedBox(height: 24),
        ElevatedButton(ctaLabel, onPressed: navigateToExplore),
      ],
    )
    ```

### Step 7.5: Performance Optimization

- **Details:**
  - Ensure all list pages use `const` constructors where possible
  - Use `AutomaticKeepAliveClientMixin` on tab pages to preserve state when switching tabs
  - Add `cacheExtent` to `ListView`s for smoother scrolling
  - Ensure `CachedNetworkImage` is used for all remote images (already the pattern)
  - Lazy-load BLoCs: only create when route is visited (already the pattern via `BlocProvider` in router)

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Booking availability API response format mismatch | Medium | Read web portal's TypeScript types as source of truth for response shape |
| QR scanner camera permissions on iOS/Android | Medium | Use `permission_handler` (already a dependency) to request camera permission before opening scanner |
| Polling timer memory leak in messaging | Medium | Cancel timer in `ChatBloc.close()` method; use `Timer.periodic` with proper disposal |
| Large transaction lists causing jank | Low | Already mitigated by infinite scroll pagination pattern |
| Organization merchant confusion (booking vs branches) | Medium | Strict `type != 'organization'` check before showing booking button |

## Testing Strategy

- [ ] Dashboard: stats load correctly, empty state when no transactions
- [ ] Bookings list: pagination, status filter, pull-to-refresh, detail sheet opens
- [ ] Cancel booking: confirmation dialog, optimistic update, error handling (can't cancel confirmed)
- [ ] Booking wizard: service selection, date picker, slot/time picker, fee calculation, submission
- [ ] Booking wizard: organization merchant shows branches, not booking form
- [ ] Reservation wizard: date range selection, unit type selection, guest count, submission
- [ ] Order wizard: product selection, quantity validation (stock), submission
- [ ] Loyalty cards: list, detail with stamp grid, progress indicator
- [ ] QR scanner: camera opens, scans code, handles success/409/410/404
- [ ] Coupons: browse merchant coupons, claim, view my coupons
- [ ] Referrals: generate code, share, view referrals and rewards
- [ ] Chat: messages load, send message, 5s polling picks up new messages, mark read
- [ ] Chat: message deduplication (no duplicates from polling + send)
- [ ] Ads: carousel displays, auto-scrolls, impression tracked, click opens URL
- [ ] Navigation: all tabs work, back button behavior correct, deep links work
- [ ] Auth guard: protected pages redirect to login when unauthenticated
- [ ] Code generation: `build_runner` completes without errors after all phases

## Open Questions

- None. All architectural decisions made in brainstorm. Implementation can begin with Phase 1.

## Execution Notes

- Run `dart run build_runner build --delete-conflicting-outputs` after each phase to regenerate `.g.dart` and `injection.config.dart`
- Run `/home/betrnk/flutter/bin/flutter pub get` after modifying `pubspec.yaml`
- Test on Android emulator with `--dart-define=API_URL=http://10.0.2.2:8090/api/v1`
- Each phase is independently testable — no phase depends on a later phase
- Use `/work <this-plan>` to begin Phase 1 execution
