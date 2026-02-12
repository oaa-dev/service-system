<?php

use App\Models\PlatformFee;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Platform Fee Index', function () {
    it('can list all platform fees', function () {
        PlatformFee::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/platform-fees');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'description', 'transaction_type', 'rate_percentage', 'is_active', 'sort_order', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter platform fees by name', function () {
        PlatformFee::factory()->create(['name' => 'Booking Fee']);
        PlatformFee::factory()->create(['name' => 'Reservation Fee']);

        $response = $this->getJson('/api/v1/platform-fees?filter[name]=Booking');

        $response->assertStatus(200);
        $data = $response->json('data');
        $filtered = collect($data)->filter(fn ($pf) => str_contains($pf['name'], 'Booking'));
        expect($filtered)->toHaveCount(1);
    });

    it('can filter platform fees by transaction type', function () {
        PlatformFee::factory()->booking()->create();
        PlatformFee::factory()->reservation()->create();

        $response = $this->getJson('/api/v1/platform-fees?filter[transaction_type]=booking');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(collect($data)->every(fn ($pf) => $pf['transaction_type'] === 'booking'))->toBeTrue();
    });

    it('can paginate platform fees', function () {
        PlatformFee::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/platform-fees?per_page=5');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });
});

describe('Platform Fee All', function () {
    it('can list all platform fees without pagination', function () {
        PlatformFee::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/platform-fees/all');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    });
});

describe('Platform Fee Active', function () {
    it('can list active platform fees', function () {
        PlatformFee::factory()->count(3)->create(['is_active' => true]);
        PlatformFee::factory()->count(2)->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/platform-fees/active');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        expect(count($data))->toBe(3);
    });

    it('is accessible without authentication', function () {
        $this->app['auth']->forgetGuards();

        PlatformFee::factory()->create(['is_active' => true]);

        $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/platform-fees/active');

        $response->assertStatus(200);
    });
});

describe('Platform Fee Store', function () {
    it('can create a platform fee', function () {
        $response = $this->postJson('/api/v1/platform-fees', [
            'name' => 'New Booking Fee',
            'description' => 'A convenience fee for bookings',
            'transaction_type' => 'booking',
            'rate_percentage' => 7.50,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Platform fee created successfully',
                'data' => [
                    'name' => 'New Booking Fee',
                    'slug' => 'new-booking-fee',
                    'transaction_type' => 'booking',
                    'rate_percentage' => '7.50',
                ],
            ]);

        $this->assertDatabaseHas('platform_fees', [
            'name' => 'New Booking Fee',
            'slug' => 'new-booking-fee',
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/platform-fees', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'transaction_type', 'rate_percentage']);
    });

    it('validates name uniqueness', function () {
        PlatformFee::factory()->create(['name' => 'Booking Fee']);

        $response = $this->postJson('/api/v1/platform-fees', [
            'name' => 'Booking Fee',
            'transaction_type' => 'booking',
            'rate_percentage' => 5.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates transaction type enum', function () {
        $response = $this->postJson('/api/v1/platform-fees', [
            'name' => 'Invalid Fee',
            'transaction_type' => 'invalid_type',
            'rate_percentage' => 5.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['transaction_type']);
    });

    it('validates rate percentage range', function () {
        $response = $this->postJson('/api/v1/platform-fees', [
            'name' => 'High Fee',
            'transaction_type' => 'booking',
            'rate_percentage' => 150.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rate_percentage']);
    });

    it('deactivates other fees of same type when creating active fee', function () {
        $existing = PlatformFee::factory()->booking()->create(['is_active' => true]);

        $response = $this->postJson('/api/v1/platform-fees', [
            'name' => 'New Booking Fee',
            'transaction_type' => 'booking',
            'rate_percentage' => 10.00,
            'is_active' => true,
        ]);

        $response->assertStatus(201);
        expect($existing->fresh()->is_active)->toBeFalse();
    });
});

describe('Platform Fee Show', function () {
    it('can show a specific platform fee', function () {
        $platformFee = PlatformFee::factory()->create();

        $response = $this->getJson("/api/v1/platform-fees/{$platformFee->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $platformFee->id,
                    'name' => $platformFee->name,
                ],
            ]);
    });

    it('returns 404 for non-existent platform fee', function () {
        $response = $this->getJson('/api/v1/platform-fees/99999');

        $response->assertStatus(404);
    });
});

describe('Platform Fee Update', function () {
    it('can update a platform fee', function () {
        $platformFee = PlatformFee::factory()->create();

        $response = $this->putJson("/api/v1/platform-fees/{$platformFee->id}", [
            'name' => 'Updated Name',
            'rate_percentage' => 8.00,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Name',
                    'rate_percentage' => '8.00',
                ],
            ]);

        $this->assertDatabaseHas('platform_fees', [
            'id' => $platformFee->id,
            'name' => 'Updated Name',
        ]);
    });

    it('validates name uniqueness on update', function () {
        $pf1 = PlatformFee::factory()->create(['name' => 'Fee A']);
        $pf2 = PlatformFee::factory()->create(['name' => 'Fee B']);

        $response = $this->putJson("/api/v1/platform-fees/{$pf1->id}", [
            'name' => 'Fee B',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('deactivates other fees of same type when activating', function () {
        $existing = PlatformFee::factory()->booking()->create(['is_active' => true]);
        $inactive = PlatformFee::factory()->booking()->create(['is_active' => false]);

        $response = $this->putJson("/api/v1/platform-fees/{$inactive->id}", [
            'is_active' => true,
        ]);

        $response->assertStatus(200);
        expect($existing->fresh()->is_active)->toBeFalse();
        expect($inactive->fresh()->is_active)->toBeTrue();
    });
});

describe('Platform Fee Delete', function () {
    it('can delete a platform fee', function () {
        $platformFee = PlatformFee::factory()->create();

        $response = $this->deleteJson("/api/v1/platform-fees/{$platformFee->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Platform fee deleted successfully',
            ]);

        $this->assertDatabaseMissing('platform_fees', [
            'id' => $platformFee->id,
        ]);
    });

    it('returns error for non-existent platform fee', function () {
        $response = $this->deleteJson('/api/v1/platform-fees/99999');

        $response->assertStatus(422);
    });
});

describe('Platform Fee Calculate', function () {
    it('calculates fee correctly when active fee exists', function () {
        PlatformFee::factory()->booking()->create([
            'is_active' => true,
            'rate_percentage' => 5.00,
        ]);

        $service = app(\App\Services\Contracts\PlatformFeeServiceInterface::class);
        $result = $service->calculateFee('booking', 1000.00);

        expect($result['fee_rate'])->toBe(5.0);
        expect($result['fee_amount'])->toBe(50.0);
        expect($result['total_amount'])->toBe(1050.0);
    });

    it('returns zero fee when no active fee exists', function () {
        $service = app(\App\Services\Contracts\PlatformFeeServiceInterface::class);
        $result = $service->calculateFee('booking', 1000.00);

        expect($result['fee_rate'])->toBe(0);
        expect($result['fee_amount'])->toBe(0);
        expect($result['total_amount'])->toBe(1000.0);
    });
});
