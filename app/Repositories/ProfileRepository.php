<?php

namespace App\Repositories;

use App\Models\UserProfile;
use App\Repositories\Contracts\ProfileRepositoryInterface;

class ProfileRepository extends BaseRepository implements ProfileRepositoryInterface
{
    public function __construct(UserProfile $model)
    {
        parent::__construct($model);
    }

    public function findByUserId(int $userId): ?UserProfile
    {
        return $this->model->with(['address', 'media'])->where('user_id', $userId)->first();
    }
}
