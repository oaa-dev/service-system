<?php

namespace App\Repositories;

use App\Models\Conversation;
use App\Models\Message;
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
            ->with([
                'merchant.user.profile.media',
                'customer.profile.media',
                'conversable',
                'latestMessage.sender.profile.media',
            ])
            ->orderByDesc('last_message_at')
            ->paginate($perPage);
    }

    public function getForMerchant(int $merchantId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->newQuery()
            ->where('merchant_id', $merchantId)
            ->with([
                'merchant.user.profile.media',
                'customer.profile.media',
                'conversable',
                'latestMessage.sender.profile.media',
            ])
            ->orderByDesc('last_message_at')
            ->paginate($perPage);
    }

    public function getConversationWithRelations(int $id): ?Conversation
    {
        return $this->model->newQuery()
            ->with([
                'merchant.user.profile.media',
                'customer.profile.media',
                'conversable',
                'latestMessage.sender.profile.media',
            ])
            ->find($id);
    }

    public function countUnreadForUser(int $userId): int
    {
        return Message::query()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $userId)
            ->whereHas('conversation', function ($query) use ($userId) {
                $query->where('customer_id', $userId)
                    ->orWhereHas('merchant', function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    });
            })
            ->count();
    }

    public function updateLastMessageAt(int $conversationId): void
    {
        $this->model->newQuery()
            ->where('id', $conversationId)
            ->update(['last_message_at' => now()]);
    }
}
