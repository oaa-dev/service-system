<?php

namespace App\Services\Contracts;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Pagination\LengthAwarePaginator;

interface ConversationServiceInterface
{
    public function getOrCreateConversation(int $merchantId, int $customerId, string $conversableType, int $conversableId): Conversation;

    public function getMessages(int $conversationId, int $perPage = 20): LengthAwarePaginator;

    public function sendMessage(int $conversationId, int $senderId, string $body): Message;

    public function markAsRead(int $conversationId, int $userId): int;

    public function getMyConversations(int $userId, int $perPage = 15): LengthAwarePaginator;
}
