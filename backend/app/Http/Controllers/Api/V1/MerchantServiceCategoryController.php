<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ServiceCategoryData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ServiceCategory\StoreServiceCategoryRequest;
use App\Http\Requests\Api\V1\ServiceCategory\UpdateServiceCategoryRequest;
use App\Http\Resources\Api\V1\ServiceCategoryResource;
use App\Services\Contracts\ServiceCategoryServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MerchantServiceCategoryController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ServiceCategoryServiceInterface $serviceCategoryService
    ) {}

    public function index(Request $request, int $merchantId): JsonResponse
    {
        $serviceCategories = $this->serviceCategoryService->getMerchantServiceCategories($merchantId, [
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($serviceCategories, ServiceCategoryResource::class);
    }

    public function all(int $merchantId): JsonResponse
    {
        $serviceCategories = $this->serviceCategoryService->getMerchantServiceCategoriesAll($merchantId);

        return $this->successResponse(
            ServiceCategoryResource::collection($serviceCategories),
            'Service categories retrieved successfully'
        );
    }

    public function active(int $merchantId): JsonResponse
    {
        $serviceCategories = $this->serviceCategoryService->getMerchantActiveServiceCategories($merchantId);

        return $this->successResponse(
            ServiceCategoryResource::collection($serviceCategories),
            'Active service categories retrieved successfully'
        );
    }

    public function store(StoreServiceCategoryRequest $request, int $merchantId): JsonResponse
    {
        $data = ServiceCategoryData::from($request->validated());
        $serviceCategory = $this->serviceCategoryService->createMerchantServiceCategory($merchantId, $data);

        return $this->createdResponse(
            new ServiceCategoryResource($serviceCategory),
            'Service category created successfully'
        );
    }

    public function show(int $merchantId, int $serviceCategoryId): JsonResponse
    {
        $serviceCategory = $this->serviceCategoryService->getMerchantServiceCategoryById($merchantId, $serviceCategoryId);

        return $this->successResponse(
            new ServiceCategoryResource($serviceCategory),
            'Service category retrieved successfully'
        );
    }

    public function update(UpdateServiceCategoryRequest $request, int $merchantId, int $serviceCategoryId): JsonResponse
    {
        $data = ServiceCategoryData::from($request->validated());
        $serviceCategory = $this->serviceCategoryService->updateMerchantServiceCategory($merchantId, $serviceCategoryId, $data);

        return $this->successResponse(
            new ServiceCategoryResource($serviceCategory),
            'Service category updated successfully'
        );
    }

    public function destroy(int $merchantId, int $serviceCategoryId): JsonResponse
    {
        try {
            $this->serviceCategoryService->deleteMerchantServiceCategory($merchantId, $serviceCategoryId);

            return $this->successResponse(null, 'Service category deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
