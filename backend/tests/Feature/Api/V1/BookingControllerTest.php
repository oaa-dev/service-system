<?php

use App\Models\Booking;
use App\Models\Merchant;
use App\Models\PlatformFee;
use App\Models\Service;
use App\Models\ServiceSchedule;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);

    $this->merchant = Merchant::factory()->create(['can_take_bookings' => true]);
    $this->service = Service::factory()->create([
        'merchant_id' => $this->merchant->id,
        'is_bookable' => true,
        'duration' => 60,
        'max_capacity' => 2,
        'requires_confirmation' => true,
    ]);

    // Set up a schedule for Monday (day 1)
    ServiceSchedule::create([
        'service_id' => $this->service->id,
        'day_of_week' => 1,
        'start_time' => '09:00',
        'end_time' => '17:00',
        'is_available' => true,
    ]);
});

describe('Booking Index', function () {
    it('can list merchant bookings', function () {
        Booking::factory()->count(3)->create(['merchant_id' => $this->merchant->id, 'service_id' => $this->service->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/bookings");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'merchant_id', 'service_id', 'customer_id', 'booking_date', 'start_time', 'end_time', 'party_size', 'status'],
                ],
                'meta',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter bookings by status', function () {
        Booking::factory()->count(2)->create(['merchant_id' => $this->merchant->id, 'service_id' => $this->service->id, 'status' => 'pending']);
        Booking::factory()->confirmed()->create(['merchant_id' => $this->merchant->id, 'service_id' => $this->service->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/bookings?filter[status]=pending");

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(2);
    });

    it('only returns bookings for the specified merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        Booking::factory()->count(2)->create(['merchant_id' => $this->merchant->id, 'service_id' => $this->service->id]);
        Booking::factory()->count(3)->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/bookings");

        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBe(2);
    });
});

describe('Booking Show', function () {
    it('can show a specific booking', function () {
        $booking = Booking::factory()->create(['merchant_id' => $this->merchant->id, 'service_id' => $this->service->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $booking->id,
                    'status' => $booking->status,
                ],
            ])
            ->assertJsonStructure(['data' => ['service', 'customer']]);
    });

    it('returns 404 for booking belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $booking = Booking::factory()->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}");

        $response->assertStatus(404);
    });
});

describe('Booking Create', function () {
    it('can create a booking for a bookable service', function () {
        // Find a Monday date in the future
        $nextMonday = now()->next('Monday')->format('Y-m-d');

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'service_id' => $this->service->id,
                    'status' => 'pending', // requires_confirmation = true
                    'party_size' => 1,
                ],
            ]);
    });

    it('auto-confirms when service does not require confirmation', function () {
        $service = Service::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_bookable' => true,
            'duration' => 30,
            'requires_confirmation' => false,
        ]);
        ServiceSchedule::create([
            'service_id' => $service->id,
            'day_of_week' => 1,
            'start_time' => '09:00',
            'end_time' => '17:00',
            'is_available' => true,
        ]);

        $nextMonday = now()->next('Monday')->format('Y-m-d');

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/bookings", [
            'service_id' => $service->id,
            'booking_date' => $nextMonday,
            'start_time' => '10:00',
        ]);

        $response->assertStatus(201)
            ->assertJson(['data' => ['status' => 'confirmed']]);

        expect($response->json('data.confirmed_at'))->not->toBeNull();
    });

    it('rejects booking when merchant cannot take bookings', function () {
        $merchant = Merchant::factory()->create(['can_take_bookings' => false]);
        $service = Service::factory()->create(['merchant_id' => $merchant->id, 'is_bookable' => true, 'duration' => 60]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/bookings", [
            'service_id' => $service->id,
            'booking_date' => now()->next('Monday')->format('Y-m-d'),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['merchant']);
    });

    it('rejects booking on unavailable day', function () {
        // Sunday has no schedule
        $nextSunday = now()->next('Sunday')->format('Y-m-d');

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $nextSunday,
            'start_time' => '10:00',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['booking_date']);
    });

    it('rejects booking outside schedule hours', function () {
        $nextMonday = now()->next('Monday')->format('Y-m-d');

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $nextMonday,
            'start_time' => '07:00', // before 09:00
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_time']);
    });

    it('rejects booking when slot is at capacity', function () {
        $nextMonday = now()->next('Monday')->format('Y-m-d');

        // Fill to capacity (max_capacity = 2)
        Booking::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'booking_date' => $nextMonday,
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'party_size' => 1,
            'status' => 'confirmed',
        ]);

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_time']);
    });

    it('validates required fields', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/bookings", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_id', 'booking_date', 'start_time']);
    });
});

describe('Booking Status Update', function () {
    it('can confirm a pending booking', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}/status", [
            'status' => 'confirmed',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'confirmed']]);

        expect($response->json('data.confirmed_at'))->not->toBeNull();
    });

    it('can cancel a pending booking', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}/status", [
            'status' => 'cancelled',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'cancelled']]);

        expect($response->json('data.cancelled_at'))->not->toBeNull();
    });

    it('can complete a confirmed booking', function () {
        $booking = Booking::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'completed']]);
    });

    it('can mark a confirmed booking as no_show', function () {
        $booking = Booking::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}/status", [
            'status' => 'no_show',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'no_show']]);
    });

    it('rejects invalid status transition', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}/status", [
            'status' => 'completed', // can't go from pending to completed
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    });

    it('returns 404 for booking belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $booking = Booking::factory()->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}/status", [
            'status' => 'confirmed',
        ]);

        $response->assertStatus(404);
    });
});

describe('Booking Platform Fee', function () {
    it('calculates platform fee on creation', function () {
        // Create active booking fee at 5%
        PlatformFee::factory()->booking()->create([
            'is_active' => true,
            'rate_percentage' => 5.00,
        ]);

        $this->service->update(['price' => 1000.00]);

        $nextMonday = now()->next('Monday')->format('Y-m-d');

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
        ]);

        $response->assertStatus(201);
        expect($response->json('data.service_price'))->toBe('1000.00');
        expect($response->json('data.fee_rate'))->toBe('5.00');
        expect($response->json('data.fee_amount'))->toBe('50.00');
        expect($response->json('data.total_amount'))->toBe('1050.00');
    });

    it('sets zero fee when no active platform fee', function () {
        $this->service->update(['price' => 500.00]);

        $nextMonday = now()->next('Monday')->format('Y-m-d');

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/bookings", [
            'service_id' => $this->service->id,
            'booking_date' => $nextMonday,
            'start_time' => '10:00',
        ]);

        $response->assertStatus(201);
        expect($response->json('data.service_price'))->toBe('500.00');
        expect($response->json('data.fee_rate'))->toBe('0.00');
        expect($response->json('data.fee_amount'))->toBe('0.00');
        expect($response->json('data.total_amount'))->toBe('500.00');
    });
});
