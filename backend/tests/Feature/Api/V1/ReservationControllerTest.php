<?php

use App\Models\Merchant;
use App\Models\PlatformFee;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);

    $this->merchant = Merchant::factory()->create(['can_rent_units' => true]);
    $this->service = Service::factory()->reservation(2500.00)->create([
        'merchant_id' => $this->merchant->id,
        'max_capacity' => 4,
        'unit_status' => 'available',
        'is_active' => true,
    ]);
});

describe('Reservation Index', function () {
    it('can list merchant reservations', function () {
        Reservation::factory()->count(3)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/reservations");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['*' => ['id', 'merchant_id', 'service_id', 'customer_id', 'check_in', 'check_out', 'nights', 'status', 'total_price']],
                'meta',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter reservations by status', function () {
        Reservation::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'pending',
        ]);
        Reservation::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/reservations?filter[status]=pending");

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(2);
    });

    it('only returns reservations for the specified merchant', function () {
        $otherMerchant = Merchant::factory()->create(['can_rent_units' => true]);
        $otherService = Service::factory()->reservation()->create(['merchant_id' => $otherMerchant->id]);

        Reservation::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);
        Reservation::factory()->count(3)->create([
            'merchant_id' => $otherMerchant->id,
            'service_id' => $otherService->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/reservations");

        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBe(2);
    });
});

describe('Reservation Store', function () {
    it('can create a reservation', function () {
        $checkIn = now()->addDays(5)->format('Y-m-d');
        $checkOut = now()->addDays(8)->format('Y-m-d');

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/reservations", [
            'service_id' => $this->service->id,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'guest_count' => 2,
            'notes' => 'Early check-in requested',
            'special_requests' => 'Extra pillows',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'service_id' => $this->service->id,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'guest_count' => 2,
                    'nights' => 3,
                    'status' => 'pending',
                    'notes' => 'Early check-in requested',
                    'special_requests' => 'Extra pillows',
                ],
            ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/reservations", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_id', 'check_in', 'check_out']);
    });

    it('rejects reservation when merchant cannot rent units', function () {
        $merchant = Merchant::factory()->create(['can_rent_units' => false]);
        $service = Service::factory()->reservation()->create(['merchant_id' => $merchant->id]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/reservations", [
            'service_id' => $service->id,
            'check_in' => now()->addDays(1)->format('Y-m-d'),
            'check_out' => now()->addDays(3)->format('Y-m-d'),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['merchant']);
    });

    it('rejects overlapping reservations', function () {
        Reservation::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'check_in' => now()->addDays(5)->format('Y-m-d'),
            'check_out' => now()->addDays(10)->format('Y-m-d'),
        ]);

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/reservations", [
            'service_id' => $this->service->id,
            'check_in' => now()->addDays(7)->format('Y-m-d'),
            'check_out' => now()->addDays(12)->format('Y-m-d'),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_id']);
    });

    it('rejects guest count exceeding max capacity', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/reservations", [
            'service_id' => $this->service->id,
            'check_in' => now()->addDays(1)->format('Y-m-d'),
            'check_out' => now()->addDays(3)->format('Y-m-d'),
            'guest_count' => 10,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['guest_count']);
    });

    it('calculates pricing correctly', function () {
        $this->service->update(['price_per_night' => 2000, 'price' => 3000]);

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/reservations", [
            'service_id' => $this->service->id,
            'check_in' => now()->addDays(1)->format('Y-m-d'),
            'check_out' => now()->addDays(4)->format('Y-m-d'),
        ]);

        $response->assertStatus(201);
        expect($response->json('data.nights'))->toBe(3);
        expect($response->json('data.price_per_night'))->toBe('2000.00');
        expect($response->json('data.total_price'))->toBe('6000.00');
    });
});

describe('Reservation Show', function () {
    it('can show a specific reservation', function () {
        $reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/reservations/{$reservation->id}");

        $response->assertStatus(200)
            ->assertJson(['data' => ['id' => $reservation->id]])
            ->assertJsonStructure(['data' => ['service']]);
    });

    it('returns 404 for reservation belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create(['can_rent_units' => true]);
        $otherService = Service::factory()->reservation()->create(['merchant_id' => $otherMerchant->id]);
        $reservation = Reservation::factory()->create([
            'merchant_id' => $otherMerchant->id,
            'service_id' => $otherService->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/reservations/{$reservation->id}");

        $response->assertStatus(404);
    });
});

describe('Reservation Status Update', function () {
    it('can confirm a pending reservation', function () {
        $reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/reservations/{$reservation->id}/status", [
            'status' => 'confirmed',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'confirmed']]);
        expect($response->json('data.confirmed_at'))->not->toBeNull();
    });

    it('can cancel a pending reservation', function () {
        $reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/reservations/{$reservation->id}/status", [
            'status' => 'cancelled',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'cancelled']]);
        expect($response->json('data.cancelled_at'))->not->toBeNull();
    });

    it('can check in a confirmed reservation', function () {
        $reservation = Reservation::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/reservations/{$reservation->id}/status", [
            'status' => 'checked_in',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'checked_in']]);
        expect($response->json('data.checked_in_at'))->not->toBeNull();
    });

    it('can check out a checked-in reservation', function () {
        $reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'checked_in',
            'confirmed_at' => now()->subDay(),
            'checked_in_at' => now(),
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/reservations/{$reservation->id}/status", [
            'status' => 'checked_out',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'checked_out']]);
        expect($response->json('data.checked_out_at'))->not->toBeNull();
    });

    it('rejects invalid status transition', function () {
        $reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/reservations/{$reservation->id}/status", [
            'status' => 'checked_in',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    });

    it('returns 404 for reservation of another merchant', function () {
        $otherMerchant = Merchant::factory()->create(['can_rent_units' => true]);
        $otherService = Service::factory()->reservation()->create(['merchant_id' => $otherMerchant->id]);
        $reservation = Reservation::factory()->create([
            'merchant_id' => $otherMerchant->id,
            'service_id' => $otherService->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/reservations/{$reservation->id}/status", [
            'status' => 'confirmed',
        ]);

        $response->assertStatus(404);
    });
});

describe('Reservation Platform Fee', function () {
    it('calculates platform fee on creation', function () {
        PlatformFee::factory()->reservation()->create([
            'is_active' => true,
            'rate_percentage' => 5.00,
        ]);

        $this->service->update(['price_per_night' => 2000]);

        $checkIn = now()->addDays(5)->format('Y-m-d');
        $checkOut = now()->addDays(8)->format('Y-m-d');

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/reservations", [
            'service_id' => $this->service->id,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
        ]);

        $response->assertStatus(201);
        // 3 nights * 2000 = 6000 subtotal
        expect($response->json('data.total_price'))->toBe('6000.00');
        expect($response->json('data.fee_rate'))->toBe('5.00');
        expect($response->json('data.fee_amount'))->toBe('300.00');
        expect($response->json('data.total_amount'))->toBe('6300.00');
    });

    it('sets zero fee when no active platform fee', function () {
        $this->service->update(['price_per_night' => 1000]);

        $checkIn = now()->addDays(1)->format('Y-m-d');
        $checkOut = now()->addDays(3)->format('Y-m-d');

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/reservations", [
            'service_id' => $this->service->id,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
        ]);

        $response->assertStatus(201);
        expect($response->json('data.total_price'))->toBe('2000.00');
        expect($response->json('data.fee_rate'))->toBe('0.00');
        expect($response->json('data.fee_amount'))->toBe('0.00');
        expect($response->json('data.total_amount'))->toBe('2000.00');
    });
});
