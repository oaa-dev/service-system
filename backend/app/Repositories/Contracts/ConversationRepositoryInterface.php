<?php

namespace App\Repositories\Contracts;

use App\Models\Conversation;
use Illuminate\Pagination\LengthAwarePaginator;

interface ConversationRepositoryInterface extends BaseRepositoryInterface
{
    public function findByParticipants(int $merchantId, int $customerId, string $conversableType, int $conversableId): ?Conversation;

    public function getForCustomer(int $customerId, int $perPage = 15): LengthAwarePaginator;

    public function getForMerchant(int $merchantId, int $perPage = 15): LengthAwarePaginator;

    public function getConversationWithRelations(int $id): ?Conversation;

    public function countUnreadForUser(int $userId): int;

    public function updateLastMessageAt(int $conversationId): void;
}
