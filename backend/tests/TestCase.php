<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Passport\Client;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Create a personal access client for testing if it doesn't exist
        $this->afterApplicationCreated(function () {
            if (! \Schema::hasTable('oauth_clients')) {
                return;
            }

            // Check using grant_types for newer Passport versions
            $hasClient = Client::query()
                ->whereJsonContains('grant_types', 'personal_access')
                ->where('revoked', false)
                ->exists();

            if (! $hasClient) {
                \Artisan::call('passport:client', [
                    '--personal' => true,
                    '--name' => 'Test Personal Access Client',
                    '--no-interaction' => true,
                ]);
            }
        });
    }
}
