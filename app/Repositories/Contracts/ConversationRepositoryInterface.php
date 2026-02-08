<?php

namespace App\Repositories\Contracts;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use Illuminate\Pagination\LengthAwarePaginator;

interface ConversationRepositoryInterface extends BaseRepositoryInterface
{
    public function findByUsers(int $userOneId, int $userTwoId): ?Conversation;

    public function getForUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    public function getParticipant(int $conversationId, int $userId): ?ConversationParticipant;

    public function getTotalUnreadCount(int $userId): int;

    public function updateLastMessageAt(int $conversationId): void;
}
