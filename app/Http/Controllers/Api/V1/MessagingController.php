<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ConversationData;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ConversationResource;
use App\Http\Resources\Api\V1\MessageResource;
use App\Http\Requests\Api\V1\Messaging\SendMessageRequest;
use App\Http\Requests\Api\V1\Messaging\StartConversationRequest;
use App\Services\Contracts\MessagingServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class MessagingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MessagingServiceInterface $messagingService
    ) {}

    #[OA\Get(
        path: '/conversations',
        summary: 'List conversations',
        description: 'Get a paginated list of conversations for the authenticated user',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'per_page', in: 'query', description: 'Items per page', schema: new OA\Schema(type: 'integer', default: 15)),
            new OA\Parameter(name: 'page', in: 'query', description: 'Page number', schema: new OA\Schema(type: 'integer', default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Conversations retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Success'),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Conversation')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function conversations(Request $request): JsonResponse
    {
        $conversations = $this->messagingService->getConversations(
            $request->user()->id,
            $request->query('per_page', 15)
        );

        return $this->paginatedResponse($conversations, ConversationResource::class);
    }

    #[OA\Post(
        path: '/conversations',
        summary: 'Start a conversation',
        description: 'Start a new conversation with another user or get existing one',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['recipient_id'],
                properties: [
                    new OA\Property(property: 'recipient_id', type: 'integer', description: 'User ID to start conversation with', example: 2),
                    new OA\Property(property: 'message', type: 'string', description: 'Optional initial message', example: 'Hello!'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Conversation started successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Conversation started successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/Conversation'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function startConversation(StartConversationRequest $request): JsonResponse
    {
        $data = ConversationData::from($request->validated());
        $conversation = $this->messagingService->startConversation(
            $request->user()->id,
            $data
        );

        return $this->createdResponse(
            new ConversationResource($conversation),
            'Conversation started successfully'
        );
    }

    #[OA\Get(
        path: '/conversations/{conversationId}',
        summary: 'Get conversation details',
        description: 'Get a specific conversation by ID',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'conversationId', in: 'path', required: true, description: 'Conversation ID', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Conversation retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Conversation retrieved successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/Conversation'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden - Not a participant'),
            new OA\Response(response: 404, description: 'Conversation not found'),
        ]
    )]
    public function showConversation(Request $request, int $conversationId): JsonResponse
    {
        $conversation = $this->messagingService->getConversation(
            $conversationId,
            $request->user()->id
        );

        return $this->successResponse(
            new ConversationResource($conversation),
            'Conversation retrieved successfully'
        );
    }

    #[OA\Delete(
        path: '/conversations/{conversationId}',
        summary: 'Delete a conversation',
        description: 'Soft delete a conversation for the authenticated user',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'conversationId', in: 'path', required: true, description: 'Conversation ID', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Conversation deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Conversation deleted successfully'),
                        new OA\Property(property: 'data', type: 'null'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Conversation not found'),
        ]
    )]
    public function deleteConversation(Request $request, int $conversationId): JsonResponse
    {
        $this->messagingService->deleteConversation(
            $conversationId,
            $request->user()->id
        );

        return $this->successResponse(null, 'Conversation deleted successfully');
    }

    #[OA\Get(
        path: '/conversations/{conversationId}/messages',
        summary: 'Get messages',
        description: 'Get paginated messages for a conversation',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'conversationId', in: 'path', required: true, description: 'Conversation ID', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'per_page', in: 'query', description: 'Items per page', schema: new OA\Schema(type: 'integer', default: 20)),
            new OA\Parameter(name: 'page', in: 'query', description: 'Page number', schema: new OA\Schema(type: 'integer', default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Messages retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Success'),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Message')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Conversation not found'),
        ]
    )]
    public function messages(Request $request, int $conversationId): JsonResponse
    {
        $messages = $this->messagingService->getMessages(
            $conversationId,
            $request->user()->id,
            $request->query('per_page', 20)
        );

        return $this->paginatedResponse($messages, MessageResource::class);
    }

    #[OA\Post(
        path: '/conversations/{conversationId}/messages',
        summary: 'Send a message',
        description: 'Send a new message in a conversation',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'conversationId', in: 'path', required: true, description: 'Conversation ID', schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['body'],
                properties: [
                    new OA\Property(property: 'body', type: 'string', description: 'Message content', example: 'Hello, how are you?'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Message sent successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Message sent successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/Message'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Conversation not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function sendMessage(SendMessageRequest $request, int $conversationId): JsonResponse
    {
        $message = $this->messagingService->sendMessage(
            $conversationId,
            $request->user()->id,
            $request->validated('body')
        );

        return $this->createdResponse(
            new MessageResource($message),
            'Message sent successfully'
        );
    }

    #[OA\Post(
        path: '/conversations/{conversationId}/read',
        summary: 'Mark conversation as read',
        description: 'Mark all messages in a conversation as read',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'conversationId', in: 'path', required: true, description: 'Conversation ID', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Conversation marked as read',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Conversation marked as read'),
                        new OA\Property(property: 'data', type: 'null'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Conversation not found'),
        ]
    )]
    public function markAsRead(Request $request, int $conversationId): JsonResponse
    {
        $this->messagingService->markAsRead(
            $conversationId,
            $request->user()->id
        );

        return $this->successResponse(null, 'Conversation marked as read');
    }

    #[OA\Get(
        path: '/messages/unread-count',
        summary: 'Get unread count',
        description: 'Get total unread messages count for the authenticated user',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Unread count retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Success'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'count', type: 'integer', example: 5),
                            ],
                            type: 'object'
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->messagingService->getTotalUnreadCount($request->user()->id);

        return $this->successResponse(['count' => $count]);
    }

    #[OA\Get(
        path: '/messages/search',
        summary: 'Search messages',
        description: 'Search through messages across all conversations',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'q', in: 'query', required: true, description: 'Search query (min 2 characters)', schema: new OA\Schema(type: 'string', minLength: 2)),
            new OA\Parameter(name: 'per_page', in: 'query', description: 'Items per page', schema: new OA\Schema(type: 'integer', default: 15)),
            new OA\Parameter(name: 'page', in: 'query', description: 'Page number', schema: new OA\Schema(type: 'integer', default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Messages found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Success'),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Message')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function searchMessages(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['required', 'string', 'min:2'],
        ]);

        $messages = $this->messagingService->searchMessages(
            $request->user()->id,
            $request->query('q'),
            $request->query('per_page', 15)
        );

        return $this->paginatedResponse($messages, MessageResource::class);
    }

    #[OA\Delete(
        path: '/messages/{messageId}',
        summary: 'Delete a message',
        description: 'Delete a message (only sender can delete their own messages)',
        tags: ['Messaging'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'messageId', in: 'path', required: true, description: 'Message ID', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Message deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Message deleted successfully'),
                        new OA\Property(property: 'data', type: 'null'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden - Can only delete own messages'),
            new OA\Response(response: 404, description: 'Message not found'),
        ]
    )]
    public function deleteMessage(Request $request, int $messageId): JsonResponse
    {
        $this->messagingService->deleteMessage(
            $messageId,
            $request->user()->id
        );

        return $this->successResponse(null, 'Message deleted successfully');
    }
}
