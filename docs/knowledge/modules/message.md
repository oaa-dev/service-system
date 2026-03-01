# Message Module

## Overview
The Message model stores individual chat messages within a Conversation. Each message belongs to a conversation scoped to a transaction (booking/reservation/service_order) between a customer and merchant.

**Note**: The messages table was dropped and recreated in migration `2026_02_28_210001_create_messages_table.php` alongside the conversation schema replacement. The new schema removes SoftDeletes and the per-user unread tracking that existed in the old DM-style system.

## Model
- **Path**: app/Models/Message.php
- **Table**: messages
- **Fillable**: conversation_id, sender_id, body, read_at
- **Casts**: read_at -> datetime
- **Relationships**:
  - conversation() -> BelongsTo -> Conversation
  - sender() -> BelongsTo -> User (FK: sender_id)
- **Traits**: HasFactory
- **Scopes**: (none)
- **Helper methods**: (none — read_at is set directly via bulk update in ConversationService::markAsRead)

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/ConversationController.php | messages, send, markRead actions |
| Service | app/Services/ConversationService.php | sendMessage creates message + updates last_message_at; markAsRead bulk-updates read_at; getMessages paginates with sender eager-load |
| Service Interface | app/Services/Contracts/ConversationServiceInterface.php | sendMessage, getMessages, markAsRead |
| Repository | (none — Message queries are performed directly in ConversationService, not via a dedicated repository) |
| Resource | app/Http/Resources/Api/V1/MessageResource.php | id, conversation_id, sender_id, sender (with avatar), body, read_at, is_mine, created_at, updated_at |
| FormRequest | app/Http/Requests/Api/V1/Conversation/SendMessageRequest.php | body required, string, max 2000 chars |
| Event | app/Events/ChatMessageSent.php | ShouldBroadcast; broadcasts on PrivateChannel("conversation.{conversationId}") as 'ChatMessageSent'; payload is full MessageResource::resolve() |

### ConversationService::sendMessage
1. Creates Message with conversation_id, sender_id, body
2. Calls `conversationRepository->updateLastMessageAt($conversationId)` to bump last_message_at
3. Loads sender relation and returns the message
4. Caller (ConversationController::send) dispatches `ChatMessageSent::dispatch($message)` after calling sendMessage

### ConversationService::markAsRead
Bulk-updates `read_at = now()` for all messages in the conversation where `sender_id != $userId` and `read_at IS NULL`. Does not use a per-participant unread_count (simplified vs. old schema).

## Routes
All routes under `auth:api + ensure.verified + onboarding + permission:customer_portal.view_own` middleware:

| Method | URI | Action |
|--------|-----|--------|
| GET | api/v1/customer/my/conversations/{type}/{id}/messages | ConversationController@messages (paginated, 20 per page, oldest-first) |
| POST | api/v1/customer/my/conversations/{type}/{id}/messages | ConversationController@send |
| PATCH | api/v1/customer/my/conversations/{type}/{id}/read | ConversationController@markRead |

## Database
| Type | File |
|------|------|
| Migration (new schema) | database/migrations/2026_02_28_210001_create_messages_table.php |
| Factory | database/factories/MessageFactory.php |
| Seeder | (none) |

### Schema Notes (new schema)
- `conversation_id` FK to conversations with cascade-on-delete
- `sender_id` FK to users with cascade-on-delete
- `body` is text type (no length limit in DB; API validates max 2000 chars)
- `read_at` nullable timestamp — null means unread by the recipient
- No SoftDeletes (removed from the new schema)
- No per-row unread tracking — read status is a single `read_at` timestamp per message
- Index on (conversation_id, created_at) for efficient chronological queries

### Old Schema Differences
The old messages table had SoftDeletes and was part of the DM-style messaging system. The new schema is simpler: no soft deletes, no per-participant unread counts on message rows.

## Resource Output
```json
{
  "id": 1,
  "conversation_id": 1,
  "sender_id": 5,
  "sender": {
    "id": 5,
    "name": "Jane Customer",
    "avatar": { "original": "...", "thumb": "...", "preview": "..." }
  },
  "body": "Can I reschedule my appointment?",
  "read_at": null,
  "is_mine": true,
  "created_at": "2026-02-28T21:00:00.000000Z",
  "updated_at": "2026-02-28T21:00:00.000000Z"
}
```
`is_mine` is computed as `$request->user()->id === $this->sender_id`.

## Tests
| Type | File |
|------|------|
| Feature | tests/Feature/Api/V1/ConversationTest.php |

### Relevant Message Test Coverage
- Send message: 201 with body persisted, auto-creates conversation, updates last_message_at, message linked to conversation, response includes sender, body required 422, max 2000 chars 422, exact 2000 chars accepted
- Mark as read: bulk-updates read_at for messages from other party, does not mark own messages, does not re-mark already-read messages, returns 204 no content
- Get messages: paginated (meta + links structure), ordered oldest-first, correct fields (id, conversation_id, sender_id, body, read_at, is_mine, created_at, updated_at), `is_mine=true` when sender is authenticated user
