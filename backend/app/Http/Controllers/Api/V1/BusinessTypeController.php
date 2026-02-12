<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\BusinessTypeData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\BusinessType\StoreBusinessTypeRequest;
use App\Http\Requests\Api\V1\BusinessType\SyncBusinessTypeFieldsRequest;
use App\Http\Requests\Api\V1\BusinessType\UpdateBusinessTypeRequest;
use App\Http\Resources\Api\V1\BusinessTypeFieldResource;
use App\Http\Resources\Api\V1\BusinessTypeResource;
use App\Services\Contracts\BusinessTypeServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessTypeController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected BusinessTypeServiceInterface $businessTypeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $businessTypes = $this->businessTypeService->getAllBusinessTypes([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($businessTypes, BusinessTypeResource::class);
    }

    public function all(): JsonResponse
    {
        $businessTypes = $this->businessTypeService->getAllBusinessTypesWithoutPagination();

        return $this->successResponse(
            BusinessTypeResource::collection($businessTypes),
            'Business types retrieved successfully'
        );
    }

    public function active(): JsonResponse
    {
        $businessTypes = $this->businessTypeService->getActiveBusinessTypes();

        return $this->successResponse(
            BusinessTypeResource::collection($businessTypes),
            'Active business types retrieved successfully'
        );
    }

    public function store(StoreBusinessTypeRequest $request): JsonResponse
    {
        $data = BusinessTypeData::from($request->validated());
        $businessType = $this->businessTypeService->createBusinessType($data);

        return $this->createdResponse(
            new BusinessTypeResource($businessType),
            'Business type created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $businessType = $this->businessTypeService->getBusinessTypeById($id);

        return $this->successResponse(
            new BusinessTypeResource($businessType),
            'Business type retrieved successfully'
        );
    }

    public function update(UpdateBusinessTypeRequest $request, int $id): JsonResponse
    {
        $data = BusinessTypeData::from($request->validated());
        $businessType = $this->businessTypeService->updateBusinessType($id, $data);

        return $this->successResponse(
            new BusinessTypeResource($businessType),
            'Business type updated successfully'
        );
    }

    public function getFields(int $id): JsonResponse
    {
        $businessType = $this->businessTypeService->getBusinessTypeById($id);
        $businessType->load('businessTypeFields.field.fieldValues');

        return $this->successResponse(
            BusinessTypeFieldResource::collection($businessType->businessTypeFields),
            'Business type fields retrieved successfully'
        );
    }

    public function syncFields(SyncBusinessTypeFieldsRequest $request, int $id): JsonResponse
    {
        $businessType = $this->businessTypeService->syncFields($id, $request->validated('fields'));

        return $this->successResponse(
            BusinessTypeFieldResource::collection($businessType->businessTypeFields),
            'Business type fields synced successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->businessTypeService->deleteBusinessType($id);

            return $this->successResponse(null, 'Business type deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
