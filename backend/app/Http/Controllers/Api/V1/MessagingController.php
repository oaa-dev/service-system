<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Conversation\SendMessageRequest;
use App\Http\Resources\Api\V1\ConversationResource;
use App\Http\Resources\Api\V1\MessageResource;
use App\Services\Contracts\ConversationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessagingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ConversationServiceInterface $conversationService
    ) {}

    public function conversations(Request $request): JsonResponse
    {
        $conversations = $this->conversationService->getMyConversations(
            $request->user()->id,
            (int) $request->query('per_page', 15)
        );

        return $this->paginatedResponse($conversations, ConversationResource::class);
    }

    public function messages(Request $request, int $conversationId): JsonResponse
    {
        try {
            $this->conversationService->authorizeAccess($conversationId, $request->user()->id);
        } catch (AuthorizationException) {
            return $this->forbiddenResponse('You do not have access to this conversation.');
        }

        $messages = $this->conversationService->getMessages(
            $conversationId,
            (int) $request->query('per_page', 20)
        );

        return $this->paginatedResponse($messages, MessageResource::class);
    }

    public function sendMessage(SendMessageRequest $request, int $conversationId): JsonResponse
    {
        try {
            $this->conversationService->authorizeAccess($conversationId, $request->user()->id);
        } catch (AuthorizationException) {
            return $this->forbiddenResponse('You do not have access to this conversation.');
        }

        $message = $this->conversationService->sendMessage(
            $conversationId,
            $request->user()->id,
            $request->validated('body')
        );

        ChatMessageSent::dispatch($message);

        return $this->createdResponse(
            new MessageResource($message),
            'Message sent successfully'
        );
    }

    public function markAsRead(Request $request, int $conversationId): JsonResponse
    {
        try {
            $this->conversationService->authorizeAccess($conversationId, $request->user()->id);
        } catch (AuthorizationException) {
            return $this->forbiddenResponse('You do not have access to this conversation.');
        }

        $this->conversationService->markAsRead($conversationId, $request->user()->id);

        return $this->successResponse(null, 'Conversation marked as read');
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->conversationService->getTotalUnreadCount($request->user()->id);

        return $this->successResponse(['count' => $count]);
    }
}
