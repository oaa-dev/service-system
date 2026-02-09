<?php

namespace App\Services\Contracts;

use App\Data\BusinessTypeData;
use App\Models\BusinessType;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface BusinessTypeServiceInterface
{
    public function getAllBusinessTypes(array $filters = []): LengthAwarePaginator;

    public function getAllBusinessTypesWithoutPagination(): Collection;

    public function getActiveBusinessTypes(): Collection;

    public function getBusinessTypeById(int $id): BusinessType;

    public function createBusinessType(BusinessTypeData $data): BusinessType;

    public function updateBusinessType(int $id, BusinessTypeData $data): BusinessType;

    public function deleteBusinessType(int $id): bool;
}
