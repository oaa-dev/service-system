<?php

use App\Models\Merchant;
use App\Models\PlatformFee;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);

    $this->merchant = Merchant::factory()->create(['can_sell_products' => true]);
    $this->service = Service::factory()->create([
        'merchant_id' => $this->merchant->id,
        'is_active' => true,
        'price' => 150.00,
    ]);
});

describe('ServiceOrder Index', function () {
    it('can list merchant service orders', function () {
        ServiceOrder::factory()->count(3)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-orders");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['*' => ['id', 'merchant_id', 'service_id', 'order_number', 'quantity', 'unit_label', 'unit_price', 'total_price', 'status']],
                'meta',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter service orders by status', function () {
        ServiceOrder::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'pending',
        ]);
        ServiceOrder::factory()->received()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-orders?filter[status]=pending");

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(2);
    });

    it('only returns service orders for the specified merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $otherService = Service::factory()->create(['merchant_id' => $otherMerchant->id]);

        ServiceOrder::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);
        ServiceOrder::factory()->count(3)->create([
            'merchant_id' => $otherMerchant->id,
            'service_id' => $otherService->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-orders");

        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBe(2);
    });
});

describe('ServiceOrder Store', function () {
    it('can create a service order', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-orders", [
            'service_id' => $this->service->id,
            'quantity' => 5.5,
            'unit_label' => 'kg',
            'notes' => 'Rush order',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'service_id' => $this->service->id,
                    'quantity' => '5.50',
                    'unit_label' => 'kg',
                    'unit_price' => '150.00',
                    'total_price' => '825.00',
                    'status' => 'pending',
                    'notes' => 'Rush order',
                ],
            ]);

        // Verify order number format
        expect($response->json('data.order_number'))->toStartWith('ORD-');
    });

    it('validates required fields', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-orders", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_id', 'quantity', 'unit_label']);
    });

    it('rejects order when merchant cannot sell products', function () {
        $merchant = Merchant::factory()->create(['can_sell_products' => false]);
        $service = Service::factory()->create(['merchant_id' => $merchant->id, 'is_active' => true]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/service-orders", [
            'service_id' => $service->id,
            'quantity' => 1,
            'unit_label' => 'pcs',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['merchant']);
    });

    it('generates sequential order numbers', function () {
        $response1 = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-orders", [
            'service_id' => $this->service->id,
            'quantity' => 1,
            'unit_label' => 'pcs',
        ]);

        $response2 = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-orders", [
            'service_id' => $this->service->id,
            'quantity' => 2,
            'unit_label' => 'pcs',
        ]);

        $response1->assertStatus(201);
        $response2->assertStatus(201);

        $orderNum1 = $response1->json('data.order_number');
        $orderNum2 = $response2->json('data.order_number');

        // Both should have the same date prefix
        $prefix1 = substr($orderNum1, 0, -3);
        $prefix2 = substr($orderNum2, 0, -3);
        expect($prefix1)->toBe($prefix2);

        // Second number should be 1 higher
        $num1 = (int) substr($orderNum1, -3);
        $num2 = (int) substr($orderNum2, -3);
        expect($num2)->toBe($num1 + 1);
    });
});

describe('ServiceOrder Show', function () {
    it('can show a specific service order', function () {
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}");

        $response->assertStatus(200)
            ->assertJson(['data' => ['id' => $order->id]])
            ->assertJsonStructure(['data' => ['service', 'customer']]);
    });

    it('returns 404 for service order belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $otherService = Service::factory()->create(['merchant_id' => $otherMerchant->id]);
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $otherMerchant->id,
            'service_id' => $otherService->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}");

        $response->assertStatus(404);
    });
});

describe('ServiceOrder Status Update', function () {
    it('can receive a pending order', function () {
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status", [
            'status' => 'received',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'received']]);
        expect($response->json('data.received_at'))->not->toBeNull();
    });

    it('can process a received order', function () {
        $order = ServiceOrder::factory()->received()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status", [
            'status' => 'processing',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'processing']]);
    });

    it('can mark a processing order as ready', function () {
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'processing',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status", [
            'status' => 'ready',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'ready']]);
    });

    it('can complete a ready order (pickup)', function () {
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'ready',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'completed']]);
        expect($response->json('data.completed_at'))->not->toBeNull();
    });

    it('can set a ready order to delivering', function () {
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'ready',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status", [
            'status' => 'delivering',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'delivering']]);
    });

    it('can complete a delivering order', function () {
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'delivering',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'completed']]);
        expect($response->json('data.completed_at'))->not->toBeNull();
    });

    it('can cancel a pending order', function () {
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status", [
            'status' => 'cancelled',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'cancelled']]);
        expect($response->json('data.cancelled_at'))->not->toBeNull();
    });

    it('rejects invalid status transition', function () {
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $this->actingUser->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    });

    it('returns 404 for service order of another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $otherService = Service::factory()->create(['merchant_id' => $otherMerchant->id]);
        $order = ServiceOrder::factory()->create([
            'merchant_id' => $otherMerchant->id,
            'service_id' => $otherService->id,
            'customer_id' => $this->actingUser->id,
        ]);

        $response = $this->patchJson("/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status", [
            'status' => 'received',
        ]);

        $response->assertStatus(404);
    });
});

describe('ServiceOrder Platform Fee', function () {
    it('calculates platform fee on creation', function () {
        PlatformFee::factory()->sellProduct()->create([
            'is_active' => true,
            'rate_percentage' => 5.00,
        ]);

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-orders", [
            'service_id' => $this->service->id,
            'quantity' => 10,
            'unit_label' => 'kg',
        ]);

        $response->assertStatus(201);
        // 10 * 150 = 1500 subtotal
        expect($response->json('data.total_price'))->toBe('1500.00');
        expect($response->json('data.fee_rate'))->toBe('5.00');
        expect($response->json('data.fee_amount'))->toBe('75.00');
        expect($response->json('data.total_amount'))->toBe('1575.00');
    });

    it('sets zero fee when no active platform fee', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-orders", [
            'service_id' => $this->service->id,
            'quantity' => 4,
            'unit_label' => 'pcs',
        ]);

        $response->assertStatus(201);
        // 4 * 150 = 600 subtotal
        expect($response->json('data.total_price'))->toBe('600.00');
        expect($response->json('data.fee_rate'))->toBe('0.00');
        expect($response->json('data.fee_amount'))->toBe('0.00');
        expect($response->json('data.total_amount'))->toBe('600.00');
    });
});
