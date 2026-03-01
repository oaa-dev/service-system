<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Events\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Conversation\SendMessageRequest;
use App\Http\Resources\Api\V1\MessageResource;
use App\Models\Booking;
use App\Models\Reservation;
use App\Models\ServiceOrder;
use App\Services\Contracts\ConversationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;

class ConversationController extends Controller
{
    use ApiResponse;

    /**
     * Map URL type segments to morph alias strings.
     */
    private const TYPE_MAP = [
        'bookings' => 'booking',
        'reservations' => 'reservation',
        'orders' => 'service_order',
    ];

    /**
     * Map morph alias strings to model classes.
     */
    private const MODEL_MAP = [
        'booking' => Booking::class,
        'reservation' => Reservation::class,
        'service_order' => ServiceOrder::class,
    ];

    public function __construct(
        protected ConversationServiceInterface $conversationService
    ) {}

    /**
     * Fetch (or create) the conversation for the given context and return paginated messages.
     */
    public function messages(string $type, int $id): JsonResponse
    {
        $customerId = auth()->id();
        $conversable = $this->resolveConversable($type, $id, $customerId);
        $conversableType = self::TYPE_MAP[$type];

        $conversation = $this->conversationService->getOrCreateConversation(
            $conversable->merchant_id,
            $customerId,
            $conversableType,
            $id
        );

        $messages = $this->conversationService->getMessages($conversation->id, 20);

        return $this->paginatedResponse($messages, MessageResource::class);
    }

    /**
     * Send a message in the conversation for the given context.
     */
    public function send(SendMessageRequest $request, string $type, int $id): JsonResponse
    {
        $customerId = auth()->id();
        $conversable = $this->resolveConversable($type, $id, $customerId);
        $conversableType = self::TYPE_MAP[$type];

        $conversation = $this->conversationService->getOrCreateConversation(
            $conversable->merchant_id,
            $customerId,
            $conversableType,
            $id
        );

        $message = $this->conversationService->sendMessage(
            $conversation->id,
            auth()->id(),
            $request->body
        );

        ChatMessageSent::dispatch($message);

        return $this->createdResponse(new MessageResource($message), 'Message sent successfully');
    }

    /**
     * Mark all messages in the conversation as read for the current user.
     */
    public function markRead(string $type, int $id): JsonResponse
    {
        $customerId = auth()->id();
        $conversable = $this->resolveConversable($type, $id, $customerId);
        $conversableType = self::TYPE_MAP[$type];

        $conversation = $this->conversationService->getOrCreateConversation(
            $conversable->merchant_id,
            $customerId,
            $conversableType,
            $id
        );

        $this->conversationService->markAsRead($conversation->id, auth()->id());

        return $this->noContentResponse();
    }

    /**
     * Resolve the conversable model from the URL type segment and verify customer ownership.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\NotFoundHttpException
     */
    private function resolveConversable(string $type, int $id, int $customerId): Model
    {
        if (! isset(self::TYPE_MAP[$type])) {
            abort(404, 'Invalid conversation type.');
        }

        $morphAlias = self::TYPE_MAP[$type];
        $modelClass = self::MODEL_MAP[$morphAlias];

        $conversable = $modelClass::where('customer_id', $customerId)->find($id);

        if (! $conversable) {
            abort(404, 'Resource not found.');
        }

        return $conversable;
    }
}
