<?php

namespace App\Repositories\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface MessageRepositoryInterface extends BaseRepositoryInterface
{
    public function getForConversation(int $conversationId, int $perPage = 20): LengthAwarePaginator;

    public function markConversationAsRead(int $conversationId, int $userId): int;

    public function getUnreadMessagesCount(int $conversationId, int $userId): int;
}
