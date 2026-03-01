<?php

namespace App\Repositories;

use App\Models\Conversation;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ConversationRepository extends BaseRepository implements ConversationRepositoryInterface
{
    public function __construct(Conversation $model)
    {
        parent::__construct($model);
    }

    public function findByParticipants(int $merchantId, int $customerId, string $conversableType, int $conversableId): ?Conversation
    {
        return $this->model->newQuery()
            ->where('merchant_id', $merchantId)
            ->where('customer_id', $customerId)
            ->where('conversable_type', $conversableType)
            ->where('conversable_id', $conversableId)
            ->first();
    }

    public function getForCustomer(int $customerId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->newQuery()
            ->where('customer_id', $customerId)
            ->with(['merchant', 'conversable', 'latestMessage.sender'])
            ->orderByDesc('last_message_at')
            ->paginate($perPage);
    }

    public function getForMerchant(int $merchantId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->newQuery()
            ->where('merchant_id', $merchantId)
            ->with(['customer', 'conversable', 'latestMessage.sender'])
            ->orderByDesc('last_message_at')
            ->paginate($perPage);
    }

    public function updateLastMessageAt(int $conversationId): void
    {
        $this->model->newQuery()
            ->where('id', $conversationId)
            ->update(['last_message_at' => now()]);
    }
}
