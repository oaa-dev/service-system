<?php

use App\Models\Address;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Models\ServiceSchedule;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->assignRole('customer');
    $this->customer = Customer::factory()->create(['user_id' => $this->user->id]);
    Passport::actingAs($this->user);

    // Create an active merchant with all capabilities
    $merchantUser = User::factory()->create();
    $merchantUser->assignRole('merchant');
    $this->merchant = Merchant::factory()->create([
        'user_id' => $merchantUser->id,
        'status' => 'active',
        'can_take_bookings' => true,
        'can_sell_products' => true,
        'can_rent_units' => true,
    ]);

    // Set PayMongo config for tests and fake API calls
    config([
        'paymongo.secret_key' => 'sk_test_fake',
        'paymongo.success_url' => 'http://localhost:3001/payment/success',
        'paymongo.cancel_url' => 'http://localhost:3001/payment/cancel',
    ]);
    Http::fake([
        'https://api.paymongo.com/v1/checkout_sessions' => Http::response([
            'data' => [
                'id' => 'cs_test_customer_portal',
                'attributes' => [
                    'checkout_url' => 'https://checkout.paymongo.com/test/customer_portal',
                ],
            ],
        ]),
    ]);
});

describe('Customer Booking', function () {
    it('can create a booking for an active merchant', function () {
        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'max_capacity' => 10,
            'requires_confirmation' => true,
        ]);

        // Set up a schedule for Monday (day 1)
        ServiceSchedule::create([
            'service_id' => $service->id,
            'day_of_week' => 1,
            'start_time' => '09:00',
            'end_time' => '17:00',
            'is_available' => true,
        ]);

        $nextMonday = now()->next('Monday')->format('Y-m-d');

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/bookings", [
            'service_id' => $service->id,
            'booking_date' => $nextMonday,
            'start_time' => '10:00',
            'party_size' => 2,
            'notes' => 'Test booking from customer portal',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'service_id' => $service->id,
                    'merchant_id' => $this->merchant->id,
                    'customer_id' => $this->user->id,
                    'status' => 'pending',
                    'party_size' => 2,
                    'notes' => 'Test booking from customer portal',
                    'payment_status' => 'pending',
                    'payment' => [
                        'status' => 'pending',
                        'checkout_url' => 'https://checkout.paymongo.com/test/customer_portal',
                    ],
                ],
            ]);
    });

    it('cannot book for inactive merchant', function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $pendingMerchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'pending',
            'can_take_bookings' => true,
        ]);

        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $pendingMerchant->id,
        ]);

        $nextMonday = now()->next('Monday')->format('Y-m-d');

        $response = $this->postJson("/api/v1/customer/merchants/{$pendingMerchant->slug}/bookings", [
            'service_id' => $service->id,
            'booking_date' => $nextMonday,
            'start_time' => '10:00',
            'party_size' => 1,
        ]);

        $response->assertStatus(404);
    });

    it('returns 404 for non-existent merchant slug', function () {
        // Create a valid service so validation passes, but use a fake slug
        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
        ]);

        ServiceSchedule::create([
            'service_id' => $service->id,
            'day_of_week' => 1,
            'start_time' => '09:00',
            'end_time' => '17:00',
            'is_available' => true,
        ]);

        $response = $this->postJson('/api/v1/customer/merchants/non-existent-slug/bookings', [
            'service_id' => $service->id,
            'booking_date' => now()->next('Monday')->format('Y-m-d'),
            'start_time' => '10:00',
            'party_size' => 1,
        ]);

        $response->assertStatus(404);
    });

    it('requires authentication', function () {
        // Reset auth
        app('auth')->forgetGuards();

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/bookings", [
            'service_id' => 1,
            'booking_date' => now()->next('Monday')->format('Y-m-d'),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(401);
    });

    it('validates required fields', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/bookings", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_id', 'booking_date', 'start_time']);
    });
});

describe('Customer Reservation', function () {
    it('can create a reservation for an active merchant', function () {
        $service = Service::factory()->reservation(2500.00)->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
            'max_capacity' => 4,
        ]);

        $checkIn = now()->addDays(3)->format('Y-m-d');
        $checkOut = now()->addDays(5)->format('Y-m-d');

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/reservations", [
            'service_id' => $service->id,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'guest_count' => 2,
            'notes' => 'Anniversary getaway',
            'special_requests' => 'Late check-in please',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'service_id' => $service->id,
                    'merchant_id' => $this->merchant->id,
                    'customer_id' => $this->user->id,
                    'status' => 'pending',
                    'guest_count' => 2,
                    'nights' => 2,
                    'notes' => 'Anniversary getaway',
                    'special_requests' => 'Late check-in please',
                    'payment_status' => 'pending',
                    'payment' => [
                        'status' => 'pending',
                        'checkout_url' => 'https://checkout.paymongo.com/test/customer_portal',
                    ],
                ],
            ]);
    });

    it('cannot reserve for inactive merchant', function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $pendingMerchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'pending',
            'can_rent_units' => true,
        ]);

        $service = Service::factory()->reservation()->create([
            'merchant_id' => $pendingMerchant->id,
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$pendingMerchant->slug}/reservations", [
            'service_id' => $service->id,
            'check_in' => now()->addDays(3)->format('Y-m-d'),
            'check_out' => now()->addDays(5)->format('Y-m-d'),
        ]);

        $response->assertStatus(404);
    });

    it('validates required fields', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/reservations", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_id', 'check_in', 'check_out']);
    });
});

describe('Customer Order', function () {
    it('can create an order for an active merchant', function () {
        $service = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
            'price' => 150.00,
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/orders", [
            'service_id' => $service->id,
            'quantity' => 3,
            'unit_label' => 'pcs',
            'notes' => 'Please deliver by noon',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'service_id' => $service->id,
                    'merchant_id' => $this->merchant->id,
                    'customer_id' => $this->user->id,
                    'status' => 'pending',
                    'unit_label' => 'pcs',
                    'notes' => 'Please deliver by noon',
                    'payment_status' => 'pending',
                    'payment' => [
                        'status' => 'pending',
                        'checkout_url' => 'https://checkout.paymongo.com/test/customer_portal',
                    ],
                ],
            ]);

        // Verify order has an auto-generated order number
        expect($response->json('data.order_number'))->toStartWith('ORD-');
    });

    it('cannot order from inactive merchant', function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $pendingMerchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'pending',
            'can_sell_products' => true,
        ]);

        $service = Service::factory()->sellable()->create([
            'merchant_id' => $pendingMerchant->id,
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$pendingMerchant->slug}/orders", [
            'service_id' => $service->id,
            'quantity' => 1,
            'unit_label' => 'pcs',
        ]);

        $response->assertStatus(404);
    });

    it('validates required fields', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->slug}/orders", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_id', 'quantity', 'unit_label']);
    });
});

describe('My Bookings', function () {
    it('can list own bookings', function () {
        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
        ]);

        Booking::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
        ]);

        // Create a booking for another user (should not appear)
        Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => User::factory()->create()->id,
        ]);

        $response = $this->getJson('/api/v1/customer/my/bookings');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'data');
    });

    it('can view a single booking', function () {
        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
        ]);

        $response = $this->getJson("/api/v1/customer/my/bookings/{$booking->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $booking->id,
                    'customer_id' => $this->user->id,
                    'status' => 'pending',
                ],
            ]);
    });

    it('can cancel a pending booking', function () {
        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/customer/my/bookings/{$booking->id}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $booking->id,
                    'status' => 'cancelled',
                ],
            ]);

        expect($booking->fresh()->cancelled_at)->not->toBeNull();
    });

    it('can cancel a confirmed booking', function () {
        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $booking = Booking::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
        ]);

        $response = $this->patchJson("/api/v1/customer/my/bookings/{$booking->id}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'cancelled',
                ],
            ]);
    });

    it('cannot cancel a completed booking', function () {
        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $booking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
            'status' => 'completed',
        ]);

        $response = $this->patchJson("/api/v1/customer/my/bookings/{$booking->id}/cancel");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Only pending or confirmed bookings can be cancelled.',
            ]);
    });

    it('cannot view another users booking', function () {
        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $otherBooking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => User::factory()->create()->id,
        ]);

        $response = $this->getJson("/api/v1/customer/my/bookings/{$otherBooking->id}");

        $response->assertStatus(404);
    });
});

describe('My Reservations', function () {
    it('can list own reservations', function () {
        $service = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        Reservation::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
        ]);

        // Create a reservation for another user (should not appear)
        Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => User::factory()->create()->id,
        ]);

        $response = $this->getJson('/api/v1/customer/my/reservations');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'data');
    });

    it('can cancel a pending reservation', function () {
        $service = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/customer/my/reservations/{$reservation->id}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $reservation->id,
                    'status' => 'cancelled',
                ],
            ]);

        expect($reservation->fresh()->cancelled_at)->not->toBeNull();
    });

    it('can cancel a confirmed reservation', function () {
        $service = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $reservation = Reservation::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
        ]);

        $response = $this->patchJson("/api/v1/customer/my/reservations/{$reservation->id}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'cancelled',
                ],
            ]);
    });

    it('cannot cancel a checked_in reservation', function () {
        $service = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
            'status' => 'checked_in',
            'checked_in_at' => now(),
        ]);

        $response = $this->patchJson("/api/v1/customer/my/reservations/{$reservation->id}/cancel");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Only pending or confirmed reservations can be cancelled.',
            ]);
    });
});

describe('My Orders', function () {
    it('can list own orders', function () {
        $service = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        ServiceOrder::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
        ]);

        // Create an order for another user (should not appear)
        ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => User::factory()->create()->id,
        ]);

        $response = $this->getJson('/api/v1/customer/my/orders');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'data');
    });

    it('can cancel a pending order', function () {
        $service = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/v1/customer/my/orders/{$order->id}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $order->id,
                    'status' => 'cancelled',
                ],
            ]);

        expect($order->fresh()->cancelled_at)->not->toBeNull();
    });

    it('cannot cancel a processing order', function () {
        $service = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
            'status' => 'processing',
        ]);

        $response = $this->patchJson("/api/v1/customer/my/orders/{$order->id}/cancel");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Only pending orders can be cancelled.',
            ]);
    });
});

describe('My Stats', function () {
    it('returns dashboard stats', function () {
        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
        ]);
        $reservationService = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
        ]);
        $sellableService = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        // Create bookings: 1 upcoming pending, 1 past completed
        Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
            'status' => 'pending',
            'booking_date' => now()->addDays(5)->format('Y-m-d'),
        ]);
        Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $this->user->id,
            'status' => 'completed',
            'booking_date' => now()->subDays(5)->format('Y-m-d'),
        ]);

        // Create reservations: 1 confirmed (active), 1 cancelled
        Reservation::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $reservationService->id,
            'customer_id' => $this->user->id,
        ]);
        Reservation::factory()->cancelled()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $reservationService->id,
            'customer_id' => $this->user->id,
        ]);

        // Create orders: 1 pending (active), 1 completed
        ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $sellableService->id,
            'customer_id' => $this->user->id,
            'status' => 'pending',
        ]);
        ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $sellableService->id,
            'customer_id' => $this->user->id,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/customer/my/stats');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'bookings' => [
                        'total' => 2,
                        'upcoming' => 1,
                    ],
                    'reservations' => [
                        'total' => 2,
                        'active' => 1,
                    ],
                    'orders' => [
                        'total' => 2,
                        'active' => 1,
                    ],
                ],
            ]);
    });

    it('returns zero stats for new customer', function () {
        $response = $this->getJson('/api/v1/customer/my/stats');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'bookings' => ['total' => 0, 'upcoming' => 0],
                    'reservations' => ['total' => 0, 'active' => 0],
                    'orders' => ['total' => 0, 'active' => 0],
                ],
            ]);
    });
});

describe('Detail Endpoints', function () {
    beforeEach(function () {
        // Create an address for the merchant so address data appears in responses
        $this->address = Address::factory()->create([
            'addressable_type' => Merchant::class,
            'addressable_id' => $this->merchant->id,
            'street' => '123 Test Street',
            'city' => 'Test City',
            'state' => 'Test State',
            'postal_code' => '12345',
            'country' => 'Philippines',
        ]);
    });

    describe('Reservation Detail', function () {
        it('can fetch a single reservation with merchant details', function () {
            $service = Service::factory()->reservation()->create([
                'merchant_id' => $this->merchant->id,
            ]);

            $reservation = Reservation::factory()->create([
                'merchant_id' => $this->merchant->id,
                'service_id' => $service->id,
                'customer_id' => $this->user->id,
            ]);

            $response = $this->getJson("/api/v1/customer/my/reservations/{$reservation->id}");

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $reservation->id,
                        'customer_id' => $this->user->id,
                        'status' => 'pending',
                        'service' => [
                            'id' => $service->id,
                            'name' => $service->name,
                        ],
                        'merchant' => [
                            'id' => $this->merchant->id,
                            'name' => $this->merchant->name,
                            'slug' => $this->merchant->slug,
                            'address' => [
                                'street' => '123 Test Street',
                                'city' => 'Test City',
                            ],
                        ],
                    ],
                ]);
        });

        it('cannot fetch another customer\'s reservation', function () {
            $service = Service::factory()->reservation()->create([
                'merchant_id' => $this->merchant->id,
            ]);

            $otherUser = User::factory()->create();
            $otherReservation = Reservation::factory()->create([
                'merchant_id' => $this->merchant->id,
                'service_id' => $service->id,
                'customer_id' => $otherUser->id,
            ]);

            $response = $this->getJson("/api/v1/customer/my/reservations/{$otherReservation->id}");

            $response->assertStatus(404);
        });

        it('returns 404 for non-existent reservation', function () {
            $response = $this->getJson('/api/v1/customer/my/reservations/99999');

            $response->assertStatus(404);
        });
    });

    describe('Order Detail', function () {
        it('can fetch a single order with merchant details', function () {
            $service = Service::factory()->sellable()->create([
                'merchant_id' => $this->merchant->id,
            ]);

            $order = ServiceOrder::factory()->create([
                'merchant_id' => $this->merchant->id,
                'service_id' => $service->id,
                'customer_id' => $this->user->id,
            ]);

            $response = $this->getJson("/api/v1/customer/my/orders/{$order->id}");

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $order->id,
                        'customer_id' => $this->user->id,
                        'order_number' => $order->order_number,
                        'status' => 'pending',
                        'service' => [
                            'id' => $service->id,
                            'name' => $service->name,
                        ],
                        'merchant' => [
                            'id' => $this->merchant->id,
                            'name' => $this->merchant->name,
                            'slug' => $this->merchant->slug,
                            'address' => [
                                'street' => '123 Test Street',
                                'city' => 'Test City',
                            ],
                        ],
                    ],
                ]);
        });

        it('cannot fetch another customer\'s order', function () {
            $service = Service::factory()->sellable()->create([
                'merchant_id' => $this->merchant->id,
            ]);

            $otherUser = User::factory()->create();
            $otherOrder = ServiceOrder::factory()->create([
                'merchant_id' => $this->merchant->id,
                'service_id' => $service->id,
                'customer_id' => $otherUser->id,
            ]);

            $response = $this->getJson("/api/v1/customer/my/orders/{$otherOrder->id}");

            $response->assertStatus(404);
        });

        it('returns 404 for non-existent order', function () {
            $response = $this->getJson('/api/v1/customer/my/orders/99999');

            $response->assertStatus(404);
        });
    });

    describe('Booking Detail with Merchant', function () {
        it('returns merchant details in booking response', function () {
            $service = Service::factory()->bookable(60)->create([
                'merchant_id' => $this->merchant->id,
            ]);

            $booking = Booking::factory()->create([
                'merchant_id' => $this->merchant->id,
                'service_id' => $service->id,
                'customer_id' => $this->user->id,
            ]);

            $response = $this->getJson("/api/v1/customer/my/bookings/{$booking->id}");

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $booking->id,
                        'customer_id' => $this->user->id,
                        'service' => [
                            'id' => $service->id,
                            'name' => $service->name,
                        ],
                        'merchant' => [
                            'id' => $this->merchant->id,
                            'name' => $this->merchant->name,
                            'slug' => $this->merchant->slug,
                            'address' => [
                                'street' => '123 Test Street',
                                'city' => 'Test City',
                            ],
                        ],
                    ],
                ]);
        });
    });
});
