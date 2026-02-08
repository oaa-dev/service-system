<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Laravel\Passport\Client;

class DatabaseSeeder extends Seeder
{

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Passport personal access client first if it doesn't exist
        $hasPersonalClient = Client::where('provider', 'users')
            ->whereJsonContains('grant_types', 'personal_access')
            ->exists();

        if (! $hasPersonalClient) {
            Artisan::call('passport:client', [
                '--personal' => true,
                '--name' => 'Personal Access Client',
                '--provider' => 'users',
                '--no-interaction' => true,
            ]);
            $this->command->info('Passport personal access client created.');
        }

        $this->call([
            RolePermissionSeeder::class,
            UserSeeder::class,
        ]);
    }
}
