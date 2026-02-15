<?php

use App\Models\Merchant;
use App\Models\MerchantStatusLog;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('super-admin');
});

describe('Status Log Creation', function () {
    it('creates initial log when merchant is created via admin store', function () {
        Passport::actingAs($this->admin);

        $response = $this->postJson('/api/v1/merchants', [
            'user_first_name' => 'John',
            'user_last_name' => 'Doe',
            'user_email' => 'john@example.com',
            'user_password' => 'Password123!',
            'name' => 'Test Store',
            'type' => 'individual',
        ]);

        $response->assertStatus(201);
        $merchantId = $response->json('data.id');

        $this->assertDatabaseHas('merchant_status_logs', [
            'merchant_id' => $merchantId,
            'from_status' => null,
            'to_status' => 'pending',
        ]);
    });

    it('creates a log when merchant status is updated to approved', function () {
        Passport::actingAs($this->admin);

        $merchant = Merchant::factory()->create(['status' => 'submitted', 'submitted_at' => now()]);

        $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'approved',
        ])->assertOk();

        $this->assertDatabaseHas('merchant_status_logs', [
            'merchant_id' => $merchant->id,
            'from_status' => 'submitted',
            'to_status' => 'approved',
            'changed_by' => $this->admin->id,
        ]);
    });

    it('creates a log when merchant status is updated to rejected with reason', function () {
        Passport::actingAs($this->admin);

        $merchant = Merchant::factory()->create(['status' => 'submitted', 'submitted_at' => now()]);

        $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'rejected',
            'status_reason' => 'Incomplete documents',
        ])->assertOk();

        $this->assertDatabaseHas('merchant_status_logs', [
            'merchant_id' => $merchant->id,
            'from_status' => 'submitted',
            'to_status' => 'rejected',
            'reason' => 'Incomplete documents',
            'changed_by' => $this->admin->id,
        ]);
    });

    it('records correct from and to status through multiple transitions', function () {
        Passport::actingAs($this->admin);

        $merchant = Merchant::factory()->create(['status' => 'submitted', 'submitted_at' => now()]);

        // submitted -> approved
        $this->patchJson("/api/v1/merchants/{$merchant->id}/status", ['status' => 'approved'])->assertOk();
        // approved -> active
        $this->patchJson("/api/v1/merchants/{$merchant->id}/status", ['status' => 'active'])->assertOk();

        $logs = MerchantStatusLog::where('merchant_id', $merchant->id)->orderBy('created_at')->get();

        expect($logs)->toHaveCount(2);
        expect($logs[0]->from_status)->toBe('submitted');
        expect($logs[0]->to_status)->toBe('approved');
        expect($logs[1]->from_status)->toBe('approved');
        expect($logs[1]->to_status)->toBe('active');
    });
});

describe('Admin Status Logs Endpoint', function () {
    it('can list status logs for a merchant', function () {
        Passport::actingAs($this->admin);

        $merchant = Merchant::factory()->create(['status' => 'submitted', 'submitted_at' => now()]);

        // Update status to create logs
        $this->patchJson("/api/v1/merchants/{$merchant->id}/status", ['status' => 'approved']);

        $response = $this->getJson("/api/v1/merchants/{$merchant->id}/status-logs");

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [['id', 'merchant_id', 'from_status', 'to_status', 'reason', 'created_at']],
            ]);
    });

    it('returns logs in descending chronological order', function () {
        Passport::actingAs($this->admin);

        $merchant = Merchant::factory()->create(['status' => 'submitted', 'submitted_at' => now()]);
        $this->patchJson("/api/v1/merchants/{$merchant->id}/status", ['status' => 'approved']);
        $this->patchJson("/api/v1/merchants/{$merchant->id}/status", ['status' => 'active']);

        $response = $this->getJson("/api/v1/merchants/{$merchant->id}/status-logs");
        $data = $response->json('data');

        // Most recent (active) should be first
        expect($data[0]['to_status'])->toBe('active');
    });

    it('returns 404 for non-existent merchant', function () {
        Passport::actingAs($this->admin);

        $this->getJson('/api/v1/merchants/99999/status-logs')->assertNotFound();
    });
});

describe('Self-Service Status Logs Endpoint', function () {
    it('can list status logs for own merchant', function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $merchant = Merchant::factory()->create(['user_id' => $merchantUser->id]);
        Passport::actingAs($merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/status-logs');

        $response->assertOk()
            ->assertJsonStructure(['success', 'data']);
    });

    it('returns 404 when user has no merchant', function () {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole('admin');
        Passport::actingAs($user);

        $this->getJson('/api/v1/auth/merchant/status-logs')->assertNotFound();
    });

    it('requires authentication', function () {
        $this->getJson('/api/v1/auth/merchant/status-logs')->assertUnauthorized();
    });
});
