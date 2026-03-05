<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Events\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Conversation\SendMessageRequest;
use App\Http\Resources\Api\V1\ConversationResource;
use App\Http\Resources\Api\V1\MessageResource;
use App\Models\Booking;
use App\Models\Merchant;
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
        'inquiries' => 'inquiry',
    ];

    /**
     * Map morph alias strings to model classes.
     */
    private const MODEL_MAP = [
        'booking' => Booking::class,
        'reservation' => Reservation::class,
        'service_order' => ServiceOrder::class,
        'inquiry' => Merchant::class,
    ];

    public function __construct(
        protected ConversationServiceInterface $conversationService
    ) {}

    /**
     * Fetch (or create) the conversation for the given context and return paginated messages.
     */
    public function messages(string $type, string $id): JsonResponse
    {
        $customerId = auth()->id();
        $conversable = $this->resolveConversable($type, $id, $customerId);
        $conversableType = self::TYPE_MAP[$type];

        [$merchantId, $conversableId] = $this->resolveConversationIds($conversableType, $conversable, $id);

        $conversation = $this->conversationService->getOrCreateConversation(
            $merchantId,
            $customerId,
            $conversableType,
            $conversableId
        );

        $messages = $this->conversationService->getMessages($conversation->id, 20);

        return $this->successResponse([
            'conversation' => new ConversationResource($conversation),
            'messages' => [
                'data' => MessageResource::collection($messages->items()),
                'meta' => [
                    'current_page' => $messages->currentPage(),
                    'last_page'    => $messages->lastPage(),
                    'per_page'     => $messages->perPage(),
                    'total'        => $messages->total(),
                    'from'         => $messages->firstItem(),
                    'to'           => $messages->lastItem(),
                ],
                'links' => [
                    'first' => $messages->url(1),
                    'last'  => $messages->url($messages->lastPage()),
                    'prev'  => $messages->previousPageUrl(),
                    'next'  => $messages->nextPageUrl(),
                ],
            ],
        ]);
    }

    /**
     * Send a message in the conversation for the given context.
     */
    public function send(SendMessageRequest $request, string $type, string $id): JsonResponse
    {
        $customerId = auth()->id();
        $conversable = $this->resolveConversable($type, $id, $customerId);
        $conversableType = self::TYPE_MAP[$type];

        [$merchantId, $conversableId] = $this->resolveConversationIds($conversableType, $conversable, $id);

        $conversation = $this->conversationService->getOrCreateConversation(
            $merchantId,
            $customerId,
            $conversableType,
            $conversableId
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
    public function markRead(string $type, string $id): JsonResponse
    {
        $customerId = auth()->id();
        $conversable = $this->resolveConversable($type, $id, $customerId);
        $conversableType = self::TYPE_MAP[$type];

        [$merchantId, $conversableId] = $this->resolveConversationIds($conversableType, $conversable, $id);

        $conversation = $this->conversationService->getOrCreateConversation(
            $merchantId,
            $customerId,
            $conversableType,
            $conversableId
        );

        $this->conversationService->markAsRead($conversation->id, auth()->id());

        return $this->noContentResponse();
    }

    /**
     * Resolve the conversable model from the URL type segment and verify customer ownership.
     * For inquiry type, looks up the merchant by slug with no ownership check.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\NotFoundHttpException
     */
    private function resolveConversable(string $type, string $id, int $customerId): Model
    {
        if (! isset(self::TYPE_MAP[$type])) {
            abort(404, 'Invalid conversation type.');
        }

        $morphAlias = self::TYPE_MAP[$type];

        // Inquiry: find an active merchant by slug; no customer ownership check needed
        if ($morphAlias === 'inquiry') {
            $merchant = Merchant::where('slug', $id)
                ->whereIn('status', ['active', 'approved'])
                ->first();

            if (! $merchant) {
                abort(404, 'Merchant not found.');
            }

            return $merchant;
        }

        $modelClass = self::MODEL_MAP[$morphAlias];

        $conversable = $modelClass::where('customer_id', $customerId)->find((int) $id);

        if (! $conversable) {
            abort(404, 'Resource not found.');
        }

        return $conversable;
    }

    /**
     * Resolve merchant_id and conversable_id for getOrCreateConversation.
     * For inquiry, both are the merchant's own id.
     * For all other types, merchant_id comes from the conversable's merchant_id attribute.
     *
     * @return array{int, int}
     */
    private function resolveConversationIds(string $conversableType, Model $conversable, string $id): array
    {
        if ($conversableType === 'inquiry') {
            return [$conversable->id, $conversable->id];
        }

        return [$conversable->merchant_id, (int) $id];
    }
}
