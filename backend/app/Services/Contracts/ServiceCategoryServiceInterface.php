<?php

namespace App\Services\Contracts;

use App\Data\ServiceCategoryData;
use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface ServiceCategoryServiceInterface
{
    public function getMerchantServiceCategories(int $merchantId, array $filters = []): LengthAwarePaginator;

    public function getMerchantServiceCategoriesAll(int $merchantId): Collection;

    public function getMerchantActiveServiceCategories(int $merchantId): Collection;

    public function getMerchantServiceCategoryById(int $merchantId, int $categoryId): ServiceCategory;

    public function createMerchantServiceCategory(int $merchantId, ServiceCategoryData $data): ServiceCategory;

    public function updateMerchantServiceCategory(int $merchantId, int $categoryId, ServiceCategoryData $data): ServiceCategory;

    public function deleteMerchantServiceCategory(int $merchantId, int $categoryId): bool;
}
