<?php

namespace App\Services\Contracts;

use App\Data\ServiceOrderData;
use App\Models\ServiceOrder;
use Illuminate\Pagination\LengthAwarePaginator;

interface ServiceOrderServiceInterface
{
    public function getMerchantServiceOrders(int $merchantId, array $filters = []): LengthAwarePaginator;

    public function getMerchantServiceOrderById(int $merchantId, int $serviceOrderId): ServiceOrder;

    public function createServiceOrder(int $merchantId, ServiceOrderData $data): ServiceOrder;

    public function updateServiceOrderStatus(int $merchantId, int $serviceOrderId, string $status): ServiceOrder;
}
