<?php

use App\Mail\OtpMail;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Mail;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

describe('Auth Registration', function () {
    it('can register a new user', function () {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'first_name', 'last_name', 'created_at', 'updated_at'],
                    'access_token',
                    'token_type',
                    'requires_verification',
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'User registered successfully. Please verify your email.',
                'data' => [
                    'user' => [
                        'name' => 'Test User',
                        'first_name' => 'Test',
                        'last_name' => 'User',
                    ],
                    'requires_verification' => true,
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->assertDatabaseHas('user_profiles', [
            'first_name' => 'Test',
            'last_name' => 'User',
        ]);
    });

    it('validates required fields for registration', function () {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'password']);
    });

    it('validates email uniqueness for verified users', function () {
        // Create a verified user — registration with this email should be blocked
        User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('resends OTP when registering with unverified email', function () {
        Mail::fake();

        // First registration — creates the user and sends OTP
        $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'unverified@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(201)
            ->assertJson([
                'message' => 'User registered successfully. Please verify your email.',
            ]);

        Mail::assertSent(OtpMail::class, 1);

        // Second registration with the same unverified email — should resend OTP, not error
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Another',
            'last_name' => 'Name',
            'email' => 'unverified@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email'],
                    'access_token',
                    'token_type',
                    'requires_verification',
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Verification code resent. Please verify your email.',
                'data' => [
                    'requires_verification' => true,
                    'user' => [
                        'email' => 'unverified@example.com',
                    ],
                ],
            ]);

        // OTP email should have been sent twice total (once per registration attempt)
        Mail::assertSent(OtpMail::class, 2);

        // Only one user should exist in the database (not duplicated)
        expect(User::where('email', 'unverified@example.com')->count())->toBe(1);
    });

    it('validates password confirmation', function () {
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different_password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    });
});

describe('Auth Login', function () {
    it('can login with valid credentials', function () {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email'],
                    'access_token',
                    'token_type',
                    'requires_verification',
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Login successful',
            ]);
    });

    it('returns error with invalid credentials', function () {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid credentials',
            ]);
    });

    it('validates required fields for login', function () {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    });
});

describe('Auth Profile', function () {
    it('can get authenticated user profile', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User profile retrieved successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ]);
    });

    it('returns unauthorized when not authenticated', function () {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    });

    it('can update first and last name', function () {
        $user = User::factory()->create();
        $user->assignRole('super-admin');
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/auth/me', [
            'first_name' => 'John',
            'last_name' => 'Smith',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'name' => 'John Smith',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'John Smith',
        ]);

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'first_name' => 'John',
            'last_name' => 'Smith',
        ]);
    });
});

describe('Auth Logout', function () {
    it('can logout authenticated user', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logged out successfully',
            ]);
    });

    it('returns unauthorized when not authenticated', function () {
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(401);
    });
});
