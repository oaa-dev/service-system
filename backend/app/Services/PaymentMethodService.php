<?php

namespace App\Services;

use App\Data\PaymentMethodData;
use App\Models\PaymentMethod;
use App\Repositories\Contracts\PaymentMethodRepositoryInterface;
use App\Services\Contracts\PaymentMethodServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentMethodService implements PaymentMethodServiceInterface
{
    public function __construct(
        protected PaymentMethodRepositoryInterface $paymentMethodRepository
    ) {}

    public function getAllPaymentMethods(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(PaymentMethod::class)
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

    public function getAllPaymentMethodsWithoutPagination(): Collection
    {
        return PaymentMethod::orderBy('sort_order')->get();
    }

    public function getActivePaymentMethods(): Collection
    {
        return $this->paymentMethodRepository->getActive();
    }

    public function getPaymentMethodById(int $id): PaymentMethod
    {
        return $this->paymentMethodRepository->findOrFail($id);
    }

    public function createPaymentMethod(PaymentMethodData $data): PaymentMethod
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->paymentMethodRepository->create($createData);
    }

    public function updatePaymentMethod(int $id, PaymentMethodData $data): PaymentMethod
    {
        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->paymentMethodRepository->update($id, $updateData);
    }

    public function deletePaymentMethod(int $id): bool
    {
        return $this->paymentMethodRepository->delete($id);
    }
}
