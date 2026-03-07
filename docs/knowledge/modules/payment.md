# Module: Payment

## Model

- **File:** `backend/app/Models/Payment.php`
- **Table:** `payments`
- **Fillable:** `payable_type`, `payable_id`, `payment_method`, `amount`, `currency`, `status`, `refund_status`, `gateway`, `gateway_payment_id`, `gateway_reference`, `checkout_url`, `paid_at`, `refunded_at`, `expires_at`, `metadata`
- **Defaults:** `amount=0`, `currency=PHP`, `status=unpaid`, `gateway=paymongo`, `refund_status=none`
- **Relationships:**
  - `payable()` — MorphTo (polymorphic: booking, reservation, service_order)
- **Casts:** `amount` decimal:2, `paid_at` datetime, `refunded_at` datetime, `expires_at` datetime, `metadata` array

## Key Model Methods

- `isExpired()` — `expires_at !== null && expires_at->isPast()`
- `isPaid()` — `status === 'paid'`

## Service

- **File:** `backend/app/Services/PaymentService.php`
- **Interface:** `backend/app/Services/Contracts/PaymentServiceInterface.php`
- **Status workflow (VALID_TRANSITIONS):**
  - `unpaid` → `pending`, `cancelled`
  - `pending` → `paid`, `failed`, `expired`, `cancelled`
  - `failed` → `pending`
  - `expired` → `pending`
  - `paid` → `refunded`
- **Key methods:**
  - `createPaymentForTransaction()` — Creates payment from any payable model (reads `total_amount`)
  - `requestOnlinePayment()` — Creates PayMongo checkout session, sets status to pending, notifies customer
  - `markAsCash()` — Sets payment_method to cash
  - `markAsPaid()` — Manual mark as paid with optional reference
  - `handleWebhookEvent()` — Processes PayMongo webhooks (idempotent, DB::transaction wrapped)
  - `checkPaymentStatus()` — Polls PayMongo for current session status
  - `requestRefund()` — Sets refund_status to requested with reason in metadata
  - `markRefunded()` — Sets status to refunded + refund_status to processed
  - `getPaymentForTransaction()` — Find payment by payable type+id

## Controller

- **File:** `backend/app/Http/Controllers/Api/V1/PaymentController.php`
- **Endpoints:**
  - `GET /payments/{payment}` — Show payment (permission: `payments.view`)
  - `POST /payments/{payment}/mark-paid` — Manual mark as paid (permission: `payments.manage`)
  - `POST /payments/{payment}/request-refund` — Request refund (permission: `payments.manage`)
  - `POST /payments/{payment}/mark-refunded` — Mark refunded (permission: `payments.manage`)
  - `POST /payments/{payment}/check-status` — Poll gateway status (permission: `payments.manage`)

## Form Requests

- `MarkAsPaidRequest` — `reference` optional string
- `RequestRefundRequest` — `reason` optional string

## Resource

- **File:** `backend/app/Http/Resources/Api/V1/PaymentResource.php`

## Repository

- **File:** `backend/app/Repositories/PaymentRepository.php`
- **Interface:** `backend/app/Repositories/Contracts/PaymentRepositoryInterface.php`
- **Custom methods:** `findByGatewayPaymentId()`, `findByPayable()`

## Permissions

- `payments.view` — View payment details
- `payments.manage` — Mark paid, request refund, mark refunded, check status
- Assigned to: super-admin, admin, manager, merchant

## PayMongo Integration

- **File:** `backend/app/Services/PayMongoService.php`
- **Interface:** `backend/app/Services/Contracts/PayMongoServiceInterface.php`
- Gateway: PayMongo (Philippine payment gateway supporting GCash, card, etc.)
- Checkout session flow: create session → redirect user → webhook callback
- Link expiry configurable via `config('paymongo.link_expiry_hours')`

## Notifications

- `PaymentRequestedNotification` — Sent to customer when online payment is requested
- `PaymentReceivedNotification` — Sent to customer and merchant owner when payment confirmed

## Gotchas / Notes

- **Polymorphic `payable`:** Uses morph map (booking, reservation, service_order)
- **Webhook idempotency:** `handleWebhookEvent()` checks `isPaid()` before processing to prevent double-processing
- **Payable sync:** Every status change also updates `payable.payment_status` field on the transaction model
- **Currency:** Hardcoded to `PHP` (Philippine Peso) — amounts converted to centavos for PayMongo (multiply by 100)
- **Refund is two-step:** `requestRefund()` records intent, `markRefunded()` confirms processing
- No DTO — payment creation uses service method directly with payable model
