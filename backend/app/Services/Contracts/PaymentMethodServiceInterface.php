<?php

namespace App\Services\Contracts;

use App\Data\PaymentMethodData;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PaymentMethodServiceInterface
{
    public function getAllPaymentMethods(array $filters = []): LengthAwarePaginator;

    public function getAllPaymentMethodsWithoutPagination(): Collection;

    public function getActivePaymentMethods(): Collection;

    public function getPaymentMethodById(int $id): PaymentMethod;

    public function createPaymentMethod(PaymentMethodData $data): PaymentMethod;

    public function updatePaymentMethod(int $id, PaymentMethodData $data): PaymentMethod;

    public function deletePaymentMethod(int $id): bool;
}
