<?php

use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramTier;
use App\Models\Merchant;
use App\Models\User;
use Laravel\Passport\Passport;

/*
|--------------------------------------------------------------------------
| Merchant Loyalty Program CRUD (Self-Service)
|--------------------------------------------------------------------------
*/
describe('Merchant Loyalty Program CRUD', function () {
    beforeEach(function () {
        $this->merchantUser = User::factory()->create();
        $this->merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'status' => 'active',
        ]);

        Passport::actingAs($this->merchantUser);
    });

    it('can create a loyalty program with tiers', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty-program', [
            'name' => 'Buy 10 Get 1 Free',
            'description' => 'Earn stamps and get rewards!',
            'required_stamps' => 10,
            'tiers' => [
                [
                    'required_stamps' => 5,
                    'reward_type' => 'discount_percentage',
                    'reward_value' => 10,
                    'reward_description' => '10% off your next purchase',
                ],
                [
                    'required_stamps' => 10,
                    'reward_type' => 'free_product',
                    'reward_description' => 'FREE regular coffee',
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Loyalty program saved.',
            ])
            ->assertJsonPath('data.name', 'Buy 10 Get 1 Free')
            ->assertJsonPath('data.required_stamps', 10)
            ->assertJsonPath('data.is_active', true)
            ->assertJsonCount(2, 'data.tiers');

        expect(LoyaltyProgram::count())->toBe(1);
        expect(LoyaltyProgramTier::count())->toBe(2);
    });

    it('can create a discount percentage tier', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty-program', [
            'name' => '20% Off After 5 Stamps',
            'required_stamps' => 5,
            'tiers' => [
                [
                    'required_stamps' => 5,
                    'reward_type' => 'discount_percentage',
                    'reward_value' => 20,
                    'reward_description' => '20% off your next purchase',
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.tiers.0.reward_type', 'discount_percentage')
            ->assertJsonPath('data.tiers.0.reward_value', '20.00');
    });

    it('can view my loyalty program with tiers', function () {
        $program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
            'name' => 'Test Program',
            'required_stamps' => 10,
            'is_active' => true,
        ]);

        LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $program->id,
            'required_stamps' => 10,
            'reward_type' => 'free_product',
            'reward_description' => 'Free item',
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/loyalty-program');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Test Program')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonCount(1, 'data.tiers');
    });

    it('returns null when no active program', function () {
        $response = $this->getJson('/api/v1/auth/merchant/loyalty-program');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data', null);
    });

    it('updates existing program and tiers on second create', function () {
        $this->postJson('/api/v1/auth/merchant/loyalty-program', [
            'name' => 'Original Program',
            'required_stamps' => 10,
            'tiers' => [
                [
                    'required_stamps' => 10,
                    'reward_type' => 'free_product',
                    'reward_description' => 'Free item',
                ],
            ],
        ])->assertStatus(201);

        $this->postJson('/api/v1/auth/merchant/loyalty-program', [
            'name' => 'Updated Program',
            'required_stamps' => 8,
            'tiers' => [
                [
                    'required_stamps' => 4,
                    'reward_type' => 'discount_percentage',
                    'reward_value' => 10,
                    'reward_description' => '10% off',
                ],
                [
                    'required_stamps' => 8,
                    'reward_type' => 'discount_fixed',
                    'reward_value' => 50,
                    'reward_description' => '50 off',
                ],
            ],
        ])->assertStatus(201);

        // Should still be 1 program (upsert)
        expect(LoyaltyProgram::where('merchant_id', $this->merchant->id)->count())->toBe(1);
        expect(LoyaltyProgram::first()->name)->toBe('Updated Program');
        expect(LoyaltyProgram::first()->required_stamps)->toBe(8);
        // Old tiers replaced with new ones
        expect(LoyaltyProgramTier::count())->toBe(2);
    });

    it('can deactivate loyalty program', function () {
        LoyaltyProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        $response = $this->deleteJson('/api/v1/auth/merchant/loyalty-program');

        $response->assertStatus(204);

        expect(LoyaltyProgram::where('merchant_id', $this->merchant->id)
            ->where('is_active', true)->count())->toBe(0);
    });

    it('validates required fields on create', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty-program', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'required_stamps', 'tiers']);
    });

    it('validates tiers must have at least one entry', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty-program', [
            'name' => 'Test',
            'required_stamps' => 10,
            'tiers' => [],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tiers']);
    });

    it('validates tier reward_type enum', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty-program', [
            'name' => 'Test',
            'required_stamps' => 10,
            'tiers' => [
                [
                    'required_stamps' => 10,
                    'reward_type' => 'invalid_type',
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tiers.0.reward_type']);
    });

    it('validates required_stamps min 1', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty-program', [
            'name' => 'Test',
            'required_stamps' => 0,
            'tiers' => [
                [
                    'required_stamps' => 1,
                    'reward_type' => 'free_product',
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['required_stamps']);
    });

    it('can set stamp and reward expiry days', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty-program', [
            'name' => 'Expiring Program',
            'required_stamps' => 5,
            'stamp_expiry_days' => 30,
            'reward_expiry_days' => 60,
            'tiers' => [
                [
                    'required_stamps' => 5,
                    'reward_type' => 'discount_fixed',
                    'reward_value' => 100,
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.stamp_expiry_days', 30)
            ->assertJsonPath('data.reward_expiry_days', 60);
    });
});

/*
|--------------------------------------------------------------------------
| Admin Loyalty Program Management
|--------------------------------------------------------------------------
*/
describe('Admin Loyalty Program Management', function () {
    beforeEach(function () {
        $this->admin = User::factory()->create();
        $this->admin->assignRole('super-admin');

        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
        ]);

        Passport::actingAs($this->admin);
    });

    it('admin can view merchant loyalty program with tiers', function () {
        $program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
            'name' => 'Merchant Program',
            'required_stamps' => 10,
            'is_active' => true,
        ]);

        LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $program->id,
            'required_stamps' => 10,
            'reward_type' => 'free_product',
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/loyalty-program");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Merchant Program')
            ->assertJsonCount(1, 'data.tiers');
    });

    it('admin can update merchant loyalty program with tiers', function () {
        $program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
            'name' => 'Original',
            'required_stamps' => 10,
            'is_active' => true,
        ]);

        LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $program->id,
            'required_stamps' => 10,
            'reward_type' => 'free_product',
        ]);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/loyalty-program", [
            'name' => 'Admin Updated',
            'required_stamps' => 5,
            'tiers' => [
                [
                    'required_stamps' => 3,
                    'reward_type' => 'discount_percentage',
                    'reward_value' => 10,
                ],
                [
                    'required_stamps' => 5,
                    'reward_type' => 'free_product',
                    'reward_description' => 'Free item',
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Admin Updated')
            ->assertJsonPath('data.required_stamps', 5)
            ->assertJsonCount(2, 'data.tiers');
    });

    it('returns null when merchant has no program', function () {
        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/loyalty-program");

        $response->assertStatus(200)
            ->assertJsonPath('data', null);
    });
});

/*
|--------------------------------------------------------------------------
| Branch Loyalty Program (Inherited from Organization)
|--------------------------------------------------------------------------
*/
describe('Branch Loyalty Program Inheritance', function () {
    beforeEach(function () {
        // Organization merchant
        $this->orgUser = User::factory()->create();
        $this->orgUser->assignRole('merchant');
        $this->org = Merchant::factory()->create([
            'user_id' => $this->orgUser->id,
            'type' => 'organization',
            'status' => 'active',
        ]);

        // Branch merchant
        $this->branchUser = User::factory()->create();
        $this->branchUser->assignRole('branch-merchant');
        $this->branch = Merchant::factory()->create([
            'user_id' => $this->branchUser->id,
            'parent_id' => $this->org->id,
            'type' => 'individual',
            'status' => 'active',
        ]);
    });

    it('branch sees parent program with is_inherited true', function () {
        $program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->org->id,
            'name' => 'Org Program',
            'is_active' => true,
        ]);

        LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $program->id,
            'required_stamps' => 10,
            'reward_type' => 'free_product',
        ]);

        Passport::actingAs($this->branchUser);

        $response = $this->getJson('/api/v1/auth/merchant/loyalty-program');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Org Program')
            ->assertJsonPath('data.is_inherited', true)
            ->assertJsonCount(1, 'data.tiers');
    });

    it('branch returns null when parent has no active program', function () {
        Passport::actingAs($this->branchUser);

        $response = $this->getJson('/api/v1/auth/merchant/loyalty-program');

        $response->assertStatus(200)
            ->assertJsonPath('data', null);
    });

    it('branch cannot create a loyalty program', function () {
        Passport::actingAs($this->branchUser);

        $response = $this->postJson('/api/v1/auth/merchant/loyalty-program', [
            'name' => 'Branch Program',
            'required_stamps' => 5,
            'tiers' => [
                [
                    'required_stamps' => 5,
                    'reward_type' => 'free_product',
                ],
            ],
        ]);

        $response->assertStatus(403);
    });

    it('branch cannot deactivate a loyalty program', function () {
        LoyaltyProgram::factory()->create([
            'merchant_id' => $this->org->id,
            'is_active' => true,
        ]);

        Passport::actingAs($this->branchUser);

        $response = $this->deleteJson('/api/v1/auth/merchant/loyalty-program');

        $response->assertStatus(403);
    });

    it('organization program shows is_inherited false', function () {
        LoyaltyProgram::factory()->create([
            'merchant_id' => $this->org->id,
            'name' => 'Org Program',
            'is_active' => true,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson('/api/v1/auth/merchant/loyalty-program');

        $response->assertStatus(200)
            ->assertJsonPath('data.is_inherited', false);
    });
});
