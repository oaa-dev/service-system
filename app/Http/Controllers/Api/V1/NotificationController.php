<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NotificationResource;
use App\Services\Contracts\NotificationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class NotificationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected NotificationServiceInterface $notificationService
    ) {}

    #[OA\Get(
        path: '/notifications',
        summary: 'List all notifications',
        description: 'Get a paginated list of notifications for the authenticated user',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'per_page', in: 'query', description: 'Items per page', schema: new OA\Schema(type: 'integer', default: 15)),
            new OA\Parameter(name: 'page', in: 'query', description: 'Page number', schema: new OA\Schema(type: 'integer', default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notifications retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Success'),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Notification')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->getAllNotifications(
            $request->user()->id,
            ['per_page' => $request->query('per_page', 15)]
        );

        return $this->paginatedResponse($notifications, NotificationResource::class);
    }

    #[OA\Get(
        path: '/notifications/unread-count',
        summary: 'Get unread notifications count',
        description: 'Get the count of unread notifications for the authenticated user',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Unread count retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Success'),
                        new OA\Property(property: 'data', properties: [
                            new OA\Property(property: 'count', type: 'integer', example: 5),
                        ], type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->notificationService->getUnreadCount($request->user()->id);

        return $this->successResponse(['count' => $count]);
    }

    #[OA\Post(
        path: '/notifications/{id}/read',
        summary: 'Mark notification as read',
        description: 'Mark a specific notification as read',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Notification ID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notification marked as read',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Notification marked as read'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/Notification'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Notification not found'),
        ]
    )]
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $this->notificationService->markAsRead($request->user()->id, $id);

        return $this->successResponse(
            new NotificationResource($notification),
            'Notification marked as read'
        );
    }

    #[OA\Post(
        path: '/notifications/read-all',
        summary: 'Mark all notifications as read',
        description: 'Mark all notifications as read for the authenticated user',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'All notifications marked as read',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'All notifications marked as read'),
                        new OA\Property(property: 'data', properties: [
                            new OA\Property(property: 'count', type: 'integer', example: 5),
                        ], type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function markAllAsRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllAsRead($request->user()->id);

        return $this->successResponse(
            ['count' => $count],
            'All notifications marked as read'
        );
    }

    #[OA\Delete(
        path: '/notifications/{id}',
        summary: 'Delete a notification',
        description: 'Delete a specific notification',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Notification ID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notification deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Notification deleted successfully'),
                        new OA\Property(property: 'data', type: 'null'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Notification not found'),
        ]
    )]
    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->notificationService->delete($request->user()->id, $id);

        return $this->successResponse(null, 'Notification deleted successfully');
    }
}
