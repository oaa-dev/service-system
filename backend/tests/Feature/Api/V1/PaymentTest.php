<?php

use App\Models\Booking;
use App\Models\Merchant;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Models\User;
use App\Notifications\PaymentReceivedNotification;
use App\Notifications\PaymentRequestedNotification;
use App\Services\Contracts\PayMongoServiceInterface;
use Illuminate\Support\Facades\Notification;
use Laravel\Passport\Passport;

/*
|--------------------------------------------------------------------------
| Payment Controller Tests
|--------------------------------------------------------------------------
*/
describe('Payment Show', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'active',
            'can_take_bookings' => true,
        ]);
        $this->service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);
        Passport::actingAs($this->user);
    });

    it('can view a payment', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'confirmed',
        ]);
        $payment = Payment::factory()->pending()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'amount' => 1500.00,
        ]);

        $response = $this->getJson("/api/v1/payments/{$payment->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.id', $payment->id)
            ->assertJsonPath('data.amount', '1500.00')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.currency', 'PHP');
    });

    it('returns 404 for non-existent payment', function () {
        $response = $this->getJson('/api/v1/payments/99999');

        $response->assertStatus(404);
    });
});

/*
|--------------------------------------------------------------------------
| Payment Mark as Paid
|--------------------------------------------------------------------------
*/
describe('Payment Mark as Paid', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'active',
            'can_take_bookings' => true,
        ]);
        $this->service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);
        Passport::actingAs($this->user);
    });

    it('can mark a pending payment as paid', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);
        $payment = Payment::factory()->pending()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'amount' => 1500.00,
        ]);

        $response = $this->postJson("/api/v1/payments/{$payment->id}/mark-paid", [
            'reference' => 'REF-123',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.status', 'paid');

        $payment->refresh();
        expect($payment->status)->toBe('paid')
            ->and($payment->paid_at)->not->toBeNull()
            ->and($payment->gateway_reference)->toBe('REF-123');

        // Check payable payment_status was updated
        $booking->refresh();
        expect($booking->payment_status)->toBe('paid');
    });

    it('cannot mark an unpaid payment as paid (must be pending first)', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'confirmed',
        ]);
        $payment = Payment::factory()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'amount' => 1500.00,
            'status' => 'unpaid',
        ]);

        $response = $this->postJson("/api/v1/payments/{$payment->id}/mark-paid");

        $response->assertStatus(422);
    });
});

/*
|--------------------------------------------------------------------------
| Payment Refund
|--------------------------------------------------------------------------
*/
describe('Payment Refund', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'active',
            'can_take_bookings' => true,
        ]);
        $this->service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);
        Passport::actingAs($this->user);
    });

    it('can request a refund for a paid payment', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);
        $payment = Payment::factory()->paid()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'amount' => 1500.00,
        ]);

        $response = $this->postJson("/api/v1/payments/{$payment->id}/request-refund", [
            'reason' => 'Customer requested cancellation',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $payment->refresh();
        expect($payment->refund_status)->toBe('requested')
            ->and($payment->metadata['refund_reason'])->toBe('Customer requested cancellation');
    });

    it('can mark a paid payment as refunded', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);
        $payment = Payment::factory()->paid()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'amount' => 1500.00,
        ]);

        $response = $this->postJson("/api/v1/payments/{$payment->id}/mark-refunded");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'refunded');

        $payment->refresh();
        expect($payment->status)->toBe('refunded')
            ->and($payment->refund_status)->toBe('processed')
            ->and($payment->refunded_at)->not->toBeNull();

        $booking->refresh();
        expect($booking->payment_status)->toBe('refunded');
    });

    it('cannot refund an unpaid payment', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'confirmed',
        ]);
        $payment = Payment::factory()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'status' => 'unpaid',
        ]);

        $response = $this->postJson("/api/v1/payments/{$payment->id}/mark-refunded");

        $response->assertStatus(422);
    });
});

/*
|--------------------------------------------------------------------------
| Booking Confirmation with Payment
|--------------------------------------------------------------------------
*/
describe('Booking Confirmation with Payment', function () {
    beforeEach(function () {
        Notification::fake();

        $this->user = User::factory()->create();
        $this->user->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'active',
            'can_take_bookings' => true,
        ]);
        $this->service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        // Mock PayMongo service
        $this->mock(PayMongoServiceInterface::class, function ($mock) {
            $mock->shouldReceive('createCheckoutSession')
                ->andReturn([
                    'checkout_session_id' => 'cs_test_mock123',
                    'checkout_url' => 'https://checkout.paymongo.com/test/mock123',
                ]);
        });

        Passport::actingAs($this->user);
    });

    it('creates payment and requests online payment on confirmation', function () {
        $customerUser = User::factory()->create();
        $customerUser->assignRole('customer');

        $booking = Booking::factory()->create([
            'customer_id' => $customerUser->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'pending',
            'total_amount' => 1500.00,
        ]);

        $response = $this->patchJson(
            "/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}/status",
            [
                'status' => 'confirmed',
                'payment_action' => 'request_payment',
            ]
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed');

        // Payment record should exist
        $payment = Payment::where('payable_type', 'booking')
            ->where('payable_id', $booking->id)
            ->first();

        expect($payment)->not->toBeNull()
            ->and($payment->status)->toBe('pending')
            ->and($payment->checkout_url)->toBe('https://checkout.paymongo.com/test/mock123')
            ->and($payment->gateway_payment_id)->toBe('cs_test_mock123');

        // Booking payment_status should be pending
        $booking->refresh();
        expect($booking->payment_status)->toBe('pending');

        // Customer should receive notification
        Notification::assertSentTo($customerUser, PaymentRequestedNotification::class);
    });

    it('creates payment marked as cash on confirmation', function () {
        $customerUser = User::factory()->create();

        $booking = Booking::factory()->create([
            'customer_id' => $customerUser->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'pending',
            'total_amount' => 1500.00,
        ]);

        $response = $this->patchJson(
            "/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}/status",
            [
                'status' => 'confirmed',
                'payment_action' => 'mark_cash',
            ]
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed');

        $payment = Payment::where('payable_type', 'booking')
            ->where('payable_id', $booking->id)
            ->first();

        expect($payment)->not->toBeNull()
            ->and($payment->payment_method)->toBe('cash')
            ->and($payment->status)->toBe('unpaid');
    });

    it('can confirm without payment action', function () {
        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson(
            "/api/v1/merchants/{$this->merchant->id}/bookings/{$booking->id}/status",
            ['status' => 'confirmed']
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed');

        // No payment record created
        expect(Payment::where('payable_type', 'booking')->where('payable_id', $booking->id)->count())->toBe(0);
    });
});

/*
|--------------------------------------------------------------------------
| Reservation Confirmation with Payment
|--------------------------------------------------------------------------
*/
describe('Reservation Confirmation with Payment', function () {
    beforeEach(function () {
        Notification::fake();

        $this->user = User::factory()->create();
        $this->user->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'active',
            'can_rent_units' => true,
        ]);
        $this->service = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        $this->mock(PayMongoServiceInterface::class, function ($mock) {
            $mock->shouldReceive('createCheckoutSession')
                ->andReturn([
                    'checkout_session_id' => 'cs_test_res123',
                    'checkout_url' => 'https://checkout.paymongo.com/test/res123',
                ]);
        });

        Passport::actingAs($this->user);
    });

    it('creates payment on reservation confirmation', function () {
        $customerUser = User::factory()->create();
        $customerUser->assignRole('customer');

        $reservation = Reservation::factory()->create([
            'customer_id' => $customerUser->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'pending',
            'total_amount' => 5000.00,
        ]);

        $response = $this->patchJson(
            "/api/v1/merchants/{$this->merchant->id}/reservations/{$reservation->id}/status",
            [
                'status' => 'confirmed',
                'payment_action' => 'request_payment',
            ]
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed');

        $payment = Payment::where('payable_type', 'reservation')
            ->where('payable_id', $reservation->id)
            ->first();

        expect($payment)->not->toBeNull()
            ->and($payment->status)->toBe('pending')
            ->and($payment->amount)->toBe('5000.00');
    });
});

/*
|--------------------------------------------------------------------------
| ServiceOrder Received with Payment
|--------------------------------------------------------------------------
*/
describe('ServiceOrder Received with Payment', function () {
    beforeEach(function () {
        Notification::fake();

        $this->user = User::factory()->create();
        $this->user->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'active',
            'can_sell_products' => true,
        ]);
        $this->service = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        $this->mock(PayMongoServiceInterface::class, function ($mock) {
            $mock->shouldReceive('createCheckoutSession')
                ->andReturn([
                    'checkout_session_id' => 'cs_test_ord123',
                    'checkout_url' => 'https://checkout.paymongo.com/test/ord123',
                ]);
        });

        Passport::actingAs($this->user);
    });

    it('creates payment on order received status', function () {
        $customerUser = User::factory()->create();
        $customerUser->assignRole('customer');

        $order = ServiceOrder::factory()->create([
            'customer_id' => $customerUser->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'pending',
            'total_amount' => 2000.00,
        ]);

        $response = $this->patchJson(
            "/api/v1/merchants/{$this->merchant->id}/service-orders/{$order->id}/status",
            [
                'status' => 'received',
                'payment_action' => 'request_payment',
            ]
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'received');

        $payment = Payment::where('payable_type', 'service_order')
            ->where('payable_id', $order->id)
            ->first();

        expect($payment)->not->toBeNull()
            ->and($payment->status)->toBe('pending')
            ->and($payment->amount)->toBe('2000.00');
    });
});

/*
|--------------------------------------------------------------------------
| PayMongo Webhook
|--------------------------------------------------------------------------
*/
describe('PayMongo Webhook', function () {
    beforeEach(function () {
        Notification::fake();
    });

    it('processes checkout_session.payment.paid webhook', function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
        ]);

        $customerUser = User::factory()->create();
        $customerUser->assignRole('customer');

        $booking = Booking::factory()->create([
            'customer_id' => $customerUser->id,
            'merchant_id' => $merchant->id,
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        $payment = Payment::factory()->pending()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'gateway_payment_id' => 'cs_test_webhook123',
            'amount' => 1500.00,
        ]);

        // Mock webhook signature verification
        $this->mock(PayMongoServiceInterface::class, function ($mock) {
            $mock->shouldReceive('verifyWebhookSignature')->andReturn(true);
        });

        $webhookPayload = [
            'data' => [
                'attributes' => [
                    'type' => 'checkout_session.payment.paid',
                    'data' => [
                        'id' => 'cs_test_webhook123',
                        'attributes' => [
                            'payment_method_used' => 'gcash',
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/webhooks/paymongo', $webhookPayload, [
            'Paymongo-Signature' => 't=12345,te=test_sig',
        ]);

        $response->assertStatus(200);

        $payment->refresh();
        expect($payment->status)->toBe('paid')
            ->and($payment->paid_at)->not->toBeNull();

        $booking->refresh();
        expect($booking->payment_status)->toBe('paid');

        Notification::assertSentTo($customerUser, PaymentReceivedNotification::class);
        Notification::assertSentTo($merchantUser, PaymentReceivedNotification::class);
    });

    it('processes payment.failed webhook', function () {
        $booking = Booking::factory()->create([
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);

        $payment = Payment::factory()->pending()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'gateway_payment_id' => 'cs_test_fail123',
        ]);

        $this->mock(PayMongoServiceInterface::class, function ($mock) {
            $mock->shouldReceive('verifyWebhookSignature')->andReturn(true);
        });

        $webhookPayload = [
            'data' => [
                'attributes' => [
                    'type' => 'payment.failed',
                    'data' => [
                        'id' => 'cs_test_fail123',
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/webhooks/paymongo', $webhookPayload, [
            'Paymongo-Signature' => 't=12345,te=test_sig',
        ]);

        $response->assertStatus(200);

        $payment->refresh();
        expect($payment->status)->toBe('failed');
    });

    it('rejects webhooks with invalid signature', function () {
        $this->mock(PayMongoServiceInterface::class, function ($mock) {
            $mock->shouldReceive('verifyWebhookSignature')->andReturn(false);
        });

        $response = $this->postJson('/api/v1/webhooks/paymongo', [
            'data' => ['attributes' => ['type' => 'checkout_session.payment.paid']],
        ], [
            'Paymongo-Signature' => 'invalid',
        ]);

        $response->assertStatus(400);
    });

    it('is idempotent for already paid payments', function () {
        $booking = Booking::factory()->create([
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);

        $payment = Payment::factory()->paid()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'gateway_payment_id' => 'cs_test_idem123',
        ]);

        $this->mock(PayMongoServiceInterface::class, function ($mock) {
            $mock->shouldReceive('verifyWebhookSignature')->andReturn(true);
        });

        $webhookPayload = [
            'data' => [
                'attributes' => [
                    'type' => 'checkout_session.payment.paid',
                    'data' => ['id' => 'cs_test_idem123'],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/webhooks/paymongo', $webhookPayload, [
            'Paymongo-Signature' => 't=12345,te=test_sig',
        ]);

        // Should succeed without error (idempotent)
        $response->assertStatus(200);
    });
});

/*
|--------------------------------------------------------------------------
| Permission Tests
|--------------------------------------------------------------------------
*/
describe('Payment Permissions', function () {
    it('denies access without payments.view permission', function () {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $payment = Payment::factory()->create();

        Passport::actingAs($user);

        $response = $this->getJson("/api/v1/payments/{$payment->id}");
        $response->assertStatus(403);
    });

    it('denies manage actions without payments.manage permission', function () {
        $user = User::factory()->create();
        $user->assignRole('branch-merchant');

        $booking = Booking::factory()->create();
        $payment = Payment::factory()->pending()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
        ]);

        Passport::actingAs($user);

        $response = $this->postJson("/api/v1/payments/{$payment->id}/mark-paid");
        $response->assertStatus(403);
    });

    it('allows admin full payment access', function () {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $booking = Booking::factory()->create([
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);
        $payment = Payment::factory()->pending()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
        ]);

        Passport::actingAs($user);

        $response = $this->getJson("/api/v1/payments/{$payment->id}");
        $response->assertStatus(200);

        $response = $this->postJson("/api/v1/payments/{$payment->id}/mark-paid");
        $response->assertStatus(200);
    });
});

/*
|--------------------------------------------------------------------------
| Check Payment Status
|--------------------------------------------------------------------------
*/
describe('Check Payment Status', function () {
    it('updates payment to paid when PayMongo reports paid', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Merchant::factory()->create(['user_id' => $user->id, 'status' => 'active']);

        $booking = Booking::factory()->create([
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);
        $payment = Payment::factory()->pending()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'gateway_payment_id' => 'cs_test_check123',
        ]);

        $this->mock(PayMongoServiceInterface::class, function ($mock) {
            $mock->shouldReceive('retrieveCheckoutSession')
                ->with('cs_test_check123')
                ->andReturn([
                    'id' => 'cs_test_check123',
                    'status' => 'paid',
                    'payment_intent' => null,
                    'payments' => [],
                    'payment_method_used' => 'gcash',
                ]);
        });

        Passport::actingAs($user);

        $response = $this->postJson("/api/v1/payments/{$payment->id}/check-status");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'paid');

        $booking->refresh();
        expect($booking->payment_status)->toBe('paid');
    });

    it('updates payment to expired when PayMongo reports expired', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Merchant::factory()->create(['user_id' => $user->id, 'status' => 'active']);

        $booking = Booking::factory()->create([
            'status' => 'confirmed',
            'payment_status' => 'pending',
        ]);
        $payment = Payment::factory()->pending()->create([
            'payable_type' => 'booking',
            'payable_id' => $booking->id,
            'gateway_payment_id' => 'cs_test_exp123',
        ]);

        $this->mock(PayMongoServiceInterface::class, function ($mock) {
            $mock->shouldReceive('retrieveCheckoutSession')
                ->with('cs_test_exp123')
                ->andReturn([
                    'id' => 'cs_test_exp123',
                    'status' => 'expired',
                ]);
        });

        Passport::actingAs($user);

        $response = $this->postJson("/api/v1/payments/{$payment->id}/check-status");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'expired');
    });
});
