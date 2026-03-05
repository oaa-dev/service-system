<?php

use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Referral;
use App\Models\ReferralCode;
use App\Models\ReferralProgram;
use App\Models\ReferralReward;
use App\Models\User;
use Laravel\Passport\Passport;

/*
|--------------------------------------------------------------------------
| Merchant Referral Program CRUD (Self-Service)
|--------------------------------------------------------------------------
*/
describe('Merchant Referral Program CRUD', function () {
    beforeEach(function () {
        $this->merchantUser = User::factory()->create();
        $this->merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'status' => 'active',
        ]);

        Passport::actingAs($this->merchantUser);
    });

    it('can create a referral program', function () {
        $response = $this->postJson('/api/v1/auth/merchant/referral-program', [
            'name' => 'Refer a Friend',
            'description' => 'Get rewards when you refer friends!',
            'referrer_reward_type' => 'percentage',
            'referrer_reward_value' => 10,
            'referee_reward_type' => 'percentage',
            'referee_reward_value' => 5,
            'max_referrals_per_customer' => 10,
            'code_expiry_days' => 30,
            'reward_expiry_days' => 90,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Referral program saved.',
            ])
            ->assertJsonPath('data.name', 'Refer a Friend')
            ->assertJsonPath('data.referrer_reward_type', 'percentage')
            ->assertJsonPath('data.is_active', true);

        expect(ReferralProgram::count())->toBe(1);
    });

    it('can view my referral program', function () {
        ReferralProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/referral-program');

        $response->assertOk()
            ->assertJsonPath('data.name', fn ($name) => ! empty($name));
    });

    it('returns null when no active program exists', function () {
        $response = $this->getJson('/api/v1/auth/merchant/referral-program');

        $response->assertOk()
            ->assertJsonPath('data', null);
    });

    it('can update an existing referral program', function () {
        ReferralProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $response = $this->postJson('/api/v1/auth/merchant/referral-program', [
            'name' => 'Updated Program',
            'referrer_reward_type' => 'fixed',
            'referrer_reward_value' => 50,
            'referee_reward_type' => 'percentage',
            'referee_reward_value' => 10,
            'code_expiry_days' => 60,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Updated Program');

        // Should still be 1 program (updated, not duplicated)
        expect(ReferralProgram::count())->toBe(1);
    });

    it('can deactivate referral program', function () {
        $program = ReferralProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $response = $this->deleteJson('/api/v1/auth/merchant/referral-program');

        $response->assertNoContent();
        expect($program->fresh()->is_active)->toBeFalse();
    });

    it('can view merchant referrals list', function () {
        $program = ReferralProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $referrerCustomer = Customer::factory()->create();
        $refereeCustomer = Customer::factory()->create();
        $code = ReferralCode::factory()->create([
            'referral_program_id' => $program->id,
            'customer_id' => $referrerCustomer->id,
        ]);

        Referral::factory()->create([
            'referral_code_id' => $code->id,
            'referral_program_id' => $program->id,
            'referrer_customer_id' => $referrerCustomer->id,
            'referee_customer_id' => $refereeCustomer->id,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/referrals');

        $response->assertOk()
            ->assertJsonPath('data.0.referrer_customer.id', $referrerCustomer->id);
    });

    it('can view referral stats', function () {
        $program = ReferralProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/referral-stats');

        $response->assertOk()
            ->assertJsonStructure(['data' => [
                'total_referrals',
                'completed_referrals',
                'pending_referrals',
                'conversion_rate',
                'top_referrers',
            ]]);
    });
});

/*
|--------------------------------------------------------------------------
| Branch Merchant Referral Program
|--------------------------------------------------------------------------
*/
describe('Branch Merchant Referral Program', function () {
    beforeEach(function () {
        $this->orgUser = User::factory()->create();
        $this->orgUser->assignRole('merchant');
        $this->orgMerchant = Merchant::factory()->create([
            'user_id' => $this->orgUser->id,
            'type' => 'organization',
            'status' => 'active',
        ]);

        $this->branchUser = User::factory()->create();
        $this->branchUser->assignRole('branch-merchant');
        $this->branch = Merchant::factory()->create([
            'user_id' => $this->branchUser->id,
            'parent_id' => $this->orgMerchant->id,
            'type' => 'individual',
            'status' => 'active',
        ]);
    });

    it('branch can view inherited referral program', function () {
        ReferralProgram::factory()->create([
            'merchant_id' => $this->orgMerchant->id,
        ]);

        Passport::actingAs($this->branchUser);
        $response = $this->getJson('/api/v1/auth/merchant/referral-program');

        $response->assertOk()
            ->assertJsonPath('data.is_inherited', true);
    });

    it('branch cannot create referral program', function () {
        Passport::actingAs($this->branchUser);
        $response = $this->postJson('/api/v1/auth/merchant/referral-program', [
            'name' => 'Branch Program',
            'referrer_reward_type' => 'percentage',
            'referrer_reward_value' => 10,
            'referee_reward_type' => 'percentage',
            'referee_reward_value' => 5,
            'code_expiry_days' => 30,
        ]);

        $response->assertStatus(403);
    });
});

/*
|--------------------------------------------------------------------------
| Admin Referral Program Routes
|--------------------------------------------------------------------------
*/
describe('Admin Referral Program Routes', function () {
    beforeEach(function () {
        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole('admin');

        $this->merchantUser = User::factory()->create();
        $this->merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'status' => 'active',
        ]);

        Passport::actingAs($this->adminUser);
    });

    it('admin can view merchant referral program', function () {
        ReferralProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/referral-program");

        $response->assertOk();
    });

    it('admin can update merchant referral program', function () {
        ReferralProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/referral-program", [
            'name' => 'Admin Updated',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Admin Updated');
    });
});

/*
|--------------------------------------------------------------------------
| Customer Referral Routes
|--------------------------------------------------------------------------
*/
describe('Customer Referral Routes', function () {
    beforeEach(function () {
        $this->customerUser = User::factory()->create();
        $this->customerUser->assignRole('customer');
        $this->customer = Customer::factory()->create([
            'user_id' => $this->customerUser->id,
        ]);

        $this->merchantUser = User::factory()->create();
        $this->merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'status' => 'active',
        ]);

        $this->program = ReferralProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        Passport::actingAs($this->customerUser);
    });

    it('customer can generate a referral code', function () {
        $response = $this->postJson("/api/v1/customer/referrals/generate/{$this->merchant->id}");

        $response->assertOk()
            ->assertJsonStructure(['data' => ['code', 'expires_at']]);

        expect(ReferralCode::count())->toBe(1);
    });

    it('customer gets same code on repeated generation', function () {
        $this->postJson("/api/v1/customer/referrals/generate/{$this->merchant->id}");
        $response = $this->postJson("/api/v1/customer/referrals/generate/{$this->merchant->id}");

        $response->assertOk();
        expect(ReferralCode::count())->toBe(1);
    });

    it('customer can view their referral codes', function () {
        ReferralCode::factory()->create([
            'referral_program_id' => $this->program->id,
            'customer_id' => $this->customer->id,
        ]);

        $response = $this->getJson('/api/v1/customer/referral-codes');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    });

    it('customer can accept a referral code', function () {
        $referrer = Customer::factory()->create();
        $code = ReferralCode::factory()->create([
            'referral_program_id' => $this->program->id,
            'customer_id' => $referrer->id,
        ]);

        $response = $this->postJson('/api/v1/customer/referrals/accept', [
            'code' => $code->code,
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        expect(Referral::count())->toBe(1);
    });

    it('customer cannot accept own referral code', function () {
        $code = ReferralCode::factory()->create([
            'referral_program_id' => $this->program->id,
            'customer_id' => $this->customer->id,
        ]);

        $response = $this->postJson('/api/v1/customer/referrals/accept', [
            'code' => $code->code,
        ]);

        $response->assertStatus(422);
    });

    it('customer cannot accept same program referral twice', function () {
        $referrer = Customer::factory()->create();
        $code = ReferralCode::factory()->create([
            'referral_program_id' => $this->program->id,
            'customer_id' => $referrer->id,
        ]);

        // First accept
        $this->postJson('/api/v1/customer/referrals/accept', ['code' => $code->code]);

        // Second attempt
        $response = $this->postJson('/api/v1/customer/referrals/accept', [
            'code' => $code->code,
        ]);

        $response->assertStatus(409);
    });

    it('customer can view their referrals', function () {
        $refereeCustomer = Customer::factory()->create();
        $code = ReferralCode::factory()->create([
            'referral_program_id' => $this->program->id,
            'customer_id' => $this->customer->id,
        ]);

        Referral::factory()->create([
            'referral_code_id' => $code->id,
            'referral_program_id' => $this->program->id,
            'referrer_customer_id' => $this->customer->id,
            'referee_customer_id' => $refereeCustomer->id,
        ]);

        $response = $this->getJson('/api/v1/customer/referrals');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    });

    it('customer can view their referral rewards', function () {
        $referral = Referral::factory()->create([
            'referral_program_id' => $this->program->id,
            'referrer_customer_id' => $this->customer->id,
            'referee_customer_id' => Customer::factory()->create()->id,
        ]);

        ReferralReward::factory()->create([
            'referral_id' => $referral->id,
            'customer_id' => $this->customer->id,
            'role' => 'referrer',
        ]);

        $response = $this->getJson('/api/v1/customer/referral-rewards');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    });
});

/*
|--------------------------------------------------------------------------
| Storefront Referral Code Validation (Public)
|--------------------------------------------------------------------------
*/
describe('Storefront Referral Code Validation', function () {
    it('can validate a valid referral code', function () {
        $merchant = Merchant::factory()->create(['status' => 'active']);
        $program = ReferralProgram::factory()->create(['merchant_id' => $merchant->id]);
        $customer = Customer::factory()->create();
        $code = ReferralCode::factory()->create([
            'referral_program_id' => $program->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->getJson("/api/v1/storefront/referral/{$code->code}");

        $response->assertOk()
            ->assertJsonStructure(['data' => [
                'code',
                'referrer',
                'program' => ['name', 'referee_reward_type', 'referee_reward_value'],
                'merchant' => ['id', 'name', 'slug'],
            ]]);
    });

    it('returns 404 for invalid referral code', function () {
        $response = $this->getJson('/api/v1/storefront/referral/INVALID1');

        $response->assertStatus(404);
    });

    it('returns 422 for expired referral code', function () {
        $merchant = Merchant::factory()->create(['status' => 'active']);
        $program = ReferralProgram::factory()->create(['merchant_id' => $merchant->id]);
        $customer = Customer::factory()->create();
        $code = ReferralCode::factory()->expired()->create([
            'referral_program_id' => $program->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->getJson("/api/v1/storefront/referral/{$code->code}");

        $response->assertStatus(422);
    });
});

/*
|--------------------------------------------------------------------------
| Referral Completion Hook
|--------------------------------------------------------------------------
*/
describe('Referral Completion Hook', function () {
    it('completes referral and creates rewards when booking completes', function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
            'can_take_bookings' => true,
        ]);

        $program = ReferralProgram::factory()->create([
            'merchant_id' => $merchant->id,
            'referrer_reward_type' => 'fixed',
            'referrer_reward_value' => 100,
            'referee_reward_type' => 'percentage',
            'referee_reward_value' => 10,
        ]);

        $referrerCustomer = Customer::factory()->create();
        $refereeCustomer = Customer::factory()->create();

        $code = ReferralCode::factory()->create([
            'referral_program_id' => $program->id,
            'customer_id' => $referrerCustomer->id,
        ]);

        $referral = Referral::factory()->create([
            'referral_code_id' => $code->id,
            'referral_program_id' => $program->id,
            'referrer_customer_id' => $referrerCustomer->id,
            'referee_customer_id' => $refereeCustomer->id,
            'status' => 'pending',
        ]);

        // Create a booking for the referee
        $service = \App\Models\Service::factory()->create([
            'merchant_id' => $merchant->id,
            'service_type' => 'bookable',
            'is_active' => true,
            'duration' => 60,
            'max_capacity' => 10,
        ]);

        $booking = \App\Models\Booking::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
            'customer_id' => $refereeCustomer->user_id,
            'status' => 'confirmed',
        ]);

        // Trigger status update to completed
        Passport::actingAs($merchantUser);
        $response = $this->patchJson(
            "/api/v1/merchants/{$merchant->id}/bookings/{$booking->id}/status",
            ['status' => 'completed']
        );

        $response->assertOk();

        // Verify referral was completed
        expect($referral->fresh()->status)->toBe('completed');
        expect(ReferralReward::count())->toBe(2);

        // Verify rewards for referrer and referee
        $referrerReward = ReferralReward::where('customer_id', $referrerCustomer->id)->first();
        expect($referrerReward->role)->toBe('referrer');
        expect($referrerReward->reward_type)->toBe('fixed');

        $refereeReward = ReferralReward::where('customer_id', $refereeCustomer->id)->first();
        expect($refereeReward->role)->toBe('referee');
        expect($refereeReward->reward_type)->toBe('percentage');
    });
});

/*
|--------------------------------------------------------------------------
| Max Referrals Per Customer
|--------------------------------------------------------------------------
*/
describe('Max Referrals Per Customer', function () {
    it('enforces max referrals per customer limit', function () {
        $customerUser = User::factory()->create();
        $customerUser->assignRole('customer');
        $customer = Customer::factory()->create(['user_id' => $customerUser->id]);

        $merchant = Merchant::factory()->create(['status' => 'active']);
        $program = ReferralProgram::factory()->create([
            'merchant_id' => $merchant->id,
            'max_referrals_per_customer' => 1,
        ]);

        $referrer = Customer::factory()->create();
        $code = ReferralCode::factory()->create([
            'referral_program_id' => $program->id,
            'customer_id' => $referrer->id,
        ]);

        // Create an existing referral for this referrer
        Referral::factory()->create([
            'referral_code_id' => $code->id,
            'referral_program_id' => $program->id,
            'referrer_customer_id' => $referrer->id,
            'referee_customer_id' => Customer::factory()->create()->id,
        ]);

        // Try to accept — should fail because referrer already has max referrals
        Passport::actingAs($customerUser);
        $response = $this->postJson('/api/v1/customer/referrals/accept', [
            'code' => $code->code,
        ]);

        $response->assertStatus(422);
    });
});
