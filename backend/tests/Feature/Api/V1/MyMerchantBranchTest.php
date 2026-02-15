<?php

use App\Models\Merchant;
use App\Models\MerchantStatusLog;
use App\Models\User;
use App\Services\Contracts\EmailVerificationServiceInterface;
use Illuminate\Support\Facades\Mail;
use Laravel\Passport\Passport;

beforeEach(function () {
    // Organization merchant user (the happy path)
    $this->orgUser = User::factory()->create();
    $this->orgUser->assignRole('merchant');
    $this->orgMerchant = Merchant::factory()->active()->organization()->create([
        'user_id' => $this->orgUser->id,
        'can_sell_products' => true,
        'can_take_bookings' => true,
        'can_rent_units' => false,
    ]);

    // Individual merchant user (should not be able to manage branches)
    $this->individualUser = User::factory()->create();
    $this->individualUser->assignRole('merchant');
    $this->individualMerchant = Merchant::factory()->active()->individual()->create([
        'user_id' => $this->individualUser->id,
    ]);

    // Other org merchant user (for scoping tests)
    $this->otherOrgUser = User::factory()->create();
    $this->otherOrgUser->assignRole('merchant');
    $this->otherOrgMerchant = Merchant::factory()->active()->organization()->create([
        'user_id' => $this->otherOrgUser->id,
    ]);
});

describe('Branch List', function () {
    it('returns paginated branches for organization merchant', function () {
        Merchant::factory()->count(3)->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson('/api/v1/auth/merchant/branches');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data');
    });

    it('returns empty list when no branches exist', function () {
        Passport::actingAs($this->orgUser);

        $response = $this->getJson('/api/v1/auth/merchant/branches');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    });

    it('returns 422 for individual-type merchant', function () {
        Passport::actingAs($this->individualUser);

        $response = $this->getJson('/api/v1/auth/merchant/branches');

        $response->assertStatus(422);
    });

    it('does not return branches from other merchants', function () {
        Merchant::factory()->count(2)->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
        ]);
        Merchant::factory()->count(3)->create([
            'parent_id' => $this->otherOrgMerchant->id,
            'user_id' => null,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson('/api/v1/auth/merchant/branches');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    });

    it('supports search filter', function () {
        Merchant::factory()->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
            'name' => 'Downtown Branch',
        ]);
        Merchant::factory()->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
            'name' => 'Uptown Location',
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson('/api/v1/auth/merchant/branches?filter[search]=Downtown');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Downtown Branch');
    });

    it('supports sorting by name', function () {
        Merchant::factory()->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
            'name' => 'Zebra Branch',
        ]);
        Merchant::factory()->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
            'name' => 'Alpha Branch',
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson('/api/v1/auth/merchant/branches?sort=name');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Alpha Branch');
    });
});

describe('Branch Show', function () {
    it('returns a single branch', function () {
        $branch = Merchant::factory()->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
            'name' => 'Test Branch',
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson("/api/v1/auth/merchant/branches/{$branch->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $branch->id,
                    'name' => 'Test Branch',
                ],
            ]);
    });

    it('returns 404 for branch belonging to another merchant', function () {
        $otherBranch = Merchant::factory()->create([
            'parent_id' => $this->otherOrgMerchant->id,
            'user_id' => null,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson("/api/v1/auth/merchant/branches/{$otherBranch->id}");

        $response->assertStatus(404);
    });

    it('returns 404 for nonexistent branch', function () {
        Passport::actingAs($this->orgUser);

        $response = $this->getJson('/api/v1/auth/merchant/branches/99999');

        $response->assertStatus(404);
    });
});

describe('Branch Create', function () {
    it('creates a branch with user account successfully', function () {
        Mail::fake();
        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'New Branch Location',
            'user_name' => 'Branch Manager',
            'user_email' => 'branchmanager@example.com',
            'user_password' => 'password123',
            'description' => 'A new branch',
            'contact_email' => 'branch@example.com',
            'contact_phone' => '09123456789',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Branch created successfully',
                'data' => [
                    'name' => 'New Branch Location',
                    'description' => 'A new branch',
                    'contact_email' => 'branch@example.com',
                    'status' => 'active',
                ],
            ]);
    });

    it('creates user account with correct email and branch-merchant role', function () {
        Mail::fake();
        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Role Test Branch',
            'user_name' => 'Branch User',
            'user_email' => 'branchuser@example.com',
            'user_password' => 'password123',
        ]);

        $response->assertStatus(201);

        $branchUser = User::where('email', 'branchuser@example.com')->first();
        expect($branchUser)->not->toBeNull();
        expect($branchUser->name)->toBe('Branch User');
        expect($branchUser->hasRole('branch-merchant'))->toBeTrue();
        expect($branchUser->email_verified_at)->toBeNull();
    });

    it('auto-sets branch to active status with approved_at', function () {
        Mail::fake();
        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Auto-Active Branch',
            'user_name' => 'Manager',
            'user_email' => 'autoactive@example.com',
            'user_password' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'parent_id' => $this->orgMerchant->id,
                    'type' => 'individual',
                    'status' => 'active',
                ],
            ]);

        $branchId = $response->json('data.id');
        $branch = Merchant::find($branchId);
        expect($branch->approved_at)->not->toBeNull();
    });

    it('does not send OTP email on branch creation', function () {
        $mockService = Mockery::mock(EmailVerificationServiceInterface::class);
        $mockService->shouldNotReceive('generateAndSendOtp');
        $this->app->instance(EmailVerificationServiceInterface::class, $mockService);

        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'No OTP Branch',
            'user_name' => 'No OTP User',
            'user_email' => 'nootp@example.com',
            'user_password' => 'password123',
        ]);

        $response->assertStatus(201);
    });

    it('inherits capabilities from parent', function () {
        Mail::fake();
        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Inherited Branch',
            'user_name' => 'Manager',
            'user_email' => 'inherited@example.com',
            'user_password' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => true,
                    'can_rent_units' => false,
                ],
            ]);
    });

    it('sets contact_email from user_email when not provided', function () {
        Mail::fake();
        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Contact Fallback Branch',
            'user_name' => 'Manager',
            'user_email' => 'fallback@example.com',
            'user_password' => 'password123',
        ]);

        $response->assertStatus(201);

        $branchId = $response->json('data.id');
        $branch = Merchant::find($branchId);
        expect($branch->contact_email)->toBe('fallback@example.com');
    });

    it('creates a status log entry with active status', function () {
        Mail::fake();
        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Logged Branch',
            'user_name' => 'Manager',
            'user_email' => 'logged@example.com',
            'user_password' => 'password123',
        ]);

        $branchId = $response->json('data.id');
        expect(MerchantStatusLog::where('merchant_id', $branchId)->count())->toBe(1);
        $log = MerchantStatusLog::where('merchant_id', $branchId)->first();
        expect($log->to_status)->toBe('active');
        expect($log->reason)->toBe('Branch created with user account');
    });

    it('returns 422 for individual-type merchant', function () {
        Passport::actingAs($this->individualUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Should Fail',
            'user_name' => 'Manager',
            'user_email' => 'fail@example.com',
            'user_password' => 'password123',
        ]);

        $response->assertStatus(422);
    });

    it('requires name, user_name, user_email, and user_password', function () {
        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'user_name', 'user_email', 'user_password']);
    });

    it('rejects duplicate user_email', function () {
        $existingUser = User::factory()->create(['email' => 'taken@example.com']);

        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Dupe Email Branch',
            'user_name' => 'Manager',
            'user_email' => 'taken@example.com',
            'user_password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('user_email');
    });

    it('creates branch with address', function () {
        Mail::fake();
        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Branch With Address',
            'user_name' => 'Manager',
            'user_email' => 'address@example.com',
            'user_password' => 'password123',
            'address' => [
                'street' => '123 Main St',
                'postal_code' => '1234',
            ],
        ]);

        $response->assertStatus(201);

        $branchId = $response->json('data.id');
        $branch = Merchant::find($branchId);
        expect($branch->address)->not->toBeNull();
        expect($branch->address->street)->toBe('123 Main St');
    });

    it('allows branch user to login and access my merchant endpoint', function () {
        Passport::actingAs($this->orgUser);

        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Login Test Branch',
            'user_name' => 'Branch Login User',
            'user_email' => 'logintest@example.com',
            'user_password' => 'password123',
        ]);

        $response->assertStatus(201);
        $branchId = $response->json('data.id');

        // Now login as the branch user
        $branchUser = User::where('email', 'logintest@example.com')->first();
        expect($branchUser->hasRole('branch-merchant'))->toBeTrue();
        // Manually verify email for this test (branch user needs to verify in real flow)
        $branchUser->update(['email_verified_at' => now()]);

        Passport::actingAs($branchUser);

        $merchantResponse = $this->getJson('/api/v1/auth/merchant');

        $merchantResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $branchId,
                    'name' => 'Login Test Branch',
                ],
            ]);
    });
});

describe('Branch Update', function () {
    it('updates branch name and description', function () {
        $branch = Merchant::factory()->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->putJson("/api/v1/auth/merchant/branches/{$branch->id}", [
            'name' => 'Updated Branch Name',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Branch Name',
                    'description' => 'Updated description',
                ],
            ]);
    });

    it('cannot update branch from another merchant', function () {
        $otherBranch = Merchant::factory()->create([
            'parent_id' => $this->otherOrgMerchant->id,
            'user_id' => null,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->putJson("/api/v1/auth/merchant/branches/{$otherBranch->id}", [
            'name' => 'Should Not Update',
        ]);

        $response->assertStatus(404);
    });

    it('updates branch address', function () {
        $branch = Merchant::factory()->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->putJson("/api/v1/auth/merchant/branches/{$branch->id}", [
            'address' => [
                'street' => '456 Updated St',
                'postal_code' => '5678',
            ],
        ]);

        $response->assertStatus(200);

        $branch->refresh();
        expect($branch->address)->not->toBeNull();
        expect($branch->address->street)->toBe('456 Updated St');
    });
});

describe('Branch Delete', function () {
    it('deletes a branch successfully', function () {
        $branch = Merchant::factory()->create([
            'parent_id' => $this->orgMerchant->id,
            'user_id' => null,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->deleteJson("/api/v1/auth/merchant/branches/{$branch->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Branch deleted successfully',
            ]);

        expect(Merchant::find($branch->id))->toBeNull();
    });

    it('deletes associated user account when branch has user', function () {
        Mail::fake();
        Passport::actingAs($this->orgUser);

        // Create a branch with user
        $response = $this->postJson('/api/v1/auth/merchant/branches', [
            'name' => 'Delete User Branch',
            'user_name' => 'To Delete',
            'user_email' => 'deleteuser@example.com',
            'user_password' => 'password123',
        ]);

        $branchId = $response->json('data.id');
        $branch = Merchant::find($branchId);
        $branchUserId = $branch->user_id;

        expect(User::find($branchUserId))->not->toBeNull();

        // Now delete the branch
        $deleteResponse = $this->deleteJson("/api/v1/auth/merchant/branches/{$branchId}");

        $deleteResponse->assertStatus(200);
        expect(Merchant::find($branchId))->toBeNull();
        expect(User::find($branchUserId))->toBeNull();
    });

    it('returns 422 when trying to delete branch from another merchant', function () {
        $otherBranch = Merchant::factory()->create([
            'parent_id' => $this->otherOrgMerchant->id,
            'user_id' => null,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->deleteJson("/api/v1/auth/merchant/branches/{$otherBranch->id}");

        $response->assertStatus(422);
    });
});

describe('Branch Auth', function () {
    it('returns 401 for unauthenticated user', function () {
        $response = $this->getJson('/api/v1/auth/merchant/branches');

        $response->assertStatus(401);
    });
});
