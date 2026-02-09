<?php

namespace App\Services;

use App\Data\RoleData;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Services\Contracts\RoleServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RoleService implements RoleServiceInterface
{
    public function __construct(
        protected RoleRepositoryInterface $roleRepository
    ) {}

    public function getAllRoles(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Role::class)
            ->with(['permissions'])
            ->where('guard_name', 'api')
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where('name', 'like', "%{$value}%")),
            ])
            ->allowedSorts(['id', 'name', 'created_at', 'updated_at'])
            ->defaultSort('name')
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getAllRolesWithoutPagination(): Collection
    {
        return Role::where('guard_name', 'api')->with(['permissions'])->get();
    }

    public function getRoleById(int $id): Role
    {
        $role = $this->roleRepository->findOrFail($id);
        $role->load(['permissions']);

        return $role;
    }

    public function createRole(RoleData $data): Role
    {
        $role = $this->roleRepository->create([
            'name' => $data->name,
            'guard_name' => 'api',
        ]);

        if (! $data->permissions instanceof Optional) {
            $role->syncPermissions($data->permissions);
        }

        $role->load(['permissions']);

        return $role;
    }

    public function updateRole(int $id, RoleData $data): Role
    {
        $role = $this->roleRepository->update($id, [
            'name' => $data->name,
        ]);

        if (! $data->permissions instanceof Optional) {
            $role->syncPermissions($data->permissions);
        }

        $role->load(['permissions']);

        return $role;
    }

    public function deleteRole(int $id): bool
    {
        $role = $this->roleRepository->findOrFail($id);

        // Prevent deletion of protected roles
        if (in_array($role->name, ['super-admin', 'admin', 'user'])) {
            throw new \Exception('Cannot delete protected role');
        }

        return $this->roleRepository->delete($id);
    }

    public function syncPermissions(int $id, array $permissions): Role
    {
        $role = $this->roleRepository->findOrFail($id);

        // super-admin should not have permissions synced (bypasses all checks)
        if ($role->name === 'super-admin') {
            throw new \Exception('Cannot modify super-admin permissions');
        }

        $role->syncPermissions($permissions);
        $role->load(['permissions']);

        return $role;
    }

    public function getAllPermissions(): Collection
    {
        return Permission::where('guard_name', 'api')->get();
    }

    public function getPermissionsGroupedByModule(): array
    {
        $permissions = $this->getAllPermissions();
        $grouped = [];

        foreach ($permissions as $permission) {
            $parts = explode('.', $permission->name);
            $module = $parts[0] ?? 'general';

            if (! isset($grouped[$module])) {
                $grouped[$module] = [];
            }

            $grouped[$module][] = [
                'id' => $permission->id,
                'name' => $permission->name,
                'action' => $parts[1] ?? $permission->name,
            ];
        }

        return $grouped;
    }
}
