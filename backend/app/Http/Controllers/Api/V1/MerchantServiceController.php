<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ServiceData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Service\StoreMerchantServiceRequest;
use App\Http\Requests\Api\V1\Service\UpdateMerchantServiceRequest;
use App\Http\Requests\Api\V1\Service\UpdateServiceScheduleRequest;
use App\Http\Requests\Api\V1\Service\UploadServiceImageRequest;
use App\Http\Resources\Api\V1\ServiceResource;
use App\Http\Resources\Api\V1\ServiceScheduleResource;
use App\Services\Contracts\MerchantServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MerchantServiceController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MerchantServiceInterface $merchantService
    ) {}

    public function index(Request $request, int $merchantId): JsonResponse
    {
        $services = $this->merchantService->getMerchantServices($merchantId, [
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($services, ServiceResource::class);
    }

    public function store(StoreMerchantServiceRequest $request, int $merchantId): JsonResponse
    {
        $data = ServiceData::from($request->validated());
        $service = $this->merchantService->createMerchantService($merchantId, $data);

        return $this->createdResponse(
            new ServiceResource($service),
            'Service created successfully'
        );
    }

    public function show(int $merchantId, int $serviceId): JsonResponse
    {
        $service = $this->merchantService->getMerchantServiceById($merchantId, $serviceId);

        return $this->successResponse(
            new ServiceResource($service),
            'Service retrieved successfully'
        );
    }

    public function update(UpdateMerchantServiceRequest $request, int $merchantId, int $serviceId): JsonResponse
    {
        $data = ServiceData::from($request->validated());
        $service = $this->merchantService->updateMerchantService($merchantId, $serviceId, $data);

        return $this->successResponse(
            new ServiceResource($service),
            'Service updated successfully'
        );
    }

    public function destroy(int $merchantId, int $serviceId): JsonResponse
    {
        try {
            $this->merchantService->deleteMerchantService($merchantId, $serviceId);

            return $this->successResponse(null, 'Service deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function uploadImage(UploadServiceImageRequest $request, int $merchantId, int $serviceId): JsonResponse
    {
        $service = $this->merchantService->getMerchantServiceById($merchantId, $serviceId);

        $service->addMediaFromRequest('image')
            ->toMediaCollection('image');

        return $this->successResponse(
            new ServiceResource($service->refresh()->load(['serviceCategory', 'media'])),
            'Service image uploaded successfully'
        );
    }

    public function deleteImage(int $merchantId, int $serviceId): JsonResponse
    {
        $service = $this->merchantService->getMerchantServiceById($merchantId, $serviceId);

        $service->clearMediaCollection('image');

        return $this->successResponse(null, 'Service image deleted successfully');
    }

    public function getSchedules(int $merchantId, int $serviceId): JsonResponse
    {
        $service = $this->merchantService->getServiceSchedules($merchantId, $serviceId);

        return $this->successResponse(
            ServiceScheduleResource::collection($service->schedules),
            'Service schedules retrieved successfully'
        );
    }

    public function updateSchedules(UpdateServiceScheduleRequest $request, int $merchantId, int $serviceId): JsonResponse
    {
        $service = $this->merchantService->upsertServiceSchedules(
            $merchantId,
            $serviceId,
            $request->validated('schedules')
        );

        return $this->successResponse(
            ServiceScheduleResource::collection($service->schedules),
            'Service schedules updated successfully'
        );
    }
}
