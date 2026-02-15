<?php

use App\Models\Merchant;
use App\Models\User;
use App\Notifications\MerchantApplicationSubmittedNotification;
use App\Notifications\MerchantStatusChangedNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Notification;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->merchantUser = User::factory()->create(['email_verified_at' => now()]);
    $this->merchantUser->assignRole('merchant');
    $this->merchant = Merchant::factory()->create([
        'user_id' => $this->merchantUser->id,
        'status' => 'pending',
    ]);
});

describe('Submit Application', function () {
    it('can submit application when pending and not yet submitted', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/submit-application');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->merchant->refresh();
        expect($this->merchant->submitted_at)->not->toBeNull();
        expect($this->merchant->status)->toBe('submitted');
    });

    it('creates a status log entry on submit', function () {
        Passport::actingAs($this->merchantUser);

        $this->postJson('/api/v1/auth/merchant/submit-application')->assertOk();

        $this->assertDatabaseHas('merchant_status_logs', [
            'merchant_id' => $this->merchant->id,
            'from_status' => 'pending',
            'to_status' => 'submitted',
        ]);
    });

    it('returns validation error when already submitted', function () {
        $this->merchant->update(['submitted_at' => now(), 'status' => 'submitted']);
        Passport::actingAs($this->merchantUser);

        $this->postJson('/api/v1/auth/merchant/submit-application')
            ->assertStatus(422);
    });

    it('can re-submit application when rejected', function () {
        $this->merchant->update([
            'status' => 'rejected',
            'status_reason' => 'Incomplete documents',
            'submitted_at' => now()->subDays(3),
        ]);
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/submit-application');
        $response->assertOk();

        $this->merchant->refresh();
        expect($this->merchant->status)->toBe('submitted');
        expect($this->merchant->status_reason)->toBeNull();

        $this->assertDatabaseHas('merchant_status_logs', [
            'merchant_id' => $this->merchant->id,
            'from_status' => 'rejected',
            'to_status' => 'submitted',
        ]);
    });

    it('returns validation error when status is not pending or rejected', function () {
        $this->merchant->update(['status' => 'approved', 'approved_at' => now()]);
        Passport::actingAs($this->merchantUser);

        $this->postJson('/api/v1/auth/merchant/submit-application')
            ->assertStatus(422);
    });

    it('returns 404 when user has no merchant', function () {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole('admin');
        Passport::actingAs($user);

        $this->postJson('/api/v1/auth/merchant/submit-application')
            ->assertNotFound();
    });

    it('notifies admin users when application is submitted', function () {
        Notification::fake();

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        Passport::actingAs($this->merchantUser);

        $this->postJson('/api/v1/auth/merchant/submit-application')->assertOk();

        Notification::assertSentTo($admin, MerchantApplicationSubmittedNotification::class);
        Notification::assertSentTo($superAdmin, MerchantApplicationSubmittedNotification::class);
    });

    it('requires authentication', function () {
        $this->postJson('/api/v1/auth/merchant/submit-application')
            ->assertUnauthorized();
    });
});

describe('Status Change Notifications', function () {
    it('sends notification to merchant user on status change', function () {
        Notification::fake();

        $this->merchant->update(['status' => 'submitted', 'submitted_at' => now()]);

        $admin = User::factory()->create();
        $admin->assignRole('super-admin');
        Passport::actingAs($admin);

        $this->patchJson("/api/v1/merchants/{$this->merchant->id}/status", [
            'status' => 'approved',
        ])->assertOk();

        Notification::assertSentTo($this->merchantUser, MerchantStatusChangedNotification::class);
    });

    it('clears submitted_at when transitioning from rejected to pending', function () {
        $admin = User::factory()->create();
        $admin->assignRole('super-admin');

        $this->merchant->update([
            'status' => 'rejected',
            'status_reason' => 'Bad docs',
            'submitted_at' => now(),
        ]);

        Passport::actingAs($admin);
        Notification::fake();

        $this->patchJson("/api/v1/merchants/{$this->merchant->id}/status", [
            'status' => 'pending',
        ])->assertOk();

        $this->merchant->refresh();
        expect($this->merchant->submitted_at)->toBeNull();
    });
});
