<?php

namespace App\Services\Contracts;

use App\Data\ConversationData;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Pagination\LengthAwarePaginator;

interface MessagingServiceInterface
{
    public function getConversations(int $userId, int $perPage = 15): LengthAwarePaginator;

    public function getConversation(int $conversationId, int $userId): Conversation;

    public function startConversation(int $userId, ConversationData $data): Conversation;

    public function deleteConversation(int $conversationId, int $userId): bool;

    public function getMessages(int $conversationId, int $userId, int $perPage = 20): LengthAwarePaginator;

    public function sendMessage(int $conversationId, int $senderId, string $body): Message;

    public function markAsRead(int $conversationId, int $userId): void;

    public function deleteMessage(int $messageId, int $userId): bool;

    public function getTotalUnreadCount(int $userId): int;

    public function searchMessages(int $userId, string $query, int $perPage = 15): LengthAwarePaginator;
}
