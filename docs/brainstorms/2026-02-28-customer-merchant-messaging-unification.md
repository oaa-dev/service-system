# Brainstorm: Customer-Merchant Messaging Unification

**Date:** 2026-02-28
**Status:** Decided

## Knowledge Context

### Relevant Learnings
- [enforceMorphMap breaks polymorphic models](../knowledge/solutions/runtime-errors/enforce-morph-map-breaks-existing-polymorphic-models-chat-20260228.md): Must use `Relation::morphMap()` when adding new morph types (e.g., 'inquiry'). Never use `enforceMorphMap()`.
- [Eager load + Resource = atomic pair](../knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md): When rewriting ConversationResource, ensure all loaded relations have matching `whenLoaded()` calls.

### Known Gotchas
- Two messaging systems exist with incompatible schemas on the same Conversation model
- The Feb 28 migration dropped old `user_one_id`/`user_two_id` schema and `conversation_participants` table
- `MessagingService`, `ConversationResource`, and `MessageRepository` still reference deleted columns/tables/methods
- Admin `/messages` page is completely broken — calls `getOtherUser()`, `hasUser()`, `userOne`, `userTwo`, `participants` which don't exist

## Problem / Goal

Three interconnected issues:

1. **Broken chat delivery**: Customer sends messages from portal (bookings/reservations/orders) via `ConversationController` + `ConversationService`. Messages ARE saved correctly. But merchant's `/messages` page uses `MessagingController` + `MessagingService` which references the OLD deleted schema — merchant sees nothing.

2. **Missing storefront inquiry**: No way for a customer to message a merchant from `/merchants/<slug>` without first creating a booking/reservation/order.

3. **No online presence**: Customer has no way to know if a merchant is actively available to respond in real-time.

## Architecture Analysis

### Current State (Two Systems)

```
CUSTOMER PORTAL (Works)                    ADMIN/MERCHANT (Broken)
ConversationController                     MessagingController
    ↓                                          ↓
ConversationService                        MessagingService
    ↓                                          ↓
ConversationRepository                     ConversationRepository (OLD methods)
    ↓                                          + MessageRepository (OLD queries)
conversations table                            ↓
(merchant_id, customer_id,                 conversations table
 conversable_type, conversable_id)         (tries user_one_id, user_two_id - GONE)
```

### Target State (Unified)

```
CUSTOMER PORTAL                            ADMIN/MERCHANT
ConversationController                     MessagingController (rewritten)
    ↓                                          ↓
ConversationService                        ConversationService (shared)
    ↓                                          ↓
ConversationRepository                     ConversationRepository
    ↓                                          ↓
conversations table (merchant_id, customer_id, conversable_type, conversable_id)
messages table (conversation_id, sender_id, body, read_at)
```

## Decisions

### 1. Unify on new schema
Rewrite `MessagingService`/`MessagingController`/`ConversationResource` to use the new `merchant_id`/`customer_id`/`conversable` schema. The merchant sees all customer conversations at `/messages`. Single system, no dual maintenance.

### 2. New 'inquiry' conversable type
Add `'inquiry'` to `morphMap()` in `AppServiceProvider`. Customer at `/merchants/<slug>` starts a conversation with `conversable_type='inquiry'`, `conversable_id=merchant_id`. Requires customer auth. Merchant sees inquiries in `/messages` inbox alongside booking/order/reservation chats.

### 3. WebSocket presence channels
Use Laravel Echo presence channels for real-time online/offline detection. Show green dot on merchant storefront page when merchant is actively connected via Reverb.

## Implementation Outline

### Phase A: Fix Merchant Inbox (Critical)
1. **Rewrite `MessagingController`** to use `ConversationService` instead of `MessagingService`:
   - `GET /conversations` → `ConversationService::getMyConversations()` (already auto-detects merchant vs customer)
   - `GET /conversations/{id}/messages` → `ConversationService::getMessages()`
   - `POST /conversations/{id}/messages` → `ConversationService::sendMessage()`
   - `POST /conversations/{id}/read` → `ConversationService::markAsRead()`
   - `GET /messages/unread-count` → new method on `ConversationService`
   - Remove: `startConversation`, `deleteConversation`, `searchMessages`, `deleteMessage` (or reimplement later)
2. **Rewrite `ConversationResource`** for new schema:
   - Remove: `getOtherUser()`, `userOne`, `userTwo`, `participants` references
   - Add: `merchant` (whenLoaded), `customer` (whenLoaded), `conversable` (whenLoaded), `conversable_type`
   - Compute `other_user` based on whether current user is merchant owner or customer
3. **Update admin frontend** messaging hooks/services to match new API shape
4. **Delete or deprecate**: `MessagingService`, old `MessageRepository` methods, `ConversationParticipant` model, `ConversationData` DTO

### Phase B: Storefront Inquiry Messaging
1. Add `'inquiry' => \App\Models\Merchant::class` to `morphMap()` in AppServiceProvider
2. Add endpoint: `POST /customer/my/conversations/inquiry/{slug}/messages` — creates conversation with `conversable_type='inquiry'`, `conversable_id=merchant.id`
3. Add `'inquiry'` to ConversationController TYPE_MAP
4. Frontend: Add "Message Merchant" button on `/merchants/<slug>` page → opens chat panel or chat sheet
5. Chat panel reusable: same `ChatPanel` component, new type `'inquiry'`

### Phase C: WebSocket Presence
1. Create Laravel Echo presence channel: `presence-merchant.{merchantId}`
2. Merchant frontend subscribes to their own presence channel on login
3. Customer frontend checks presence channel for merchant when viewing storefront
4. Backend: `PresenceChannel` authorization in `channels.php`
5. Frontend: `usePresence(merchantId)` hook returning `isOnline: boolean`
6. Show green/grey dot on merchant card and detail page

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Breaking existing admin messaging frontend | High | Admin messaging page is already broken. Rewrite is fixing, not breaking. |
| Conversation count mismatch (unread_count) | Medium | Old `conversation_participants` table is gone. Track read state via `messages.read_at` column. |
| morphMap collision for 'inquiry' | Low | Merchant model is already used — just registering it with alias 'inquiry'. Verify no overlap. |
| Echo presence requires active WebSocket connection | Medium | Show "Online" only when merchant has Reverb connected. Fallback: show nothing rather than wrong state. |

## Open Questions

- Should merchant be able to initiate conversations with customers (outbound messaging)?
- Should inquiry conversations be visible in customer portal `/messages` or only in the storefront detail page?
- Do we need unread count badge in the admin sidebar for new messages?

## Next Steps

- [ ] `/plan` to create an implementation plan from this brainstorm
- [ ] Prioritize Phase A (fix broken merchant inbox) as critical path
