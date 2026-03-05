<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Payment\MarkAsPaidRequest;
use App\Http\Requests\Api\V1\Payment\RequestRefundRequest;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Models\Payment;
use App\Services\Contracts\PaymentServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PaymentServiceInterface $paymentService
    ) {}

    public function show(Payment $payment): JsonResponse
    {
        return $this->successResponse(
            new PaymentResource($payment),
            'Payment retrieved successfully'
        );
    }

    public function markAsPaid(MarkAsPaidRequest $request, Payment $payment): JsonResponse
    {
        $payment = $this->paymentService->markAsPaid(
            $payment,
            $request->validated('reference')
        );

        return $this->successResponse(
            new PaymentResource($payment),
            'Payment marked as paid'
        );
    }

    public function requestRefund(RequestRefundRequest $request, Payment $payment): JsonResponse
    {
        $payment = $this->paymentService->requestRefund(
            $payment,
            $request->validated('reason')
        );

        return $this->successResponse(
            new PaymentResource($payment),
            'Refund requested successfully'
        );
    }

    public function markRefunded(Payment $payment): JsonResponse
    {
        $payment = $this->paymentService->markRefunded($payment);

        return $this->successResponse(
            new PaymentResource($payment),
            'Payment marked as refunded'
        );
    }

    public function checkStatus(Payment $payment): JsonResponse
    {
        $payment = $this->paymentService->checkPaymentStatus($payment);

        return $this->successResponse(
            new PaymentResource($payment),
            'Payment status checked'
        );
    }
}
