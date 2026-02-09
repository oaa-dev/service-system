<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\PaymentMethodData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PaymentMethod\StorePaymentMethodRequest;
use App\Http\Requests\Api\V1\PaymentMethod\UpdatePaymentMethodRequest;
use App\Http\Resources\Api\V1\PaymentMethodResource;
use App\Services\Contracts\PaymentMethodServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PaymentMethodServiceInterface $paymentMethodService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paymentMethods = $this->paymentMethodService->getAllPaymentMethods([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($paymentMethods, PaymentMethodResource::class);
    }

    public function all(): JsonResponse
    {
        $paymentMethods = $this->paymentMethodService->getAllPaymentMethodsWithoutPagination();

        return $this->successResponse(
            PaymentMethodResource::collection($paymentMethods),
            'Payment methods retrieved successfully'
        );
    }

    public function active(): JsonResponse
    {
        $paymentMethods = $this->paymentMethodService->getActivePaymentMethods();

        return $this->successResponse(
            PaymentMethodResource::collection($paymentMethods),
            'Active payment methods retrieved successfully'
        );
    }

    public function store(StorePaymentMethodRequest $request): JsonResponse
    {
        $data = PaymentMethodData::from($request->validated());
        $paymentMethod = $this->paymentMethodService->createPaymentMethod($data);

        return $this->createdResponse(
            new PaymentMethodResource($paymentMethod),
            'Payment method created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $paymentMethod = $this->paymentMethodService->getPaymentMethodById($id);

        return $this->successResponse(
            new PaymentMethodResource($paymentMethod),
            'Payment method retrieved successfully'
        );
    }

    public function update(UpdatePaymentMethodRequest $request, int $id): JsonResponse
    {
        $data = PaymentMethodData::from($request->validated());
        $paymentMethod = $this->paymentMethodService->updatePaymentMethod($id, $data);

        return $this->successResponse(
            new PaymentMethodResource($paymentMethod),
            'Payment method updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->paymentMethodService->deletePaymentMethod($id);

            return $this->successResponse(null, 'Payment method deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
