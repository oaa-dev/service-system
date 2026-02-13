<?php

use App\Mail\OtpMail;
use App\Models\EmailVerification;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Mail;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

describe('Verify OTP', function () {
    it('can verify email with valid OTP', function () {
        Mail::fake();

        $user = User::factory()->unverified()->create();
        $user->assignRole('merchant');
        Passport::actingAs($user);

        // Resend OTP to generate a verification record
        $this->postJson('/api/v1/auth/resend-otp')->assertStatus(200);

        // Capture OTP from the mailed OtpMail
        Mail::assertSent(OtpMail::class, function (OtpMail $mail) use (&$capturedOtp) {
            $capturedOtp = $mail->otp;

            return true;
        });

        expect($capturedOtp)->not->toBeNull();

        // Verify with captured OTP
        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'otp' => $capturedOtp,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Email verified successfully',
            ]);

        $user->refresh();
        expect($user->email_verified_at)->not->toBeNull();
    });

    it('rejects invalid OTP', function () {
        Mail::fake();

        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        // Generate an OTP
        $this->postJson('/api/v1/auth/resend-otp');

        // Submit wrong OTP
        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'otp' => '000000',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        $user->refresh();
        expect($user->email_verified_at)->toBeNull();
    });

    it('rejects expired OTP', function () {
        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        // Create an expired verification record
        EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->subMinutes(1),
            'attempted_count' => 0,
            'last_resent_at' => now()->subMinutes(11),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'otp' => '123456',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);
    });

    it('locks after 3 failed attempts', function () {
        Mail::fake();

        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        // Generate OTP
        $this->postJson('/api/v1/auth/resend-otp');

        // Submit wrong OTP 3 times
        $this->postJson('/api/v1/auth/verify-otp', ['otp' => '000001']);
        $this->postJson('/api/v1/auth/verify-otp', ['otp' => '000002']);
        $response = $this->postJson('/api/v1/auth/verify-otp', ['otp' => '000003']);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        // Verify locked_until is set
        $verification = EmailVerification::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        expect($verification->locked_until)->not->toBeNull();
        expect($verification->locked_until->isFuture())->toBeTrue();
    });

    it('rejects verification when locked out', function () {
        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        // Create a locked verification record
        EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 3,
            'locked_until' => now()->addMinutes(30),
            'last_resent_at' => now()->subMinutes(6),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'otp' => '123456',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);
    });

    it('validates OTP format', function () {
        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'otp' => 'abcdef',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);
    });

    it('rejects if already verified', function () {
        $user = User::factory()->create(); // Factory default has email_verified_at set
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'otp' => '123456',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);
    });

    it('requires authentication', function () {
        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'otp' => '123456',
        ]);

        $response->assertStatus(401);
    });
});

describe('Resend OTP', function () {
    it('can resend OTP', function () {
        Mail::fake();

        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/resend-otp');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Verification code sent successfully',
            ]);

        Mail::assertSent(OtpMail::class, function (OtpMail $mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    });

    it('enforces 5-minute cooldown', function () {
        Mail::fake();

        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        // First resend should succeed
        $this->postJson('/api/v1/auth/resend-otp')->assertStatus(200);

        // Second resend immediately should fail
        $response = $this->postJson('/api/v1/auth/resend-otp');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);
    });

    it('allows resend after cooldown expires', function () {
        Mail::fake();

        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        // Create a verification record with last_resent_at 6 minutes ago
        EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(4),
            'attempted_count' => 0,
            'last_resent_at' => now()->subMinutes(6),
        ]);

        $response = $this->postJson('/api/v1/auth/resend-otp');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Verification code sent successfully',
            ]);
    });

    it('rejects resend if already verified', function () {
        $user = User::factory()->create(); // Factory default has email_verified_at set
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/auth/resend-otp');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);
    });

    it('requires authentication', function () {
        $response = $this->postJson('/api/v1/auth/resend-otp');

        $response->assertStatus(401);
    });
});

describe('Verification Status', function () {
    it('returns verified status for verified user', function () {
        $user = User::factory()->create(); // Factory default has email_verified_at set
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/auth/verification-status');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Verification status retrieved',
                'data' => [
                    'is_verified' => true,
                    'can_resend' => true,
                    'locked_until' => null,
                    'expires_at' => null,
                ],
            ]);
    });

    it('returns unverified status with metadata', function () {
        Mail::fake();

        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        // Generate an OTP first
        $this->postJson('/api/v1/auth/resend-otp');

        $response = $this->getJson('/api/v1/auth/verification-status');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'is_verified' => false,
                    'can_resend' => false, // Just sent, so cooldown active
                ],
            ]);

        // expires_at should be present (not null)
        $data = $response->json('data');
        expect($data['expires_at'])->not->toBeNull();
    });

    it('requires authentication', function () {
        $response = $this->getJson('/api/v1/auth/verification-status');

        $response->assertStatus(401);
    });
});

describe('Verification Middleware', function () {
    it('blocks unverified users from protected routes', function () {
        $user = User::factory()->unverified()->create();
        $user->assignRole('super-admin');
        Passport::actingAs($user);

        // Try to access a protected route (users list)
        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(403);
    });

    it('allows verified users to access protected routes', function () {
        $user = User::factory()->create(); // Verified by default
        $user->assignRole('super-admin');
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(200);
    });

    it('allows unverified users to access auth endpoints', function () {
        $user = User::factory()->unverified()->create();
        Passport::actingAs($user);

        // GET auth/me should work without verification
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User profile retrieved successfully',
            ]);
    });
});

describe('Registration Integration', function () {
    it('sends OTP email on registration', function () {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'New',
            'last_name' => 'User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'requires_verification' => true,
                ],
            ]);

        Mail::assertSent(OtpMail::class, function (OtpMail $mail) {
            return $mail->hasTo('newuser@example.com');
        });

        // Verify user's email is not verified after registration
        $user = User::where('email', 'newuser@example.com')->first();
        expect($user->email_verified_at)->toBeNull();
    });
});
