<?php

namespace App\Repositories\Contracts;

use App\Models\PlatformFee;
use Illuminate\Database\Eloquent\Collection;

interface PlatformFeeRepositoryInterface extends BaseRepositoryInterface
{
    public function findBySlug(string $slug): ?\Illuminate\Database\Eloquent\Model;

    public function getActive(): Collection;

    public function getActiveByTransactionType(string $transactionType): ?PlatformFee;
}
