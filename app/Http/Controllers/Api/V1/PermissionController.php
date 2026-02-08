<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PermissionResource;
use App\Services\Contracts\RoleServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class PermissionController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected RoleServiceInterface $roleService
    ) {}

    #[OA\Get(
        path: '/permissions',
        summary: 'List all permissions',
        description: 'Get all available permissions',
        tags: ['Permissions'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Permissions retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function index(): JsonResponse
    {
        $permissions = $this->roleService->getAllPermissions();

        return $this->successResponse(
            PermissionResource::collection($permissions),
            'Permissions retrieved successfully'
        );
    }

    #[OA\Get(
        path: '/permissions/grouped',
        summary: 'List permissions grouped by module',
        description: 'Get all permissions grouped by their module',
        tags: ['Permissions'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Permissions retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function grouped(): JsonResponse
    {
        $grouped = $this->roleService->getPermissionsGroupedByModule();

        return $this->successResponse($grouped, 'Permissions retrieved successfully');
    }
}
