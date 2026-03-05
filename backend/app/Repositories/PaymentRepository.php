<?php

namespace App\Repositories;

use App\Models\Payment;
use App\Repositories\Contracts\PaymentRepositoryInterface;

class PaymentRepository extends BaseRepository implements PaymentRepositoryInterface
{
    public function __construct(Payment $model)
    {
        parent::__construct($model);
    }

    public function findByGatewayPaymentId(string $gatewayPaymentId): ?Payment
    {
        return $this->model->where('gateway_payment_id', $gatewayPaymentId)->first();
    }

    public function findByPayable(string $payableType, int $payableId): ?Payment
    {
        return $this->model->where('payable_type', $payableType)
            ->where('payable_id', $payableId)
            ->first();
    }
}
