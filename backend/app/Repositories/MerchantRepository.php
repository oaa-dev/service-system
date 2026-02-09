<?php

namespace App\Repositories;

use App\Models\Merchant;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class MerchantRepository extends BaseRepository implements MerchantRepositoryInterface
{
    public function __construct(Merchant $model)
    {
        parent::__construct($model);
    }

    public function findBySlug(string $slug): ?Model
    {
        return $this->model->where('slug', $slug)->first();
    }

    public function findByUserId(int $userId): ?Model
    {
        return $this->model->where('user_id', $userId)->first();
    }

    public function getActive(): Collection
    {
        return $this->model->where('status', 'active')->get();
    }
}
