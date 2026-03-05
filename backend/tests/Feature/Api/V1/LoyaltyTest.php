<?php

use App\Models\Customer;
use App\Models\LoyaltyCard;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramTier;
use App\Models\LoyaltyStamp;
use App\Models\LoyaltyStampQrCode;
use App\Models\Merchant;
use App\Models\User;
use Laravel\Passport\Passport;

/*
|--------------------------------------------------------------------------
| Merchant Loyalty QR Code Generation
|--------------------------------------------------------------------------
*/
describe('Merchant Loyalty QR Code Generation', function () {
    beforeEach(function () {
        $this->merchantUser = User::factory()->create();
        $this->merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'status' => 'active',
        ]);

        $this->program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
            'required_stamps' => 10,
            'is_active' => true,
        ]);

        LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $this->program->id,
            'required_stamps' => 10,
            'reward_type' => 'free_product',
            'reward_description' => 'Free item',
        ]);

        Passport::actingAs($this->merchantUser);
    });

    it('generates a single-use QR code', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty/generate-qr', [
            'mode' => 'single_use',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.mode', 'single_use')
            ->assertJsonStructure([
                'data' => ['id', 'token', 'mode', 'expires_at', 'is_expired'],
            ]);

        expect(LoyaltyStampQrCode::count())->toBe(1);
        $qr = LoyaltyStampQrCode::first();
        expect($qr->mode)->toBe('single_use');
        expect(strlen($qr->token))->toBe(64);
        expect($qr->is_used)->toBeFalse();
    });

    it('generates a daily QR code', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty/generate-qr', [
            'mode' => 'daily',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.mode', 'daily');

        $qr = LoyaltyStampQrCode::first();
        expect($qr->mode)->toBe('daily');
    });

    it('cannot generate QR without active program', function () {
        $this->program->update(['is_active' => false]);

        $response = $this->postJson('/api/v1/auth/merchant/loyalty/generate-qr', [
            'mode' => 'single_use',
        ]);

        $response->assertStatus(404);
    });

    it('validates mode field on QR generation', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty/generate-qr', [
            'mode' => 'invalid_mode',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['mode']);
    });

    it('validates mode is required', function () {
        $response = $this->postJson('/api/v1/auth/merchant/loyalty/generate-qr', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['mode']);
    });
});

/*
|--------------------------------------------------------------------------
| Merchant Loyalty Card Management
|--------------------------------------------------------------------------
*/
describe('Merchant Loyalty Card Management', function () {
    beforeEach(function () {
        $this->merchantUser = User::factory()->create();
        $this->merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'status' => 'active',
        ]);

        $this->program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
            'required_stamps' => 10,
            'is_active' => true,
        ]);

        $this->tier = LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $this->program->id,
            'required_stamps' => 10,
            'reward_type' => 'free_product',
            'reward_description' => 'Free item',
        ]);

        Passport::actingAs($this->merchantUser);
    });

    it('lists customer loyalty cards', function () {
        $customer = Customer::factory()->create();
        LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 3,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/loyalty-cards');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(1, 'data');
    });

    it('only shows cards for own merchant', function () {
        $otherMerchant = Merchant::factory()->create(['status' => 'active']);
        $customer = Customer::factory()->create();

        LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);
        LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $otherMerchant->id,
            'loyalty_program_id' => LoyaltyProgram::factory()->create([
                'merchant_id' => $otherMerchant->id,
            ])->id,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/loyalty-cards');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    });

    it('views a single loyalty card detail', function () {
        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 5,
            'total_stamps_earned' => 5,
        ]);

        $response = $this->getJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.current_stamps', 5)
            ->assertJsonPath('data.total_stamps_earned', 5);
    });

    it('returns 404 for card belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create(['status' => 'active']);
        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $otherMerchant->id,
            'loyalty_program_id' => LoyaltyProgram::factory()->create([
                'merchant_id' => $otherMerchant->id,
            ])->id,
        ]);

        $response = $this->getJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}");

        $response->assertStatus(404);
    });

    it('awards bonus stamp to customer card', function () {
        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 0,
        ]);

        $response = $this->postJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}/stamp", [
            'notes' => 'Birthday bonus stamp',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.stamp.source', 'bonus')
            ->assertJsonPath('data.stamp.notes', 'Birthday bonus stamp')
            ->assertJsonPath('data.card.current_stamps', 1);

        $card->refresh();
        expect($card->current_stamps)->toBe(1);
        expect($card->total_stamps_earned)->toBe(1);
    });

    it('awards bonus stamp without notes', function () {
        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        $response = $this->postJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}/stamp", []);

        $response->assertStatus(201)
            ->assertJsonPath('data.stamp.source', 'bonus');
    });

    it('bonus stamp triggers reward when threshold reached', function () {
        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 9,
            'total_stamps_earned' => 9,
        ]);

        $response = $this->postJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}/stamp", [
            'notes' => 'Final stamp!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.reward_unlocked.status', 'available')
            ->assertJsonPath('data.reward_unlocked.reward_type', 'free_product');

        $card->refresh();
        expect($card->current_stamps)->toBe(0);
        expect($card->total_rewards_earned)->toBe(1);
        expect($card->cycle_number)->toBe(2);
    });

    it('bonus stamp triggers multiple tier rewards', function () {
        // Add a mid-tier reward at 5 stamps
        LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $this->program->id,
            'required_stamps' => 5,
            'reward_type' => 'discount_percentage',
            'reward_value' => 10,
            'reward_description' => '10% off',
        ]);

        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 9,
            'total_stamps_earned' => 9,
        ]);

        // 10th stamp triggers both the 5-stamp tier (not yet earned) and 10-stamp tier
        $response = $this->postJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}/stamp", []);

        $response->assertStatus(201);

        $card->refresh();
        expect($card->current_stamps)->toBe(0);
        expect($card->total_rewards_earned)->toBe(2);
        expect($card->cycle_number)->toBe(2);

        $rewards = $response->json('data.rewards_unlocked');
        expect(count($rewards))->toBe(2);
    });

    it('does not duplicate tier rewards in same cycle', function () {
        // Mid-tier at 5 stamps
        LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $this->program->id,
            'required_stamps' => 5,
            'reward_type' => 'discount_percentage',
            'reward_value' => 10,
        ]);

        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 5,
            'total_stamps_earned' => 5,
        ]);

        // Award first bonus stamp at 5 stamps — should trigger 5-stamp tier
        $this->postJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}/stamp", [])
            ->assertStatus(201);

        $card->refresh();
        expect($card->total_rewards_earned)->toBe(1);

        // Award another stamp at 6 — should NOT re-trigger 5-stamp tier
        $this->postJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}/stamp", [])
            ->assertStatus(201);

        $card->refresh();
        expect($card->total_rewards_earned)->toBe(1); // Still 1
    });

    it('cannot award stamp to card from another merchant', function () {
        $otherMerchant = Merchant::factory()->create(['status' => 'active']);
        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $otherMerchant->id,
            'loyalty_program_id' => LoyaltyProgram::factory()->create([
                'merchant_id' => $otherMerchant->id,
            ])->id,
        ]);

        $response = $this->postJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}/stamp", []);

        $response->assertStatus(404);
    });

    it('cannot award stamp when program is inactive', function () {
        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        $this->program->update(['is_active' => false]);

        $response = $this->postJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}/stamp", []);

        $response->assertStatus(404);
    });
});

/*
|--------------------------------------------------------------------------
| Branch Loyalty QR + Cross-Branch Card Access
|--------------------------------------------------------------------------
*/
describe('Branch Loyalty QR and Cross-Branch Cards', function () {
    beforeEach(function () {
        // Organization
        $this->orgUser = User::factory()->create();
        $this->orgUser->assignRole('merchant');
        $this->org = Merchant::factory()->create([
            'user_id' => $this->orgUser->id,
            'type' => 'organization',
            'status' => 'active',
        ]);

        // Branch
        $this->branchUser = User::factory()->create();
        $this->branchUser->assignRole('branch-merchant');
        $this->branch = Merchant::factory()->create([
            'user_id' => $this->branchUser->id,
            'parent_id' => $this->org->id,
            'type' => 'individual',
            'status' => 'active',
        ]);

        // Org loyalty program
        $this->program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->org->id,
            'required_stamps' => 10,
            'is_active' => true,
        ]);

        LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $this->program->id,
            'required_stamps' => 10,
            'reward_type' => 'free_product',
            'reward_description' => 'Free item',
        ]);
    });

    it('branch generates QR using parent program', function () {
        Passport::actingAs($this->branchUser);

        $response = $this->postJson('/api/v1/auth/merchant/loyalty/generate-qr', [
            'mode' => 'single_use',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        // QR merchant_id should be the branch for tracking
        $qr = LoyaltyStampQrCode::first();
        expect($qr->merchant_id)->toBe($this->branch->id);
        expect($qr->loyalty_program_id)->toBe($this->program->id);
    });

    it('branch cannot generate QR when parent has no program', function () {
        $this->program->update(['is_active' => false]);

        Passport::actingAs($this->branchUser);

        $response = $this->postJson('/api/v1/auth/merchant/loyalty/generate-qr', [
            'mode' => 'single_use',
        ]);

        $response->assertStatus(404);
    });

    it('organization sees cards from all branches', function () {
        $customer = Customer::factory()->create();

        // Card at org level
        LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->org->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        // Card at branch level
        LoyaltyCard::factory()->create([
            'customer_id' => Customer::factory()->create()->id,
            'merchant_id' => $this->branch->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson('/api/v1/auth/merchant/loyalty-cards');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    });

    it('organization can filter cards by branch_id', function () {
        $customer1 = Customer::factory()->create();
        $customer2 = Customer::factory()->create();

        LoyaltyCard::factory()->create([
            'customer_id' => $customer1->id,
            'merchant_id' => $this->org->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        LoyaltyCard::factory()->create([
            'customer_id' => $customer2->id,
            'merchant_id' => $this->branch->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson("/api/v1/auth/merchant/loyalty-cards?filter[branch_id]={$this->branch->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    });

    it('card response includes merchant info', function () {
        $customer = Customer::factory()->create();
        LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->branch->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson('/api/v1/auth/merchant/loyalty-cards');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.merchant.id', $this->branch->id)
            ->assertJsonPath('data.0.merchant.name', $this->branch->name);
    });

    it('branch only sees its own cards', function () {
        $customer1 = Customer::factory()->create();
        $customer2 = Customer::factory()->create();

        LoyaltyCard::factory()->create([
            'customer_id' => $customer1->id,
            'merchant_id' => $this->org->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        LoyaltyCard::factory()->create([
            'customer_id' => $customer2->id,
            'merchant_id' => $this->branch->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        Passport::actingAs($this->branchUser);

        $response = $this->getJson('/api/v1/auth/merchant/loyalty-cards');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    });

    it('organization can view branch card detail', function () {
        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->branch->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->getJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.merchant.id', $this->branch->id);
    });

    it('organization can award stamp on branch card', function () {
        $customer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $customer->id,
            'merchant_id' => $this->branch->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 0,
        ]);

        Passport::actingAs($this->orgUser);

        $response = $this->postJson("/api/v1/auth/merchant/loyalty-cards/{$card->id}/stamp", [
            'notes' => 'Org awarded bonus',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.stamp.source', 'bonus');

        $card->refresh();
        expect($card->current_stamps)->toBe(1);
    });
});
