<?php

namespace App\Services\Contracts;

use App\Data\RoleData;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Permission\Models\Role;

interface RoleServiceInterface
{
    public function getAllRoles(array $filters = []): LengthAwarePaginator;

    public function getAllRolesWithoutPagination(): Collection;

    public function getRoleById(int $id): Role;

    public function createRole(RoleData $data): Role;

    public function updateRole(int $id, RoleData $data): Role;

    public function deleteRole(int $id): bool;

    public function syncPermissions(int $id, array $permissions): Role;

    public function getAllPermissions(): Collection;

    public function getPermissionsGroupedByModule(): array;
}
