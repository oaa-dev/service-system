<?php

use App\Models\Merchant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Mail;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

describe('Select Merchant Type', function () {
    it('can select individual merchant type', function () {
        $user = User::factory()->create(); // Verified by default
        $user->assignRole('merchant');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/select-merchant-type', [
            'type' => 'individual',
            'name' => 'My Solo Business',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Merchant profile created successfully',
            ])
            ->assertJsonStructure([
                'data' => [
                    'user',
                    'merchant' => ['id', 'type', 'name', 'status'],
                ],
            ]);

        $this->assertDatabaseHas('merchants', [
            'user_id' => $user->id,
            'type' => 'individual',
            'name' => 'My Solo Business',
            'contact_email' => $user->email,
            'status' => 'pending',
        ]);
    });

    it('can select organization merchant type', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/select-merchant-type', [
            'type' => 'organization',
            'name' => 'My Company LLC',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Merchant profile created successfully',
            ]);

        $this->assertDatabaseHas('merchants', [
            'user_id' => $user->id,
            'type' => 'organization',
            'name' => 'My Company LLC',
        ]);
    });

    it('cannot select if already has merchant', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Passport::actingAs($user);

        // Create a merchant for the user
        Merchant::factory()->create(['user_id' => $user->id]);

        $response = $this->postJson('/api/v1/auth/select-merchant-type', [
            'type' => 'individual',
            'name' => 'Another Business',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'You already have a merchant profile',
            ]);
    });

    it('validates type is required', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/select-merchant-type', [
            'name' => 'My Business',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    });

    it('validates type must be individual or organization', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/select-merchant-type', [
            'type' => 'invalid_type',
            'name' => 'My Business',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    });

    it('validates name is required', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/select-merchant-type', [
            'type' => 'individual',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('requires authentication', function () {
        $response = $this->postJson('/api/v1/auth/select-merchant-type', [
            'type' => 'individual',
            'name' => 'My Business',
        ]);

        $response->assertStatus(401);
    });

    it('rejects non-merchant role from selecting merchant type', function () {
        $user = User::factory()->create();
        $user->assignRole('admin');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/select-merchant-type', [
            'type' => 'individual',
            'name' => 'My Business',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'This action is only available for merchant accounts',
            ]);
    });
});

describe('Onboarding Middleware', function () {
    it('blocks access without merchant profile', function () {
        $user = User::factory()->create(); // Verified by default
        $user->assignRole('merchant');
        Passport::actingAs($user);

        // Try to access merchants list — requires ensure.verified + onboarding
        $response = $this->getJson('/api/v1/merchants');

        $response->assertStatus(403);
    });

    it('allows access with merchant profile', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Merchant::factory()->create(['user_id' => $user->id]);
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/merchants');

        $response->assertStatus(200);
    });

    it('allows admin to bypass onboarding', function () {
        $user = User::factory()->create();
        $user->assignRole('admin');
        // Admin has no merchant — should still pass onboarding
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/merchants');

        $response->assertStatus(200);
    });

    it('allows manager role to bypass onboarding', function () {
        $user = User::factory()->create();
        $user->assignRole('manager');
        // Manager has no merchant — should still pass onboarding
        Passport::actingAs($user);

        // Manager has users.view permission, so /users route should work
        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(200);
    });

    it('allows user role to bypass onboarding', function () {
        $user = User::factory()->create();
        $user->assignRole('user');
        // User role has no merchant — should still pass onboarding
        Passport::actingAs($user);

        // User role has users.view permission, so /users route should work
        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(200);
    });

    it('allows customer role to bypass onboarding', function () {
        $user = User::factory()->create();
        $user->assignRole('customer');
        // Customer has no merchant — should still pass onboarding
        Passport::actingAs($user);

        // Customer has profile.view, test auth/me which is outside onboarding middleware
        // Instead test a route inside onboarding: PUT auth/me requires ensure.verified + onboarding
        $response = $this->putJson('/api/v1/auth/me', [
            'first_name' => 'Updated',
        ]);

        $response->assertStatus(200);
    });

    it('allows auth/me without merchant', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        // No merchant profile
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User profile retrieved successfully',
            ]);
    });

    it('allows select-merchant-type without merchant', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/select-merchant-type', [
            'type' => 'individual',
            'name' => 'My Business',
        ]);

        $response->assertStatus(201);
    });
});

describe('Registration Role', function () {
    it('assigns merchant role to newly registered users', function () {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'New',
            'last_name' => 'Merchant',
            'email' => 'newmerchant@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'newmerchant@example.com')->first();
        expect($user->hasRole('merchant'))->toBeTrue();
        expect($user->hasRole('user'))->toBeFalse();
    });
});
