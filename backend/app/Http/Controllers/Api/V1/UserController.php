<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\UserData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\User\StoreUserRequest;
use App\Http\Requests\Api\V1\User\SyncRolesRequest;
use App\Http\Requests\Api\V1\User\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Services\Contracts\UserServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected UserServiceInterface $userService
    ) {}

    #[OA\Get(
        path: '/users',
        summary: 'List all users',
        description: 'Get a paginated list of users with optional filtering and sorting',
        tags: ['Users'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'filter[search]', in: 'query', description: 'Global search across name and email', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'filter[name]', in: 'query', description: 'Filter by name (partial match)', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'filter[email]', in: 'query', description: 'Filter by email (partial match)', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'filter[status]', in: 'query', description: 'Filter by verification status', schema: new OA\Schema(type: 'string', enum: ['verified', 'unverified'])),
            new OA\Parameter(name: 'filter[created_from]', in: 'query', description: 'Filter by created date from', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'filter[created_to]', in: 'query', description: 'Filter by created date to', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'sort', in: 'query', description: 'Sort field (prefix with - for descending)', schema: new OA\Schema(type: 'string', enum: ['id', 'name', 'email', 'created_at', '-id', '-name', '-email', '-created_at'])),
            new OA\Parameter(name: 'per_page', in: 'query', description: 'Items per page', schema: new OA\Schema(type: 'integer', default: 15)),
            new OA\Parameter(name: 'page', in: 'query', description: 'Page number', schema: new OA\Schema(type: 'integer', default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Users retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Success'),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/User')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                        new OA\Property(
                            property: 'links',
                            properties: [
                                new OA\Property(property: 'first', type: 'string', format: 'uri'),
                                new OA\Property(property: 'last', type: 'string', format: 'uri'),
                                new OA\Property(property: 'prev', type: 'string', format: 'uri', nullable: true),
                                new OA\Property(property: 'next', type: 'string', format: 'uri', nullable: true),
                            ],
                            type: 'object'
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $users = $this->userService->getAllUsers([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($users, UserResource::class);
    }

    #[OA\Post(
        path: '/users',
        summary: 'Create a new user',
        description: 'Create a new user account',
        tags: ['Users'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'test@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 8, example: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'User created successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'User created successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $firstName = $validated['first_name'];
        $lastName = $validated['last_name'];
        unset($validated['first_name'], $validated['last_name']);

        $validated['name'] = trim("{$firstName} {$lastName}");
        $data = UserData::from($validated);
        $user = $this->userService->createUser($data);

        // Save first/last name to profile
        $user->profile()->update([
            'first_name' => $firstName,
            'last_name' => $lastName,
        ]);

        $user->load(['profile.media', 'roles']);

        return $this->createdResponse(
            new UserResource($user),
            'User created successfully'
        );
    }

    #[OA\Get(
        path: '/users/{id}',
        summary: 'Get a user',
        description: 'Get a specific user by ID',
        tags: ['Users'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'User ID', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'User retrieved successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'User not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getUserById($id);

        return $this->successResponse(
            new UserResource($user),
            'User retrieved successfully'
        );
    }

    #[OA\Put(
        path: '/users/{id}',
        summary: 'Update a user',
        description: 'Update an existing user',
        tags: ['Users'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'User ID', schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'test@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 8),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'User updated successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'User updated successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'User not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $validated = $request->validated();
        $firstName = $validated['first_name'] ?? null;
        $lastName = $validated['last_name'] ?? null;
        unset($validated['first_name'], $validated['last_name']);

        if ($firstName !== null || $lastName !== null) {
            $user = $this->userService->getUserById($id);
            $currentFirst = $user->profile?->first_name ?? '';
            $currentLast = $user->profile?->last_name ?? '';
            $newFirst = $firstName ?? $currentFirst;
            $newLast = $lastName ?? $currentLast;
            $validated['name'] = trim("{$newFirst} {$newLast}");

            $profileData = [];
            if ($firstName !== null) $profileData['first_name'] = $firstName;
            if ($lastName !== null) $profileData['last_name'] = $lastName;
            $user->profile()->update($profileData);
        }

        $data = UserData::from($validated);
        $user = $this->userService->updateUser($id, $data);

        return $this->successResponse(
            new UserResource($user),
            'User updated successfully'
        );
    }

    #[OA\Delete(
        path: '/users/{id}',
        summary: 'Delete a user',
        description: 'Delete a user by ID',
        tags: ['Users'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'User ID', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'User deleted successfully'),
                        new OA\Property(property: 'data', type: 'null'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'User not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function destroy(int $id): JsonResponse
    {
        $this->userService->deleteUser($id);

        return $this->successResponse(null, 'User deleted successfully');
    }

    #[OA\Post(
        path: '/users/{id}/roles',
        summary: 'Sync user roles',
        description: 'Sync roles for a user',
        tags: ['Users'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'User ID', schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['roles'],
                properties: [
                    new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'string'), example: ['admin', 'user']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Roles synced successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function syncRoles(SyncRolesRequest $request, int $id): JsonResponse
    {
        $user = $this->userService->syncRoles($id, $request->validated('roles'));

        return $this->successResponse(
            new UserResource($user),
            'Roles synced successfully'
        );
    }
}
