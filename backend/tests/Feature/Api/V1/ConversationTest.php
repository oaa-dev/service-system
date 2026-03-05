<?php

use App\Models\Booking;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Message;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Models\ServiceSchedule;
use App\Models\User;
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
    $this->merchantUser = $merchantUser;

    // Create a bookable service associated with the merchant
    $this->service = Service::factory()->bookable(60)->create([
        'merchant_id' => $this->merchant->id,
        'is_active' => true,
    ]);

    // Create a booking belonging to the current customer
    $this->booking = Booking::factory()->create([
        'merchant_id' => $this->merchant->id,
        'service_id' => $this->service->id,
        'customer_id' => $this->user->id,
        'status' => 'pending',
    ]);
});

describe('GET messages — booking conversation auto-create', function () {
    it('creates a conversation on first request and returns empty messages', function () {
        expect(Conversation::count())->toBe(0);

        $response = $this->getJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(0, 'data.messages.data');

        expect(Conversation::count())->toBe(1);

        $conversation = Conversation::first();
        expect($conversation->merchant_id)->toBe($this->merchant->id);
        expect($conversation->customer_id)->toBe($this->user->id);
        expect($conversation->conversable_type)->toBe('booking');
        expect($conversation->conversable_id)->toBe($this->booking->id);
    });

    it('reuses the same conversation on subsequent requests', function () {
        // First request creates the conversation
        $this->getJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages");

        expect(Conversation::count())->toBe(1);

        // Second request reuses existing conversation
        $this->getJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages");

        expect(Conversation::count())->toBe(1);
    });

    it('returns existing messages in the conversation', function () {
        $conversation = Conversation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->user->id,
            'conversable_type' => 'booking',
            'conversable_id' => $this->booking->id,
        ]);

        Message::factory()->count(3)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
        ]);

        $response = $this->getJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data.messages.data');
    });

    it('returns messages with correct fields', function () {
        $conversation = Conversation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->user->id,
            'conversable_type' => 'booking',
            'conversable_id' => $this->booking->id,
        ]);

        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'Hello, I have a question about my booking.',
        ]);

        $response = $this->getJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages");

        $response->assertStatus(200);

        $message = $response->json('data.messages.data.0');
        expect($message)->toHaveKeys(['id', 'conversation_id', 'sender_id', 'body', 'read_at', 'is_mine', 'created_at', 'updated_at']);
        expect($message['body'])->toBe('Hello, I have a question about my booking.');
        expect($message['sender_id'])->toBe($this->user->id);
        expect($message['is_mine'])->toBeTrue();
    });

    it('returns messages ordered oldest first', function () {
        $conversation = Conversation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->user->id,
            'conversable_type' => 'booking',
            'conversable_id' => $this->booking->id,
        ]);

        // Create messages with different timestamps
        $first = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'First message',
            'created_at' => now()->subMinutes(10),
        ]);

        $second = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'Second message',
            'created_at' => now()->subMinutes(5),
        ]);

        $third = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'Third message',
            'created_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages");

        $response->assertStatus(200);

        $messages = $response->json('data.messages.data');
        expect($messages[0]['body'])->toBe('First message');
        expect($messages[1]['body'])->toBe('Second message');
        expect($messages[2]['body'])->toBe('Third message');
    });

    it('returns paginated response with meta', function () {
        $conversation = Conversation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->user->id,
            'conversable_type' => 'booking',
            'conversable_id' => $this->booking->id,
        ]);

        Message::factory()->count(5)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
        ]);

        $response = $this->getJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'conversation' => ['id'],
                    'messages' => [
                        'data',
                        'meta' => [
                            'total',
                            'per_page',
                            'current_page',
                            'last_page',
                            'from',
                            'to',
                        ],
                        'links' => [
                            'first',
                            'last',
                            'prev',
                            'next',
                        ],
                    ],
                ],
            ]);
    });

    it('returns 404 for a non-existent booking', function () {
        $response = $this->getJson('/api/v1/customer/my/conversations/bookings/99999/messages');

        $response->assertStatus(404);
    });

    it('returns 404 for an invalid conversation type', function () {
        $response = $this->getJson("/api/v1/customer/my/conversations/invalid_type/{$this->booking->id}/messages");

        $response->assertStatus(404);
    });

    it('requires authentication', function () {
        app('auth')->forgetGuards();

        $response = $this->getJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages");

        $response->assertStatus(401);
    });
});

describe('GET messages — reservation conversation', function () {
    beforeEach(function () {
        $sellableService = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        $this->reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $sellableService->id,
            'customer_id' => $this->user->id,
            'status' => 'pending',
        ]);
    });

    it('creates a reservation conversation on first request', function () {
        expect(Conversation::count())->toBe(0);

        $response = $this->getJson("/api/v1/customer/my/conversations/reservations/{$this->reservation->id}/messages");

        $response->assertStatus(200);

        expect(Conversation::count())->toBe(1);

        $conversation = Conversation::first();
        expect($conversation->conversable_type)->toBe('reservation');
        expect($conversation->conversable_id)->toBe($this->reservation->id);
    });

    it('returns 404 for another customer\'s reservation', function () {
        $otherUser = User::factory()->create();
        $otherReservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->reservation->service_id,
            'customer_id' => $otherUser->id,
        ]);

        $response = $this->getJson("/api/v1/customer/my/conversations/reservations/{$otherReservation->id}/messages");

        $response->assertStatus(404);
    });
});

describe('GET messages — order conversation', function () {
    beforeEach(function () {
        $sellableService = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        $this->order = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $sellableService->id,
            'customer_id' => $this->user->id,
            'status' => 'pending',
        ]);
    });

    it('creates an order conversation on first request', function () {
        expect(Conversation::count())->toBe(0);

        $response = $this->getJson("/api/v1/customer/my/conversations/orders/{$this->order->id}/messages");

        $response->assertStatus(200);

        expect(Conversation::count())->toBe(1);

        $conversation = Conversation::first();
        expect($conversation->conversable_type)->toBe('service_order');
        expect($conversation->conversable_id)->toBe($this->order->id);
    });

    it('returns 404 for another customer\'s order', function () {
        $otherUser = User::factory()->create();
        $otherOrder = ServiceOrder::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->order->service_id,
            'customer_id' => $otherUser->id,
        ]);

        $response = $this->getJson("/api/v1/customer/my/conversations/orders/{$otherOrder->id}/messages");

        $response->assertStatus(404);
    });
});

describe('POST send message', function () {
    it('creates a message in the conversation', function () {
        expect(Message::count())->toBe(0);

        $response = $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => 'Can I reschedule my appointment?',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'sender_id' => $this->user->id,
                    'body' => 'Can I reschedule my appointment?',
                    'is_mine' => true,
                ],
            ]);

        expect(Message::count())->toBe(1);
    });

    it('auto-creates the conversation when sending the first message', function () {
        expect(Conversation::count())->toBe(0);

        $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => 'First message creates conversation',
        ]);

        expect(Conversation::count())->toBe(1);
        expect(Message::count())->toBe(1);
    });

    it('updates last_message_at on the conversation', function () {
        $originalTime = now()->subHour();

        $conversation = Conversation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->user->id,
            'conversable_type' => 'booking',
            'conversable_id' => $this->booking->id,
            'last_message_at' => $originalTime,
        ]);

        $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => 'This should update last_message_at',
        ]);

        $conversation->refresh();
        expect($conversation->last_message_at->gt($originalTime))->toBeTrue();
    });

    it('links the message to the correct conversation', function () {
        $response = $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => 'Hello merchant!',
        ]);

        $response->assertStatus(201);

        $conversation = Conversation::first();
        $message = Message::first();

        expect($message->conversation_id)->toBe($conversation->id);
        expect($message->sender_id)->toBe($this->user->id);
    });

    it('returns the sent message with sender information', function () {
        $response = $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => 'Test message body',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'conversation_id',
                    'sender_id',
                    'sender',
                    'body',
                    'read_at',
                    'is_mine',
                    'created_at',
                    'updated_at',
                ],
            ]);
    });

    it('validates that body is required', function () {
        $response = $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['body']);
    });

    it('validates that body cannot exceed 2000 characters', function () {
        $response = $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => str_repeat('a', 2001),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['body']);
    });

    it('accepts a body of exactly 2000 characters', function () {
        $response = $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => str_repeat('a', 2000),
        ]);

        $response->assertStatus(201);
    });

    it('returns 404 when sending a message to another customer\'s booking', function () {
        $otherUser = User::factory()->create();
        $otherBooking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $otherUser->id,
        ]);

        $response = $this->postJson("/api/v1/customer/my/conversations/bookings/{$otherBooking->id}/messages", [
            'body' => 'I should not be able to do this',
        ]);

        $response->assertStatus(404);
    });

    it('returns 404 when sending a message for a non-existent booking', function () {
        $response = $this->postJson('/api/v1/customer/my/conversations/bookings/99999/messages', [
            'body' => 'This booking does not exist',
        ]);

        $response->assertStatus(404);
    });

    it('requires authentication to send messages', function () {
        app('auth')->forgetGuards();

        $response = $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => 'Unauthenticated message attempt',
        ]);

        $response->assertStatus(401);
    });
});

describe('PATCH mark as read', function () {
    it('marks unread messages from the other party as read', function () {
        $conversation = Conversation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->user->id,
            'conversable_type' => 'booking',
            'conversable_id' => $this->booking->id,
        ]);

        // Merchant sends 3 unread messages to the customer
        Message::factory()->count(3)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->merchantUser->id,
            'read_at' => null,
        ]);

        $response = $this->patchJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/read");

        $response->assertStatus(204);

        // All merchant messages should now be marked as read
        $unreadCount = Message::where('conversation_id', $conversation->id)
            ->where('sender_id', $this->merchantUser->id)
            ->whereNull('read_at')
            ->count();

        expect($unreadCount)->toBe(0);
    });

    it('does not mark the customer\'s own messages as read', function () {
        $conversation = Conversation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->user->id,
            'conversable_type' => 'booking',
            'conversable_id' => $this->booking->id,
        ]);

        // Customer sends messages (own messages — should stay unread by mark-read logic)
        Message::factory()->count(2)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'read_at' => null,
        ]);

        $this->patchJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/read");

        // Customer's own messages should still be null (not marked as read by this endpoint)
        $ownUnreadCount = Message::where('conversation_id', $conversation->id)
            ->where('sender_id', $this->user->id)
            ->whereNull('read_at')
            ->count();

        expect($ownUnreadCount)->toBe(2);
    });

    it('does not re-mark already-read messages', function () {
        $conversation = Conversation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->user->id,
            'conversable_type' => 'booking',
            'conversable_id' => $this->booking->id,
        ]);

        $readAt = now()->subHour();

        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->merchantUser->id,
            'read_at' => $readAt,
        ]);

        $this->patchJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/read");

        $message = Message::first();

        // The read_at timestamp should not change significantly
        expect($message->fresh()->read_at->toDateTimeString())->toBe($readAt->toDateTimeString());
    });

    it('auto-creates conversation if it does not exist when marking read', function () {
        expect(Conversation::count())->toBe(0);

        $this->patchJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/read");

        expect(Conversation::count())->toBe(1);
    });

    it('returns 204 no content on success', function () {
        $response = $this->patchJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/read");

        $response->assertStatus(204);
    });

    it('returns 404 for another customer\'s booking', function () {
        $otherUser = User::factory()->create();
        $otherBooking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $otherUser->id,
        ]);

        $response = $this->patchJson("/api/v1/customer/my/conversations/bookings/{$otherBooking->id}/read");

        $response->assertStatus(404);
    });

    it('requires authentication to mark as read', function () {
        app('auth')->forgetGuards();

        $response = $this->patchJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/read");

        $response->assertStatus(401);
    });
});

describe('Scoping and isolation', function () {
    it('customer cannot read messages for another customer\'s booking', function () {
        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        Customer::factory()->create(['user_id' => $otherUser->id]);

        $otherBooking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $otherUser->id,
        ]);

        $response = $this->getJson("/api/v1/customer/my/conversations/bookings/{$otherBooking->id}/messages");

        $response->assertStatus(404);
    });

    it('customer cannot send messages for another customer\'s booking', function () {
        $otherUser = User::factory()->create();
        $otherBooking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $otherUser->id,
        ]);

        $response = $this->postJson("/api/v1/customer/my/conversations/bookings/{$otherBooking->id}/messages", [
            'body' => 'I am trying to infiltrate another conversation',
        ]);

        $response->assertStatus(404);
    });

    it('separate customers have separate conversations for the same merchant', function () {
        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        Customer::factory()->create(['user_id' => $otherUser->id]);

        $otherBooking = Booking::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'customer_id' => $otherUser->id,
        ]);

        // First customer sends a message
        $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => 'Message from first customer',
        ]);

        // Switch to second customer
        Passport::actingAs($otherUser);

        // Second customer sends a message
        $this->postJson("/api/v1/customer/my/conversations/bookings/{$otherBooking->id}/messages", [
            'body' => 'Message from second customer',
        ]);

        expect(Conversation::count())->toBe(2);
        expect(Message::count())->toBe(2);

        // Each conversation should only have 1 message
        $firstConversation = Conversation::where('customer_id', $this->user->id)->first();
        $secondConversation = Conversation::where('customer_id', $otherUser->id)->first();

        expect($firstConversation->messages()->count())->toBe(1);
        expect($secondConversation->messages()->count())->toBe(1);
    });

    it('non-existent booking returns 404', function () {
        $response = $this->getJson('/api/v1/customer/my/conversations/bookings/99999/messages');

        $response->assertStatus(404);
    });

    it('non-existent reservation returns 404', function () {
        $response = $this->getJson('/api/v1/customer/my/conversations/reservations/99999/messages');

        $response->assertStatus(404);
    });

    it('non-existent order returns 404', function () {
        $response = $this->getJson('/api/v1/customer/my/conversations/orders/99999/messages');

        $response->assertStatus(404);
    });
});

describe('inquiry conversations', function () {
    it('creates an inquiry conversation on first GET request using merchant slug', function () {
        expect(Conversation::count())->toBe(0);

        $response = $this->getJson("/api/v1/customer/my/conversations/inquiries/{$this->merchant->slug}/messages");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(0, 'data.messages.data');

        expect(Conversation::count())->toBe(1);

        $conversation = Conversation::first();
        expect($conversation->merchant_id)->toBe($this->merchant->id);
        expect($conversation->customer_id)->toBe($this->user->id);
        expect($conversation->conversable_type)->toBe('inquiry');
        expect($conversation->conversable_id)->toBe($this->merchant->id);
    });

    it('reuses the same inquiry conversation on subsequent requests', function () {
        $this->getJson("/api/v1/customer/my/conversations/inquiries/{$this->merchant->slug}/messages");

        expect(Conversation::count())->toBe(1);

        $this->getJson("/api/v1/customer/my/conversations/inquiries/{$this->merchant->slug}/messages");

        expect(Conversation::count())->toBe(1);
    });

    it('customer can send messages in an inquiry conversation', function () {
        expect(Message::count())->toBe(0);

        $response = $this->postJson("/api/v1/customer/my/conversations/inquiries/{$this->merchant->slug}/messages", [
            'body' => 'Hi, I have a general question about your services.',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'sender_id' => $this->user->id,
                    'body' => 'Hi, I have a general question about your services.',
                    'is_mine' => true,
                ],
            ]);

        expect(Message::count())->toBe(1);

        $conversation = Conversation::first();
        expect($conversation->conversable_type)->toBe('inquiry');
        expect($conversation->conversable_id)->toBe($this->merchant->id);
    });

    it('auto-creates the inquiry conversation when customer sends the first message', function () {
        expect(Conversation::count())->toBe(0);

        $this->postJson("/api/v1/customer/my/conversations/inquiries/{$this->merchant->slug}/messages", [
            'body' => 'First message triggers conversation creation.',
        ]);

        expect(Conversation::count())->toBe(1);
        expect(Message::count())->toBe(1);
    });

    it('merchant sees inquiry conversation in their conversation list', function () {
        // Customer sends a message to create the inquiry conversation
        $this->postJson("/api/v1/customer/my/conversations/inquiries/{$this->merchant->slug}/messages", [
            'body' => 'Hello from customer!',
        ]);

        // Switch to the merchant user and call the admin conversations endpoint
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/conversations');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $conversationIds = collect($response->json('data'))->pluck('id')->toArray();

        $conversation = Conversation::where('conversable_type', 'inquiry')->first();
        expect($conversation)->not->toBeNull();
        expect($conversationIds)->toContain($conversation->id);
    });

    it('multiple customers each have separate inquiry conversations with the same merchant', function () {
        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        Customer::factory()->create(['user_id' => $otherUser->id]);

        // First customer sends an inquiry
        $this->postJson("/api/v1/customer/my/conversations/inquiries/{$this->merchant->slug}/messages", [
            'body' => 'Message from first customer',
        ]);

        // Switch to second customer
        Passport::actingAs($otherUser);

        // Second customer sends a separate inquiry to the same merchant
        $this->postJson("/api/v1/customer/my/conversations/inquiries/{$this->merchant->slug}/messages", [
            'body' => 'Message from second customer',
        ]);

        expect(Conversation::count())->toBe(2);
        expect(Message::count())->toBe(2);

        $firstConversation = Conversation::where('customer_id', $this->user->id)->first();
        $secondConversation = Conversation::where('customer_id', $otherUser->id)->first();

        expect($firstConversation->conversable_type)->toBe('inquiry');
        expect($secondConversation->conversable_type)->toBe('inquiry');
        expect($firstConversation->messages()->count())->toBe(1);
        expect($secondConversation->messages()->count())->toBe(1);
    });

    it('returns 404 for a non-existent merchant slug', function () {
        $response = $this->getJson('/api/v1/customer/my/conversations/inquiries/non-existent-merchant-slug/messages');

        $response->assertStatus(404);
    });

    it('returns 404 for an inactive merchant slug', function () {
        $inactiveMerchantUser = User::factory()->create();
        $inactiveMerchant = Merchant::factory()->create([
            'user_id' => $inactiveMerchantUser->id,
            'status' => 'pending',
        ]);

        $response = $this->getJson("/api/v1/customer/my/conversations/inquiries/{$inactiveMerchant->slug}/messages");

        $response->assertStatus(404);
    });

    it('works for a merchant with approved status', function () {
        $approvedMerchantUser = User::factory()->create();
        $approvedMerchant = Merchant::factory()->create([
            'user_id' => $approvedMerchantUser->id,
            'status' => 'approved',
        ]);

        $response = $this->getJson("/api/v1/customer/my/conversations/inquiries/{$approvedMerchant->slug}/messages");

        $response->assertStatus(200);

        $conversation = Conversation::where('conversable_type', 'inquiry')
            ->where('merchant_id', $approvedMerchant->id)
            ->first();

        expect($conversation)->not->toBeNull();
        expect($conversation->conversable_id)->toBe($approvedMerchant->id);
    });
});

describe('Conversation persistence across context types', function () {
    it('creates separate conversations for booking and reservation for same customer and merchant', function () {
        $reservationService = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $reservationService->id,
            'customer_id' => $this->user->id,
        ]);

        $this->getJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages");
        $this->getJson("/api/v1/customer/my/conversations/reservations/{$reservation->id}/messages");

        expect(Conversation::count())->toBe(2);

        $bookingConversation = Conversation::where('conversable_type', 'booking')->first();
        $reservationConversation = Conversation::where('conversable_type', 'reservation')->first();

        expect($bookingConversation->conversable_id)->toBe($this->booking->id);
        expect($reservationConversation->conversable_id)->toBe($reservation->id);
    });

    it('messages in one conversation do not appear in another', function () {
        $reservationService = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $reservation = Reservation::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $reservationService->id,
            'customer_id' => $this->user->id,
        ]);

        // Send message in booking conversation
        $this->postJson("/api/v1/customer/my/conversations/bookings/{$this->booking->id}/messages", [
            'body' => 'Booking message',
        ]);

        // Check reservation conversation — should be empty
        $response = $this->getJson("/api/v1/customer/my/conversations/reservations/{$reservation->id}/messages");

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    });
});
