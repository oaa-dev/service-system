<?php

use App\Models\Customer;
use App\Models\LoyaltyCard;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyReward;
use App\Models\Merchant;
use App\Models\MerchantBookingSlot;
use App\Models\PlatformFee;
use App\Models\Service;
use App\Models\ServiceSchedule;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->assignRole('customer');
    $this->customer = Customer::factory()->create(['user_id' => $this->user->id]);
    Passport::actingAs($this->user);

    $merchantUser = User::factory()->create();
    $merchantUser->assignRole('merchant');
    $this->merchant = Merchant::factory()->create([
        'user_id' => $merchantUser->id,
        'status' => 'active',
        'can_take_bookings' => true,
        'can_sell_products' => true,
        'can_rent_units' => true,
    ]);

    // Loyalty program + card for this customer at this merchant
    $this->program = LoyaltyProgram::factory()->create([
        'merchant_id' => $this->merchant->id,
        'is_active' => true,
    ]);
    $this->card = LoyaltyCard::factory()->create([
        'customer_id' => $this->customer->id,
        'loyalty_program_id' => $this->program->id,
        'merchant_id' => $this->merchant->id,
    ]);

    // Platform fees for all transaction types (5% each)
    PlatformFee::factory()->create([
        'transaction_type' => 'booking',
        'rate_percentage' => 5.00,
        'is_active' => true,
    ]);
    PlatformFee::factory()->create([
        'transaction_type' => 'reservation',
        'rate_percentage' => 5.00,
        'is_active' => true,
    ]);
    PlatformFee::factory()->create([
        'transaction_type' => 'sell_product',
        'rate_percentage' => 5.00,
        'is_active' => true,
    ]);
});

describe('Reward Redemption on Booking', function () {
    beforeEach(function () {
        $this->service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'price' => 1000.00,
            'max_capacity' => 10,
            'requires_confirmation' => false,
        ]);

        ServiceSchedule::create([
            'service_id' => $this->service->id,
            'day_of_week' => 1, // Monday
            'start_time' => '09:00',
            'end_time' => '17:00',
            'is_available' => true,
        ]);

        $this->nextMonday = now()->next('Monday')->format('Y-m-d');
    });

    it('applies percentage discount on booking and reduces total_amount', function () {
        $reward = LoyaltyReward::factory()->create([
            'loyalty_card_id' => $this->card->id,
            'loyalty_program_id' => $this->program->id,
            'reward_type' => 'discount_percentage',
            'reward_value' => 20.00,
            'status' => 'available',
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $this->nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
            'loyalty_reward_id' => $reward->id,
        ]);

        $response->assertStatus(201);

        // Subtotal = 1000, 20% discount = 200, discounted = 800, fee = 800 * 5% = 40
        $data = $response->json('data');
        expect($data['discount_amount'])->toBe('200.00');
        expect($data['total_amount'])->toBe('840.00'); // 800 + 40

        // Reward should be marked as redeemed
        $reward->refresh();
        expect($reward->status)->toBe('redeemed');
        expect($reward->redeemed_on_type)->toBe('booking');
        expect($reward->redeemed_on_id)->toBe($data['id']);
    });

    it('applies fixed discount on booking', function () {
        $reward = LoyaltyReward::factory()->discountFixed(300)->create([
            'loyalty_card_id' => $this->card->id,
            'loyalty_program_id' => $this->program->id,
            'status' => 'available',
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $this->nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
            'loyalty_reward_id' => $reward->id,
        ]);

        $response->assertStatus(201);

        // Subtotal = 1000, fixed 300 off = 700, fee = 700 * 5% = 35
        $data = $response->json('data');
        expect($data['discount_amount'])->toBe('300.00');
        expect($data['total_amount'])->toBe('735.00'); // 700 + 35
    });

    it('caps fixed discount at subtotal when reward exceeds price', function () {
        $reward = LoyaltyReward::factory()->discountFixed(5000)->create([
            'loyalty_card_id' => $this->card->id,
            'loyalty_program_id' => $this->program->id,
            'status' => 'available',
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $this->nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
            'loyalty_reward_id' => $reward->id,
        ]);

        $response->assertStatus(201);

        // Subtotal = 1000, fixed 5000 capped at 1000 = discount 1000, discounted = 0, fee = 0
        $data = $response->json('data');
        expect($data['discount_amount'])->toBe('1000.00');
        expect($data['total_amount'])->toBe('0.00');
    });

    it('applies no discount for free_product reward type', function () {
        $reward = LoyaltyReward::factory()->freeProduct()->create([
            'loyalty_card_id' => $this->card->id,
            'loyalty_program_id' => $this->program->id,
            'status' => 'available',
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $this->nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
            'loyalty_reward_id' => $reward->id,
        ]);

        $response->assertStatus(201);

        // No discount for free_product, full price: 1000 + 50 fee = 1050
        $data = $response->json('data');
        expect($data['discount_amount'])->toBe('0.00');
        expect($data['total_amount'])->toBe('1050.00');

        // Still marked as redeemed
        $reward->refresh();
        expect($reward->status)->toBe('redeemed');
    });

    it('creates booking without discount when no reward provided', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $this->nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
        ]);

        $response->assertStatus(201);

        $data = $response->json('data');
        expect($data['discount_amount'])->toBe('0.00');
        expect($data['total_amount'])->toBe('1050.00'); // 1000 + 50
    });

    it('rejects already-redeemed reward with 409', function () {
        $reward = LoyaltyReward::factory()->redeemed()->create([
            'loyalty_card_id' => $this->card->id,
            'loyalty_program_id' => $this->program->id,
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $this->nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
            'loyalty_reward_id' => $reward->id,
        ]);

        $response->assertStatus(409);
    });
});

describe('Reward Redemption on Reservation', function () {
    it('applies fixed discount on reservation and reduces total_amount', function () {
        $service = Service::factory()->reservation(2000.00)->create([
            'merchant_id' => $this->merchant->id,
            'max_capacity' => 4,
        ]);

        $reward = LoyaltyReward::factory()->discountFixed(500)->create([
            'loyalty_card_id' => $this->card->id,
            'loyalty_program_id' => $this->program->id,
            'status' => 'available',
        ]);

        $checkIn = now()->addDays(3)->format('Y-m-d');
        $checkOut = now()->addDays(5)->format('Y-m-d');

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/reservations", [
            'service_id' => $service->id,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'guest_count' => 2,
            'loyalty_reward_id' => $reward->id,
        ]);

        $response->assertStatus(201);

        // 2 nights * 2000 = 4000, fixed 500 off = 3500, fee = 3500 * 5% = 175
        $data = $response->json('data');
        expect($data['discount_amount'])->toBe('500.00');
        expect($data['total_amount'])->toBe('3675.00'); // 3500 + 175

        $reward->refresh();
        expect($reward->status)->toBe('redeemed');
        expect($reward->redeemed_on_type)->toBe('reservation');
    });
});

describe('Reward Redemption on Service Order', function () {
    it('applies percentage discount on service order', function () {
        $service = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
            'price' => 500.00,
        ]);

        $reward = LoyaltyReward::factory()->create([
            'loyalty_card_id' => $this->card->id,
            'loyalty_program_id' => $this->program->id,
            'reward_type' => 'discount_percentage',
            'reward_value' => 10.00,
            'status' => 'available',
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/orders", [
            'service_id' => $service->id,
            'quantity' => 2,
            'unit_label' => 'pcs',
            'loyalty_reward_id' => $reward->id,
        ]);

        $response->assertStatus(201);

        // 2 * 500 = 1000, 10% discount = 100, discounted = 900, fee = 900 * 5% = 45
        $data = $response->json('data');
        expect($data['discount_amount'])->toBe('100.00');
        expect($data['total_amount'])->toBe('945.00'); // 900 + 45

        $reward->refresh();
        expect($reward->status)->toBe('redeemed');
        expect($reward->redeemed_on_type)->toBe('service_order');
    });
});
