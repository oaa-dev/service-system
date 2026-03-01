# Plan: Customer Portal Enhancements (Phases A–E)

**Date:** 2026-02-28
**Type:** feature
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- [Eager load + Resource = atomic pair](../knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md): When adding merchant/service relations to detail queries, MUST add matching `whenLoaded()` in Resource classes. Missing it silently omits data.
- [InfoWindow must be sibling of AdvancedMarker](../knowledge/solutions/ui-bugs/infowindow-inside-advancedmarker-renders-as-pin-html-20260227.md): Map component in detail panels must render InfoWindow as sibling, not child of AdvancedMarker.
- [CSS `background` shorthand overrides Tailwind `bg-*`](../knowledge/solutions/styling-issues/css-background-shorthand-overrides-tailwind-bg-utility-20260227.md): Use Tailwind gradient classes only if gradients are needed.

### Known Gotchas
- **Missing detail endpoints**: Only `GET /customer/my/bookings/{booking}` exists. Reservations and orders lack single-item GET endpoints.
- **No merchant eager loading**: Customer portal queries load `['service', 'service.media']` but NOT merchant details. Need to add `merchant.address` for map coordinates.
- **Coordinates on Address, not Merchant**: Latitude/longitude are on the polymorphic Address model. Must eager load `merchant.address` to get coordinates.
- **Customer model has no avatar**: Avatar lives on User → Profile (Spatie Media Library avatar collection on Profile model, not Customer model).
- **Resource customer inline bug**: BookingResource/ReservationResource/ServiceOrderResource reference `$this->customer->name` and `->email` but Customer model has no name/email fields — those are on the linked User. This is a pre-existing issue.

### Critical Patterns Applied
- Service-Repository pattern for new Message/Conversation models
- Eager load + Resource atomic pair for all new relations
- Existing `@vis.gl/react-google-maps` AdvancedMarker pattern for maps
- Existing shadcn/ui Sheet component for slide-over panels
- Existing AddressFormFields cascading component for profile address
- Existing Laravel Echo/Reverb infrastructure for real-time chat

## Overview

5-phase enhancement of the customer portal:
- **Phase A**: Detail slide-over panels (booking/reservation/order) with service images + merchant map
- **Phase B**: Customer profile & account management (avatar, password, address, verification status display)
- **Phase C**: Payment option setup for verified customers
- **Phase D**: Real-time customer-merchant chat via WebSocket
- **Phase E**: ID document upload + admin approval workflow (Tier 2 verification)

---

## Phase A: Detail Slide-Over Panels

### Step A1: Add missing backend detail endpoints
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php`
  - `backend/app/Services/CustomerPortalService.php`
  - `backend/routes/api.php`
- **Details:**
  - Add `myReservation(int $reservation)` method to controller → delegates to service
  - Add `myOrder(int $order)` method to controller → delegates to service
  - Add `getMyReservation($reservationId)` to CustomerPortalService — scope by `customer_id = auth()->id()`, eager load `['service', 'service.media', 'service.serviceCategory', 'merchant', 'merchant.address']`
  - Add `getMyOrder($orderId)` to CustomerPortalService — same eager loading pattern
  - Update existing `getMyBooking()` to also eager load `merchant` and `merchant.address`
  - Add routes: `GET /customer/my/reservations/{reservation}` and `GET /customer/my/orders/{order}` with `customer_portal.view_own` permission
- **Knowledge note:** Eager load + Resource atomic pair — Step A2 adds the matching whenLoaded entries.

### Step A2: Update Resources to include merchant details
- **Files:**
  - `backend/app/Http/Resources/Api/V1/BookingResource.php`
  - `backend/app/Http/Resources/Api/V1/ReservationResource.php`
  - `backend/app/Http/Resources/Api/V1/ServiceOrderResource.php`
- **Details:**
  - Add `'merchant' => $this->whenLoaded('merchant', fn() => [...])` to all three resources
  - Merchant inline: `id`, `name`, `slug`, `logo` (from media), `address` (whenLoaded with AddressResource for lat/lng)
  - Optionally add `'unit' => $this->whenLoaded('unit', ...)` to ReservationResource (unit name, images)
- **Knowledge note:** This is the Resource half of the eager-load + Resource atomic pair from Step A1.

### Step A3: Add frontend service methods + hooks for detail endpoints
- **Files:**
  - `frontend-customer-portal/services/customerDashboardService.ts`
  - `frontend-customer-portal/hooks/useCustomerDashboard.ts`
  - `frontend-customer-portal/types/api.ts`
- **Details:**
  - Add `getMyReservation(id)` → `GET /customer/my/reservations/${id}` to service
  - Add `getMyOrder(id)` → `GET /customer/my/orders/${id}` to service
  - Add `useMyReservation(id)` and `useMyOrder(id)` React Query hooks (match existing `useMyBooking` pattern)
  - Update `Booking`, `Reservation`, `ServiceOrder` TypeScript interfaces to include optional `merchant` field with `{ id, name, slug, logo?, address?: { latitude, longitude, ... } }`

### Step A4: Create detail slide-over Sheet components
- **Files:**
  - `frontend-customer-portal/app/(customer)/bookings/booking-detail-sheet.tsx` (new)
  - `frontend-customer-portal/app/(customer)/reservations/reservation-detail-sheet.tsx` (new)
  - `frontend-customer-portal/app/(customer)/orders/order-detail-sheet.tsx` (new)
- **Details:**
  - Use shadcn/ui `Sheet` component (side="right", responsive width)
  - Each sheet contains:
    - **Header**: Service image (preview conversion), service name, status badge
    - **Details section**: Date/time, party size/guests/quantity, pricing breakdown (itemized: base, fee, total)
    - **Merchant section**: Merchant name + logo, small map (if coordinates available)
    - **Notes section**: Customer notes, special requests (reservation)
    - **Actions**: Cancel button (conditionally shown based on status rules)
  - Map component: use `@vis.gl/react-google-maps` `<Map>` + `<AdvancedMarker>` (InfoWindow as sibling per knowledge)

### Step A5: Integrate sheets into list pages
- **Files:**
  - `frontend-customer-portal/app/(customer)/bookings/page.tsx`
  - `frontend-customer-portal/app/(customer)/reservations/page.tsx`
  - `frontend-customer-portal/app/(customer)/orders/page.tsx`
- **Details:**
  - Add `useState<number | null>(null)` for selected item ID
  - Make list items clickable → set selected ID
  - Render detail Sheet conditionally when selected ID is set
  - Sheet `onOpenChange` → clear selected ID

### Step A6: Backend tests for new detail endpoints
- **Files:**
  - `backend/tests/Feature/Api/V1/CustomerPortalTest.php` (existing, extend)
- **Details:**
  - Test `GET /customer/my/reservations/{id}` returns correct data with eager-loaded relations
  - Test `GET /customer/my/orders/{id}` returns correct data
  - Test scoping: customer cannot access another customer's reservation/order (403 or 404)
  - Test merchant data included in response (name, address with coordinates)

---

## Phase B: Customer Profile & Account Management

### Step B1: Backend profile self-service endpoints
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php` (or use existing ProfileController)
  - `backend/app/Services/CustomerPortalService.php`
  - `backend/routes/api.php`
  - `backend/app/Http/Requests/Api/V1/Customer/` (new requests if needed)
- **Details:**
  - Verify existing `GET /profile/customer` returns full customer data including user profile (avatar, address)
  - Verify existing `PUT /profile/customer` can update: first_name, last_name, phone, date_of_birth, gender, bio, address fields
  - Add or verify avatar upload endpoint: `POST /profile/avatar` (may already exist on ProfileController)
  - Add password change endpoint: `PUT /profile/password` with current_password + new_password validation
  - Ensure profile response includes: `user.profile.avatar` (media URLs), `user.email_verified_at`, address with geographic FKs

### Step B2: Frontend profile page — Personal Info tab
- **Files:**
  - `frontend-customer-portal/app/(customer)/profile/page.tsx` (rewrite from placeholder)
  - `frontend-customer-portal/app/(customer)/profile/personal-info-tab.tsx` (new)
- **Details:**
  - Replace placeholder with tabbed layout (Tabs component): Personal Info | Account | Payment
  - Personal Info tab form fields:
    - Avatar upload with crop dialog (reuse AvatarCropDialog pattern from admin frontend)
    - First name, last name (text inputs)
    - Phone (text input)
    - Date of birth (date picker)
    - Gender (select: male/female/other/prefer_not_to_say)
    - Bio (textarea)
    - Address (AddressFormFields cascading component — Region→Province→City→Barangay + street)
  - Form submission: `PUT /profile/customer`
  - Avatar upload: `POST /profile/avatar` with FormData

### Step B3: Frontend profile page — Account tab
- **Files:**
  - `frontend-customer-portal/app/(customer)/profile/account-tab.tsx` (new)
- **Details:**
  - **Verification status display**:
    - Badge showing: "Unverified" (red) / "Email Verified" (yellow/basic) / "Fully Verified" (green)
    - Based on `email_verified_at` (Tier 1) and `identity_verified_at` (Tier 2, Phase E)
  - **Email display**: Read-only, shows current email
  - **Change password form**: Current password + New password + Confirm new password
  - **Account info**: Customer type, tier, member since date

### Step B4: Frontend hooks + services for profile
- **Files:**
  - `frontend-customer-portal/services/customerProfileService.ts` (new)
  - `frontend-customer-portal/hooks/useCustomerProfile.ts` (new)
  - `frontend-customer-portal/types/api.ts` (extend)
- **Details:**
  - `getMyProfile()` → `GET /profile/customer`
  - `updateMyProfile(data)` → `PUT /profile/customer`
  - `uploadAvatar(file)` → `POST /profile/avatar`
  - `deleteAvatar()` → `DELETE /profile/avatar`
  - `changePassword(data)` → `PUT /profile/password`
  - React Query hooks: `useMyProfile()`, `useUpdateMyProfile()`, `useUploadAvatar()`, `useChangePassword()`
  - Types: `CustomerProfile` interface, `UpdateProfilePayload`, `ChangePasswordPayload`

### Step B5: Backend tests for profile endpoints
- **Files:**
  - `backend/tests/Feature/Api/V1/CustomerProfileTest.php` (new)
- **Details:**
  - Test profile fetch returns full data with avatar, address, verification status
  - Test profile update (name, phone, address)
  - Test avatar upload + delete
  - Test password change (correct current password required, new password validation)
  - Test unauthorized access (non-customer users)

---

## Phase C: Payment Option Setup

### Step C1: Backend payment preference endpoint
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php`
  - `backend/app/Services/CustomerPortalService.php`
  - `backend/routes/api.php`
- **Details:**
  - Add `GET /customer/my/payment-methods` — returns available payment methods (from active PaymentMethod reference data) + customer's current selections
  - Add `PUT /customer/my/payment-preferences` — updates `Customer.preferred_payment_method` (stores JSON array of selected method IDs)
  - Gate behind email verification: middleware check or controller-level check for `email_verified_at`

### Step C2: Frontend Payment tab on profile
- **Files:**
  - `frontend-customer-portal/app/(customer)/profile/payment-tab.tsx` (new)
- **Details:**
  - Show only when customer is email-verified (`email_verified_at !== null`)
  - If not verified: show message "Verify your email to set up payment methods"
  - List all active payment methods with toggle switches or checkboxes
  - Mark currently selected/preferred method
  - Save button → `PUT /customer/my/payment-preferences`
  - Future placeholder: "Saved cards coming soon" section

### Step C3: Backend test for payment preferences
- **Files:**
  - `backend/tests/Feature/Api/V1/CustomerPaymentPreferenceTest.php` (new)
- **Details:**
  - Test fetching available methods
  - Test updating preferences
  - Test unverified user cannot update preferences (if gated)

---

## Phase D: Real-Time Customer-Merchant Chat

### Step D1: Database — Conversation + Message models
- **Files:**
  - `backend/database/migrations/XXXX_create_conversations_table.php` (new)
  - `backend/database/migrations/XXXX_create_messages_table.php` (new)
  - `backend/app/Models/Conversation.php` (new)
  - `backend/app/Models/Message.php` (new)
  - `backend/database/factories/ConversationFactory.php` (new)
  - `backend/database/factories/MessageFactory.php` (new)
- **Details:**
  - **conversations table**: `id`, `merchant_id` (FK), `customer_id` (FK to users), `conversable_type` (booking|reservation|service_order), `conversable_id`, `last_message_at` (nullable timestamp), `created_at`, `updated_at`
    - Composite unique: `[merchant_id, customer_id, conversable_type, conversable_id]`
  - **messages table**: `id`, `conversation_id` (FK), `sender_id` (FK to users), `body` (text), `read_at` (nullable timestamp), `created_at`, `updated_at`
  - Conversation relationships: `merchant()`, `customer()` (User), `conversable()` (MorphTo), `messages()`, `latestMessage()`
  - Message relationships: `conversation()`, `sender()` (User)

### Step D2: Service-Repository layer for chat
- **Files:**
  - `backend/app/Repositories/ConversationRepository.php` (new)
  - `backend/app/Repositories/Contracts/ConversationRepositoryInterface.php` (new)
  - `backend/app/Services/ConversationService.php` (new)
  - `backend/app/Services/Contracts/ConversationServiceInterface.php` (new)
  - `backend/app/Providers/RepositoryServiceProvider.php` (bind)
- **Details:**
  - `getOrCreateConversation(merchantId, customerId, conversableType, conversableId)` — finds existing or creates new
  - `getMessages(conversationId, paginationParams)` — paginated, oldest first
  - `sendMessage(conversationId, senderId, body)` — creates message, updates `last_message_at`, dispatches `MessageSent` event
  - `markAsRead(conversationId, userId)` — marks unread messages as read
  - `getMyConversations(userId)` — all conversations for a user (for future Messages nav)

### Step D3: Chat API endpoints + requests
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/ConversationController.php` (new)
  - `backend/app/Http/Requests/Api/V1/Conversation/SendMessageRequest.php` (new)
  - `backend/app/Http/Resources/Api/V1/ConversationResource.php` (new)
  - `backend/app/Http/Resources/Api/V1/MessageResource.php` (new)
  - `backend/routes/api.php`
- **Details:**
  - Customer endpoints (under `customer/my/`):
    - `GET /customer/my/conversations/{type}/{id}/messages` — get/create conversation + paginated messages
    - `POST /customer/my/conversations/{type}/{id}/messages` — send message
    - `PATCH /customer/my/conversations/{type}/{id}/read` — mark as read
  - `type` = `bookings|reservations|orders`, `id` = the booking/reservation/order ID
  - Controller resolves conversation from type+id+current user, verifies ownership
  - Permissions: `customer_portal.view_own` for read, new `customer_portal.chat` for send

### Step D4: Broadcasting — MessageSent event for chat
- **Files:**
  - `backend/app/Events/MessageSent.php` (update existing or create chat-specific)
  - `backend/routes/channels.php`
- **Details:**
  - Broadcast on `PrivateChannel('conversation.{conversationId}')`
  - Event payload: message data (id, body, sender_id, sender_name, created_at)
  - Channel authorization: user must be either the merchant user or the customer in the conversation
  - Update existing `MessageSent` event or create `ChatMessageSent` to avoid conflicting with existing messaging events

### Step D5: Frontend chat component
- **Files:**
  - `frontend-customer-portal/components/chat/chat-panel.tsx` (new)
  - `frontend-customer-portal/services/conversationService.ts` (new)
  - `frontend-customer-portal/hooks/useConversation.ts` (new)
  - `frontend-customer-portal/lib/echo.ts` (new — mirror admin frontend pattern)
- **Details:**
  - `ChatPanel` component: message list (scrollable, auto-scroll to bottom), input field, send button
  - Service: `getMessages(type, id, page)`, `sendMessage(type, id, body)`, `markAsRead(type, id)`
  - Hooks: `useMessages(type, id)`, `useSendMessage()`, `useMarkAsRead()`
  - Echo integration: listen on `conversation.{id}` private channel for `ChatMessageSent` events
  - On new message received: append to React Query cache, scroll to bottom
  - Message bubbles: sender alignment (right = customer, left = merchant), timestamp, read status

### Step D6: Integrate chat into detail sheets
- **Files:**
  - `frontend-customer-portal/app/(customer)/bookings/booking-detail-sheet.tsx`
  - `frontend-customer-portal/app/(customer)/reservations/reservation-detail-sheet.tsx`
  - `frontend-customer-portal/app/(customer)/orders/order-detail-sheet.tsx`
- **Details:**
  - Add collapsible "Chat with Merchant" section at bottom of each detail sheet
  - Render `<ChatPanel type="bookings" id={booking.id} />` (or reservations/orders)
  - Show unread message count badge if applicable
  - Chat only available for non-cancelled transactions

### Step D7: Backend tests for chat
- **Files:**
  - `backend/tests/Feature/Api/V1/ConversationTest.php` (new)
- **Details:**
  - Test conversation auto-creation on first message fetch
  - Test sending messages
  - Test message pagination (oldest first)
  - Test mark as read
  - Test scoping: customer can only access their own conversations
  - Test customer cannot chat on another customer's booking

---

## Phase E: ID Document Verification (Tier 2)

### Step E1: Backend — Customer identity verification fields + endpoint
- **Files:**
  - `backend/database/migrations/XXXX_add_identity_verification_to_customers_table.php` (new)
  - `backend/app/Models/Customer.php`
  - `backend/app/Http/Controllers/Api/V1/CustomerController.php` (admin side)
  - `backend/app/Http/Controllers/Api/V1/CustomerPortalController.php` (customer side)
  - `backend/routes/api.php`
- **Details:**
  - Migration: add `identity_verified_at` (nullable timestamp), `identity_document_status` (enum: none, pending, approved, rejected) to customers table
  - Customer model: add to fillable + casts
  - Customer self-service: `POST /customer/my/identity-document` — upload government ID (Spatie Media Library `identity_document` collection on Customer model, requires adding `HasMedia`/`InteractsWithMedia` to Customer)
  - Admin: `PATCH /customers/{customer}/verify-identity` — sets `identity_verified_at` + status to approved
  - Admin: `PATCH /customers/{customer}/reject-identity` — sets status to rejected (with reason)
  - CustomerResource: add `identity_verified_at`, `identity_document_status`, `identity_document` (media URL whenLoaded)

### Step E2: Frontend — ID upload on profile Account tab
- **Files:**
  - `frontend-customer-portal/app/(customer)/profile/account-tab.tsx` (extend from Phase B)
- **Details:**
  - New section: "Identity Verification"
  - Status display: none → "Upload ID to get fully verified" / pending → "Under review" / approved → "Fully Verified ✓" / rejected → "Rejected — please re-upload"
  - File upload: accept image/pdf, preview before submit
  - Upload button → `POST /customer/my/identity-document`

### Step E3: Admin — Identity verification review
- **Files:**
  - `frontend/app/(system)/(customers)/customers/[id]/` (admin frontend, existing customer detail)
- **Details:**
  - Show uploaded identity document with preview
  - "Approve" and "Reject" (with reason input) buttons
  - Updates customer verification status

### Step E4: Backend tests for identity verification
- **Files:**
  - `backend/tests/Feature/Api/V1/CustomerIdentityVerificationTest.php` (new)
- **Details:**
  - Test document upload
  - Test admin approval sets identity_verified_at
  - Test admin rejection with reason
  - Test re-upload after rejection
  - Test customer cannot self-approve

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Eager loading N+1 on list pages after adding merchant | Medium | Only add merchant eager loading to detail (single-item) queries, not list queries |
| Chat WebSocket connection management | Medium | Singleton Echo pattern, connect only when chat panel is open |
| Message flooding / spam | Low | Rate limiting on send message endpoint |
| Large file upload for ID documents | Low | Backend validation: max 5MB, accept only image/pdf |
| Customer-merchant channel authorization | Medium | Channel auth checks both parties belong to the conversation |
| Pre-existing Resource customer inline bug | Low | Fix inline to use `$this->customer->user->name` where needed, or leave as-is if not user-facing |

## Testing Strategy

### Backend (Pest tests)
- [ ] Customer portal detail endpoints (reservation + order single-item GET)
- [ ] Merchant data included in detail responses (eager load + Resource)
- [ ] Customer profile CRUD (fetch, update, avatar, password)
- [ ] Payment preference update (verified customers only)
- [ ] Conversation/Message CRUD (create, send, paginate, read, scope)
- [ ] Identity document upload + admin approval/rejection
- [ ] Cross-customer isolation on all endpoints

### Frontend
- [ ] TypeScript + build passes for customer portal
- [ ] Detail sheets open on list item click, show correct data
- [ ] Map renders with merchant coordinates
- [ ] Profile form saves correctly (all fields + avatar)
- [ ] Password change works
- [ ] Chat messages send and receive in real-time
- [ ] Payment tab visible only for verified customers

## Open Questions

- Should chat messages support file/image attachments? (Recommend deferring to post-MVP)
- Should there be a dedicated "Messages" nav item listing all conversations? (Recommend adding after Phase D)
- For payment, is `preferred_payment_method` a single selection or multiple? (Current model: single string field — may need migration to JSON array or pivot table for multiple)
- Should push/email notifications be sent for new chat messages? (Recommend deferring)
