<?php

namespace App\Repositories\Contracts;

use App\Models\UserProfile;

interface ProfileRepositoryInterface extends BaseRepositoryInterface
{
    public function findByUserId(int $userId): ?UserProfile;
}
