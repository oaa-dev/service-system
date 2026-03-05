# Plan: Customer-Merchant Messaging Unification

**Date:** 2026-02-28
**Type:** feature
**Status:** Draft
**Brainstorm:** [2026-02-28-customer-merchant-messaging-unification.md](../brainstorms/2026-02-28-customer-merchant-messaging-unification.md)

## Knowledge Context

### Relevant Learnings
- [enforceMorphMap breaks polymorphic models](../knowledge/solutions/runtime-errors/enforce-morph-map-breaks-existing-polymorphic-models-chat-20260228.md): Must use `Relation::morphMap()` when adding 'inquiry' morph type
- [Eager load + Resource = atomic pair](../knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md): ConversationResource rewrite must pair every eager load with `whenLoaded()`

### Known Gotchas
- `MessagingService` references deleted `user_one_id`/`user_two_id` columns and `ConversationParticipant` table (dropped by Feb 28 migration)
- `ConversationResource` calls `getOtherUser()`/`userOne` — methods don't exist on current Conversation model
- `MessageRepository.searchMessages()` queries `user_one_id`/`user_two_id` — will fail on current schema
- Two broadcast channel patterns exist: `App.Models.User.{id}` (old) and `conversation.{conversationId}` (new)

### Critical Patterns Applied
- Use `morphMap()` not `enforceMorphMap()` in AppServiceProvider (Step B1)
- Eager load + `whenLoaded()` atomic pair in ConversationResource rewrite (Step A2)

## Overview

Unify the two incompatible messaging systems (old user-to-user DM vs new merchant-customer-conversable) into a single system using the new schema. Add storefront inquiry messaging and WebSocket-based merchant online presence.

## Implementation Steps

### Phase A: Fix Merchant Inbox (Critical Path)

#### Step A1: Rewrite MessagingController to use ConversationService
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/MessagingController.php` (rewrite)
- **Details:**
  - Replace `MessagingServiceInterface` dependency with `ConversationServiceInterface`
  - Rewrite all methods to delegate to ConversationService:
    - `conversations()` → `$this->conversationService->getMyConversations(auth()->id())`
    - `messages(conversationId)` → verify access (merchant owns or is customer), then `getMessages()`
    - `sendMessage(conversationId)` → verify access, then `sendMessage()`, dispatch `ChatMessageSent`
    - `markAsRead(conversationId)` → verify access, then `markAsRead()`
    - `unreadCount()` → new method (count unread messages across all conversations for user)
  - Remove broken methods: `startConversation`, `showConversation`, `deleteConversation`, `searchMessages`, `deleteMessage`
  - Remove OpenAPI attributes (they reference old schema)
  - Add authorization helper: verify user is either the merchant owner or the customer of the conversation

#### Step A2: Rewrite ConversationResource for new schema
- **Files:**
  - `backend/app/Http/Resources/Api/V1/ConversationResource.php` (rewrite)
- **Details:**
  - Remove all old-schema references: `getOtherUser()`, `userOne`, `userTwo`, `participants`
  - New output structure:
    ```json
    {
      "id": 1,
      "merchant": { "id": 1, "name": "Shop" },
      "customer": { "id": 2, "name": "John" },
      "conversable_type": "booking",
      "conversable_id": 5,
      "conversable_label": "Booking #5",
      "other_user": { "id": 2, "name": "John", "avatar": {...} },
      "latest_message": {...},
      "unread_count": 3,
      "last_message_at": "...",
      "created_at": "..."
    }
  - `other_user` computed dynamically: if current user owns the merchant → show customer; if current user is customer → show merchant owner
  - `unread_count` computed from `messages.read_at` (count messages where sender_id != current user AND read_at IS NULL)
  - `conversable_label` derived from conversable type + any useful info (booking date, order number, etc.)
  - **Knowledge note:** Pair every `->with([...])` in repository with matching `whenLoaded()` in resource

#### Step A3: Add unread count + conversation access methods to ConversationService
- **Files:**
  - `backend/app/Services/ConversationService.php` (modify)
  - `backend/app/Services/Contracts/ConversationServiceInterface.php` (modify)
  - `backend/app/Repositories/ConversationRepository.php` (modify)
  - `backend/app/Repositories/Contracts/ConversationRepositoryInterface.php` (modify)
- **Details:**
  - Add `getConversation(conversationId): Conversation` — eager load merchant.user.profile.media, customer.profile.media, conversable, latestMessage.sender
  - Add `getTotalUnreadCount(userId): int` — count messages across all conversations where user is participant and read_at IS NULL
  - Add `authorizeAccess(conversationId, userId): Conversation` — verify user is customer_id or owns the merchant
  - Repository: add `getConversationWithRelations(id)`, add `countUnreadForUser(userId): int`
  - Repository: update `getForMerchant`/`getForCustomer` to also eager load `customer.profile.media` and `merchant.user.profile.media` respectively

#### Step A4: Update admin frontend types + services
- **Files:**
  - `frontend/types/api.ts` (modify Conversation interface)
  - `frontend/services/messagingService.ts` (simplify)
- **Details:**
  - Update `Conversation` interface:
    ```ts
    interface Conversation {
      id: number;
      merchant: { id: number; name: string } | null;
      customer: { id: number; name: string } | null;
      conversable_type: string;
      conversable_id: number;
      conversable_label: string | null;
      other_user: MessageSender;
      latest_message: Message | null;
      unread_count: number;
      last_message_at: string | null;
      created_at: string;
      updated_at: string;
    }
    ```
  - Remove `StartConversationRequest`, `MessageSearchParams` types
  - Simplify `messagingService.ts`: remove `startConversation`, `deleteConversation`, `searchMessages`, `deleteMessage`, `getConversation`
  - Keep: `getConversations`, `getMessages`, `sendMessage`, `markAsRead`, `getUnreadCount`

#### Step A5: Update admin frontend hooks + store
- **Files:**
  - `frontend/hooks/useMessaging.ts` (simplify)
  - `frontend/stores/messagingStore.ts` (simplify)
- **Details:**
  - Remove hooks: `useStartConversation`, `useDeleteConversation`, `useSearchMessages`, `useDeleteMessage`, `useConversation`
  - Keep: `useConversations`, `useMessages`, `useSendMessage`, `useMarkConversationAsRead`, `useMessagesUnreadCount`, `useRealtimeMessaging`
  - Update `useRealtimeMessaging` to subscribe to `conversation.{conversationId}` channel pattern (ChatMessageSent event) instead of `App.Models.User.{id}`
  - Simplify store: remove `removeConversation`, `removeMessage` actions

#### Step A6: Update admin frontend messaging components
- **Files:**
  - `frontend/components/messaging/conversation-list.tsx` (update)
  - `frontend/components/messaging/conversation-item.tsx` (update)
  - `frontend/components/messaging/message-list.tsx` (keep)
  - `frontend/components/messaging/message-item.tsx` (keep)
  - `frontend/components/messaging/message-input.tsx` (keep)
  - `frontend/components/messaging/new-conversation-dialog.tsx` (remove)
  - `frontend/components/messaging/message-search.tsx` (remove)
  - `frontend/app/(system)/(messaging)/messages/page.tsx` (update)
- **Details:**
  - `conversation-item.tsx`: Show `conversable_type` label (Booking, Reservation, Order, Inquiry), show `other_user.name` + avatar
  - `conversation-list.tsx`: Remove "New Conversation" button (merchants receive, don't initiate)
  - `messages/page.tsx`: Remove search and delete conversation buttons, remove new-conversation-dialog import
  - Remove `new-conversation-dialog.tsx` and `message-search.tsx` (features removed)

#### Step A7: Clean up deprecated backend files
- **Files:**
  - `backend/app/Services/MessagingService.php` (delete)
  - `backend/app/Services/Contracts/MessagingServiceInterface.php` (delete)
  - `backend/app/Data/ConversationData.php` (delete)
  - `backend/app/Http/Requests/Api/V1/Messaging/StartConversationRequest.php` (delete)
  - `backend/app/Http/Requests/Api/V1/Messaging/SendMessageRequest.php` (delete — separate from Conversation/SendMessageRequest which stays)
  - `backend/app/Events/MessageSent.php` (delete — old user-channel event)
  - `backend/app/Events/ConversationUpdated.php` (delete — old user-channel event)
  - `backend/app/Providers/RepositoryServiceProvider.php` (remove MessagingService binding)
  - `backend/routes/api.php` (slim down messaging routes)
- **Details:**
  - Remove `MessagingServiceInterface => MessagingService` binding from RepositoryServiceProvider
  - Slim routes: keep `GET /conversations`, `GET /conversations/{id}/messages`, `POST /conversations/{id}/messages`, `POST /conversations/{id}/read`, `GET /messages/unread-count`
  - Remove: `POST /conversations` (start), `DELETE /conversations/{id}`, `GET /conversations/{id}` (show), `GET /messages/search`, `DELETE /messages/{id}`
  - Keep `MessageRepository` — `getForConversation()` and `markConversationAsRead()` methods work fine on new schema
  - Delete `MessageRepository::searchMessages()` — it queries `conversation.user_one_id`/`user_two_id` columns that no longer exist (lines 37-48)

#### Step A8: Unify broadcast events
- **Files:**
  - `backend/app/Events/ChatMessageSent.php` (keep — already uses `conversation.{conversationId}` channel)
  - `backend/routes/channels.php` (already updated — authorizes by customer_id or merchant owner)
- **Details:**
  - `ChatMessageSent` is the sole event. Broadcasts on `PrivateChannel("conversation.{conversationId}")` with `broadcastAs('ChatMessageSent')`
  - Old events `MessageSent` (user-channel) and `ConversationUpdated` (user-channel) are deleted in Step A7
  - Both merchant admin frontend and customer portal listen on same channel pattern
  - `channels.php` already authorizes: user is `customer_id` OR owns the `merchant_id` merchant

#### Step A9: Backend tests for unified messaging
- **Files:**
  - `backend/tests/Feature/Api/V1/MessagingControllerTest.php` (rewrite)
- **Details:**
  - Test merchant can list their conversations: `GET /conversations` returns conversations where merchant_id matches user's merchant
  - Test merchant can get messages for a conversation they own
  - Test merchant can send a message in their conversation
  - Test merchant can mark conversation as read
  - Test customer can list their conversations (same endpoint works for both roles)
  - Test unread count returns correct count
  - Test unauthorized access is rejected (user not in conversation)

---

### Phase B: Storefront Inquiry Messaging

#### Step B1: Add 'inquiry' to morphMap
- **Files:**
  - `backend/app/Providers/AppServiceProvider.php` (modify)
- **Details:**
  - Add `'inquiry' => \App\Models\Merchant::class` to `Relation::morphMap()`
  - **Knowledge note:** Use `morphMap()` not `enforceMorphMap()` — critical pattern from knowledge base

#### Step B2: Extend ConversationController for inquiry type
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/ConversationController.php` (modify)
- **Details:**
  - Add `'inquiry'` to `TYPE_MAP`: `'inquiry' => 'inquiry'`
  - Add `Merchant::class` to `MODEL_MAP`: `'inquiry' => Merchant::class`
  - Update `resolveConversable()`: for inquiry type, resolve by slug instead of ID, use `Merchant::where('slug', $slugOrId)` not `where('customer_id', ...)`
  - The merchant IS the conversable — `conversable_id = merchant.id`, `conversable_type = 'inquiry'`
  - No customer ownership check for inquiry (customer is starting fresh)

#### Step B3: Add inquiry route
- **Files:**
  - `backend/routes/api.php` (modify)
- **Details:**
  - The existing customer portal conversation routes already support `{type}/{id}` pattern
  - Inquiry will use: `POST /customer/my/conversations/inquiry/{slug}/messages`
  - May need to adjust route parameter from `{id}` (int) to `{identifier}` (string) since inquiry uses slug
  - Alternative: Add separate route `POST /customer/my/inquiry/{slug}/messages` if slug vs ID causes type confusion

#### Step B4: Customer portal — add inquiry chat to merchant detail page
- **Files:**
  - `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx` (modify)
  - `frontend-customer-portal/components/chat/chat-panel.tsx` (modify to support 'inquiry' type)
  - `frontend-customer-portal/services/conversationService.ts` (add inquiry support)
  - `frontend-customer-portal/hooks/useConversation.ts` (update type union)
- **Details:**
  - Add "Message Merchant" button on merchant detail page (visible when authenticated)
  - On click, open a Sheet/Dialog with ChatPanel using `type="inquiry"` and `id={merchant.slug}`
  - Update ChatPanel to accept `type: 'bookings' | 'reservations' | 'orders' | 'inquiry'`
  - Update conversationService to use slug for inquiry type

#### Step B5: Backend tests for inquiry messaging
- **Files:**
  - `backend/tests/Feature/Api/V1/ConversationTest.php` (add test cases)
- **Details:**
  - Test customer can start inquiry conversation with merchant via slug
  - Test customer can send messages in inquiry conversation
  - Test merchant sees inquiry in their conversation list
  - Test multiple customers can each have separate inquiry conversations with same merchant

---

### Phase C: WebSocket Merchant Presence

#### Step C1: Backend presence channel
- **Files:**
  - `backend/routes/channels.php` (add presence channel)
- **Details:**
  - Add presence channel: `Broadcast::channel('presence-merchant.{merchantId}', ...)`
  - Authorization: any authenticated user can join as viewer; merchant owner joins as member
  - Return user info for the joining member (id, name, avatar)

#### Step C2: Merchant frontend — join presence channel on login
- **Files:**
  - `frontend/hooks/useMessaging.ts` or new `frontend/hooks/usePresence.ts` (add)
  - `frontend/components/layout/system-layout.tsx` (or equivalent) (add presence join)
- **Details:**
  - When merchant user logs in, join `presence-merchant.{merchantId}` via Echo
  - This simply establishes the merchant's online presence
  - On logout/disconnect, Echo auto-leaves the presence channel

#### Step C3: Customer portal — presence hook + UI
- **Files:**
  - `frontend-customer-portal/hooks/usePresence.ts` (new)
  - `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx` (modify)
  - `frontend-customer-portal/app/(storefront)/components/merchant-card.tsx` (modify if exists)
- **Details:**
  - `usePresence(merchantId: number)` hook:
    - Joins `presence-merchant.{merchantId}` as a listener
    - Returns `{ isOnline: boolean, memberCount: number }`
    - `isOnline` = true when at least one member (the merchant owner) is in the channel
  - Show green dot / "Online" badge on merchant detail page next to merchant name
  - Show green dot on merchant cards in browse/search results
  - Graceful fallback: if Echo/Reverb unavailable, just don't show the indicator (no error)

#### Step C4: Backend tests for presence
- **Files:**
  - `backend/tests/Feature/Api/V1/PresenceChannelTest.php` (new, optional)
- **Details:**
  - Test presence channel authorization allows authenticated users
  - Test presence channel returns correct user info for merchant owner
  - Note: Presence behavior is harder to unit test (WebSocket), focus on channel auth

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Breaking admin messaging frontend | High | Page is already broken. Rewrite fixes it. Verify with `npm run build` |
| ConversationResource shape change breaks frontend | Medium | Update frontend types + components atomically in same wave |
| 'inquiry' morphMap collision | Low | Merchant model used as conversable — unique alias, no collision |
| Presence channel memory on Reverb | Low | Presence channels are lightweight. Monitor Reverb connection count |
| Route parameter type confusion (int vs slug) | Medium | Use separate route group for inquiry or add type-aware parameter resolution |
| Unread count performance | Medium | Add DB index on `messages(conversation_id, sender_id, read_at)` if slow |

## Testing Strategy

- [ ] Merchant logs in at admin frontend, sees customer conversations at `/messages`
- [ ] Merchant can read and reply to messages from customer portal bookings/reservations/orders
- [ ] Customer sends message in booking detail → merchant receives it in real-time at `/messages`
- [ ] Customer starts inquiry from `/merchants/<slug>` → merchant sees it in `/messages`
- [ ] Multiple customers can each have inquiry conversations with same merchant
- [ ] Unread count badge shows correct number in admin sidebar
- [ ] Green "Online" dot appears on merchant page when merchant is logged in at admin
- [ ] Green dot disappears when merchant closes their browser/logs out
- [ ] All existing customer portal chat functionality still works (booking/reservation/order)
- [ ] Backend Pest tests pass for all three phases

## Open Questions

- Should we add unread count badge to the admin sidebar navigation item for Messages?
- Should merchant be able to see inquiry conversations in a separate tab/filter, or mixed with order conversations?
- Do we need customer-side conversation list page at `/messages` in customer portal?

## Execution Waves

**Wave 1** (backend foundation):
- A1: Rewrite MessagingController
- A2: Rewrite ConversationResource
- A3: Add methods to ConversationService/Repository
- A7: Delete deprecated files (MessagingService, old events, old DTOs/requests, broken searchMessages)
- A8: Verify broadcast events (ChatMessageSent already correct, just confirm channels.php)

**Wave 2** (admin frontend + tests):
- A4: Update frontend types/services
- A5: Update frontend hooks/store
- A6: Update frontend components/page
- A9: Backend tests

**Wave 3** (inquiry feature):
- B1: morphMap 'inquiry'
- B2: Extend ConversationController
- B3: Add inquiry route
- B5: Backend tests for inquiry

**Wave 4** (inquiry frontend + presence):
- B4: Customer portal inquiry UI
- C1: Backend presence channel
- C2: Merchant frontend presence join
- C3: Customer portal presence UI
- C4: Presence tests (optional)
