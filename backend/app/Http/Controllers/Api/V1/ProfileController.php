<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\CustomerData;
use App\Data\ProfileData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profile\UpdateCustomerPreferencesRequest;
use App\Http\Requests\Api\V1\Profile\UpdateProfileRequest;
use App\Http\Requests\Api\V1\Profile\UploadAvatarRequest;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Http\Resources\Api\V1\ProfileResource;
use App\Services\Contracts\ProfileServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class ProfileController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ProfileServiceInterface $profileService
    ) {}

    #[OA\Get(
        path: '/profile',
        summary: 'Get current user profile',
        description: 'Get the profile of the currently authenticated user',
        tags: ['Profile'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Profile retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Profile retrieved successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/UserProfile'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function show(): JsonResponse
    {
        $profile = $this->profileService->getProfileByUserId(auth()->id());

        return $this->successResponse(
            new ProfileResource($profile),
            'Profile retrieved successfully'
        );
    }

    #[OA\Put(
        path: '/profile',
        summary: 'Update current user profile',
        description: 'Update the profile of the currently authenticated user',
        tags: ['Profile'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'bio', type: 'string', maxLength: 1000, nullable: true, example: 'Software developer'),
                    new OA\Property(property: 'phone', type: 'string', maxLength: 20, nullable: true, example: '+1234567890'),
                    new OA\Property(property: 'date_of_birth', type: 'string', format: 'date', nullable: true, example: '1990-01-15'),
                    new OA\Property(property: 'gender', type: 'string', enum: ['male', 'female', 'other'], nullable: true, example: 'male'),
                    new OA\Property(property: 'address', ref: '#/components/schemas/AddressInput', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Profile updated successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Profile updated successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/UserProfile'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $data = ProfileData::from($request->validated());
        $profile = $this->profileService->updateProfile(auth()->id(), $data);

        return $this->successResponse(
            new ProfileResource($profile),
            'Profile updated successfully'
        );
    }

    #[OA\Post(
        path: '/profile/avatar',
        summary: 'Upload profile avatar',
        description: 'Upload or replace the avatar image for the current user profile',
        tags: ['Profile'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['avatar'],
                    properties: [
                        new OA\Property(
                            property: 'avatar',
                            type: 'string',
                            format: 'binary',
                            description: 'Avatar image file (JPEG, PNG, WebP, max 5MB, 100x100 to 4000x4000 pixels)'
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Avatar uploaded successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Avatar uploaded successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/UserProfile'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $profile = $this->profileService->uploadAvatar(auth()->id(), $request->file('avatar'));

        return $this->successResponse(
            new ProfileResource($profile),
            'Avatar uploaded successfully'
        );
    }

    #[OA\Delete(
        path: '/profile/avatar',
        summary: 'Delete profile avatar',
        description: 'Remove the avatar image from the current user profile',
        tags: ['Profile'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Avatar deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Avatar deleted successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/UserProfile'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function deleteAvatar(): JsonResponse
    {
        $profile = $this->profileService->deleteAvatar(auth()->id());

        return $this->successResponse(
            new ProfileResource($profile),
            'Avatar deleted successfully'
        );
    }

    public function showCustomer(): JsonResponse
    {
        $customer = $this->profileService->getCustomerByUserId(auth()->id());

        return $this->successResponse(
            new CustomerResource($customer),
            'Customer profile retrieved successfully'
        );
    }

    public function updateCustomer(UpdateCustomerPreferencesRequest $request): JsonResponse
    {
        $data = CustomerData::from($request->validated());
        $customer = $this->profileService->updateCustomerPreferences(auth()->id(), $data);

        return $this->successResponse(
            new CustomerResource($customer),
            'Customer preferences updated successfully'
        );
    }
}
