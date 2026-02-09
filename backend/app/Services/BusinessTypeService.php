<?php

namespace App\Services;

use App\Data\BusinessTypeData;
use App\Models\BusinessType;
use App\Repositories\Contracts\BusinessTypeRepositoryInterface;
use App\Services\Contracts\BusinessTypeServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class BusinessTypeService implements BusinessTypeServiceInterface
{
    public function __construct(
        protected BusinessTypeRepositoryInterface $businessTypeRepository
    ) {}

    public function getAllBusinessTypes(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(BusinessType::class)
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

    public function getAllBusinessTypesWithoutPagination(): Collection
    {
        return BusinessType::orderBy('sort_order')->get();
    }

    public function getActiveBusinessTypes(): Collection
    {
        return $this->businessTypeRepository->getActive();
    }

    public function getBusinessTypeById(int $id): BusinessType
    {
        return $this->businessTypeRepository->findOrFail($id);
    }

    public function createBusinessType(BusinessTypeData $data): BusinessType
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->businessTypeRepository->create($createData);
    }

    public function updateBusinessType(int $id, BusinessTypeData $data): BusinessType
    {
        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->businessTypeRepository->update($id, $updateData);
    }

    public function deleteBusinessType(int $id): bool
    {
        return $this->businessTypeRepository->delete($id);
    }
}
