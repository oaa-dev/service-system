<?php

use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('User Index', function () {
    it('can list all users', function () {
        User::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'email', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter users by name', function () {
        User::factory()->create(['name' => 'John Doe']);
        User::factory()->create(['name' => 'Jane Smith']);

        $response = $this->getJson('/api/v1/users?filter[name]=John');

        $response->assertStatus(200);
        $data = $response->json('data');
        $filteredUsers = collect($data)->filter(fn ($u) => str_contains($u['name'], 'John'));
        expect($filteredUsers)->toHaveCount(1);
        expect($filteredUsers->first()['name'])->toBe('John Doe');
    });

    it('can filter users by email', function () {
        User::factory()->create(['email' => 'john@example.com']);
        User::factory()->create(['email' => 'jane@example.com']);

        $response = $this->getJson('/api/v1/users?filter[email]=john');

        $response->assertStatus(200);
        $data = $response->json('data');
        $filteredUsers = collect($data)->filter(fn ($u) => str_contains($u['email'], 'john'));
        expect($filteredUsers)->toHaveCount(1);
        expect($filteredUsers->first()['email'])->toBe('john@example.com');
    });

    it('can sort users by created_at', function () {
        // Create users with specific timestamps
        $olderUser = User::factory()->create([
            'name' => 'Older User',
            'created_at' => now()->subDays(5),
        ]);
        $newerUser = User::factory()->create([
            'name' => 'Newer User',
            'created_at' => now()->subDay(),
        ]);

        // Default sort is -created_at (newest first)
        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(200);
        $data = $response->json('data');

        // Verify response contains both users
        $names = collect($data)->pluck('name');
        expect($names)->toContain('Newer User');
        expect($names)->toContain('Older User');
    });

    it('can paginate users', function () {
        User::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/users?per_page=5');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });

    it('returns unauthorized when not authenticated', function () {
        $this->app['auth']->forgetGuards();

        $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/users');

        $response->assertStatus(401);
    });
});

describe('User Show', function () {
    it('can show a specific user', function () {
        $user = User::factory()->create();

        $response = $this->getJson("/api/v1/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User retrieved successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ]);
    });

    it('returns 404 for non-existent user', function () {
        $response = $this->getJson('/api/v1/users/99999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
            ]);
    });
});

describe('User Store', function () {
    it('can create a new user', function () {
        $response = $this->postJson('/api/v1/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'User created successfully',
                'data' => [
                    'name' => 'New User',
                    'email' => 'newuser@example.com',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/users', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    });

    it('validates email uniqueness', function () {
        $existingUser = User::factory()->create();

        $response = $this->postJson('/api/v1/users', [
            'name' => 'New User',
            'email' => $existingUser->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });
});

describe('User Update', function () {
    it('can update an existing user', function () {
        $user = User::factory()->create();

        $response = $this->putJson("/api/v1/users/{$user->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => [
                    'name' => 'Updated Name',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);
    });

    it('can update user email', function () {
        $user = User::factory()->create();

        $response = $this->putJson("/api/v1/users/{$user->id}", [
            'email' => 'newemail@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'email' => 'newemail@example.com',
                ],
            ]);
    });

    it('validates email uniqueness on update', function () {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $response = $this->putJson("/api/v1/users/{$user1->id}", [
            'email' => $user2->email,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('returns 404 for non-existent user', function () {
        $response = $this->putJson('/api/v1/users/99999', [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(404);
    });
});

describe('User Delete', function () {
    it('can delete a user', function () {
        $user = User::factory()->create();

        $response = $this->deleteJson("/api/v1/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User deleted successfully',
            ]);

        $this->assertDatabaseMissing('users', [
            'id' => $user->id,
        ]);
    });

    it('returns 404 for non-existent user', function () {
        $response = $this->deleteJson('/api/v1/users/99999');

        $response->assertStatus(404);
    });
});
