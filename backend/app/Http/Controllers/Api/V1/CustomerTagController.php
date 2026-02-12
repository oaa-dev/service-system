<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\CustomerTagData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CustomerTag\StoreCustomerTagRequest;
use App\Http\Requests\Api\V1\CustomerTag\UpdateCustomerTagRequest;
use App\Http\Resources\Api\V1\CustomerTagResource;
use App\Services\Contracts\CustomerTagServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerTagController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerTagServiceInterface $customerTagService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $customerTags = $this->customerTagService->getAllCustomerTags([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($customerTags, CustomerTagResource::class);
    }

    public function all(): JsonResponse
    {
        $customerTags = $this->customerTagService->getAllCustomerTagsWithoutPagination();

        return $this->successResponse(
            CustomerTagResource::collection($customerTags),
            'Customer tags retrieved successfully'
        );
    }

    public function active(): JsonResponse
    {
        $customerTags = $this->customerTagService->getActiveCustomerTags();

        return $this->successResponse(
            CustomerTagResource::collection($customerTags),
            'Active customer tags retrieved successfully'
        );
    }

    public function store(StoreCustomerTagRequest $request): JsonResponse
    {
        $data = CustomerTagData::from($request->validated());
        $customerTag = $this->customerTagService->createCustomerTag($data);

        return $this->createdResponse(
            new CustomerTagResource($customerTag),
            'Customer tag created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $customerTag = $this->customerTagService->getCustomerTagById($id);

        return $this->successResponse(
            new CustomerTagResource($customerTag),
            'Customer tag retrieved successfully'
        );
    }

    public function update(UpdateCustomerTagRequest $request, int $id): JsonResponse
    {
        $data = CustomerTagData::from($request->validated());
        $customerTag = $this->customerTagService->updateCustomerTag($id, $data);

        return $this->successResponse(
            new CustomerTagResource($customerTag),
            'Customer tag updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->customerTagService->deleteCustomerTag($id);

            return $this->successResponse(null, 'Customer tag deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
