<?php

namespace App\Services\Contracts;

use App\Data\PlatformFeeData;
use App\Models\PlatformFee;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PlatformFeeServiceInterface
{
    public function getAllPlatformFees(array $filters = []): LengthAwarePaginator;

    public function getAllPlatformFeesWithoutPagination(): Collection;

    public function getActivePlatformFees(): Collection;

    public function getPlatformFeeById(int $id): PlatformFee;

    public function createPlatformFee(PlatformFeeData $data): PlatformFee;

    public function updatePlatformFee(int $id, PlatformFeeData $data): PlatformFee;

    public function deletePlatformFee(int $id): bool;

    public function calculateFee(string $transactionType, float $subtotal): array;
}
