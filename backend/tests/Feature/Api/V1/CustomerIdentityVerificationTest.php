<?php

use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;

describe('CustomerIdentityVerification', function () {

    describe('POST /customer/my/identity-document', function () {
        it('can upload identity document', function () {
            Storage::fake('media');

            $user = User::factory()->create();
            $user->assignRole('customer');
            $customer = Customer::factory()->create(['user_id' => $user->id]);
            Passport::actingAs($user);

            $file = UploadedFile::fake()->image('test-id.jpg');

            $response = $this->postJson('/api/v1/customer/my/identity-document', [
                'document' => $file,
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Identity document uploaded successfully',
                    'data' => [
                        'identity_document_status' => 'pending',
                    ],
                ]);
        });

        it('updates status to pending after upload', function () {
            Storage::fake('media');

            $user = User::factory()->create();
            $user->assignRole('customer');
            $customer = Customer::factory()->create([
                'user_id' => $user->id,
                'identity_document_status' => 'none',
            ]);
            Passport::actingAs($user);

            $file = UploadedFile::fake()->image('id-photo.jpg');

            $this->postJson('/api/v1/customer/my/identity-document', [
                'document' => $file,
            ]);

            expect($customer->fresh()->identity_document_status)->toBe('pending');
        });

        it('requires authentication', function () {
            app('auth')->forgetGuards();

            $response = $this->postJson('/api/v1/customer/my/identity-document', [
                'document' => UploadedFile::fake()->image('test.jpg'),
            ]);

            $response->assertStatus(401);
        });

        it('requires customer_portal.view_own permission', function () {
            $user = User::factory()->create();
            $user->assignRole('user');
            Passport::actingAs($user);

            $response = $this->postJson('/api/v1/customer/my/identity-document', [
                'document' => UploadedFile::fake()->image('test.jpg'),
            ]);

            $response->assertStatus(403);
        });

        it('validates document is required', function () {
            $user = User::factory()->create();
            $user->assignRole('customer');
            Customer::factory()->create(['user_id' => $user->id]);
            Passport::actingAs($user);

            $response = $this->postJson('/api/v1/customer/my/identity-document', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['document']);
        });

        it('validates document mime type', function () {
            $user = User::factory()->create();
            $user->assignRole('customer');
            Customer::factory()->create(['user_id' => $user->id]);
            Passport::actingAs($user);

            $file = UploadedFile::fake()->create('test.txt', 100, 'text/plain');

            $response = $this->postJson('/api/v1/customer/my/identity-document', [
                'document' => $file,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['document']);
        });

        it('accepts pdf documents', function () {
            Storage::fake('media');

            $user = User::factory()->create();
            $user->assignRole('customer');
            Customer::factory()->create(['user_id' => $user->id]);
            Passport::actingAs($user);

            $file = UploadedFile::fake()->create('document.pdf', 1024, 'application/pdf');

            $response = $this->postJson('/api/v1/customer/my/identity-document', [
                'document' => $file,
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'identity_document_status' => 'pending',
                    ],
                ]);
        });

        it('rejects files exceeding max size', function () {
            $user = User::factory()->create();
            $user->assignRole('customer');
            Customer::factory()->create(['user_id' => $user->id]);
            Passport::actingAs($user);

            // 5120 KB = 5 MB max; create a file slightly over that
            $file = UploadedFile::fake()->create('large.jpg', 5121, 'image/jpeg');

            $response = $this->postJson('/api/v1/customer/my/identity-document', [
                'document' => $file,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['document']);
        });
    });

    describe('PATCH /customers/{id}/verify-identity', function () {
        beforeEach(function () {
            $this->admin = User::factory()->create();
            $this->admin->assignRole('admin');
            Passport::actingAs($this->admin);
        });

        it('can verify customer identity', function () {
            $customer = Customer::factory()->create([
                'identity_document_status' => 'pending',
                'identity_verified_at' => null,
            ]);

            $response = $this->patchJson("/api/v1/customers/{$customer->id}/verify-identity");

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Identity verified successfully',
                    'data' => [
                        'id' => $customer->id,
                        'identity_document_status' => 'approved',
                    ],
                ]);

            $fresh = $customer->fresh();
            expect($fresh->identity_document_status)->toBe('approved');
            expect($fresh->identity_verified_at)->not->toBeNull();
        });

        it('sets identity_verified_at timestamp on approval', function () {
            $customer = Customer::factory()->create([
                'identity_document_status' => 'pending',
                'identity_verified_at' => null,
            ]);

            $this->patchJson("/api/v1/customers/{$customer->id}/verify-identity");

            $fresh = $customer->fresh();
            expect($fresh->identity_verified_at)->not->toBeNull();
            expect($fresh->identity_document_status)->toBe('approved');
        });

        it('requires customers.update permission', function () {
            $customerUser = User::factory()->create();
            $customerUser->assignRole('customer');
            $customer = Customer::factory()->create(['user_id' => $customerUser->id]);
            Passport::actingAs($customerUser);

            $response = $this->patchJson("/api/v1/customers/{$customer->id}/verify-identity");

            $response->assertStatus(403);
        });

        it('requires authentication', function () {
            app('auth')->forgetGuards();
            $customer = Customer::factory()->create();

            $response = $this->patchJson("/api/v1/customers/{$customer->id}/verify-identity");

            $response->assertStatus(401);
        });

        it('returns 404 for non-existent customer', function () {
            $response = $this->patchJson('/api/v1/customers/99999/verify-identity');

            $response->assertStatus(404);
        });
    });

    describe('PATCH /customers/{id}/reject-identity', function () {
        beforeEach(function () {
            $this->admin = User::factory()->create();
            $this->admin->assignRole('admin');
            Passport::actingAs($this->admin);
        });

        it('can reject customer identity', function () {
            $customer = Customer::factory()->create([
                'identity_document_status' => 'pending',
                'identity_verified_at' => null,
            ]);

            $response = $this->patchJson("/api/v1/customers/{$customer->id}/reject-identity");

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Identity rejected successfully',
                    'data' => [
                        'id' => $customer->id,
                        'identity_document_status' => 'rejected',
                    ],
                ]);

            $fresh = $customer->fresh();
            expect($fresh->identity_document_status)->toBe('rejected');
            expect($fresh->identity_verified_at)->toBeNull();
        });

        it('can reject with a reason', function () {
            $customer = Customer::factory()->create([
                'identity_document_status' => 'pending',
            ]);

            $response = $this->patchJson("/api/v1/customers/{$customer->id}/reject-identity", [
                'reason' => 'Document is blurry and unreadable',
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'identity_document_status' => 'rejected',
                    ],
                ]);

            expect($customer->fresh()->identity_document_status)->toBe('rejected');
        });

        it('clears identity_verified_at on rejection', function () {
            $customer = Customer::factory()->create([
                'identity_document_status' => 'approved',
                'identity_verified_at' => now(),
            ]);

            $this->patchJson("/api/v1/customers/{$customer->id}/reject-identity");

            $fresh = $customer->fresh();
            expect($fresh->identity_document_status)->toBe('rejected');
            expect($fresh->identity_verified_at)->toBeNull();
        });

        it('validates reason max length', function () {
            $customer = Customer::factory()->create();

            $response = $this->patchJson("/api/v1/customers/{$customer->id}/reject-identity", [
                'reason' => str_repeat('x', 501),
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['reason']);
        });

        it('requires customers.update permission', function () {
            $customerUser = User::factory()->create();
            $customerUser->assignRole('customer');
            $customer = Customer::factory()->create(['user_id' => $customerUser->id]);
            Passport::actingAs($customerUser);

            $response = $this->patchJson("/api/v1/customers/{$customer->id}/reject-identity");

            $response->assertStatus(403);
        });

        it('requires authentication', function () {
            app('auth')->forgetGuards();
            $customer = Customer::factory()->create();

            $response = $this->patchJson("/api/v1/customers/{$customer->id}/reject-identity");

            $response->assertStatus(401);
        });

        it('returns 404 for non-existent customer', function () {
            $response = $this->patchJson('/api/v1/customers/99999/reject-identity');

            $response->assertStatus(404);
        });
    });
});
