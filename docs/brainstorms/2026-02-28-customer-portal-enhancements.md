# Brainstorm: Customer Portal Enhancements

**Date:** 2026-02-28
**Status:** Decided

## Knowledge Context

- **Eager load + Resource = atomic pair**: When adding relations to detail queries (service.media, service.serviceCategory, merchant.address), must add matching `whenLoaded()` in Resource classes. Critical for detail pages.
- **InfoWindow must be a sibling of AdvancedMarker**: For map display in detail pages, never nest InfoWindow inside AdvancedMarker. Use single selected state pattern.
- **CSS `background` shorthand overrides Tailwind `bg-*`**: Use Tailwind gradient classes only.
- Existing backend hooks: `useMyBooking(id)` exists but unused. `useMyReservation(id)` and `useMyOrder(id)` do NOT exist yet — need backend endpoints + frontend hooks.
- Customer model has: avatar collection (Spatie Media Library), `preferred_payment_method`, `communication_preference`, `status`, address via HasAddress trait.
- Existing customer portal auth store persists to `'customer-auth-storage'` localStorage key.
- Geographic cascading dropdowns component `AddressFormFields` exists and is reusable.
- WebSocket infrastructure exists: Laravel Echo + Reverb, configured in admin frontend `lib/echo.ts`.

## Problem / Goal

The customer portal currently has basic list pages for bookings, reservations, and orders but lacks:
1. **Detail views** — no way to see full details when clicking a list item
2. **Communication** — no way for customers to chat with merchants about their bookings/reservations
3. **Visual context** — no maps or service images in transaction views
4. **Account management** — profile page is a read-only placeholder
5. **Payment setup** — no payment method configuration

## Feature Areas

### 1. Detail Pages (Slide-over Panels) — DECIDED

**Approach: Slide-over sheet panel on list pages**

When a customer clicks a booking/reservation/order in the list, a right-side Sheet (shadcn/ui) opens showing full details without navigating away from the list.

**Booking Detail Panel contents:**
- Service image (from `service.media` image collection, preview conversion)
- Service name + category
- Booking date, start time → end time
- Party size
- Status badge with color coding
- Pricing breakdown: service price, platform fee, total amount
- Merchant name + location map (if merchant has coordinates)
- Notes (if any)
- Cancel button (if status is pending/confirmed)
- Chat section (see area 2)

**Reservation Detail Panel contents:**
- Service/unit image
- Unit name + service name
- Check-in → check-out dates, nights count
- Guest count
- Status badge
- Pricing: price per night × nights, fee, total
- Merchant name + location map
- Notes + special requests
- Cancel button (if pending/confirmed)
- Chat section

**Order Detail Panel contents:**
- Product image
- Product name
- Order number (ORD-YYYYMMDD-NNN)
- Quantity × unit label
- Status badge (with full workflow: pending→received→processing→ready→delivering→completed)
- Pricing: unit price × quantity, fee, total
- Estimated completion (if set)
- Merchant name + location map
- Notes
- Cancel button (if pending only — stricter than booking/reservation)
- Chat section

**Backend needs:**
- `GET /customer/my/reservations/{id}` — endpoint does NOT exist yet (booking one exists)
- `GET /customer/my/orders/{id}` — endpoint does NOT exist yet
- Eager load service.media, service.serviceCategory, merchant (with address + coordinates) on all detail endpoints
- Ensure BookingResource, ReservationResource, ServiceOrderResource have `whenLoaded()` for all eager-loaded relations

**Frontend needs:**
- `useMyReservation(id)` and `useMyOrder(id)` hooks + service methods
- Sheet component for each detail type (or a shared detail sheet with type-specific content)
- Map component (reuse `@vis.gl/react-google-maps` AdvancedMarker pattern from storefront)

### 2. Customer-Merchant Real-Time Chat — DECIDED

**Approach: Real-time WebSocket chat via Laravel Echo/Reverb**

A message thread tied to a specific booking, reservation, or order. Appears as a collapsible section within the detail slide-over panel.

**Backend:**
- New `Message` model: `id`, `conversation_id`, `sender_id`, `sender_type` (customer|merchant), `body`, `read_at`, `created_at`
- New `Conversation` model: `id`, `merchant_id`, `customer_id`, `conversable_type` (booking|reservation|service_order), `conversable_id`, `last_message_at`, `created_at`
- Conversation auto-created on first message (or on booking/reservation/order creation)
- Broadcasting: `MessageSent` event on private channel `conversation.{id}`
- Customer portal endpoints:
  - `GET /customer/my/conversations/{conversableType}/{conversableId}/messages` — paginated messages
  - `POST /customer/my/conversations/{conversableType}/{conversableId}/messages` — send message
- Merchant (admin) side: similar endpoints under `merchants/{merchant}/conversations/`

**Frontend:**
- Laravel Echo client in customer portal (mirror admin frontend pattern from `lib/echo.ts`)
- Chat component: message list (auto-scroll to bottom), input field, send button
- Real-time: listen on `conversation.{id}` channel for new messages
- Unread indicator on list items (optional, phase 2)

### 3. Maps & Images in Detail Pages — DECIDED

**Maps:**
- Show merchant location on a small static map (or interactive AdvancedMarker) in the detail panel
- Requires merchant coordinates (latitude/longitude) — already on Merchant model
- Use `@vis.gl/react-google-maps` (already installed in customer portal)
- Knowledge guardrail: InfoWindow as sibling of AdvancedMarker, not child

**Images:**
- Service image: display `service.image.preview` (600x400) at top of detail panel
- For reservations: also show unit images if available
- Merchant logo: small avatar next to merchant name
- Gallery: if service has multiple images, show a mini gallery (future enhancement)

### 4. Customer Profile & Account Management — DECIDED

**Approach: Full profile page with tabbed sections**

**Profile Tab (personal info):**
- Avatar upload/change (Spatie Media Library avatar collection, crop dialog)
- First name, last name
- Phone number
- Date of birth, gender
- Address (using AddressFormFields cascading component: Region→Province→City→Barangay)
- Bio (optional textarea)
- Save button → `PUT /customer/my/profile` or equivalent

**Account Tab:**
- Email display (read-only or changeable with re-verification)
- Change password (current password + new password + confirm)
- Account status indicator: verification tier display
  - Unverified (no email OTP yet)
  - Basic verified (email OTP completed — `email_verified_at` set)
  - Fully verified (ID document approved by admin)
- ID document upload for full verification (Spatie Media Library document collection)

**Backend needs:**
- Customer self-service profile endpoints (some may already exist via `GET /profile/customer`, `PUT /profile/customer`)
- Avatar upload endpoint for customer self-service
- Password change endpoint for customer self-service
- ID document upload + admin approval workflow

### 5. Payment Option Setup — DECIDED

**Approach: Available to verified customers (basic verified = email OTP)**

**Payment Tab (on profile page, shown only when email_verified_at is set):**
- List of available payment methods (from platform's PaymentMethod reference data)
- Customer selects preferred payment methods (checkbox list or toggle switches)
- Stores to `customer.preferred_payment_method` field
- Future: integrate with payment gateway for saved cards/wallets

**Backend needs:**
- Endpoint to fetch available payment methods: `GET /payment-methods/active` (already exists as public reference data)
- Endpoint to update customer payment preferences: `PUT /customer/my/payment-preferences`
- Customer model already has `preferred_payment_method` field

### 6. Verification — DECIDED (Tiered)

**Tier 1 — Basic Verified:**
- Triggered by: completing email OTP during registration (already implemented)
- Indicator: `user.email_verified_at !== null`
- Unlocks: payment method setup, full profile editing

**Tier 2 — Fully Verified:**
- Triggered by: uploading government ID document + admin approval
- Indicator: new field on Customer model (e.g., `identity_verified_at`)
- Unlocks: higher transaction limits, priority support (future features)

**Admin workflow for Tier 2:**
- Customer uploads ID document on profile page
- Document appears in admin customer management panel
- Admin reviews and clicks "Verify Identity" button
- Sets `identity_verified_at` timestamp on Customer model

## Implementation Priority

| Phase | Features | Complexity |
|-------|----------|-----------|
| **A** | Detail slide-over panels (booking/reservation/order) with images + map | Medium |
| **B** | Customer profile & account management (avatar, password, address, verification status) | Medium |
| **C** | Payment option setup (verified customers only) | Low |
| **D** | Real-time chat (new Message/Conversation models, WebSocket, full stack) | High |
| **E** | ID document upload + admin approval workflow (Tier 2 verification) | Medium |

## Open Questions

- Should chat messages support file/image attachments (e.g., sending photos of issues)?
- Should the chat be accessible from a dedicated "Messages" nav item, or only within detail panels?
- For payment setup, is this purely preference tracking or will it integrate with a payment gateway (GCash, PayMongo, etc.)?
- Should there be push notifications / email notifications for new chat messages?

## Next Steps

- [ ] `/plan` Phase A — Detail slide-over panels with backend endpoints + frontend sheets
- [ ] `/plan` Phase B — Customer profile & account management
- [ ] `/plan` Phase C — Payment option setup
- [ ] `/plan` Phase D — Real-time chat system
- [ ] `/plan` Phase E — ID verification workflow
