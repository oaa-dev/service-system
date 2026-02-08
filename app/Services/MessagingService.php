<?php

namespace App\Services;

use App\Data\ConversationData;
use App\Events\ConversationUpdated;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use App\Repositories\Contracts\MessageRepositoryInterface;
use App\Services\Contracts\MessagingServiceInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelData\Optional;

class MessagingService implements MessagingServiceInterface
{
    public function __construct(
        protected ConversationRepositoryInterface $conversationRepository,
        protected MessageRepositoryInterface $messageRepository
    ) {}

    public function getConversations(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->conversationRepository->getForUser($userId, $perPage);
    }

    public function getConversation(int $conversationId, int $userId): Conversation
    {
        $conversation = $this->conversationRepository->findOrFail($conversationId);

        $this->authorizeConversationAccess($conversation, $userId);

        $conversation->load([
            'userOne.profile.media',
            'userTwo.profile.media',
            'participants' => fn ($q) => $q->where('user_id', $userId),
        ]);

        return $conversation;
    }

    public function startConversation(int $userId, ConversationData $data): Conversation
    {
        if ($userId === $data->recipient_id) {
            throw new \InvalidArgumentException('Cannot start a conversation with yourself');
        }

        return DB::transaction(function () use ($userId, $data) {
            // Check if conversation already exists
            $conversation = $this->conversationRepository->findByUsers($userId, $data->recipient_id);

            if ($conversation) {
                // Restore participant if soft deleted
                $participant = $this->conversationRepository->getParticipant($conversation->id, $userId);
                if ($participant && $participant->trashed()) {
                    $participant->restore();
                }
            } else {
                // Create new conversation
                $conversation = $this->conversationRepository->create([
                    'user_one_id' => $userId,
                    'user_two_id' => $data->recipient_id,
                ]);
            }

            // Send initial message if provided
            if (! $data->message instanceof Optional) {
                $this->sendMessageInternal($conversation->id, $userId, $data->message);
            }

            $conversation->load([
                'userOne.profile.media',
                'userTwo.profile.media',
                'latestMessage.sender',
                'participants' => fn ($q) => $q->where('user_id', $userId),
            ]);

            return $conversation;
        });
    }

    public function deleteConversation(int $conversationId, int $userId): bool
    {
        $conversation = $this->conversationRepository->findOrFail($conversationId);

        $this->authorizeConversationAccess($conversation, $userId);

        // Soft delete only the participant record (user's view of the conversation)
        $participant = $this->conversationRepository->getParticipant($conversationId, $userId);

        if ($participant) {
            return $participant->delete();
        }

        return false;
    }

    public function getMessages(int $conversationId, int $userId, int $perPage = 20): LengthAwarePaginator
    {
        $conversation = $this->conversationRepository->findOrFail($conversationId);

        $this->authorizeConversationAccess($conversation, $userId);

        return $this->messageRepository->getForConversation($conversationId, $perPage);
    }

    public function sendMessage(int $conversationId, int $senderId, string $body): Message
    {
        return $this->sendMessageInternal($conversationId, $senderId, $body);
    }

    protected function sendMessageInternal(int $conversationId, int $senderId, string $body): Message
    {
        $conversation = $this->conversationRepository->findOrFail($conversationId);

        $this->authorizeConversationAccess($conversation, $senderId);

        return DB::transaction(function () use ($conversation, $conversationId, $senderId, $body) {
            // Create the message
            $message = $this->messageRepository->create([
                'conversation_id' => $conversationId,
                'sender_id' => $senderId,
                'body' => $body,
            ]);

            // Update conversation's last_message_at
            $this->conversationRepository->updateLastMessageAt($conversationId);

            // Increment unread count for the recipient
            $recipientId = $conversation->getOtherUserId($senderId);
            $recipientParticipant = $this->conversationRepository->getParticipant($conversationId, $recipientId);

            if ($recipientParticipant) {
                $recipientParticipant->incrementUnread();
            }

            // Load relationships for broadcasting
            $message->load(['sender.profile.media', 'conversation']);

            // Broadcast the message to the recipient
            broadcast(new MessageSent($message, $recipientId))->toOthers();

            // Broadcast conversation update to both users
            broadcast(new ConversationUpdated($conversation->fresh(['latestMessage']), $senderId));
            broadcast(new ConversationUpdated($conversation->fresh(['latestMessage']), $recipientId));

            return $message;
        });
    }

    public function markAsRead(int $conversationId, int $userId): void
    {
        $conversation = $this->conversationRepository->findOrFail($conversationId);

        $this->authorizeConversationAccess($conversation, $userId);

        DB::transaction(function () use ($conversationId, $userId) {
            // Mark all messages from the other user as read
            $this->messageRepository->markConversationAsRead($conversationId, $userId);

            // Reset unread count for this user's participant record
            $participant = $this->conversationRepository->getParticipant($conversationId, $userId);

            if ($participant) {
                $participant->markAsRead();
            }
        });
    }

    public function deleteMessage(int $messageId, int $userId): bool
    {
        $message = $this->messageRepository->findOrFail($messageId);

        // Only the sender can delete their message
        if ($message->sender_id !== $userId) {
            throw new AuthorizationException('You can only delete your own messages');
        }

        return $this->messageRepository->delete($messageId);
    }

    public function getTotalUnreadCount(int $userId): int
    {
        return $this->conversationRepository->getTotalUnreadCount($userId);
    }

    public function searchMessages(int $userId, string $query, int $perPage = 15): LengthAwarePaginator
    {
        return $this->messageRepository->searchMessages($userId, $query, $perPage);
    }

    protected function authorizeConversationAccess(Conversation $conversation, int $userId): void
    {
        if (! $conversation->hasUser($userId)) {
            throw new AuthorizationException('You are not a participant of this conversation');
        }

        // Check if user's participant record is soft deleted
        $participant = $this->conversationRepository->getParticipant($conversation->id, $userId);

        if ($participant && $participant->trashed()) {
            throw new ModelNotFoundException('Conversation not found');
        }
    }
}
