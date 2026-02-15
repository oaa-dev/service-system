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
            'payment_methods' => [
                'payment_methods.view',
                'payment_methods.create',
                'payment_methods.update',
                'payment_methods.delete',
            ],
            'document_types' => [
                'document_types.view',
                'document_types.create',
                'document_types.update',
                'document_types.delete',
            ],
            'business_types' => [
                'business_types.view',
                'business_types.create',
                'business_types.update',
                'business_types.delete',
            ],
            'social_platforms' => [
                'social_platforms.view',
                'social_platforms.create',
                'social_platforms.update',
                'social_platforms.delete',
            ],
            'merchants' => [
                'merchants.view',
                'merchants.create',
                'merchants.update',
                'merchants.delete',
                'merchants.update_status',
            ],
            'service_categories' => [
                'service_categories.view',
                'service_categories.create',
                'service_categories.update',
                'service_categories.delete',
            ],
            'services' => [
                'services.view',
                'services.create',
                'services.update',
                'services.delete',
            ],
            'customer_tags' => [
                'customer_tags.view',
                'customer_tags.create',
                'customer_tags.update',
                'customer_tags.delete',
            ],
            'customers' => [
                'customers.view',
                'customers.create',
                'customers.update',
                'customers.delete',
                'customers.update_status',
            ],
            'bookings' => [
                'bookings.view',
                'bookings.create',
                'bookings.update_status',
            ],
            'reservations' => [
                'reservations.view',
                'reservations.create',
                'reservations.update_status',
            ],
            'service_orders' => [
                'service_orders.view',
                'service_orders.create',
                'service_orders.update_status',
            ],
            'platform_fees' => [
                'platform_fees.view',
                'platform_fees.create',
                'platform_fees.update',
                'platform_fees.delete',
            ],
            'fields' => [
                'fields.view',
                'fields.create',
                'fields.update',
                'fields.delete',
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
                'payment_methods.view', 'payment_methods.create', 'payment_methods.update', 'payment_methods.delete',
                'document_types.view', 'document_types.create', 'document_types.update', 'document_types.delete',
                'business_types.view', 'business_types.create', 'business_types.update', 'business_types.delete',
                'social_platforms.view', 'social_platforms.create', 'social_platforms.update', 'social_platforms.delete',
                'merchants.view', 'merchants.create', 'merchants.update', 'merchants.delete', 'merchants.update_status',
                'service_categories.view', 'service_categories.create', 'service_categories.update', 'service_categories.delete',
                'services.view', 'services.create', 'services.update', 'services.delete',
                'customer_tags.view', 'customer_tags.create', 'customer_tags.update', 'customer_tags.delete',
                'customers.view', 'customers.create', 'customers.update', 'customers.delete', 'customers.update_status',
                'bookings.view', 'bookings.create', 'bookings.update_status',
                'reservations.view', 'reservations.create', 'reservations.update_status',
                'service_orders.view', 'service_orders.create', 'service_orders.update_status',
                'platform_fees.view', 'platform_fees.create', 'platform_fees.update', 'platform_fees.delete',
                'fields.view', 'fields.create', 'fields.update', 'fields.delete',
            ],
            'manager' => [
                'users.view', 'users.create', 'users.update',
                'profile.view', 'profile.update',
                'customers.view',
            ],
            'user' => [
                'users.view',
                'profile.view', 'profile.update',
            ],
            'merchant' => [
                'profile.view', 'profile.update',
                'business_types.view',
                'service_categories.view', 'service_categories.create', 'service_categories.update', 'service_categories.delete',
                'services.view', 'services.create', 'services.update', 'services.delete',
                'bookings.view', 'bookings.create', 'bookings.update_status',
                'reservations.view', 'reservations.create', 'reservations.update_status',
                'service_orders.view', 'service_orders.create', 'service_orders.update_status',
            ],
            'branch-merchant' => [
                'profile.view', 'profile.update',
                'services.view',
                'bookings.view', 'bookings.create', 'bookings.update_status',
                'reservations.view', 'reservations.create', 'reservations.update_status',
                'service_orders.view', 'service_orders.create', 'service_orders.update_status',
            ],
            'customer' => [
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
