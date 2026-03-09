<?php

declare(strict_types=1);

use App\Models\EmailVerification;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');

    $this->merchant = User::factory()->create();
    $this->merchant->assignRole('merchant');
});

describe('OTP Management List', function () {
    it('requires authentication', function () {
        $this->getJson('/api/v1/otp-management')
            ->assertStatus(401);
    });

    it('requires otp_management.view permission', function () {
        Passport::actingAs($this->merchant);

        $this->getJson('/api/v1/otp-management')
            ->assertStatus(403);
    });

    it('can list otp records', function () {
        Passport::actingAs($this->admin);

        $user = User::factory()->create();
        EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);

        $this->getJson('/api/v1/otp-management')
            ->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'user' => ['id', 'name', 'email', 'email_verified_at'],
                        'status',
                        'expires_at',
                        'attempted_count',
                        'locked_until',
                        'last_resent_at',
                        'verified_at',
                        'created_at',
                    ],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('success', true);
    });

    it('can filter by status verified', function () {
        Passport::actingAs($this->admin);

        $verifiedUser = User::factory()->create();
        EmailVerification::create([
            'user_id' => $verifiedUser->id,
            'otp_hash' => hash('sha256', '111111'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 1,
            'verified_at' => now(),
        ]);

        $pendingUser = User::factory()->create();
        EmailVerification::create([
            'user_id' => $pendingUser->id,
            'otp_hash' => hash('sha256', '222222'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);

        $response = $this->getJson('/api/v1/otp-management?filter[status]=verified')
            ->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['status'])->toBe('verified');
        expect($data[0]['user']['id'])->toBe($verifiedUser->id);
    });

    it('can filter by status pending', function () {
        Passport::actingAs($this->admin);

        $pendingUser = User::factory()->create();
        EmailVerification::create([
            'user_id' => $pendingUser->id,
            'otp_hash' => hash('sha256', '111111'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);

        $verifiedUser = User::factory()->create();
        EmailVerification::create([
            'user_id' => $verifiedUser->id,
            'otp_hash' => hash('sha256', '222222'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 1,
            'verified_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/otp-management?filter[status]=pending')
            ->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['status'])->toBe('pending');
        expect($data[0]['user']['id'])->toBe($pendingUser->id);
    });

    it('can filter by status expired', function () {
        Passport::actingAs($this->admin);

        $expiredUser = User::factory()->create();
        EmailVerification::create([
            'user_id' => $expiredUser->id,
            'otp_hash' => hash('sha256', '111111'),
            'expires_at' => now()->subMinutes(5),
            'attempted_count' => 2,
        ]);

        $pendingUser = User::factory()->create();
        EmailVerification::create([
            'user_id' => $pendingUser->id,
            'otp_hash' => hash('sha256', '222222'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);

        $response = $this->getJson('/api/v1/otp-management?filter[status]=expired')
            ->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['status'])->toBe('expired');
        expect($data[0]['user']['id'])->toBe($expiredUser->id);
    });

    it('can filter by status locked', function () {
        Passport::actingAs($this->admin);

        $lockedUser = User::factory()->create();
        EmailVerification::create([
            'user_id' => $lockedUser->id,
            'otp_hash' => hash('sha256', '111111'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 3,
            'locked_until' => now()->addMinutes(30),
        ]);

        $pendingUser = User::factory()->create();
        EmailVerification::create([
            'user_id' => $pendingUser->id,
            'otp_hash' => hash('sha256', '222222'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);

        $response = $this->getJson('/api/v1/otp-management?filter[status]=locked')
            ->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['status'])->toBe('locked');
        expect($data[0]['user']['id'])->toBe($lockedUser->id);
    });

    it('can search by user email', function () {
        Passport::actingAs($this->admin);

        $targetUser = User::factory()->create(['email' => 'searchable-target@example.com']);
        EmailVerification::create([
            'user_id' => $targetUser->id,
            'otp_hash' => hash('sha256', '111111'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);

        $otherUser = User::factory()->create(['email' => 'other-person@example.com']);
        EmailVerification::create([
            'user_id' => $otherUser->id,
            'otp_hash' => hash('sha256', '222222'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);

        $response = $this->getJson('/api/v1/otp-management?filter[search]=searchable-target')
            ->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['user']['email'])->toBe('searchable-target@example.com');
    });

    it('can filter by date range', function () {
        Passport::actingAs($this->admin);

        $user1 = User::factory()->create();
        $inRange = EmailVerification::create([
            'user_id' => $user1->id,
            'otp_hash' => hash('sha256', '111111'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);
        EmailVerification::where('id', $inRange->id)->update(['created_at' => now()->subDays(3)]);

        $user2 = User::factory()->create();
        $outOfRange = EmailVerification::create([
            'user_id' => $user2->id,
            'otp_hash' => hash('sha256', '222222'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);
        EmailVerification::where('id', $outOfRange->id)->update(['created_at' => now()->subDays(10)]);

        $from = now()->subDays(5)->toDateString();
        $to = now()->toDateString();

        $response = $this->getJson("/api/v1/otp-management?filter[created_from]={$from}&filter[created_to]={$to}")
            ->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['user']['id'])->toBe($user1->id);
    });
});

describe('OTP Management Show', function () {
    it('can view a single otp record', function () {
        Passport::actingAs($this->admin);

        $user = User::factory()->create();
        $record = EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);

        $this->getJson("/api/v1/otp-management/{$record->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $record->id)
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'user' => ['id', 'name', 'email', 'email_verified_at'],
                    'status',
                    'expires_at',
                    'attempted_count',
                    'locked_until',
                    'last_resent_at',
                    'verified_at',
                    'created_at',
                ],
            ]);
    });
});

describe('OTP Management Verify User', function () {
    it('can manually verify a user', function () {
        Passport::actingAs($this->admin);

        $user = User::factory()->unverified()->create();
        $record = EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 1,
        ]);

        $this->postJson("/api/v1/otp-management/{$record->id}/verify")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'verified')
            ->assertJsonPath('message', 'User verified successfully');

        $record->refresh();
        expect($record->verified_at)->not->toBeNull();

        $user->refresh();
        expect($user->email_verified_at)->not->toBeNull();
    });

    it('cannot verify already verified user', function () {
        Passport::actingAs($this->admin);

        $user = User::factory()->create();
        $record = EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 1,
            'verified_at' => now(),
        ]);

        $this->postJson("/api/v1/otp-management/{$record->id}/verify")
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'User is already verified.');
    });
});

describe('OTP Management Unlock User', function () {
    it('can unlock a locked user', function () {
        Passport::actingAs($this->admin);

        $user = User::factory()->create();
        $record = EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 3,
            'locked_until' => now()->addMinutes(30),
        ]);

        $this->postJson("/api/v1/otp-management/{$record->id}/unlock")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'User unlocked successfully');

        $record->refresh();
        expect($record->locked_until)->toBeNull();
        expect($record->attempted_count)->toBe(0);
    });

    it('cannot unlock non-locked user', function () {
        Passport::actingAs($this->admin);

        $user = User::factory()->create();
        $record = EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(10),
            'attempted_count' => 0,
        ]);

        $this->postJson("/api/v1/otp-management/{$record->id}/unlock")
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'User is not locked.');
    });
});
