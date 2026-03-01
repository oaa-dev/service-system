# Frontend Messaging Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(messaging)/messages/page.tsx` | Page | Full messaging interface: conversation list, message thread, input, search |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/messagingService.ts` | Conversations CRUD, messages CRUD, search, real-time events |
| Hook | `hooks/useMessaging.ts` | useConversations, useDeleteConversation, useRealtimeMessaging |
| Store | `stores/messagingStore.ts` | Active conversation state, unread counts |
| Type | `types/api.ts` | Conversation, Message types |
| Component | `components/messaging/conversation-list.tsx` | Sidebar conversation list |
| Component | `components/messaging/conversation-item.tsx` | Individual conversation item |
| Component | `components/messaging/message-list.tsx` | Message thread display |
| Component | `components/messaging/message-item.tsx` | Individual message bubble |
| Component | `components/messaging/message-input.tsx` | Message composition input |
| Component | `components/messaging/message-search.tsx` | Search within messages |
| Component | `components/messaging/message-badge.tsx` | Unread message count badge |
| Component | `components/messaging/messaging-provider.tsx` | Context provider for real-time messaging state |
| Component | `components/messaging/new-conversation-dialog.tsx` | Start new conversation dialog |
| Utility | `lib/utils.ts` | getInitials |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- Full messaging interface with conversation list sidebar and message thread view
- Real-time messaging via Laravel Echo / WebSocket (Reverb broadcaster)
- MessagingProvider wraps the system layout to provide real-time state across all pages
- Delete conversation confirmation uses AlertDialog
- Message search enables searching within conversation messages
- Conversation list shows last message preview, timestamps, and unread badges
