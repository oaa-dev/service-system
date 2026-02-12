<?php

namespace App\Services;

use App\Data\CustomerTagData;
use App\Models\CustomerTag;
use App\Repositories\Contracts\CustomerTagRepositoryInterface;
use App\Services\Contracts\CustomerTagServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CustomerTagService implements CustomerTagServiceInterface
{
    public function __construct(
        protected CustomerTagRepositoryInterface $customerTagRepository
    ) {}

    public function getAllCustomerTags(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(CustomerTag::class)
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

    public function getAllCustomerTagsWithoutPagination(): Collection
    {
        return CustomerTag::orderBy('sort_order')->get();
    }

    public function getActiveCustomerTags(): Collection
    {
        return $this->customerTagRepository->getActive();
    }

    public function getCustomerTagById(int $id): CustomerTag
    {
        return $this->customerTagRepository->findOrFail($id);
    }

    public function createCustomerTag(CustomerTagData $data): CustomerTag
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->customerTagRepository->create($createData);
    }

    public function updateCustomerTag(int $id, CustomerTagData $data): CustomerTag
    {
        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->customerTagRepository->update($id, $updateData);
    }

    public function deleteCustomerTag(int $id): bool
    {
        return $this->customerTagRepository->delete($id);
    }
}
