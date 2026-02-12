<?php

namespace App\Repositories;

use App\Models\PlatformFee;
use App\Repositories\Contracts\PlatformFeeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class PlatformFeeRepository extends BaseRepository implements PlatformFeeRepositoryInterface
{
    public function __construct(PlatformFee $model)
    {
        parent::__construct($model);
    }

    public function findBySlug(string $slug): ?Model
    {
        return $this->model->where('slug', $slug)->first();
    }

    public function getActive(): Collection
    {
        return $this->model->where('is_active', true)->orderBy('sort_order')->get();
    }

    public function getActiveByTransactionType(string $transactionType): ?PlatformFee
    {
        return $this->model
            ->where('is_active', true)
            ->where('transaction_type', $transactionType)
            ->first();
    }
}
