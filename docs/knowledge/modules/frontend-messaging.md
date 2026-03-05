# Frontend Messaging Module

## Overview
Admin/merchant messaging interface for the conversation system. Conversations are scoped to transactions (bookings, reservations, orders). Real-time messages via Laravel Echo / Reverb WebSocket. See `messaging.md` for full backend and architecture documentation.

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(messaging)/messages/page.tsx` | Page | Full messaging interface: conversation list sidebar + message thread + input |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/messagingService.ts` | getConversations, getMessages, sendMessage, markAsRead, getUnreadCount |
| Hook | `frontend/hooks/useMessaging.ts` | useConversations, useMessages (infinite scroll), useSendMessage, useMarkConversationAsRead, useMessagesUnreadCount, useRealtimeMessaging |
| Store | `frontend/stores/messagingStore.ts` | Zustand (NOT persisted); conversations[], activeConversationId, messages Record<number,Message[]>, unreadCount |
| Types | `frontend/types/api.ts` | Conversation (with latest_message, unread_count), Message (with sender) |
| Component | `frontend/components/messaging/conversation-list.tsx` | Sidebar list with unread badges, last message preview, timestamps |
| Component | `frontend/components/messaging/conversation-item.tsx` | Individual conversation row |
| Component | `frontend/components/messaging/message-list.tsx` | Message thread display (oldest-first) |
| Component | `frontend/components/messaging/message-item.tsx` | Individual message bubble (own vs other side) |
| Component | `frontend/components/messaging/message-input.tsx` | Compose and send; disabled while pending |
| Component | `frontend/components/messaging/message-badge.tsx` | Unread count badge shown in sidebar nav |
| Component | `frontend/components/messaging/messaging-provider.tsx` | Mounts in SystemLayout; subscribes to Echo for active conversation |
| Hook | `frontend/hooks/usePresence.ts` | `useMerchantPresence()` — joins presence channel while mounted |

## Notes
- Conversations are auto-created lazily: first message fetch for a booking/reservation/order creates the row
- No "new conversation" dialog — merchants see conversations initiated by customers
- `useMessages` uses `useInfiniteQuery` for scroll-to-load-more; messages combined from all pages and reversed for chronological display
- `MessagingProvider` mounts in the system layout so real-time state persists across page navigation
- `messagingStore` is NOT persisted to localStorage — resets on page reload to avoid stale state
- `useRealtimeMessaging(conversationId)` listens on `private conversation.{id}` channel for `.ChatMessageSent` events
- If the active conversation receives a message, it is auto-marked as read; otherwise a toast notification appears
- Unread count badge polled every 30 seconds as fallback if WebSocket drops
- `message-search.tsx` and `new-conversation-dialog.tsx` were removed in the messaging unification refactor
