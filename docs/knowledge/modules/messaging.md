# Messaging Module

## Overview
Conversation-based messaging between customers and merchants, scoped to a specific transaction (booking, reservation, or service order). The admin/merchant side uses `MessagingController` at `/conversations/*`; the customer portal side uses `ConversationController` at `/customer/my/conversations/{type}/{id}/`. Both sides share the same `ConversationService`.

## Data Model

### Conversation
- **Path**: `backend/app/Models/Conversation.php`
- **Table**: `conversations`
- **Fillable**: `merchant_id`, `customer_id`, `conversable_type`, `conversable_id`, `last_message_at`
- **Casts**: `last_message_at` -> datetime
- **Relationships**:
  - `merchant()` -> BelongsTo -> `Merchant`
  - `customer()` -> BelongsTo -> `User` (FK: customer_id)
  - `conversable()` -> MorphTo (alias: 'booking', 'reservation', 'service_order')
  - `messages()` -> HasMany -> `Message`
  - `latestMessage()` -> HasOne -> `Message` (via latestOfMany())
- **Unique constraint**: `[merchant_id, customer_id, conversable_type, conversable_id]` — one conversation per transaction pair
- **Indexes**: (customer_id, last_message_at), (merchant_id, last_message_at)

### Message
- **Path**: `backend/app/Models/Message.php`
- **Table**: `messages`
- **Fillable**: `conversation_id`, `sender_id`, `body`, `read_at`
- **Casts**: `read_at` -> datetime
- **Relationships**: `conversation()` -> BelongsTo -> `Conversation`, `sender()` -> BelongsTo -> `User`

## Connected Files (Backend)
| Category | File | Notes |
|----------|------|-------|
| Controller (admin/merchant) | `backend/app/Http/Controllers/Api/V1/MessagingController.php` | conversations, messages (paginated), sendMessage, markAsRead, unreadCount |
| Controller (customer portal) | `backend/app/Http/Controllers/Api/V1/ConversationController.php` | messages, send, markRead; uses TYPE_MAP to resolve 'bookings'→'booking' alias |
| Service | `backend/app/Services/ConversationService.php` | getOrCreateConversation (idempotent), getMessages, sendMessage (dispatches ChatMessageSent), markAsRead, getMyConversations (auto-detects merchant vs customer), getTotalUnreadCount, authorizeAccess |
| Service Interface | `backend/app/Services/Contracts/ConversationServiceInterface.php` | — |
| Repository | `backend/app/Repositories/ConversationRepository.php` | findByParticipants, getForCustomer, getForMerchant, updateLastMessageAt |
| Repository Interface | `backend/app/Repositories/Contracts/ConversationRepositoryInterface.php` | — |
| Repository (messages) | `backend/app/Repositories/MessageRepository.php` | Extends BaseRepository |
| Repository Interface (messages) | `backend/app/Repositories/Contracts/MessageRepositoryInterface.php` | — |
| Event | `backend/app/Events/ChatMessageSent.php` | ShouldBroadcast; broadcasts on `PrivateChannel("conversation.{id}")` as `.ChatMessageSent`; payload: full MessageResource |
| FormRequest | `backend/app/Http/Requests/Api/V1/Conversation/SendMessageRequest.php` | body required, string, max 2000 chars |
| Resource | `backend/app/Http/Resources/Api/V1/ConversationResource.php` | id, merchant (name, logo), customer (name, email), conversable_type, conversable_id, last_message_at, latest_message, unread_count |
| Resource | `backend/app/Http/Resources/Api/V1/MessageResource.php` | id, conversation_id, sender (id, name), body, read_at, created_at |
| Broadcast channel | `backend/routes/channels.php` | `conversation.{id}` — allows customer or merchant owner |
| Provider Binding | `backend/app/Providers/RepositoryServiceProvider.php` | ConversationRepositoryInterface, MessageRepositoryInterface, ConversationServiceInterface |

## Routes

### Admin/Merchant (prefix: `/api/v1`, auth + verified + onboarded, no extra permission)
| Method | URI | Action |
|--------|-----|--------|
| GET | `conversations` | MessagingController@conversations — paginated list (auto-detects merchant vs customer context) |
| GET | `conversations/{conversationId}/messages` | MessagingController@messages — paginated, 20/page |
| POST | `conversations/{conversationId}/messages` | MessagingController@sendMessage |
| POST | `conversations/{conversationId}/read` | MessagingController@markAsRead |
| GET | `messages/unread-count` | MessagingController@unreadCount |

### Customer Portal (prefix: `/api/v1/customer/my`, auth + verified + onboarded + permission:customer_portal.view_own)
| Method | URI | Action |
|--------|-----|--------|
| GET | `conversations/{type}/{id}/messages` | ConversationController@messages |
| POST | `conversations/{type}/{id}/messages` | ConversationController@send |
| PATCH | `conversations/{type}/{id}/read` | ConversationController@markRead |

`{type}` accepts: `bookings`, `reservations`, `orders` (and `inquiries` for general merchant inquiries)

## Morph Map (AppServiceProvider)
```php
Relation::morphMap([
    'booking'       => Booking::class,
    'reservation'   => Reservation::class,
    'service_order' => ServiceOrder::class,
]);
```
`conversable_type` stores the alias string (e.g., `'booking'`), not the full class name.

### ConversationController TYPE_MAP
```
'bookings'     -> 'booking'
'reservations' -> 'reservation'
'orders'       -> 'service_order'
'inquiries'    -> 'inquiry'    (for general merchant inquiries)
```

## Broadcast Channels (routes/channels.php)
| Channel | Type | Authorization |
|---------|------|---------------|
| `App.Models.User.{id}` | Private | user.id matches |
| `conversation.{conversationId}` | Private | user is customer OR user's merchant owns the conversation |
| `presence-merchant.{merchantId}` | Presence | any authenticated user; payload includes `is_merchant_owner` |

## ConversationService Key Behaviors
- **getOrCreateConversation**: Idempotent lookup by `[merchant_id, customer_id, conversable_type, conversable_id]`. First GET request lazily creates the conversation row.
- **getMyConversations**: Detects if the authenticated user has a `merchant` record; returns merchant-scoped conversations if so, else customer-scoped.
- **authorizeAccess**: Used by `MessagingController` to verify user is the customer or merchant owner before allowing access.
- **sendMessage**: Creates message, updates `last_message_at` on conversation, dispatches `ChatMessageSent` broadcast event.
- **markAsRead**: Sets `read_at = now()` on messages sent by the other party that haven't been read yet.

## Database
| Type | File |
|------|------|
| Migration (new schema) | `backend/database/migrations/2026_02_28_210000_create_conversations_table.php` |
| Factory | `backend/database/factories/ConversationFactory.php` |

## Admin Frontend (frontend/)
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/messagingService.ts` | getConversations(params), getMessages(id, params), sendMessage(id, body), markAsRead(id), getUnreadCount() |
| Hook | `frontend/hooks/useMessaging.ts` | useConversations, useMessages (infinite scroll), useSendMessage, useMarkConversationAsRead, useMessagesUnreadCount, useRealtimeMessaging(conversationId) |
| Store | `frontend/stores/messagingStore.ts` | Zustand; conversations[], activeConversationId, messages Record<number,Message[]>, unreadCount; NOT persisted to localStorage |
| Page | `frontend/app/(system)/(messaging)/messages/page.tsx` | Full messaging UI: conversation list sidebar + message thread + input |
| Component | `frontend/components/messaging/conversation-list.tsx` | Sidebar list with unread badge, last message preview |
| Component | `frontend/components/messaging/conversation-item.tsx` | Single conversation row |
| Component | `frontend/components/messaging/message-input.tsx` | Compose and send messages |
| Component | `frontend/components/messaging/messaging-provider.tsx` | Context provider in SystemLayout; starts real-time Echo subscription |
| Component | `frontend/components/messaging/message-badge.tsx` | Unread count badge in nav |
| Hook | `frontend/hooks/usePresence.ts` | `useMerchantPresence()` — joins `presence-merchant.{merchantId}` channel while mounted |

## Customer Portal Frontend (frontend-customer-portal/)
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend-customer-portal/services/conversationService.ts` | getMessages(type, id, page), sendMessage(type, id, body), markAsRead(type, id) |
| Hook | `frontend-customer-portal/hooks/useConversation.ts` | useMessages(type, id) — polls every 5s; useSendMessage(); useMarkAsRead(type, id) |
| Hook | `frontend-customer-portal/hooks/usePresence.ts` | `useMerchantPresence()` — subscribe to merchant online status via presence channel |
| Component | `frontend-customer-portal/components/chat/chat-panel.tsx` | Embedded chat UI in booking/reservation/order detail sheets; deduplicates messages from polling + Echo |

## Real-time Behavior
- **Admin frontend**: `useRealtimeMessaging(conversationId)` subscribes to `PrivateChannel("conversation.{id}")` via Laravel Echo; on `.ChatMessageSent` event: adds message to store, marks read if active, shows toast if not, increments unread count.
- **Customer portal**: `ChatPanel` subscribes to the same channel via Echo; falls back to 5-second polling via `refetchInterval: 5000`.
- **Unread count**: `MessagingController@unreadCount` returns total unread messages across all conversations for the user; polled every 30s by admin frontend.

## Tests
| Type | File |
|------|------|
| Feature (customer portal conversations) | `backend/tests/Feature/Api/V1/ConversationTest.php` |
| Feature (admin/merchant messaging) | `backend/tests/Feature/Api/V1/MessagingControllerTest.php` |

## Notes
- The old DM-style schema (user_one_id/user_two_id, ConversationParticipant records) was replaced in migration `2026_02_28_210000_create_conversations_table.php`. The `conversation_participants` table no longer exists.
- No dedicated permission for the admin `conversations` routes — any authenticated verified user can access their own conversations.
- `MessagingStore` is intentionally NOT persisted to localStorage; it resets on page reload to avoid stale conversation state.
- Message deduplication in the store uses ID comparison to handle race conditions between polling and Echo events.
- The `presence-merchant.{merchantId}` channel allows the customer portal to show whether the merchant is currently online.
