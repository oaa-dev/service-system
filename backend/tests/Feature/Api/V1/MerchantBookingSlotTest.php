<?php

use App\Models\Merchant;
use App\Models\MerchantBookingSlot;
use App\Models\User;
use Laravel\Passport\Passport;

describe('MerchantBookingSlot', function () {

    /*
    |--------------------------------------------------------------------------
    | Self-service slot management (merchant)
    |--------------------------------------------------------------------------
    */
    describe('Self-service slot management (merchant)', function () {
        beforeEach(function () {
            $this->user = User::factory()->create();
            $this->user->assignRole('merchant');
            $this->merchant = Merchant::factory()->create([
                'user_id' => $this->user->id,
                'status' => 'active',
            ]);

            Passport::actingAs($this->user);
        });

        it('merchant can list their booking slots', function () {
            MerchantBookingSlot::factory()->count(3)->create([
                'merchant_id' => $this->merchant->id,
            ]);

            $response = $this->getJson('/api/v1/auth/merchant/booking-slots');

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonCount(3, 'data')
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'merchant_id',
                            'day_of_week',
                            'start_time',
                            'end_time',
                            'max_capacity',
                            'is_active',
                            'sort_order',
                            'created_at',
                            'updated_at',
                        ],
                    ],
                ]);
        });

        it('merchant can create a booking slot', function () {
            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'day_of_week' => 1,
                'start_time' => '09:00',
                'end_time' => '10:00',
                'max_capacity' => 5,
            ]);

            $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Booking slot created successfully',
                ])
                ->assertJsonPath('data.merchant_id', $this->merchant->id)
                ->assertJsonPath('data.day_of_week', 1)
                ->assertJsonPath('data.start_time', '09:00')
                ->assertJsonPath('data.end_time', '10:00')
                ->assertJsonPath('data.max_capacity', 5)
                ->assertJsonPath('data.is_active', true);

            expect(MerchantBookingSlot::count())->toBe(1);
            $this->assertDatabaseHas('merchant_booking_slots', [
                'merchant_id' => $this->merchant->id,
                'day_of_week' => 1,
                'start_time' => '09:00',
            ]);
        });

        it('merchant can view a booking slot', function () {
            $slot = MerchantBookingSlot::factory()->create([
                'merchant_id' => $this->merchant->id,
                'day_of_week' => 2,
                'start_time' => '14:00',
                'end_time' => '15:00',
            ]);

            $response = $this->getJson("/api/v1/auth/merchant/booking-slots/{$slot->id}");

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonPath('data.id', $slot->id)
                ->assertJsonPath('data.merchant_id', $this->merchant->id)
                ->assertJsonPath('data.day_of_week', 2);

            // The API returns time as stored by MySQL (H:i or H:i:s depending on DB)
            expect($response->json('data.start_time'))->toStartWith('14:00');
        });

        it('merchant can update a booking slot', function () {
            $slot = MerchantBookingSlot::factory()->create([
                'merchant_id' => $this->merchant->id,
                'day_of_week' => 3,
                'start_time' => '10:00',
                'end_time' => '11:00',
                'max_capacity' => 10,
            ]);

            $response = $this->putJson("/api/v1/auth/merchant/booking-slots/{$slot->id}", [
                'max_capacity' => 20,
                'end_time' => '12:00',
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Booking slot updated successfully',
                ])
                ->assertJsonPath('data.max_capacity', 20);

            // MySQL TIME columns may serialize with or without seconds
            expect($response->json('data.end_time'))->toStartWith('12:00');
            expect($response->json('data.start_time'))->toStartWith('10:00');
        });

        it('merchant can delete a booking slot', function () {
            $slot = MerchantBookingSlot::factory()->create([
                'merchant_id' => $this->merchant->id,
            ]);

            expect(MerchantBookingSlot::count())->toBe(1);

            $response = $this->deleteJson("/api/v1/auth/merchant/booking-slots/{$slot->id}");

            $response->assertStatus(204);
            expect(MerchantBookingSlot::count())->toBe(0);
        });

        it('returns 422 when trying to delete non-existent slot', function () {
            $response = $this->deleteJson('/api/v1/auth/merchant/booking-slots/99999');

            $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'message' => 'Booking slot not found',
                ]);
        });

        it('validates day_of_week must be 0-6', function () {
            // day_of_week too high
            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'day_of_week' => 7,
                'start_time' => '09:00',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['day_of_week']);

            // day_of_week negative
            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'day_of_week' => -1,
                'start_time' => '09:00',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['day_of_week']);

            // day_of_week missing
            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'start_time' => '09:00',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['day_of_week']);
        });

        it('validates unique slot: cannot create duplicate day_of_week + start_time', function () {
            // Create the first slot
            MerchantBookingSlot::factory()->create([
                'merchant_id' => $this->merchant->id,
                'day_of_week' => 1,
                'start_time' => '09:00',
            ]);

            // Attempt to create duplicate
            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'day_of_week' => 1,
                'start_time' => '09:00',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['start_time']);

            expect(MerchantBookingSlot::count())->toBe(1);
        });

        it('merchant cannot access another merchant\'s slot', function () {
            // Create another merchant
            $otherUser = User::factory()->create();
            $otherUser->assignRole('merchant');
            $otherMerchant = Merchant::factory()->create([
                'user_id' => $otherUser->id,
                'status' => 'active',
            ]);

            $slotFromOtherMerchant = MerchantBookingSlot::factory()->create([
                'merchant_id' => $otherMerchant->id,
                'day_of_week' => 0,
                'start_time' => '08:00',
            ]);

            // As merchant A, try to view a slot that belongs to merchant B
            $response = $this->getJson("/api/v1/auth/merchant/booking-slots/{$slotFromOtherMerchant->id}");

            $response->assertStatus(404);
        });

        it('only returns the merchant\'s own slots in the list', function () {
            // Create slots for our merchant
            MerchantBookingSlot::factory()->count(2)->create([
                'merchant_id' => $this->merchant->id,
            ]);

            // Create slots for another merchant (should not appear)
            $otherUser = User::factory()->create();
            $otherUser->assignRole('merchant');
            $otherMerchant = Merchant::factory()->create([
                'user_id' => $otherUser->id,
                'status' => 'active',
            ]);
            MerchantBookingSlot::factory()->count(5)->create([
                'merchant_id' => $otherMerchant->id,
            ]);

            $response = $this->getJson('/api/v1/auth/merchant/booking-slots');

            $response->assertStatus(200)
                ->assertJsonCount(2, 'data');
        });

        it('creates a slot with optional fields null when not provided', function () {
            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'day_of_week' => 5,
                'start_time' => '11:00',
            ]);

            $response->assertStatus(201)
                ->assertJsonPath('data.end_time', null)
                ->assertJsonPath('data.max_capacity', null)
                ->assertJsonPath('data.is_active', true)
                ->assertJsonPath('data.sort_order', 0);
        });

        it('validates max_capacity must be at least 1', function () {
            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'day_of_week' => 1,
                'start_time' => '09:00',
                'max_capacity' => 0,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['max_capacity']);
        });

        it('validates start_time must be in H:i format', function () {
            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'day_of_week' => 1,
                'start_time' => '9:00 AM',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['start_time']);
        });

        it('same day_of_week + start_time is allowed for different merchants', function () {
            // Another merchant with the same slot combination
            $otherUser = User::factory()->create();
            $otherUser->assignRole('merchant');
            $otherMerchant = Merchant::factory()->create([
                'user_id' => $otherUser->id,
                'status' => 'active',
            ]);

            MerchantBookingSlot::factory()->create([
                'merchant_id' => $otherMerchant->id,
                'day_of_week' => 1,
                'start_time' => '09:00',
            ]);

            // Our merchant should be able to create the same slot
            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'day_of_week' => 1,
                'start_time' => '09:00',
            ]);

            $response->assertStatus(201);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Admin slot management
    |--------------------------------------------------------------------------
    */
    describe('Admin slot management', function () {
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

        it('admin can list merchant booking slots', function () {
            MerchantBookingSlot::factory()->count(4)->create([
                'merchant_id' => $this->merchant->id,
            ]);

            $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/booking-slots");

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonCount(4, 'data')
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'merchant_id',
                            'day_of_week',
                            'start_time',
                            'end_time',
                            'max_capacity',
                            'is_active',
                            'sort_order',
                        ],
                    ],
                ]);
        });

        it('admin can create booking slot for a merchant', function () {
            $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/booking-slots", [
                'day_of_week' => 0,
                'start_time' => '08:00',
                'end_time' => '09:00',
                'max_capacity' => 10,
            ]);

            $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Booking slot created successfully',
                ])
                ->assertJsonPath('data.merchant_id', $this->merchant->id)
                ->assertJsonPath('data.day_of_week', 0)
                ->assertJsonPath('data.start_time', '08:00');

            $this->assertDatabaseHas('merchant_booking_slots', [
                'merchant_id' => $this->merchant->id,
                'day_of_week' => 0,
                'start_time' => '08:00',
            ]);
        });

        it('admin can update merchant booking slot', function () {
            $slot = MerchantBookingSlot::factory()->create([
                'merchant_id' => $this->merchant->id,
                'day_of_week' => 4,
                'start_time' => '13:00',
                'max_capacity' => 5,
                'is_active' => true,
            ]);

            $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/booking-slots/{$slot->id}", [
                'max_capacity' => 15,
                'is_active' => false,
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Booking slot updated successfully',
                ])
                ->assertJsonPath('data.max_capacity', 15)
                ->assertJsonPath('data.is_active', false);
        });

        it('admin can delete merchant booking slot', function () {
            $slot = MerchantBookingSlot::factory()->create([
                'merchant_id' => $this->merchant->id,
            ]);

            expect(MerchantBookingSlot::count())->toBe(1);

            $response = $this->deleteJson("/api/v1/merchants/{$this->merchant->id}/booking-slots/{$slot->id}");

            $response->assertStatus(204);
            expect(MerchantBookingSlot::count())->toBe(0);
        });

        it('admin gets 422 when deleting non-existent slot', function () {
            $response = $this->deleteJson("/api/v1/merchants/{$this->merchant->id}/booking-slots/99999");

            $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'message' => 'Booking slot not found',
                ]);
        });

        it('admin cannot update a slot that belongs to a different merchant', function () {
            // Create a slot on another merchant
            $otherMerchantUser = User::factory()->create();
            $otherMerchantUser->assignRole('merchant');
            $otherMerchant = Merchant::factory()->create([
                'user_id' => $otherMerchantUser->id,
                'status' => 'active',
            ]);

            $slotFromOtherMerchant = MerchantBookingSlot::factory()->create([
                'merchant_id' => $otherMerchant->id,
                'day_of_week' => 2,
                'start_time' => '10:00',
            ]);

            // Try to update as if it belongs to $this->merchant
            $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/booking-slots/{$slotFromOtherMerchant->id}", [
                'max_capacity' => 99,
            ]);

            // Should 404 because the slot doesn't belong to the specified merchant
            $response->assertStatus(404);
        });

        it('non-admin user cannot access admin booking-slot routes', function () {
            $regularUser = User::factory()->create();
            $regularUser->assignRole('user');
            Passport::actingAs($regularUser);

            $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/booking-slots");

            $response->assertStatus(403);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */
    describe('Authentication', function () {
        it('requires authentication to list self-service booking slots', function () {
            app('auth')->forgetGuards();

            $response = $this->getJson('/api/v1/auth/merchant/booking-slots');

            $response->assertStatus(401);
        });

        it('requires authentication to create a self-service booking slot', function () {
            app('auth')->forgetGuards();

            $response = $this->postJson('/api/v1/auth/merchant/booking-slots', [
                'day_of_week' => 1,
                'start_time' => '09:00',
            ]);

            $response->assertStatus(401);
        });

        it('requires authentication to access admin booking-slot routes', function () {
            app('auth')->forgetGuards();

            $merchantUser = User::factory()->create();
            $merchantUser->assignRole('merchant');
            $merchant = Merchant::factory()->create([
                'user_id' => $merchantUser->id,
                'status' => 'active',
            ]);

            $response = $this->getJson("/api/v1/merchants/{$merchant->id}/booking-slots");

            $response->assertStatus(401);
        });
    });
});
