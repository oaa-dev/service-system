<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\RoleData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Role\StoreRoleRequest;
use App\Http\Requests\Api\V1\Role\SyncPermissionsRequest;
use App\Http\Requests\Api\V1\Role\UpdateRoleRequest;
use App\Http\Resources\Api\V1\RoleResource;
use App\Services\Contracts\RoleServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class RoleController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected RoleServiceInterface $roleService
    ) {}

    #[OA\Get(
        path: '/roles',
        summary: 'List all roles',
        description: 'Get a paginated list of roles with their permissions',
        tags: ['Roles'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'filter[search]', in: 'query', description: 'Search by role name', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'filter[name]', in: 'query', description: 'Filter by name (partial match)', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort', in: 'query', description: 'Sort field', schema: new OA\Schema(type: 'string', enum: ['id', 'name', 'created_at', '-id', '-name', '-created_at'])),
            new OA\Parameter(name: 'per_page', in: 'query', description: 'Items per page', schema: new OA\Schema(type: 'integer', default: 15)),
            new OA\Parameter(name: 'page', in: 'query', description: 'Page number', schema: new OA\Schema(type: 'integer', default: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Roles retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $roles = $this->roleService->getAllRoles([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($roles, RoleResource::class);
    }

    #[OA\Get(
        path: '/roles/all',
        summary: 'List all roles without pagination',
        description: 'Get all roles without pagination for dropdowns',
        tags: ['Roles'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Roles retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function all(): JsonResponse
    {
        $roles = $this->roleService->getAllRolesWithoutPagination();

        return $this->successResponse(
            RoleResource::collection($roles),
            'Roles retrieved successfully'
        );
    }

    #[OA\Post(
        path: '/roles',
        summary: 'Create a new role',
        description: 'Create a new role with optional permissions',
        tags: ['Roles'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'editor'),
                    new OA\Property(property: 'permissions', type: 'array', items: new OA\Items(type: 'string'), example: ['users.view', 'users.create']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Role created successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(StoreRoleRequest $request): JsonResponse
    {
        $data = RoleData::from($request->validated());
        $role = $this->roleService->createRole($data);

        return $this->createdResponse(
            new RoleResource($role),
            'Role created successfully'
        );
    }

    #[OA\Get(
        path: '/roles/{id}',
        summary: 'Get a role',
        description: 'Get a specific role by ID',
        tags: ['Roles'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Role ID', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Role retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Role not found'),
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $role = $this->roleService->getRoleById($id);

        return $this->successResponse(
            new RoleResource($role),
            'Role retrieved successfully'
        );
    }

    #[OA\Put(
        path: '/roles/{id}',
        summary: 'Update a role',
        description: 'Update an existing role',
        tags: ['Roles'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Role ID', schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'editor'),
                    new OA\Property(property: 'permissions', type: 'array', items: new OA\Items(type: 'string'), example: ['users.view', 'users.create']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Role updated successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Role not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(UpdateRoleRequest $request, int $id): JsonResponse
    {
        $data = RoleData::from($request->validated());
        $role = $this->roleService->updateRole($id, $data);

        return $this->successResponse(
            new RoleResource($role),
            'Role updated successfully'
        );
    }

    #[OA\Delete(
        path: '/roles/{id}',
        summary: 'Delete a role',
        description: 'Delete a role by ID',
        tags: ['Roles'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Role ID', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Role deleted successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Role not found'),
        ]
    )]
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->roleService->deleteRole($id);

            return $this->successResponse(null, 'Role deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    #[OA\Post(
        path: '/roles/{id}/permissions',
        summary: 'Sync role permissions',
        description: 'Sync permissions for a role',
        tags: ['Roles'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Role ID', schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['permissions'],
                properties: [
                    new OA\Property(property: 'permissions', type: 'array', items: new OA\Items(type: 'string'), example: ['users.view', 'users.create']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Permissions synced successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Role not found'),
        ]
    )]
    public function syncPermissions(SyncPermissionsRequest $request, int $id): JsonResponse
    {
        try {
            $role = $this->roleService->syncPermissions($id, $request->validated('permissions'));

            return $this->successResponse(
                new RoleResource($role),
                'Permissions synced successfully'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
