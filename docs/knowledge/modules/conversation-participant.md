# ConversationParticipant Module

## Status: DEPRECATED / REMOVED

The `ConversationParticipant` model and `conversation_participants` table were part of the original DM-style messaging system. They were **dropped** in migration `2026_02_28_210000_create_conversations_table.php` when the conversation system was replaced with the merchant-customer conversable schema.

The old migration that created this table (`2026_02_03_000003_create_conversation_participants_table.php`) still exists in the codebase but its table is dropped by the newer migration.

## What Replaced It
The new Conversation model (see `conversation.md`) uses a simpler participant model:
- `merchant_id` FK — the merchant participant
- `customer_id` FK — the customer participant (references users table)
- No unread_count tracking on participant records
- No SoftDeletes for "leaving" a conversation
- Read status tracked per-message via `read_at` on the Message model

## Old Schema (for reference only)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| conversation_id | FK | cascade-on-delete |
| user_id | FK | cascade-on-delete |
| unread_count | unsigned int | default 0 |
| last_read_at | nullable timestamp | |
| deleted_at | nullable timestamp | SoftDeletes |

The old system auto-created two ConversationParticipant records per conversation (one per user) via a Conversation `created` boot hook. This boot hook no longer exists on the new Conversation model.
