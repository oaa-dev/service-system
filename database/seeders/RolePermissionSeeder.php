<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions grouped by module
        $permissions = [
            'users' => [
                'users.view',
                'users.create',
                'users.update',
                'users.delete',
            ],
            'roles' => [
                'roles.view',
                'roles.create',
                'roles.update',
                'roles.delete',
            ],
            'profile' => [
                'profile.view',
                'profile.update',
            ],
        ];

        // Create all permissions
        foreach ($permissions as $module => $modulePermissions) {
            foreach ($modulePermissions as $permission) {
                Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
            }
        }

        // Create roles and assign permissions
        $roles = [
            'super-admin' => [], // Super-admin bypasses all permission checks via Gate::before
            'admin' => [
                'users.view', 'users.create', 'users.update', 'users.delete',
                'roles.view', 'roles.create', 'roles.update', 'roles.delete',
                'profile.view', 'profile.update',
            ],
            'manager' => [
                'users.view', 'users.create', 'users.update',
                'profile.view', 'profile.update',
            ],
            'user' => [
                'users.view',
                'profile.view', 'profile.update',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'api']);

            if ($roleName !== 'super-admin') {
                $role->syncPermissions($rolePermissions);
            }
        }
    }
}
