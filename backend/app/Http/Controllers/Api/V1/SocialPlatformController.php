<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\SocialPlatformData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SocialPlatform\StoreSocialPlatformRequest;
use App\Http\Requests\Api\V1\SocialPlatform\UpdateSocialPlatformRequest;
use App\Http\Resources\Api\V1\SocialPlatformResource;
use App\Services\Contracts\SocialPlatformServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SocialPlatformController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SocialPlatformServiceInterface $socialPlatformService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $socialPlatforms = $this->socialPlatformService->getAllSocialPlatforms([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($socialPlatforms, SocialPlatformResource::class);
    }

    public function all(): JsonResponse
    {
        $socialPlatforms = $this->socialPlatformService->getAllSocialPlatformsWithoutPagination();

        return $this->successResponse(
            SocialPlatformResource::collection($socialPlatforms),
            'Social platforms retrieved successfully'
        );
    }

    public function active(): JsonResponse
    {
        $socialPlatforms = $this->socialPlatformService->getActiveSocialPlatforms();

        return $this->successResponse(
            SocialPlatformResource::collection($socialPlatforms),
            'Active social platforms retrieved successfully'
        );
    }

    public function store(StoreSocialPlatformRequest $request): JsonResponse
    {
        $data = SocialPlatformData::from($request->validated());
        $socialPlatform = $this->socialPlatformService->createSocialPlatform($data);

        return $this->createdResponse(
            new SocialPlatformResource($socialPlatform),
            'Social platform created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $socialPlatform = $this->socialPlatformService->getSocialPlatformById($id);

        return $this->successResponse(
            new SocialPlatformResource($socialPlatform),
            'Social platform retrieved successfully'
        );
    }

    public function update(UpdateSocialPlatformRequest $request, int $id): JsonResponse
    {
        $data = SocialPlatformData::from($request->validated());
        $socialPlatform = $this->socialPlatformService->updateSocialPlatform($id, $data);

        return $this->successResponse(
            new SocialPlatformResource($socialPlatform),
            'Social platform updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->socialPlatformService->deleteSocialPlatform($id);

            return $this->successResponse(null, 'Social platform deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
