<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Data\AdvertisementData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Advertisement\StoreAdvertisementRequest;
use App\Http\Requests\Api\V1\Advertisement\UpdateAdvertisementRequest;
use App\Http\Resources\Api\V1\AdvertisementResource;
use App\Rules\ImageRule;
use App\Services\Contracts\AdvertisementServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdvertisementController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AdvertisementServiceInterface $advertisementService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $advertisements = $this->advertisementService->getAdvertisements($request);

        return $this->paginatedResponse($advertisements, AdvertisementResource::class);
    }

    public function store(StoreAdvertisementRequest $request): JsonResponse
    {
        $data = AdvertisementData::from($request->validated());
        $advertisement = $this->advertisementService->createAdvertisement($data, $request->user()->id);

        if ($request->hasFile('image')) {
            $advertisement = $this->advertisementService->uploadImage($advertisement->id, $request->file('image'));
        }

        return $this->createdResponse(
            new AdvertisementResource($advertisement->load(['merchant', 'creator'])),
            'Advertisement created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $advertisement = $this->advertisementService->getAdvertisementById($id);

        return $this->successResponse(
            new AdvertisementResource($advertisement),
            'Advertisement retrieved successfully'
        );
    }

    public function update(UpdateAdvertisementRequest $request, int $id): JsonResponse
    {
        $data = AdvertisementData::from($request->validated());
        $advertisement = $this->advertisementService->updateAdvertisement($id, $data);

        return $this->successResponse(
            new AdvertisementResource($advertisement->load(['merchant', 'creator'])),
            'Advertisement updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->advertisementService->deleteAdvertisement($id);

            return $this->successResponse(null, 'Advertisement deleted successfully');
        } catch (ModelNotFoundException $e) {
            return $this->errorResponse('Advertisement not found', 422);
        }
    }

    public function uploadImage(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'image' => ['required', ImageRule::adImage()],
        ]);

        $advertisement = $this->advertisementService->uploadImage($id, $request->file('image'));

        return $this->successResponse(
            new AdvertisementResource($advertisement),
            'Advertisement image uploaded successfully'
        );
    }

    public function deleteImage(int $id): JsonResponse
    {
        $advertisement = $this->advertisementService->deleteImage($id);

        return $this->successResponse(
            new AdvertisementResource($advertisement),
            'Advertisement image deleted successfully'
        );
    }

    public function trackImpression(int $id): JsonResponse
    {
        $this->advertisementService->trackImpression($id);

        return $this->noContentResponse();
    }

    public function trackClick(int $id): JsonResponse
    {
        $this->advertisementService->trackClick($id);

        return $this->noContentResponse();
    }
}
