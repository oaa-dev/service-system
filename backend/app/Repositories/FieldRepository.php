<?php

namespace App\Repositories;

use App\Models\Field;
use App\Repositories\Contracts\FieldRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class FieldRepository extends BaseRepository implements FieldRepositoryInterface
{
    public function __construct(Field $model)
    {
        parent::__construct($model);
    }

    public function findByName(string $name): ?Model
    {
        return $this->model->where('name', $name)->first();
    }

    public function getActive(): Collection
    {
        return $this->model->where('is_active', true)->orderBy('sort_order')->with('fieldValues')->get();
    }
}
