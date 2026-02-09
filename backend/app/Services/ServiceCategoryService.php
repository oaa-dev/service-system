<?php

namespace App\Services;

use App\Data\ServiceCategoryData;
use App\Models\ServiceCategory;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Services\Contracts\ServiceCategoryServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ServiceCategoryService implements ServiceCategoryServiceInterface
{
    public function __construct(
        protected MerchantRepositoryInterface $merchantRepository
    ) {}

    public function getMerchantServiceCategories(int $merchantId, array $filters = []): LengthAwarePaginator
    {
        $this->merchantRepository->findOrFail($merchantId);

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(ServiceCategory::where('merchant_id', $merchantId))
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where('name', 'like', "%{$value}%")),
            ])
            ->allowedSorts(['id', 'name', 'sort_order', 'is_active', 'created_at'])
            ->defaultSort('sort_order')
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getMerchantServiceCategoriesAll(int $merchantId): Collection
    {
        $this->merchantRepository->findOrFail($merchantId);

        return ServiceCategory::where('merchant_id', $merchantId)
            ->orderBy('sort_order')
            ->get();
    }

    public function getMerchantActiveServiceCategories(int $merchantId): Collection
    {
        $this->merchantRepository->findOrFail($merchantId);

        return ServiceCategory::where('merchant_id', $merchantId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }

    public function getMerchantServiceCategoryById(int $merchantId, int $categoryId): ServiceCategory
    {
        $this->merchantRepository->findOrFail($merchantId);

        return ServiceCategory::where('merchant_id', $merchantId)
            ->findOrFail($categoryId);
    }

    public function createMerchantServiceCategory(int $merchantId, ServiceCategoryData $data): ServiceCategory
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $merchant->serviceCategories()->create($createData);
    }

    public function updateMerchantServiceCategory(int $merchantId, int $categoryId, ServiceCategoryData $data): ServiceCategory
    {
        $this->merchantRepository->findOrFail($merchantId);

        $serviceCategory = ServiceCategory::where('merchant_id', $merchantId)->findOrFail($categoryId);

        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        $serviceCategory->update($updateData);

        return $serviceCategory;
    }

    public function deleteMerchantServiceCategory(int $merchantId, int $categoryId): bool
    {
        $this->merchantRepository->findOrFail($merchantId);

        $serviceCategory = ServiceCategory::where('merchant_id', $merchantId)->findOrFail($categoryId);

        return $serviceCategory->delete();
    }
}
