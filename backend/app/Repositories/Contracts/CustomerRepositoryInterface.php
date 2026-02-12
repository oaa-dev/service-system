<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Model;

interface CustomerRepositoryInterface extends BaseRepositoryInterface
{
    public function findByUserId(int $userId): ?Model;
}
