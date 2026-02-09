<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

interface MerchantRepositoryInterface extends BaseRepositoryInterface
{
    public function findBySlug(string $slug): ?Model;

    public function findByUserId(int $userId): ?Model;

    public function getActive(): Collection;
}
