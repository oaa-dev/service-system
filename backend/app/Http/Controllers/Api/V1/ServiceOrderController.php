<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ServiceOrderData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ServiceOrder\CreateServiceOrderRequest;
use App\Http\Requests\Api\V1\ServiceOrder\UpdateServiceOrderStatusRequest;
use App\Http\Resources\Api\V1\ServiceOrderResource;
use App\Services\Contracts\ServiceOrderServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceOrderController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ServiceOrderServiceInterface $serviceOrderService
    ) {}

    public function index(Request $request, int $merchantId): JsonResponse
    {
        $serviceOrders = $this->serviceOrderService->getMerchantServiceOrders($merchantId, [
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($serviceOrders, ServiceOrderResource::class);
    }

    public function store(CreateServiceOrderRequest $request, int $merchantId): JsonResponse
    {
        $data = ServiceOrderData::from($request->validated());
        $serviceOrder = $this->serviceOrderService->createServiceOrder($merchantId, $data);

        return $this->createdResponse(
            new ServiceOrderResource($serviceOrder),
            'Service order created successfully'
        );
    }

    public function show(int $merchantId, int $serviceOrderId): JsonResponse
    {
        $serviceOrder = $this->serviceOrderService->getMerchantServiceOrderById($merchantId, $serviceOrderId);

        return $this->successResponse(
            new ServiceOrderResource($serviceOrder),
            'Service order retrieved successfully'
        );
    }

    public function updateStatus(UpdateServiceOrderStatusRequest $request, int $merchantId, int $serviceOrderId): JsonResponse
    {
        $serviceOrder = $this->serviceOrderService->updateServiceOrderStatus(
            $merchantId,
            $serviceOrderId,
            $request->validated('status')
        );

        return $this->successResponse(
            new ServiceOrderResource($serviceOrder),
            'Service order status updated successfully'
        );
    }
}
