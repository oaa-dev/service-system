<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin
        $superAdmin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'email_verified_at' => now(),
        ]);
        $superAdmin->assignRole('super-admin');

        // Admin
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('admin');

        // Manager
        $manager = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@example.com',
            'email_verified_at' => now(),
        ]);
        $manager->assignRole('manager');

        // Regular User
        $user = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'email_verified_at' => now(),
        ]);
        $user->assignRole('user');
    }
}
