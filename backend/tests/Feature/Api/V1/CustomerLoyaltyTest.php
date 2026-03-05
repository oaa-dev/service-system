<?php

use App\Models\Customer;
use App\Models\LoyaltyCard;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramTier;
use App\Models\LoyaltyReward;
use App\Models\LoyaltyStamp;
use App\Models\LoyaltyStampQrCode;
use App\Models\Merchant;
use App\Models\User;
use Laravel\Passport\Passport;

/*
|--------------------------------------------------------------------------
| Customer QR Scanning
|--------------------------------------------------------------------------
*/
describe('Customer QR Scanning', function () {
    beforeEach(function () {
        // Set up merchant with active loyalty program
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
        ]);

        $this->program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
            'required_stamps' => 5,
            'is_active' => true,
        ]);

        $this->tier = LoyaltyProgramTier::factory()->create([
            'loyalty_program_id' => $this->program->id,
            'required_stamps' => 5,
            'reward_type' => 'free_product',
            'reward_description' => 'Free coffee!',
        ]);

        // Set up customer user
        $this->customerUser = User::factory()->create();
        $this->customerUser->assignRole('customer');
        $this->customer = Customer::factory()->create([
            'user_id' => $this->customerUser->id,
        ]);

        Passport::actingAs($this->customerUser);
    });

    it('scans a single-use QR code and earns a stamp', function () {
        $qr = LoyaltyStampQrCode::factory()->create([
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'mode' => 'single_use',
            'expires_at' => now()->addMinutes(2),
            'is_used' => false,
        ]);

        $response = $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => $qr->token,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Stamp earned!'])
            ->assertJsonPath('data.stamp.source', 'qr_scan')
            ->assertJsonPath('data.card.current_stamps', 1)
            ->assertJsonPath('data.reward_unlocked', null);

        // QR should be marked as used
        $qr->refresh();
        expect($qr->is_used)->toBeTrue();

        // Card should be created
        expect(LoyaltyCard::count())->toBe(1);
        expect(LoyaltyStamp::count())->toBe(1);
    });

    it('auto-creates loyalty card on first scan', function () {
        $qr = LoyaltyStampQrCode::factory()->create([
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'mode' => 'single_use',
            'expires_at' => now()->addMinutes(2),
            'is_used' => false,
        ]);

        expect(LoyaltyCard::where('customer_id', $this->customer->id)->count())->toBe(0);

        $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => $qr->token,
        ])->assertStatus(200);

        $card = LoyaltyCard::where('customer_id', $this->customer->id)
            ->where('merchant_id', $this->merchant->id)
            ->first();

        expect($card)->not()->toBeNull();
        expect($card->current_stamps)->toBe(1);
        expect($card->total_stamps_earned)->toBe(1);
    });

    it('returns 410 for expired QR code', function () {
        $qr = LoyaltyStampQrCode::factory()->expired()->create([
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        $response = $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => $qr->token,
        ]);

        $response->assertStatus(410);
    });

    it('returns 409 for already-used single-use QR code', function () {
        $qr = LoyaltyStampQrCode::factory()->used()->create([
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'expires_at' => now()->addMinutes(2),
        ]);

        $response = $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => $qr->token,
        ]);

        $response->assertStatus(409);
    });

    it('scans daily QR code and earns stamp', function () {
        $qr = LoyaltyStampQrCode::factory()->daily()->create([
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        $response = $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => $qr->token,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.stamp.source', 'qr_scan')
            ->assertJsonPath('data.card.current_stamps', 1);
    });

    it('returns 409 when scanning daily QR twice same day', function () {
        $qr = LoyaltyStampQrCode::factory()->daily()->create([
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        // First scan succeeds
        $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => $qr->token,
        ])->assertStatus(200);

        // Second scan same day should fail
        $response = $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => $qr->token,
        ]);

        $response->assertStatus(409);
    });

    it('reaching threshold unlocks reward and resets stamps', function () {
        // Create card with 4 stamps (threshold is 5)
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $this->customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 4,
            'total_stamps_earned' => 4,
        ]);

        $qr = LoyaltyStampQrCode::factory()->create([
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'mode' => 'single_use',
            'expires_at' => now()->addMinutes(2),
            'is_used' => false,
        ]);

        $response = $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => $qr->token,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.reward_unlocked.status', 'available')
            ->assertJsonPath('data.reward_unlocked.reward_type', 'free_product')
            ->assertJsonPath('data.reward_unlocked.reward_description', 'Free coffee!')
            ->assertJsonPath('data.card.current_stamps', 0);

        $card->refresh();
        expect($card->current_stamps)->toBe(0);
        expect($card->total_rewards_earned)->toBe(1);
        expect($card->cycle_number)->toBe(2);
        expect(LoyaltyReward::count())->toBe(1);
    });

    it('returns 404 for non-existent QR token', function () {
        $response = $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => str_repeat('x', 64),
        ]);

        $response->assertStatus(404);
    });

    it('returns 404 when scanning QR for deactivated program', function () {
        $qr = LoyaltyStampQrCode::factory()->create([
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'mode' => 'single_use',
            'expires_at' => now()->addMinutes(2),
            'is_used' => false,
        ]);

        // Deactivate program
        $this->program->update(['is_active' => false]);

        $response = $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => $qr->token,
        ]);

        $response->assertStatus(404);
    });

    it('validates token is required', function () {
        $response = $this->postJson('/api/v1/customer/loyalty/scan', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    });

    it('validates token must be 64 characters', function () {
        $response = $this->postJson('/api/v1/customer/loyalty/scan', [
            'token' => 'too-short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    });
});

/*
|--------------------------------------------------------------------------
| Customer Loyalty Cards
|--------------------------------------------------------------------------
*/
describe('Customer Loyalty Cards', function () {
    beforeEach(function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
        ]);

        $this->program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        $this->customerUser = User::factory()->create();
        $this->customerUser->assignRole('customer');
        $this->customer = Customer::factory()->create([
            'user_id' => $this->customerUser->id,
        ]);

        Passport::actingAs($this->customerUser);
    });

    it('lists my loyalty cards', function () {
        LoyaltyCard::factory()->create([
            'customer_id' => $this->customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 3,
        ]);

        $response = $this->getJson('/api/v1/customer/loyalty-cards');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(1, 'data');
    });

    it('only shows my own cards', function () {
        // My card
        LoyaltyCard::factory()->create([
            'customer_id' => $this->customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        // Another customer's card
        $otherCustomer = Customer::factory()->create();
        LoyaltyCard::factory()->create([
            'customer_id' => $otherCustomer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        $response = $this->getJson('/api/v1/customer/loyalty-cards');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    });

    it('views my loyalty card detail', function () {
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $this->customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
            'current_stamps' => 7,
            'total_stamps_earned' => 12,
            'total_rewards_earned' => 1,
        ]);

        // Add some stamps to verify they're included
        LoyaltyStamp::factory()->create([
            'loyalty_card_id' => $card->id,
            'source' => 'qr_scan',
        ]);

        $response = $this->getJson("/api/v1/customer/loyalty-cards/{$card->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.current_stamps', 7)
            ->assertJsonPath('data.total_stamps_earned', 12);
    });

    it('cannot view another customer card', function () {
        $otherCustomer = Customer::factory()->create();
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $otherCustomer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        $response = $this->getJson("/api/v1/customer/loyalty-cards/{$card->id}");

        $response->assertStatus(404);
    });
});

/*
|--------------------------------------------------------------------------
| Customer Loyalty Rewards
|--------------------------------------------------------------------------
*/
describe('Customer Loyalty Rewards', function () {
    beforeEach(function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
        ]);

        $this->program = LoyaltyProgram::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        $this->customerUser = User::factory()->create();
        $this->customerUser->assignRole('customer');
        $this->customer = Customer::factory()->create([
            'user_id' => $this->customerUser->id,
        ]);

        Passport::actingAs($this->customerUser);
    });

    it('lists my available rewards', function () {
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $this->customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        // Available reward
        LoyaltyReward::factory()->available()->create([
            'loyalty_card_id' => $card->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        // Redeemed reward (should not appear)
        LoyaltyReward::factory()->redeemed()->create([
            'loyalty_card_id' => $card->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        // Expired reward (should not appear)
        LoyaltyReward::factory()->expiredReward()->create([
            'loyalty_card_id' => $card->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        $response = $this->getJson('/api/v1/customer/loyalty-rewards');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // Only the available reward should be returned
        expect(count($response->json('data')))->toBe(1);
    });

    it('excludes expired available rewards', function () {
        $card = LoyaltyCard::factory()->create([
            'customer_id' => $this->customer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        // Available but with expired date
        LoyaltyReward::factory()->create([
            'loyalty_card_id' => $card->id,
            'loyalty_program_id' => $this->program->id,
            'status' => 'available',
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/customer/loyalty-rewards');

        $response->assertStatus(200);
        expect(count($response->json('data')))->toBe(0);
    });

    it('does not show other customer rewards', function () {
        $otherCustomer = Customer::factory()->create();
        $otherCard = LoyaltyCard::factory()->create([
            'customer_id' => $otherCustomer->id,
            'merchant_id' => $this->merchant->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        LoyaltyReward::factory()->available()->create([
            'loyalty_card_id' => $otherCard->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        $response = $this->getJson('/api/v1/customer/loyalty-rewards');

        $response->assertStatus(200);
        expect(count($response->json('data')))->toBe(0);
    });
});
