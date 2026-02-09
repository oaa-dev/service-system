<?php

namespace App\Repositories;

use App\Models\BusinessType;
use App\Repositories\Contracts\BusinessTypeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class BusinessTypeRepository extends BaseRepository implements BusinessTypeRepositoryInterface
{
    public function __construct(BusinessType $model)
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
}
