<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\PlatformFeeData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PlatformFee\StorePlatformFeeRequest;
use App\Http\Requests\Api\V1\PlatformFee\UpdatePlatformFeeRequest;
use App\Http\Resources\Api\V1\PlatformFeeResource;
use App\Services\Contracts\PlatformFeeServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformFeeController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PlatformFeeServiceInterface $platformFeeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $platformFees = $this->platformFeeService->getAllPlatformFees([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($platformFees, PlatformFeeResource::class);
    }

    public function all(): JsonResponse
    {
        $platformFees = $this->platformFeeService->getAllPlatformFeesWithoutPagination();

        return $this->successResponse(
            PlatformFeeResource::collection($platformFees),
            'Platform fees retrieved successfully'
        );
    }

    public function active(): JsonResponse
    {
        $platformFees = $this->platformFeeService->getActivePlatformFees();

        return $this->successResponse(
            PlatformFeeResource::collection($platformFees),
            'Active platform fees retrieved successfully'
        );
    }

    public function store(StorePlatformFeeRequest $request): JsonResponse
    {
        $data = PlatformFeeData::from($request->validated());
        $platformFee = $this->platformFeeService->createPlatformFee($data);

        return $this->createdResponse(
            new PlatformFeeResource($platformFee),
            'Platform fee created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $platformFee = $this->platformFeeService->getPlatformFeeById($id);

        return $this->successResponse(
            new PlatformFeeResource($platformFee),
            'Platform fee retrieved successfully'
        );
    }

    public function update(UpdatePlatformFeeRequest $request, int $id): JsonResponse
    {
        $data = PlatformFeeData::from($request->validated());
        $platformFee = $this->platformFeeService->updatePlatformFee($id, $data);

        return $this->successResponse(
            new PlatformFeeResource($platformFee),
            'Platform fee updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->platformFeeService->deletePlatformFee($id);

            return $this->successResponse(null, 'Platform fee deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
