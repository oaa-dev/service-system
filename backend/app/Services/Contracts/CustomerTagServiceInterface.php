<?php

namespace App\Services\Contracts;

use App\Data\CustomerTagData;
use App\Models\CustomerTag;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface CustomerTagServiceInterface
{
    public function getAllCustomerTags(array $filters = []): LengthAwarePaginator;

    public function getAllCustomerTagsWithoutPagination(): Collection;

    public function getActiveCustomerTags(): Collection;

    public function getCustomerTagById(int $id): CustomerTag;

    public function createCustomerTag(CustomerTagData $data): CustomerTag;

    public function updateCustomerTag(int $id, CustomerTagData $data): CustomerTag;

    public function deleteCustomerTag(int $id): bool;
}
