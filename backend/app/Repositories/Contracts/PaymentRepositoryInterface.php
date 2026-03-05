<?php

namespace App\Repositories\Contracts;

use App\Models\Payment;

interface PaymentRepositoryInterface extends BaseRepositoryInterface
{
    public function findByGatewayPaymentId(string $gatewayPaymentId): ?Payment;

    public function findByPayable(string $payableType, int $payableId): ?Payment;
}
