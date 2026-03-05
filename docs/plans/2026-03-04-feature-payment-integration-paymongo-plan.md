# Plan: Payment Integration with PayMongo Sandbox

**Date:** 2026-03-04
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-03-04-payment-integration-sandbox.md](../brainstorms/2026-03-04-payment-integration-sandbox.md)

## Knowledge Context

### Relevant Learnings
- [enforceMorphMap breaks existing polymorphic relationships](../knowledge/solutions/runtime-errors/enforce-morph-map-breaks-existing-polymorphic-models-chat-20260228.md): ALWAYS use `Relation::morphMap()`, never `enforceMorphMap()`. Add new morph aliases alongside existing ones.
- [MySQL ENUM column silently rejects factory values](../knowledge/solutions/test-failures/mysql-enum-factory-values-truncated-in-tests-customer-20260228.md): Use VARCHAR (not ENUM) for status columns to avoid silent factory test failures. All transaction models already use VARCHAR for status.

### Known Gotchas
- **Morph map registration**: Must add `'payment' => Payment::class` to existing `Relation::morphMap()` in `AppServiceProvider`. The payable morph on Payment uses existing aliases (`booking`, `reservation`, `service_order`).
- **Model `$attributes` defaults**: Eloquent `create()` ignores DB defaults. Must set `'status' => 'unpaid'` etc. in model `$attributes` array.
- **VARCHAR for status columns**: All existing transaction models use `$table->string('status')`. Payment model should follow the same convention.
- **Charge `total_amount`**: Platform fee + discount are already folded into `total_amount` at transaction creation. PayMongo checkout amount = `payable->total_amount`.
- **VALID_TRANSITIONS pattern**: Booking/Reservation/ServiceOrder all use `private const VALID_TRANSITIONS` in their service classes. Payment status transitions should follow the same pattern.
- **Notification auto-broadcast**: `NotificationObserver` on `DatabaseNotification` fires `notification.created` event on `App.Models.User.{id}` private channel automatically — no extra wiring needed for new notification classes.
- **Webhook route placement**: Must be outside `auth:api` middleware group (like `/storefront/*` and `/config/images` public routes).
- **Permission convention**: `module_name.action` format, seeded in `RolePermissionSeeder`.

### Critical Patterns Applied
- Service-Repository pattern for Payment module (PaymentService + PaymentRepository + interfaces)
- PayMongoService as a separate gateway-abstraction service (not mixed into PaymentService)
- Status workflow via `VALID_TRANSITIONS` constant in PaymentService
- Notification pattern from `MerchantStatusChangedNotification` (database + mail channels, `afterCommit(): true`)
- FormRequest `authorize(): true` — permission checks in route middleware

## Overview

Add a polymorphic `Payment` model and integrate PayMongo Checkout Sessions (payment links) to enable online payments after merchant confirmation. Merchants choose "request online payment" or "cash/at venue" when confirming a booking/reservation/order. Customers receive a payment link notification and pay on PayMongo's hosted page. Webhooks update payment status. Refunds are tracked manually (no API refund in MVP).

**Scope:** Backend Payment module + PayMongo gateway integration + webhook handler + notifications + frontend payment status display + confirmation dialog enhancement. No PayMongo Payment Intents (embedded forms), no API refunds, no partial payments.

## Implementation Steps

### Step 1: Migration — Create `payments` table + add `payment_status` to transaction tables
- **Files:** `backend/database/migrations/2026_03_05_100000_create_payments_table.php`
- **Details:**
  - `payments` table:
    - `id` bigIncrements
    - `payable_type` string — morph type (uses existing aliases: booking, reservation, service_order)
    - `payable_id` unsignedBigInteger — morph FK
    - `payment_method` string nullable — card, gcash, grab_pay, maya, bank_transfer, cash
    - `amount` decimal(10,2) — total amount charged
    - `currency` string default 'PHP'
    - `status` string default 'unpaid' — unpaid, pending, paid, failed, expired, cancelled
    - `refund_status` string nullable — none, requested, approved, processed
    - `gateway` string default 'paymongo'
    - `gateway_payment_id` string nullable — PayMongo checkout session ID
    - `gateway_reference` string nullable — PayMongo reference number
    - `checkout_url` text nullable — PayMongo checkout URL
    - `paid_at` timestamp nullable
    - `refunded_at` timestamp nullable
    - `expires_at` timestamp nullable — checkout link expiry
    - `metadata` json nullable — raw webhook payload for audit
    - timestamps
    - Indexes: `[payable_type, payable_id]`, `gateway_payment_id` (unique nullable), `status`
  - Add `payment_status` string default 'unpaid' to `bookings`, `reservations`, `service_orders` (denormalized for quick filtering)
  - **Knowledge note**: Use `$table->string()` not `$table->enum()` for status columns — matches existing convention, avoids ENUM factory issue

### Step 2: Payment Model
- **Files:** `backend/app/Models/Payment.php`
- **Details:**
  - `$fillable`: all columns except id/timestamps
  - `$attributes`: `status => 'unpaid'`, `currency => 'PHP'`, `gateway => 'paymongo'`, `amount => 0`, `refund_status => 'none'`
  - `$casts`: `amount => 'decimal:2'`, `paid_at => 'datetime'`, `refunded_at => 'datetime'`, `expires_at => 'datetime'`, `metadata => 'array'`
  - Relationships:
    - `payable()` — `morphTo()` (Booking/Reservation/ServiceOrder)
    - `payer()` — derived through payable → `payable->customer` (no direct user FK on Payment — the payable owns the customer context)
  - `isExpired(): bool` — `$this->expires_at !== null && $this->expires_at->isPast()`
  - `isPaid(): bool` — `$this->status === 'paid'`
  - **Knowledge note**: Use `$attributes` for defaults, not DB column defaults

### Step 3: Add morph map entry + payment relationship to transaction models
- **Files:**
  - `backend/app/Providers/AppServiceProvider.php`
  - `backend/app/Models/Booking.php`
  - `backend/app/Models/Reservation.php`
  - `backend/app/Models/ServiceOrder.php`
- **Details:**
  - `AppServiceProvider`: Add `'payment' => \App\Models\Payment::class` to existing `Relation::morphMap([])`
  - Add `payment_status` to `$fillable` and `$attributes` (default 'unpaid') on Booking, Reservation, ServiceOrder
  - Add `payment(): MorphOne` relationship to each: `$this->morphOne(Payment::class, 'payable')`
  - **Knowledge note**: Use `Relation::morphMap()`, never `enforceMorphMap()`

### Step 4: PayMongo config file
- **Files:** `backend/config/paymongo.php`
- **Details:**
  ```php
  return [
      'secret_key' => env('PAYMONGO_SECRET_KEY'),
      'public_key' => env('PAYMONGO_PUBLIC_KEY'),
      'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
      'mode' => env('PAYMONGO_MODE', 'test'),
      'success_url' => env('PAYMONGO_SUCCESS_URL', 'http://localhost:3001/payment/success'),
      'cancel_url' => env('PAYMONGO_CANCEL_URL', 'http://localhost:3001/payment/cancel'),
      'link_expiry_hours' => env('PAYMONGO_LINK_EXPIRY_HOURS', 24),
  ];
  ```
  - Add PayMongo env vars to `backend/.env.example`

### Step 5: PayMongo gateway service (HTTP abstraction)
- **Files:**
  - `backend/app/Services/Contracts/PayMongoServiceInterface.php`
  - `backend/app/Services/PayMongoService.php`
- **Details:**
  - Interface methods:
    - `createCheckoutSession(Payment $payment, string $description, array $lineItems): array` — returns `['checkout_url', 'checkout_session_id']`
    - `retrieveCheckoutSession(string $sessionId): array` — for manual status checks
    - `verifyWebhookSignature(string $payload, string $signature): bool`
  - Implementation uses `Http::withBasicAuth(config('paymongo.secret_key'), '')` (raw HTTP, no package dependency)
  - PayMongo API base: `https://api.paymongo.com/v1`
  - `createCheckoutSession()`:
    - POST `/v1/checkout_sessions`
    - Body: `{ data: { attributes: { line_items, payment_method_types: ['card', 'gcash', 'grab_pay', 'paymaya'], success_url, cancel_url, description, metadata: { payment_id } } } }`
    - Returns parsed response with `checkout_url` and `id`
  - `verifyWebhookSignature()`: HMAC-SHA256 verification using `PAYMONGO_WEBHOOK_SECRET`
  - Throws `\App\Exceptions\ApiException` on API errors with meaningful messages
  - **No package dependency** — raw HTTP client for full control and no version lag

### Step 6: Payment Repository + Interface
- **Files:**
  - `backend/app/Repositories/Contracts/PaymentRepositoryInterface.php`
  - `backend/app/Repositories/PaymentRepository.php`
- **Details:**
  - Extends `BaseRepository`
  - Additional methods:
    - `findByGatewayPaymentId(string $gatewayPaymentId): ?Payment`
    - `findByPayable(string $payableType, int $payableId): ?Payment`
    - `getByMerchant(int $merchantId, array $filters): LengthAwarePaginator` — join through payable morph

### Step 7: Payment Service + Interface (business logic)
- **Files:**
  - `backend/app/Services/Contracts/PaymentServiceInterface.php`
  - `backend/app/Services/PaymentService.php`
- **Details:**
  - Constructor injects: `PaymentRepositoryInterface`, `PayMongoServiceInterface`
  - `VALID_TRANSITIONS` constant:
    ```php
    private const VALID_TRANSITIONS = [
        'unpaid' => ['pending', 'cancelled'],
        'pending' => ['paid', 'failed', 'expired', 'cancelled'],
        'failed' => ['pending'],   // retry
        'expired' => ['pending'],  // regenerate link
    ];
    ```
  - Methods:
    - `createPaymentForTransaction(Model $payable, string $paymentMethod): Payment` — creates Payment record, calculates amount from `$payable->total_amount`
    - `requestOnlinePayment(Payment $payment): Payment` — calls PayMongoService to create checkout session, stores `checkout_url`, `gateway_payment_id`, `expires_at`, sets status to `pending`
    - `markAsCash(Payment $payment): Payment` — sets `payment_method => 'cash'`, status stays `unpaid` (merchant collects offline)
    - `markAsPaid(Payment $payment, ?string $reference = null): Payment` — for cash/manual: sets status `paid`, `paid_at`, optional reference. Updates parent transaction `payment_status`
    - `handleWebhookEvent(array $payload): void` — finds Payment by `gateway_payment_id`, validates transition, updates status + `paid_at` + `payment_method` (from PayMongo response). Updates parent `payment_status`. Idempotent (ignores if already paid).
    - `checkPaymentStatus(Payment $payment): Payment` — calls `PayMongoService::retrieveCheckoutSession()` and syncs status (for manual "check status" button)
    - `requestRefund(Payment $payment, ?string $reason): Payment` — sets `refund_status => 'requested'` (no API call in MVP)
    - `markRefunded(Payment $payment): Payment` — admin action: sets `refund_status => 'processed'`, status `refunded`, `refunded_at`
    - `getPaymentForTransaction(Model $payable): ?Payment`
  - Fires notifications:
    - On `requestOnlinePayment()`: dispatch `PaymentRequestedNotification` to customer
    - On `handleWebhookEvent()` (paid): dispatch `PaymentReceivedNotification` to both merchant owner and customer
  - **Knowledge note**: Status transitions validated via VALID_TRANSITIONS constant, matching Booking/Reservation/ServiceOrder pattern

### Step 8: Payment DTO
- **Files:** `backend/app/Data/PaymentData.php`
- **Details:**
  - Fields (all `string|Optional`):
    - `payment_method` — for confirmation dialog: 'online' or 'cash'
    - `payment_action` — 'request_payment' or 'mark_cash' (used during confirmation flow)
  - Lightweight DTO — most payment data comes from the payable, not user input

### Step 9: Payment FormRequests
- **Files:**
  - `backend/app/Http/Requests/Api/V1/Payment/ConfirmWithPaymentRequest.php` — validates `payment_action` (required, in: request_payment, mark_cash)
  - `backend/app/Http/Requests/Api/V1/Payment/MarkAsPaidRequest.php` — validates optional `reference` string
  - `backend/app/Http/Requests/Api/V1/Payment/RequestRefundRequest.php` — validates optional `reason` string
- **Details:** All return `authorize(): true`

### Step 10: Payment Resource
- **Files:** `backend/app/Http/Resources/Api/V1/PaymentResource.php`
- **Details:**
  - Returns: id, payable_type, payable_id, payment_method, amount, currency, status, refund_status, gateway, gateway_reference, checkout_url, paid_at, refunded_at, expires_at, is_expired (computed), created_at
  - Excludes `gateway_payment_id` and `metadata` from public response (internal/audit only)

### Step 11: Payment Factory
- **Files:** `backend/database/factories/PaymentFactory.php`
- **Details:**
  - Default definition: status 'unpaid', currency 'PHP', gateway 'paymongo', amount from faker
  - States: `paid()`, `pending()`, `failed()`, `expired()`, `cash()`, `online()`
  - Payable set via `for()` method or explicit payable_type/payable_id
  - **Knowledge note**: Use `fake()->randomElement(['card', 'gcash', 'grab_pay', 'maya', 'cash'])` for payment_method — all VARCHAR, no ENUM issues

### Step 12: Wire confirmation flow — enhance status update methods
- **Files:**
  - `backend/app/Services/BookingService.php`
  - `backend/app/Services/ReservationService.php`
  - `backend/app/Services/ServiceOrderService.php`
- **Details:**
  - Inject `PaymentServiceInterface` into each service constructor
  - In `updateBookingStatus()` / `updateReservationStatus()` / `updateServiceOrderStatus()`:
    - After successful status transition to `confirmed`:
      - Accept optional `payment_action` parameter (from DTO/request)
      - If `payment_action === 'request_payment'`:
        1. `$payment = $this->paymentService->createPaymentForTransaction($booking, 'online')`
        2. `$this->paymentService->requestOnlinePayment($payment)`
        3. Update booking `payment_status => 'pending'`
      - If `payment_action === 'mark_cash'`:
        1. `$payment = $this->paymentService->createPaymentForTransaction($booking, 'cash')`
        2. `$this->paymentService->markAsCash($payment)`
        3. Booking `payment_status` stays 'unpaid' (paid when cash collected)
      - If no `payment_action` (null): no payment record created (backward compatible)
  - Update DTOs: Add `payment_action` field to `BookingData`, `ReservationData`, `ServiceOrderData` (string|Optional)
  - Update FormRequests: Add `payment_action` rule (`nullable|in:request_payment,mark_cash`) to status update requests
  - **Knowledge note**: This is additive — existing status update flow unchanged when `payment_action` not provided

### Step 13: Payment Controller (merchant/admin endpoints)
- **Files:** `backend/app/Http/Controllers/Api/V1/PaymentController.php`
- **Details:**
  - Methods:
    - `show(Payment $payment)` — view payment details
    - `markAsPaid(MarkAsPaidRequest $request, Payment $payment)` — for cash: merchant marks as paid
    - `requestRefund(RequestRefundRequest $request, Payment $payment)` — merchant requests refund
    - `markRefunded(Payment $payment)` — admin marks refund as processed
    - `checkStatus(Payment $payment)` — polls PayMongo for latest status
  - Uses `ApiResponse` trait for all responses

### Step 14: PayMongo Webhook Controller
- **Files:** `backend/app/Http/Controllers/Api/V1/PayMongoWebhookController.php`
- **Details:**
  - Single `handle(Request $request)` method
  - Verifies webhook signature via `PayMongoService::verifyWebhookSignature()`
  - Returns 400 on invalid signature
  - Dispatches to `PaymentService::handleWebhookEvent()`
  - Returns 200 OK (PayMongo expects 2xx)
  - Idempotent — safe to receive duplicate events
  - Logs all webhook payloads for debugging

### Step 15: Notification classes
- **Files:**
  - `backend/app/Notifications/PaymentRequestedNotification.php`
  - `backend/app/Notifications/PaymentReceivedNotification.php`
- **Details:**
  - Both follow `MerchantStatusChangedNotification` pattern:
    - `implements ShouldQueue`, `use Queueable`, `afterCommit(): true`
    - Channels: `['database', 'mail']`
  - `PaymentRequestedNotification`:
    - Sent to customer (the `payable->customer` user)
    - `toArray()`: type, title, message with checkout_url, payable details
    - `toMail()`: "You have a payment pending" with "Pay Now" button linking to checkout_url
  - `PaymentReceivedNotification`:
    - Sent to both customer and merchant owner
    - `toArray()`: type, title, amount, payment_method, payable details
    - `toMail()`: "Payment of ₱X received for [Booking #123]"
  - **Knowledge note**: `NotificationObserver` auto-broadcasts to WebSocket — no extra code needed

### Step 16: Routes
- **Files:** `backend/routes/api.php`
- **Details:**
  - **Public webhook route** (outside all auth middleware):
    ```php
    Route::post('webhooks/paymongo', [PayMongoWebhookController::class, 'handle']);
    ```
  - **Authenticated payment routes** (inside auth + verified + onboarded group):
    ```php
    Route::prefix('payments')->middleware('permission:payments.view')->group(function () {
        Route::get('{payment}', [PaymentController::class, 'show']);
        Route::post('{payment}/mark-paid', [PaymentController::class, 'markAsPaid'])
            ->middleware('permission:payments.manage');
        Route::post('{payment}/request-refund', [PaymentController::class, 'requestRefund'])
            ->middleware('permission:payments.manage');
        Route::post('{payment}/mark-refunded', [PaymentController::class, 'markRefunded'])
            ->middleware('permission:payments.manage');
        Route::post('{payment}/check-status', [PaymentController::class, 'checkStatus'])
            ->middleware('permission:payments.manage');
    });
    ```
  - Update existing status update routes — no route changes needed (payment_action is just a new field in the existing request body)

### Step 17: Permissions
- **Files:** `backend/database/seeders/RolePermissionSeeder.php`
- **Details:**
  - Add `payments` permission group:
    ```php
    'payments' => [
        'payments.view',
        'payments.manage',
    ],
    ```
  - Assign to roles:
    - `admin`: `payments.view`, `payments.manage`
    - `merchant`: `payments.view`, `payments.manage`
    - `branch-merchant`: `payments.view`

### Step 18: Service Provider bindings
- **Files:** `backend/app/Providers/RepositoryServiceProvider.php`
- **Details:**
  - Add to `$bindings`:
    ```php
    PaymentRepositoryInterface::class => PaymentRepository::class,
    PaymentServiceInterface::class => PaymentService::class,
    PayMongoServiceInterface::class => PayMongoService::class,
    ```

### Step 19: Update transaction Resources to include payment info
- **Files:**
  - `backend/app/Http/Resources/Api/V1/BookingResource.php`
  - `backend/app/Http/Resources/Api/V1/ReservationResource.php`
  - `backend/app/Http/Resources/Api/V1/ServiceOrderResource.php`
- **Details:**
  - Add `'payment_status' => $this->payment_status`
  - Add `'payment' => new PaymentResource($this->whenLoaded('payment'))`

### Step 20: Backend tests — Payment module
- **Files:** `backend/tests/Feature/Api/V1/PaymentTest.php`
- **Details:**
  - Auth: `Passport::actingAs($user)` with merchant role + `payments.view`, `payments.manage`, `bookings.update_status`
  - Test cases:
    - `describe('Payment on Booking Confirmation')`:
      - `it('creates payment and checkout session when confirming with request_payment')`
        - Confirm booking with `payment_action: 'request_payment'`
        - Assert Payment record created with status `pending`, checkout_url populated
        - Assert booking `payment_status` = `pending`
        - Mock PayMongoService to return test checkout_url
      - `it('creates cash payment when confirming with mark_cash')`
        - Confirm with `payment_action: 'mark_cash'`
        - Assert Payment with `payment_method: 'cash'`, status `unpaid`
      - `it('does not create payment when confirming without payment_action')`
        - Existing behavior preserved
      - `it('creates payment on reservation confirmation')`
      - `it('creates payment on service order confirmation')`
    - `describe('Mark as Paid')`:
      - `it('marks cash payment as paid')` — status transitions to `paid`, `paid_at` set
      - `it('rejects marking already paid payment')` — 422 validation error
    - `describe('PayMongo Webhook')`:
      - `it('handles checkout_session.payment.paid webhook')`
        - POST to `/api/v1/webhooks/paymongo` with valid signature
        - Assert Payment status = `paid`, booking `payment_status` = `paid`
      - `it('rejects webhook with invalid signature')` — 400
      - `it('handles duplicate webhook idempotently')` — already paid, returns 200, no change
      - `it('handles payment.failed webhook')`
    - `describe('Refund Tracking')`:
      - `it('requests refund for paid payment')`
      - `it('admin marks refund as processed')`
    - `describe('Check Payment Status')`:
      - `it('syncs status from PayMongo gateway')`
    - `describe('Payment Permissions')`:
      - `it('denies payment view without permission')`
      - `it('denies mark-paid without manage permission')`
  - Mock strategy: Mock `PayMongoServiceInterface` in tests to avoid real API calls. Use `$this->mock(PayMongoServiceInterface::class)` pattern.

### Step 21: Frontend types — Payment interfaces
- **Files:**
  - `frontend/types/api.ts`
  - `frontend-customer-portal/types/api.ts`
- **Details:**
  - Add `Payment` interface:
    ```typescript
    interface Payment {
      id: number;
      payable_type: string;
      payable_id: number;
      payment_method: string | null;
      amount: string;
      currency: string;
      status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded';
      refund_status: string | null;
      gateway: string;
      gateway_reference: string | null;
      checkout_url: string | null;
      paid_at: string | null;
      refunded_at: string | null;
      expires_at: string | null;
      is_expired: boolean;
      created_at: string;
    }
    ```
  - Add `payment_status: string` and `payment?: Payment` to `Booking`, `Reservation`, `ServiceOrder` interfaces
  - Add `payment_action?: 'request_payment' | 'mark_cash'` to status update payload types

### Step 22: Frontend services — Payment API calls
- **Files:**
  - `frontend/services/paymentService.ts`
- **Details:**
  - `getPayment(id: number)`
  - `markAsPaid(id: number, data?: { reference?: string })`
  - `requestRefund(id: number, data?: { reason?: string })`
  - `markRefunded(id: number)`
  - `checkStatus(id: number)`

### Step 23: Frontend hooks
- **Files:** `frontend/hooks/usePayments.ts`
- **Details:**
  - `usePayment(id)` — query
  - `useMarkAsPaid()` — mutation, invalidates booking/reservation/order queries
  - `useRequestRefund()` — mutation
  - `useMarkRefunded()` — mutation
  - `useCheckPaymentStatus()` — mutation

### Step 24: Admin frontend — Enhance confirmation dialogs with payment option
- **Files:**
  - `frontend/app/(system)/(my-store)/my-store/bookings/page.tsx`
  - `frontend/app/(system)/(my-store)/my-store/reservations/page.tsx`
  - `frontend/app/(system)/(my-store)/my-store/orders/page.tsx`
- **Details:**
  - When confirming a transaction (status → confirmed), show a dialog/select:
    - "Request Online Payment" (sends `payment_action: 'request_payment'`)
    - "Cash / At Venue" (sends `payment_action: 'mark_cash'`)
    - "No Payment Required" (sends no `payment_action` — existing behavior)
  - Add `payment_status` badge column to data tables
  - Add "Mark as Paid" button for cash payments (status = unpaid)
  - Add "Request Refund" button for paid payments
  - Show payment details in transaction detail/sheet views

### Step 25: Customer portal — Payment success/cancel pages
- **Files:**
  - `frontend-customer-portal/app/(customer)/payment/success/page.tsx`
  - `frontend-customer-portal/app/(customer)/payment/cancel/page.tsx`
- **Details:**
  - Simple status pages shown after PayMongo redirect
  - Success: "Payment received! Redirecting to your booking..." with auto-redirect
  - Cancel: "Payment cancelled. You can try again from your booking details." with link back
  - These are the URLs configured in `config/paymongo.php` success_url/cancel_url

### Step 26: Customer portal — Payment status display
- **Files:**
  - `frontend-customer-portal/app/(customer)/bookings/booking-detail-sheet.tsx`
  - `frontend-customer-portal/app/(customer)/reservations/reservation-detail-sheet.tsx`
  - `frontend-customer-portal/app/(customer)/orders/order-detail-sheet.tsx`
- **Details:**
  - Show `payment_status` badge in detail sheets
  - If `payment?.checkout_url` exists and payment is `pending`: show "Pay Now" button that opens checkout_url
  - If payment is `paid`: show paid_at date and payment_method
  - If payment is `expired`: show "Payment link expired. Contact merchant."

### Step 27: Run migrations, tests, and builds
- **Commands:**
  ```bash
  cd backend && docker compose exec app php artisan migrate
  cd backend && docker compose exec app php artisan db:seed --class=RolePermissionSeeder
  cd backend && docker compose exec app php artisan test tests/Feature/Api/V1/PaymentTest.php
  cd backend && docker compose exec app php artisan test  # full suite
  cd frontend && docker compose exec nextjs npm run build
  cd frontend-customer-portal && docker compose exec nextjs-customer npm run build
  ```

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Webhook delivery failure (PayMongo can't reach localhost) | High (dev) | Use ngrok or similar tunnel for local testing. Add "Check Status" button as fallback. PayMongo retries automatically. |
| Payment/transaction status desync | Medium | Payment table is source of truth. Denormalized `payment_status` updated atomically in same DB transaction in webhook handler. |
| Double payment on webhook retry | Low | `handleWebhookEvent()` is idempotent — checks if already `paid` before updating. |
| Test/live key confusion in production | Medium | `PAYMONGO_MODE` config flag. PayMongoService logs warning if mode=test in production environment. |
| Backward compatibility break on confirmation | Low | `payment_action` is optional/nullable in all requests. No payment created when absent — existing flow untouched. |
| PayMongo HTTP client errors (timeout, 5xx) | Medium | PayMongoService wraps calls in try-catch, throws `ApiException` with clear message. "Check Status" button for manual sync. |
| Morph map conflict | Low | `'payment'` alias is new, no existing usage. Added to `Relation::morphMap()` alongside existing aliases. |

## Testing Strategy

- [ ] Payment record created on booking confirmation with `request_payment`
- [ ] Cash payment created on confirmation with `mark_cash`
- [ ] No payment created when `payment_action` absent (backward compat)
- [ ] Payment amount equals transaction `total_amount`
- [ ] PayMongo checkout session mocked and checkout_url stored
- [ ] Webhook validates signature (reject invalid)
- [ ] Webhook updates payment + transaction status atomically
- [ ] Webhook idempotent (duplicate event safe)
- [ ] Mark as paid transitions cash payment correctly
- [ ] Refund tracking (request → processed)
- [ ] Permission checks (view, manage)
- [ ] Reservation and service order confirmation flows (same as booking)
- [ ] Frontend TypeScript builds pass
- [ ] Payment status badges render in tables and detail sheets
- [ ] Customer portal "Pay Now" button opens checkout_url

## Open Questions

- Should payment links auto-expire after 24 hours? (Included `expires_at` field — can implement expiry check later)
- Should the PayMongo checkout show line items (service name, fee breakdown) or just the total amount?
- Should we add a `GET /customer/my/payments` endpoint for customers to see all their payments?
- Future: Combined payment + reward selector UI on customer checkout pages
- Future: PayMongo Payment Intents for embedded card forms
- Future: API-driven refunds via PayMongo Refund API
- Future: Partial payments / deposit system
