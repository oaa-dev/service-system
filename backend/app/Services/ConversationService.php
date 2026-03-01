<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use App\Services\Contracts\ConversationServiceInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ConversationService implements ConversationServiceInterface
{
    public function __construct(
        protected ConversationRepositoryInterface $conversationRepository
    ) {}

    public function getOrCreateConversation(int $merchantId, int $customerId, string $conversableType, int $conversableId): Conversation
    {
        $conversation = $this->conversationRepository->findByParticipants(
            $merchantId,
            $customerId,
            $conversableType,
            $conversableId
        );

        if ($conversation) {
            return $conversation;
        }

        return $this->conversationRepository->create([
            'merchant_id' => $merchantId,
            'customer_id' => $customerId,
            'conversable_type' => $conversableType,
            'conversable_id' => $conversableId,
            'last_message_at' => now(),
        ]);
    }

    public function getMessages(int $conversationId, int $perPage = 20): LengthAwarePaginator
    {
        return Message::where('conversation_id', $conversationId)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    public function sendMessage(int $conversationId, int $senderId, string $body): Message
    {
        $message = Message::create([
            'conversation_id' => $conversationId,
            'sender_id' => $senderId,
            'body' => $body,
        ]);

        $this->conversationRepository->updateLastMessageAt($conversationId);

        return $message->load('sender');
    }

    public function markAsRead(int $conversationId, int $userId): int
    {
        return Message::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function getMyConversations(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        // Check if user is a merchant owner — if so, get their merchant conversations
        $user = \App\Models\User::find($userId);
        $merchant = $user?->merchant;

        if ($merchant) {
            return $this->conversationRepository->getForMerchant($merchant->id, $perPage);
        }

        // Otherwise treat as customer
        return $this->conversationRepository->getForCustomer($userId, $perPage);
    }
}
