# Conversation Module

## Overview
The Conversation model represents a chat thread between a customer and a merchant, scoped to a specific transaction (booking, reservation, or service order). This is a polymorphic "conversable" pattern — each conversation belongs to exactly one conversable entity.

**Note**: The original DM-style schema (user_one_id/user_two_id, ConversationParticipant records) was replaced in migration `2026_02_28_210000_create_conversations_table.php`. The old `conversation_participants` and `messages` tables are dropped and recreated with the new schema.

## Model
- **Path**: app/Models/Conversation.php
- **Table**: conversations
- **Fillable**: merchant_id, customer_id, conversable_type, conversable_id, last_message_at
- **Casts**: last_message_at -> datetime
- **Relationships**:
  - merchant() -> BelongsTo -> Merchant
  - customer() -> BelongsTo -> User (FK: customer_id)
  - conversable() -> MorphTo (morph alias: 'booking', 'reservation', 'service_order')
  - messages() -> HasMany -> Message
  - latestMessage() -> HasOne -> Message (via latestOfMany())
- **Traits**: HasFactory
- **Scopes**: (none)
- **Boot hooks**: (none — no auto-creation side-effects, unlike the old schema)

### Morph Map
Registered in `AppServiceProvider::boot()` via `Relation::morphMap()` (NOT `enforceMorphMap()`):
```php
Relation::morphMap([
    'booking'       => \App\Models\Booking::class,
    'reservation'   => \App\Models\Reservation::class,
    'service_order' => \App\Models\ServiceOrder::class,
]);
```
The `conversable_type` column stores the alias string (`'booking'`, `'reservation'`, `'service_order'`), not the full class name.

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/ConversationController.php | messages, send, markRead actions; scoped to customer portal |
| Service | app/Services/ConversationService.php | getOrCreateConversation, getMessages, sendMessage, markAsRead, getMyConversations |
| Service Interface | app/Services/Contracts/ConversationServiceInterface.php | 5 method contract |
| Repository | app/Repositories/ConversationRepository.php | findByParticipants, getForCustomer, getForMerchant, updateLastMessageAt |
| Repository Interface | app/Repositories/Contracts/ConversationRepositoryInterface.php | 4 method contract extending BaseRepositoryInterface |
| Event | app/Events/ChatMessageSent.php | ShouldBroadcast; broadcasts on PrivateChannel("conversation.{conversationId}") as 'ChatMessageSent'; payload is full MessageResource |
| FormRequest | app/Http/Requests/Api/V1/Conversation/SendMessageRequest.php | body required, string, max 2000 chars |
| Resource | (none — ConversationController returns MessageResource directly, not a ConversationResource) |

### ConversationController TYPE_MAP
The controller maps URL path segments to morph alias strings:
```
'bookings'     -> 'booking'
'reservations' -> 'reservation'
'orders'       -> 'service_order'
```
The MODEL_MAP then maps aliases to Eloquent model classes for ownership checks.

### ConversationService::getOrCreateConversation
Looks up an existing conversation by (merchant_id, customer_id, conversable_type, conversable_id). Creates one if none exists. This means the first GET /messages request lazily creates the conversation row.

### ConversationService::getMyConversations
Detects if the authenticated user has a merchant record and returns merchant-scoped conversations; otherwise returns customer-scoped conversations. Used for dashboard/admin conversation list (not exposed via customer portal routes at this time).

## Routes
All routes under `auth:api + ensure.verified + onboarding + permission:customer_portal.view_own` middleware:

| Method | URI | Action |
|--------|-----|--------|
| GET | api/v1/customer/my/conversations/{type}/{id}/messages | ConversationController@messages |
| POST | api/v1/customer/my/conversations/{type}/{id}/messages | ConversationController@send |
| PATCH | api/v1/customer/my/conversations/{type}/{id}/read | ConversationController@markRead |

`{type}` accepts: `bookings`, `reservations`, `orders`

The controller resolves the conversable by calling `ModelClass::where('customer_id', $customerId)->find($id)`. Returns 404 if the resource doesn't belong to the authenticated user.

## Database
| Type | File |
|------|------|
| Migration (new schema) | database/migrations/2026_02_28_210000_create_conversations_table.php |
| Factory | database/factories/ConversationFactory.php |
| Seeder | (none) |

### Schema Notes (new schema)
- `merchant_id` FK to merchants with cascade-on-delete
- `customer_id` FK to users with cascade-on-delete
- `conversable_type` string — morph alias ('booking', 'reservation', 'service_order')
- `conversable_id` unsigned big integer — the ID of the referenced transaction record
- Unique constraint on (merchant_id, customer_id, conversable_type, conversable_id) — ensures one conversation per transaction
- Indexes on (customer_id, last_message_at) and (merchant_id, last_message_at) for efficient list queries ordered by recency
- No participant records, no unread_count — simplified schema vs. the old DM model

### Old Schema (replaced)
The original schema used `user_one_id`/`user_two_id` (DM-style), `ConversationParticipant` records, and a `lastMessage` via `latestOfMany()`. This was dropped and the `conversation_participants` table no longer exists.

## Customer Portal Frontend
| Category | File | Notes |
|----------|------|-------|
| Service | frontend-customer-portal/services/conversationService.ts | getMessages(type, id, page), sendMessage(type, id, body), markAsRead(type, id) |
| Hook | frontend-customer-portal/hooks/useConversation.ts | useMessages(type, id) — polls every 5s; useSendMessage(); useMarkAsRead(type, id) |
| Component | frontend-customer-portal/components/chat/chat-panel.tsx | Chat UI with message bubbles, input box, real-time Echo subscription |
| Type | frontend-customer-portal/types/api.ts | Message, Conversation interfaces |

### ChatPanel Real-time Behavior
- Polls every 5 seconds via `refetchInterval: 5000` in `useMessages` (fallback until Echo is fully installed)
- Also subscribes to `PrivateChannel("conversation.{conversationId}")` for 'ChatMessageSent' events via Laravel Echo when available
- Deduplicates messages from both polling and Echo using message ID comparison
- Marks conversation as read on initial mount when `data?.conversation?.id` becomes available
- Echo channel left on component unmount

## Tests
| Type | File |
|------|------|
| Feature | tests/Feature/Api/V1/ConversationTest.php |

### Test Coverage
- GET messages — booking conversation auto-create: creates conversation on first request, reuses existing, returns messages, correct fields, messages ordered oldest-first, paginated meta, 404 for non-existent booking, 404 for invalid type, 401 unauthenticated
- GET messages — reservation conversation: creates conversation, 404 for another customer's reservation
- GET messages — order conversation: creates conversation, 404 for another customer's order
- POST send message: creates message, auto-creates conversation, updates last_message_at, links to correct conversation, returns message with sender, validates body required, validates max 2000 chars, accepts exactly 2000 chars, 404 for another customer's booking, 404 for non-existent booking, 401 unauthenticated
- PATCH mark as read: marks unread messages from other party, does not mark own messages, does not re-mark already-read messages, auto-creates conversation, returns 204, 404 for another customer's booking, 401 unauthenticated
- Scoping and isolation: cross-customer isolation (get, send), separate conversations per customer, 404 for non-existent booking/reservation/order
- Conversation persistence across context types: separate conversations for booking and reservation, messages isolated per conversation
