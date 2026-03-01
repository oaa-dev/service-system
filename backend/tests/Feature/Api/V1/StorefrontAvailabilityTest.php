<?php

use App\Models\Booking;
use App\Models\Merchant;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\ServiceSchedule;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->user = User::factory()->create();
    $this->merchant = Merchant::factory()->create([
        'user_id' => $this->user->id,
        'status' => 'active',
    ]);
});

describe('Booking Availability', function () {
    beforeEach(function () {
        $this->service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'max_capacity' => 3,
        ]);

        // Create weekly schedule: Mon-Fri 09:00-17:00, Sat-Sun closed
        foreach (range(0, 6) as $day) {
            ServiceSchedule::create([
                'service_id' => $this->service->id,
                'day_of_week' => $day,
                'start_time' => '09:00:00',
                'end_time' => '17:00:00',
                'is_available' => $day >= 1 && $day <= 5, // Mon-Fri open
            ]);
        }
    });

    it('returns schedule and empty booked_slots for month with no bookings', function () {
        $response = $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/booking-availability?month=2026-03"
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.service.id', $this->service->id)
            ->assertJsonPath('data.service.name', $this->service->name)
            ->assertJsonPath('data.service.duration', 60)
            ->assertJsonPath('data.service.max_capacity', 3)
            ->assertJsonCount(7, 'data.schedule')
            ->assertJsonPath('data.booked_slots', []);
    });

    it('returns correct booked counts per slot', function () {
        $customer = User::factory()->create();

        // 2 bookings at 10:00 on 2026-03-03
        Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'booking_date' => '2026-03-03',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'party_size' => 2,
            'status' => 'pending',
        ]);

        Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'booking_date' => '2026-03-03',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'party_size' => 1,
            'status' => 'confirmed',
        ]);

        $response = $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/booking-availability?month=2026-03"
        );

        $response->assertStatus(200);
        $data = $response->json('data');
        expect($data['booked_slots'])->toHaveKey('2026-03-03');
        expect($data['booked_slots']['2026-03-03'][0]['time'])->toBe('10:00');
        expect($data['booked_slots']['2026-03-03'][0]['booked'])->toBe(3);
    });

    it('excludes cancelled and completed bookings from counts', function () {
        $customer = User::factory()->create();

        Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'booking_date' => '2026-03-05',
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'party_size' => 1,
            'status' => 'pending',
        ]);

        Booking::factory()->cancelled()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'booking_date' => '2026-03-05',
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'party_size' => 2,
        ]);

        Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'booking_date' => '2026-03-05',
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'party_size' => 1,
            'status' => 'completed',
        ]);

        $response = $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/booking-availability?month=2026-03"
        );

        $response->assertStatus(200);
        $slots = $response->json('data.booked_slots');
        expect($slots['2026-03-05'][0]['booked'])->toBe(1); // Only the pending one
    });

    it('returns 404 for non-existent merchant slug', function () {
        $this->getJson(
            "/api/v1/storefront/merchants/non-existent/services/{$this->service->id}/booking-availability?month=2026-03"
        )->assertStatus(404);
    });

    it('returns 404 for service not belonging to merchant', function () {
        $otherUser = User::factory()->create();
        $otherMerchant = Merchant::factory()->create([
            'user_id' => $otherUser->id,
            'status' => 'active',
        ]);
        $otherService = Service::factory()->bookable()->create([
            'merchant_id' => $otherMerchant->id,
        ]);

        $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$otherService->id}/booking-availability?month=2026-03"
        )->assertStatus(404);
    });

    it('returns 404 for non-bookable service', function () {
        $sellableService = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$sellableService->id}/booking-availability?month=2026-03"
        )->assertStatus(404);
    });

    it('returns 422 for missing month param', function () {
        $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/booking-availability"
        )->assertStatus(422);
    });

    it('returns 422 for invalid month format', function () {
        $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/booking-availability?month=2026-3"
        )->assertStatus(422);
    });

    it('includes closed days in schedule response', function () {
        $response = $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/booking-availability?month=2026-03"
        );

        $response->assertStatus(200);
        $schedule = $response->json('data.schedule');

        // Sunday (0) and Saturday (6) should be is_available=false
        $sunday = collect($schedule)->firstWhere('day_of_week', 0);
        $saturday = collect($schedule)->firstWhere('day_of_week', 6);
        expect($sunday['is_available'])->toBeFalse();
        expect($saturday['is_available'])->toBeFalse();

        // Monday should be available
        $monday = collect($schedule)->firstWhere('day_of_week', 1);
        expect($monday['is_available'])->toBeTrue();
    });
});

describe('Reservation Availability', function () {
    beforeEach(function () {
        $this->service = Service::factory()->reservation(2500.00)->create([
            'merchant_id' => $this->merchant->id,
            'max_capacity' => 4,
        ]);
    });

    it('returns empty reserved_dates for month with no reservations', function () {
        $response = $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/reservation-availability?month=2026-03"
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.service.id', $this->service->id)
            ->assertJsonPath('data.service.name', $this->service->name)
            ->assertJsonPath('data.reserved_dates', []);
    });

    it('returns correct date ranges for existing reservations', function () {
        $customer = User::factory()->create();

        Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'check_in' => '2026-03-05',
            'check_out' => '2026-03-08',
            'status' => 'confirmed',
        ]);

        Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'check_in' => '2026-03-15',
            'check_out' => '2026-03-18',
            'status' => 'pending',
        ]);

        $response = $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/reservation-availability?month=2026-03"
        );

        $response->assertStatus(200);
        $reserved = $response->json('data.reserved_dates');
        expect($reserved)->toHaveCount(2);
    });

    it('includes pending, confirmed, and checked_in reservations', function () {
        $customer = User::factory()->create();

        foreach (['pending', 'confirmed', 'checked_in'] as $i => $status) {
            $day = 3 + ($i * 5);
            Reservation::factory()->create([
                'merchant_id' => $this->merchant->id,
                'service_id' => $this->service->id,
                'customer_id' => $customer->id,
                'check_in' => "2026-03-{$day}",
                'check_out' => '2026-03-' . ($day + 2),
                'status' => $status,
            ]);
        }

        $response = $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/reservation-availability?month=2026-03"
        );

        expect($response->json('data.reserved_dates'))->toHaveCount(3);
    });

    it('excludes cancelled and checked_out reservations', function () {
        $customer = User::factory()->create();

        Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'check_in' => '2026-03-05',
            'check_out' => '2026-03-08',
            'status' => 'confirmed',
        ]);

        Reservation::factory()->cancelled()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'check_in' => '2026-03-10',
            'check_out' => '2026-03-13',
        ]);

        Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'check_in' => '2026-03-20',
            'check_out' => '2026-03-23',
            'status' => 'checked_out',
        ]);

        $response = $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/reservation-availability?month=2026-03"
        );

        expect($response->json('data.reserved_dates'))->toHaveCount(1);
    });

    it('handles cross-month reservations', function () {
        $customer = User::factory()->create();

        // Reservation spanning Feb → Mar
        Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'check_in' => '2026-02-27',
            'check_out' => '2026-03-03',
            'status' => 'confirmed',
        ]);

        // Reservation spanning Mar → Apr
        Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $customer->id,
            'check_in' => '2026-03-29',
            'check_out' => '2026-04-02',
            'status' => 'confirmed',
        ]);

        $response = $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/reservation-availability?month=2026-03"
        );

        $response->assertStatus(200);
        $reserved = $response->json('data.reserved_dates');
        expect($reserved)->toHaveCount(2);
    });

    it('returns 404 for non-existent service', function () {
        $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/99999/reservation-availability?month=2026-03"
        )->assertStatus(404);
    });

    it('returns 404 for non-reservation service', function () {
        $bookableService = Service::factory()->bookable()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$bookableService->id}/reservation-availability?month=2026-03"
        )->assertStatus(404);
    });

    it('returns 422 for missing month param', function () {
        $this->getJson(
            "/api/v1/storefront/merchants/{$this->merchant->slug}/services/{$this->service->id}/reservation-availability"
        )->assertStatus(422);
    });
});
