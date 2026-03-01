<?php

use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->assignRole('customer');
    $this->customer = Customer::factory()->create([
        'user_id' => $this->user->id,
        'preferred_payment_method' => null,
    ]);
    Passport::actingAs($this->user);
});

describe('GET /customer/my/payment-methods', function () {
    it('returns active payment methods', function () {
        $active = PaymentMethod::factory()->count(3)->create(['is_active' => true]);
        PaymentMethod::factory()->count(2)->inactive()->create();

        $response = $this->getJson('/api/v1/customer/my/payment-methods');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $returnedIds = collect($response->json('data.methods'))->pluck('id')->all();

        foreach ($active as $method) {
            expect($returnedIds)->toContain($method->id);
        }

        expect(count($returnedIds))->toBe(3);
    });

    it('does not return inactive payment methods', function () {
        PaymentMethod::factory()->count(2)->inactive()->create();

        $response = $this->getJson('/api/v1/customer/my/payment-methods');

        $response->assertStatus(200);

        expect($response->json('data.methods'))->toBeEmpty();
    });

    it('returns the customers current preferred payment method', function () {
        // Use a valid ENUM value for preferred_payment_method
        $this->customer->update(['preferred_payment_method' => 'cash']);

        $response = $this->getJson('/api/v1/customer/my/payment-methods');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'preferred' => 'cash',
                ],
            ]);
    });

    it('returns null preferred when customer has no preference set', function () {
        PaymentMethod::factory()->create(['is_active' => true]);

        $response = $this->getJson('/api/v1/customer/my/payment-methods');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'preferred' => null,
                ],
            ]);
    });

    it('requires authentication', function () {
        app('auth')->forgetGuards();

        $response = $this->getJson('/api/v1/customer/my/payment-methods');

        $response->assertStatus(401);
    });
});

describe('PUT /customer/my/payment-preferences', function () {
    it('updates the preferred payment method using a valid enum value', function () {
        $response = $this->putJson('/api/v1/customer/my/payment-preferences', [
            'preferred_payment_method' => 'cash',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'preferred_payment_method' => 'cash',
                ],
            ]);

        expect($this->customer->fresh()->preferred_payment_method)->toBe('cash');
    });

    it('accepts null to clear the payment preference', function () {
        $this->customer->update(['preferred_payment_method' => 'cash']);

        $response = $this->putJson('/api/v1/customer/my/payment-preferences', [
            'preferred_payment_method' => null,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'preferred_payment_method' => null,
                ],
            ]);

        expect($this->customer->fresh()->preferred_payment_method)->toBeNull();
    });

    it('accepts an empty payload and clears the preference', function () {
        $this->customer->update(['preferred_payment_method' => 'cash']);

        $response = $this->putJson('/api/v1/customer/my/payment-preferences', []);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'preferred_payment_method' => null,
                ],
            ]);

        expect($this->customer->fresh()->preferred_payment_method)->toBeNull();
    });

    it('requires authentication', function () {
        app('auth')->forgetGuards();

        $response = $this->putJson('/api/v1/customer/my/payment-preferences', [
            'preferred_payment_method' => 'cash',
        ]);

        $response->assertStatus(401);
    });

    it('rejects payment method values that are too long', function () {
        $response = $this->putJson('/api/v1/customer/my/payment-preferences', [
            'preferred_payment_method' => str_repeat('a', 101),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['preferred_payment_method']);
    });
});
