<?php

namespace App\Repositories;

use App\Repositories\Contracts\RoleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
    public function __construct(Role $model)
    {
        parent::__construct($model);
    }

    public function findByName(string $name): ?Model
    {
        return $this->model->where('name', $name)->where('guard_name', 'api')->first();
    }

    public function getAllWithPermissions(): Collection
    {
        return $this->model->where('guard_name', 'api')->with(['permissions'])->get();
    }
}
