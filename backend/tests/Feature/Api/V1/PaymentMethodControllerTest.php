<?php

use App\Models\PaymentMethod;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Payment Method Index', function () {
    it('can list all payment methods', function () {
        PaymentMethod::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/payment-methods');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'description', 'is_active', 'sort_order', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter payment methods by name', function () {
        PaymentMethod::factory()->create(['name' => 'Cash']);
        PaymentMethod::factory()->create(['name' => 'Credit Card']);

        $response = $this->getJson('/api/v1/payment-methods?filter[name]=Cash');

        $response->assertStatus(200);
        $data = $response->json('data');
        $filtered = collect($data)->filter(fn ($pm) => str_contains($pm['name'], 'Cash'));
        expect($filtered)->toHaveCount(1);
    });

    it('can paginate payment methods', function () {
        PaymentMethod::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/payment-methods?per_page=5');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });
});

describe('Payment Method All', function () {
    it('can list all payment methods without pagination', function () {
        PaymentMethod::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/payment-methods/all');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    });
});

describe('Payment Method Active', function () {
    it('can list active payment methods', function () {
        PaymentMethod::factory()->count(3)->create(['is_active' => true]);
        PaymentMethod::factory()->count(2)->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/payment-methods/active');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        expect(count($data))->toBe(3);
    });

    it('is accessible without authentication', function () {
        $this->app['auth']->forgetGuards();

        PaymentMethod::factory()->create(['is_active' => true]);

        $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/payment-methods/active');

        $response->assertStatus(200);
    });
});

describe('Payment Method Store', function () {
    it('can create a payment method', function () {
        $response = $this->postJson('/api/v1/payment-methods', [
            'name' => 'PayPal',
            'description' => 'Online payment via PayPal',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Payment method created successfully',
                'data' => [
                    'name' => 'PayPal',
                    'slug' => 'paypal',
                    'description' => 'Online payment via PayPal',
                ],
            ]);

        $this->assertDatabaseHas('payment_methods', [
            'name' => 'PayPal',
            'slug' => 'paypal',
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/payment-methods', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates name uniqueness', function () {
        PaymentMethod::factory()->create(['name' => 'Cash']);

        $response = $this->postJson('/api/v1/payment-methods', [
            'name' => 'Cash',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});

describe('Payment Method Show', function () {
    it('can show a specific payment method', function () {
        $paymentMethod = PaymentMethod::factory()->create();

        $response = $this->getJson("/api/v1/payment-methods/{$paymentMethod->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $paymentMethod->id,
                    'name' => $paymentMethod->name,
                ],
            ]);
    });

    it('returns 404 for non-existent payment method', function () {
        $response = $this->getJson('/api/v1/payment-methods/99999');

        $response->assertStatus(404);
    });
});

describe('Payment Method Update', function () {
    it('can update a payment method', function () {
        $paymentMethod = PaymentMethod::factory()->create();

        $response = $this->putJson("/api/v1/payment-methods/{$paymentMethod->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Name',
                ],
            ]);

        $this->assertDatabaseHas('payment_methods', [
            'id' => $paymentMethod->id,
            'name' => 'Updated Name',
        ]);
    });

    it('validates name uniqueness on update', function () {
        $pm1 = PaymentMethod::factory()->create(['name' => 'Cash']);
        $pm2 = PaymentMethod::factory()->create(['name' => 'Credit Card']);

        $response = $this->putJson("/api/v1/payment-methods/{$pm1->id}", [
            'name' => 'Credit Card',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});

describe('Payment Method Delete', function () {
    it('can delete a payment method', function () {
        $paymentMethod = PaymentMethod::factory()->create();

        $response = $this->deleteJson("/api/v1/payment-methods/{$paymentMethod->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Payment method deleted successfully',
            ]);

        $this->assertDatabaseMissing('payment_methods', [
            'id' => $paymentMethod->id,
        ]);
    });

    it('returns error for non-existent payment method', function () {
        $response = $this->deleteJson('/api/v1/payment-methods/99999');

        $response->assertStatus(422);
    });
});
