<?php

namespace App\Services;

use App\Data\PlatformFeeData;
use App\Models\PlatformFee;
use App\Repositories\Contracts\PlatformFeeRepositoryInterface;
use App\Services\Contracts\PlatformFeeServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PlatformFeeService implements PlatformFeeServiceInterface
{
    public function __construct(
        protected PlatformFeeRepositoryInterface $platformFeeRepository
    ) {}

    public function getAllPlatformFees(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(PlatformFee::class)
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('transaction_type'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where('name', 'like', "%{$value}%")),
            ])
            ->allowedSorts(['id', 'name', 'transaction_type', 'rate_percentage', 'sort_order', 'is_active', 'created_at'])
            ->defaultSort('sort_order')
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getAllPlatformFeesWithoutPagination(): Collection
    {
        return PlatformFee::orderBy('sort_order')->get();
    }

    public function getActivePlatformFees(): Collection
    {
        return $this->platformFeeRepository->getActive();
    }

    public function getPlatformFeeById(int $id): PlatformFee
    {
        return $this->platformFeeRepository->findOrFail($id);
    }

    public function createPlatformFee(PlatformFeeData $data): PlatformFee
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        $fee = $this->platformFeeRepository->create($createData);

        // Enforce one active fee per transaction_type
        if ($fee->is_active) {
            $this->deactivateOthersOfSameType($fee);
        }

        return $fee;
    }

    public function updatePlatformFee(int $id, PlatformFeeData $data): PlatformFee
    {
        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        $fee = $this->platformFeeRepository->update($id, $updateData);

        // Enforce one active fee per transaction_type
        if ($fee->is_active) {
            $this->deactivateOthersOfSameType($fee);
        }

        return $fee;
    }

    public function deletePlatformFee(int $id): bool
    {
        return $this->platformFeeRepository->delete($id);
    }

    public function calculateFee(string $transactionType, float $subtotal): array
    {
        $fee = $this->platformFeeRepository->getActiveByTransactionType($transactionType);

        if (! $fee) {
            return ['fee_rate' => 0, 'fee_amount' => 0, 'total_amount' => $subtotal];
        }

        $feeRate = (float) $fee->rate_percentage;
        $feeAmount = round($subtotal * ($feeRate / 100), 2);

        return [
            'fee_rate' => $feeRate,
            'fee_amount' => $feeAmount,
            'total_amount' => round($subtotal + $feeAmount, 2),
        ];
    }

    private function deactivateOthersOfSameType(PlatformFee $fee): void
    {
        PlatformFee::where('transaction_type', $fee->transaction_type)
            ->where('id', '!=', $fee->id)
            ->where('is_active', true)
            ->update(['is_active' => false]);
    }
}
