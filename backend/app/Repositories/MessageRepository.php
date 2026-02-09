<?php

namespace App\Repositories;

use App\Models\Message;
use App\Repositories\Contracts\MessageRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class MessageRepository extends BaseRepository implements MessageRepositoryInterface
{
    public function __construct(Message $model)
    {
        parent::__construct($model);
    }

    public function getForConversation(int $conversationId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->newQuery()
            ->where('conversation_id', $conversationId)
            ->with(['sender.profile.media'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function markConversationAsRead(int $conversationId, int $userId): int
    {
        return $this->model->newQuery()
            ->where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function searchMessages(int $userId, string $query, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->newQuery()
            ->whereHas('conversation', function ($q) use ($userId) {
                $q->where('user_one_id', $userId)
                    ->orWhere('user_two_id', $userId);
            })
            ->whereHas('conversation.participants', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->whereNull('deleted_at');
            })
            ->where('body', 'like', "%{$query}%")
            ->with(['sender.profile.media', 'conversation'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function getUnreadMessagesCount(int $conversationId, int $userId): int
    {
        return $this->model->newQuery()
            ->where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->count();
    }
}
