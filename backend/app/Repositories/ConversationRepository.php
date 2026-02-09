<?php

namespace App\Repositories;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ConversationRepository extends BaseRepository implements ConversationRepositoryInterface
{
    public function __construct(Conversation $model)
    {
        parent::__construct($model);
    }

    public function findByUsers(int $userOneId, int $userTwoId): ?Conversation
    {
        return Conversation::findBetweenUsers($userOneId, $userTwoId);
    }

    public function getForUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->newQuery()
            ->where(function ($query) use ($userId) {
                $query->where('user_one_id', $userId)
                    ->orWhere('user_two_id', $userId);
            })
            ->whereHas('participants', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->whereNull('deleted_at');
            })
            ->with([
                'userOne.profile.media',
                'userTwo.profile.media',
                'latestMessage.sender',
                'participants' => fn ($q) => $q->where('user_id', $userId),
            ])
            ->orderByDesc('last_message_at')
            ->paginate($perPage);
    }

    public function getParticipant(int $conversationId, int $userId): ?ConversationParticipant
    {
        return ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->first();
    }

    public function getTotalUnreadCount(int $userId): int
    {
        return ConversationParticipant::where('user_id', $userId)
            ->whereNull('deleted_at')
            ->sum('unread_count');
    }

    public function updateLastMessageAt(int $conversationId): void
    {
        $this->model->newQuery()
            ->where('id', $conversationId)
            ->update(['last_message_at' => now()]);
    }
}
