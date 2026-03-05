# Brainstorm: Payment Integration with PayMongo Sandbox

**Date:** 2026-03-04
**Status:** Draft

## Knowledge Context

### What Already Exists
- **No payment gateway integration** — transactions (bookings, reservations, orders) track pricing fields (`subtotal`, `fee_amount`, `total_amount`, `discount_amount`) but no actual payment processing
- **Platform fees module** — calculates % fees per transaction type at creation time, consumed by BookingService/ReservationService/ServiceOrderService
- **Loyalty reward discounts** — discount calculation infrastructure (discount_percentage, discount_fixed) being wired into checkout flow
- **Payment methods reference data** — admin-managed `payment_methods` table; merchants link via `merchant_payment_method` pivot to declare which methods they accept
- **Customer `preferred_payment_method`** — ENUM `['cash', 'e-wallet', 'card']` on customers table
- **Status workflows** — all transaction types use `VALID_TRANSITIONS` constant maps in services (e.g., booking: pending→confirmed→completed)
- **Philippine market** — PHP (₱) currency, PH-specific geographic hierarchy

### Known Gotchas
- MySQL ENUM factory values must match exactly (`['cash', 'e-wallet', 'card']`)
- Model `$attributes` must include defaults (not just DB defaults) — Eloquent `create()` ignores DB defaults
- Morph map in `AppServiceProvider`: `booking`, `reservation`, `service_order`, `inquiry`
- Platform fee calculated on discounted subtotal (reward discount applied first, then fee)

## Problem / Goal

Customers can submit bookings, reservations, and orders but cannot pay online. All transactions exist in a "pending" state with no payment lifecycle. Merchants have no way to collect payments through the platform.

**Goal:** Enable online payments via PayMongo (cards, GCash, GrabPay, Maya, bank transfers) alongside cash/at-venue payment, following a "pay after confirmation" flow where merchants confirm the transaction before customers receive a payment link.

## Architecture Decisions

### Payment Flow: Pay After Confirmation
```
Customer submits booking/reservation/order
  → Transaction created with payment_status = "unpaid"
  → Merchant reviews and confirms
  → System generates PayMongo payment link (or marks as "cash" if pay-at-venue)
  → Customer receives payment link via notification
  → Customer pays via PayMongo checkout
  → PayMongo webhook fires → payment_status = "paid"
```

This aligns with the existing status workflow (pending → confirmed) — payment link generation triggers on the confirmed transition.

### Payment Model: Polymorphic `payments` Table
Single `payments` table with `payable_type`/`payable_id` morph relation to Booking/Reservation/ServiceOrder.

### Refunds: Track Only (MVP)
Add `refund_status` field but do not call PayMongo Refund API. Admin marks refunds manually. Full API refund integration deferred to future phase.

### Hybrid Cash/Online
- Merchants can accept both cash and online payments (determined by their linked payment methods)
- When confirming a transaction, merchant selects: "request online payment" or "cash/at venue"
- Cash transactions skip the PayMongo flow entirely — just update payment_status to "paid" manually

## Approaches Considered

### Approach A: PayMongo Checkout (Payment Links) — Selected
- **Description:** Use PayMongo's Checkout/Payment Links API. On merchant confirmation, create a PayMongo checkout session with line items and redirect URL. Customer clicks the link, pays on PayMongo's hosted page, webhook notifies completion.
- **Pros:**
  - Simplest integration — PayMongo handles the payment UI, PCI compliance, and method selection
  - Supports all PH methods out of the box (cards, GCash, GrabPay, Maya, bank)
  - No custom payment form needed on our side
  - Sandbox mode available for testing with test cards/wallets
- **Cons:**
  - Customer leaves the app to pay (redirect to PayMongo checkout page)
  - Less control over payment UX
  - PayMongo takes processing fees (on top of our platform fees)
- **PayMongo API:** `POST /v1/checkout_sessions` → returns `checkout_url`

### Approach B: PayMongo Payment Intents (Embedded)
- **Description:** Use PayMongo Payment Intents API with embedded card form. Requires PayMongo.js on frontend, custom card input, and handling 3DS authentication.
- **Pros:** Seamless in-app payment experience, full UX control
- **Cons:** PCI compliance burden, complex 3DS flow, e-wallet methods still redirect, significantly more frontend work
- **Verdict:** Overkill for MVP. Can migrate to this later for card payments while keeping Checkout for e-wallets.

### Approach C: Xendit or Dragonpay Alternative
- **Description:** Use Xendit or Dragonpay instead of PayMongo.
- **Pros:** Xendit has better multi-country support; Dragonpay has deeper bank coverage
- **Cons:** PayMongo is the PH market leader, best developer experience, most documentation
- **Verdict:** Not selected. PayMongo covers all needed methods.

## Decision

**Approach A: PayMongo Checkout (Payment Links)**

Rationale:
- Fastest to MVP — PayMongo handles the payment page, PCI, and method selection
- Sandbox mode enables full testing without real money
- All PH payment methods supported out of the box
- Redirect-based flow is acceptable for marketplace transactions
- Can later add Payment Intents for embedded card forms if UX demands it

## Technical Design

### Database Schema

#### `payments` table (new)
```
id                  bigint PK
payable_type        string (morph: booking, reservation, service_order)
payable_id          bigint (morph FK)
payment_method      string nullable (card, gcash, grab_pay, maya, bank_transfer, cash)
amount              decimal(10,2) — total amount charged
currency            string default 'PHP'
status              enum: unpaid, pending, paid, failed, refunded, partially_refunded
refund_status       enum: none, requested, approved, processed — nullable
gateway             string default 'paymongo' — future-proofing for multiple gateways
gateway_payment_id  string nullable — PayMongo checkout session ID or payment ID
gateway_reference   string nullable — PayMongo reference number
checkout_url        text nullable — PayMongo checkout URL for customer
paid_at             timestamp nullable
refunded_at         timestamp nullable
metadata            json nullable — raw PayMongo webhook payload for audit
created_at          timestamp
updated_at          timestamp
```

**Indexes:** `[payable_type, payable_id]` (morph), `gateway_payment_id` (webhook lookup), `status`

#### Changes to existing tables
- Add `payment_status` enum (`unpaid`, `pending`, `paid`, `failed`, `refunded`) to `bookings`, `reservations`, `service_orders` — denormalized for quick filtering/display (source of truth is `payments` table)
- No changes to `payment_methods` reference data table (that's merchant-accepted methods, not transaction payment records)

### Morph Map Addition
```php
// AppServiceProvider
'payment' => Payment::class,
```
And payable morph map entries use existing aliases: `booking`, `reservation`, `service_order`.

### PayMongo Integration

#### Config (`config/paymongo.php`)
```php
return [
    'secret_key' => env('PAYMONGO_SECRET_KEY'),
    'public_key' => env('PAYMONGO_PUBLIC_KEY'),
    'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
    'mode' => env('PAYMONGO_MODE', 'test'), // test or live
    'success_url' => env('PAYMONGO_SUCCESS_URL', 'http://localhost:3001/payment/success'),
    'cancel_url' => env('PAYMONGO_CANCEL_URL', 'http://localhost:3001/payment/cancel'),
];
```

#### PayMongoService (new)
```php
interface PayMongoServiceInterface {
    public function createCheckoutSession(Payment $payment, array $lineItems): array;
    public function handleWebhook(array $payload): void;
    public function getPayment(string $gatewayPaymentId): array;
}
```

Key methods:
- `createCheckoutSession()` — calls PayMongo `POST /v1/checkout_sessions` with line items, success/cancel URLs, and metadata (payment ID for webhook matching)
- `handleWebhook()` — validates signature, matches payment by `gateway_payment_id`, updates status
- PayMongo PHP SDK: `luigel/laravel-paymongo` package or direct HTTP via `Http::withBasicAuth()`

#### PaymentService (new)
```php
interface PaymentServiceInterface {
    public function createPayment(Model $payable, string $paymentMethod, float $amount): Payment;
    public function requestOnlinePayment(Payment $payment): string; // returns checkout_url
    public function markAsCash(Payment $payment): Payment;
    public function markAsPaid(Payment $payment, ?string $gatewayReference): Payment;
    public function handleWebhookPayment(string $gatewayPaymentId, string $status, array $metadata): void;
    public function requestRefund(Payment $payment, ?string $reason): Payment;
    public function getPaymentByPayable(Model $payable): ?Payment;
}
```

#### Webhook Controller
```php
// POST /api/v1/webhooks/paymongo (public, no auth — signature verified)
class PayMongoWebhookController extends Controller {
    public function handle(Request $request): JsonResponse;
}
```

Webhook events to handle:
- `checkout_session.payment.paid` → update Payment status to `paid`, update transaction `payment_status`
- `payment.failed` → update Payment status to `failed`

### Flow Integration with Existing Services

#### On Merchant Confirmation (status transition to `confirmed`)
When a merchant confirms a booking/reservation/order, the service layer:
1. Validates status transition (existing `VALID_TRANSITIONS` logic)
2. If merchant selects "request online payment":
   - Create `Payment` record (status: `pending`)
   - Call `PayMongoService::createCheckoutSession()`
   - Store `checkout_url` and `gateway_payment_id` on Payment
   - Send notification to customer with payment link
3. If merchant selects "cash/at venue":
   - Create `Payment` record with `payment_method: 'cash'`, `status: 'unpaid'`
   - No PayMongo call — payment collected offline

#### On PayMongo Webhook (payment completed)
1. Verify webhook signature
2. Find Payment by `gateway_payment_id`
3. Update Payment: `status: 'paid'`, `paid_at: now()`, store reference
4. Update parent transaction: `payment_status: 'paid'`
5. Send notification to both merchant and customer

### Frontend Changes

#### Customer Portal
- **Payment success/cancel pages:** `/payment/success` and `/payment/cancel` — simple status pages after PayMongo redirect
- **Payment link in notifications:** Customer receives notification with "Pay Now" button that opens `checkout_url`
- **Transaction detail sheets:** Show `payment_status` badge, payment method, paid date
- **Payment status in lists:** Badge on booking/reservation/order cards

#### Admin/Merchant Frontend
- **Confirmation dialog enhancement:** When confirming a transaction, show option to "Request Online Payment" or "Mark as Cash"
- **Payment status column** in booking/reservation/order lists
- **Payment detail** in transaction detail views (method, status, reference, paid date)
- **Manual payment actions:** "Mark as Paid" button for cash transactions, "Request Refund" for paid transactions

### PayMongo Sandbox Testing

#### Test Credentials
- Secret key: `sk_test_*` (from PayMongo dashboard)
- Public key: `pk_test_*`
- Test cards: `4343434343434343` (success), `4444444444444444` (fail)
- Test GCash/GrabPay: sandbox auto-approves

#### Test Strategy
- Unit tests: mock PayMongo HTTP responses
- Feature tests: test webhook handler with sample payloads
- Manual sandbox testing: full flow with test credentials
- `.env.testing` uses test keys, webhook secret from PayMongo sandbox

### Permissions
- `payments.view` — view payment details (merchant/admin)
- `payments.manage` — mark as paid, request refund (merchant/admin)
- No customer permission needed — customers interact via payment links

### Notification Integration
- `PaymentRequested` notification → customer channel → "You have a payment pending for [Booking #123]"
- `PaymentReceived` notification → merchant + customer channels → "Payment of ₱1,500 received"

## Open Questions

- Should we use `luigel/laravel-paymongo` package or raw HTTP client? (Package adds convenience but may lag behind API changes)
- Should payment links expire after a certain period (e.g., 24 hours)?
- Should merchants be able to set payment terms (e.g., "50% deposit, 50% on completion")? → Likely deferred
- Should the platform fee be shown as a separate line item on the PayMongo checkout page, or bundled into the total?
- Should we store PayMongo customer IDs for returning customers (saved cards)?
- How does payment interact with the reward discount? (Discount reduces total_amount → payment amount = total_amount after discount and fees)

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Webhook delivery failures | Medium | Implement idempotent webhook handler, PayMongo retries, add manual "Check Payment Status" button |
| Payment/transaction status desync | Medium | Payment status is source of truth; denormalized field updated atomically in webhook handler |
| PayMongo API changes | Low | Abstract behind PayMongoService interface; swap implementation without touching business logic |
| Test/live key confusion | Medium | Strict env separation, `PAYMONGO_MODE` config flag, log warnings in production if test keys detected |
| Double-payment on retry | Low | Idempotent checkout session creation keyed by Payment ID |

## Next Steps

- [ ] `/plan` to create detailed implementation plan
- [ ] Create PayMongo sandbox account and obtain test credentials
- [ ] Decide on `luigel/laravel-paymongo` vs raw HTTP client
- [ ] Design notification templates for payment lifecycle events
- [ ] Future: Payment Intents for embedded card form (Approach B)
- [ ] Future: PayMongo Refund API integration
- [ ] Future: Partial payments / deposit system
