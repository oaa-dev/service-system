<?php

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Message;
use App\Models\User;
use Laravel\Passport\Passport;

/**
 * Helpers to build the two actor types used throughout these tests.
 *
 * createMerchantActor() — a verified merchant user who owns a merchant record.
 *    The onboarding middleware passes because the user has a Merchant profile.
 *
 * createCustomerActor() — a verified customer user.
 *    The onboarding middleware passes because it only blocks merchant users.
 */
function createMerchantActor(): array
{
    $user = User::factory()->create();
    $user->assignRole('merchant');
    $merchant = Merchant::factory()->create([
        'user_id' => $user->id,
        'status' => 'active',
    ]);

    return ['user' => $user, 'merchant' => $merchant];
}

function createCustomerActor(): array
{
    $user = User::factory()->create();
    $user->assignRole('customer');
    $customer = Customer::factory()->create(['user_id' => $user->id]);

    return ['user' => $user, 'customer' => $customer];
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('MessagingController', function () {

    // -----------------------------------------------------------------------
    // GET /conversations
    // -----------------------------------------------------------------------

    describe('GET /conversations', function () {

        it('merchant sees their customer conversations', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            Passport::actingAs($merchantUser);

            $customerUser = User::factory()->create();

            Conversation::factory()->count(3)->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            $response = $this->getJson('/api/v1/conversations');

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'conversable_type',
                            'conversable_id',
                            'last_message_at',
                        ],
                    ],
                    'meta',
                ]);

            expect($response->json('meta.total'))->toBe(3);
        });

        it('only returns conversations belonging to the authenticated merchant', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $otherMerchant = Merchant::factory()->create(['status' => 'active']);
            $customerUser = User::factory()->create();

            Conversation::factory()->count(2)->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            // Conversations belonging to another merchant — should not appear
            Conversation::factory()->count(5)->create([
                'merchant_id' => $otherMerchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->getJson('/api/v1/conversations');

            $response->assertStatus(200);
            expect($response->json('meta.total'))->toBe(2);
        });

        it('customer sees their own conversations', function () {
            ['user' => $customerUser] = createCustomerActor();
            $merchant = Merchant::factory()->create(['status' => 'active']);

            Conversation::factory()->count(2)->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Passport::actingAs($customerUser);
            $response = $this->getJson('/api/v1/conversations');

            $response->assertStatus(200)
                ->assertJson(['success' => true]);

            expect($response->json('meta.total'))->toBe(2);
        });

        it('returns empty list when user has no conversations', function () {
            ['user' => $merchantUser] = createMerchantActor();
            Passport::actingAs($merchantUser);

            $response = $this->getJson('/api/v1/conversations');

            $response->assertStatus(200)
                ->assertJson(['success' => true, 'data' => []]);
        });

        it('returns 401 when unauthenticated', function () {
            app('auth')->forgetGuards();

            $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/conversations');

            $response->assertStatus(401);
        });
    });

    // -----------------------------------------------------------------------
    // GET /conversations/{id}/messages
    // -----------------------------------------------------------------------

    describe('GET /conversations/{id}/messages', function () {

        it('merchant can view messages in their conversation', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Message::factory()->count(4)->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'conversation_id',
                            'sender_id',
                            'body',
                            'read_at',
                            'is_mine',
                            'created_at',
                            'updated_at',
                        ],
                    ],
                    'meta',
                ]);

            expect($response->json('meta.total'))->toBe(4);
        });

        it('customer can view messages in their conversation', function () {
            ['user' => $customerUser] = createCustomerActor();
            $merchant = Merchant::factory()->create(['status' => 'active']);

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Message::factory()->count(2)->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
            ]);

            Passport::actingAs($customerUser);
            $response = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");

            $response->assertStatus(200)
                ->assertJson(['success' => true]);

            expect($response->json('meta.total'))->toBe(2);
        });

        it('messages are returned in ascending chronological order', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Message::factory()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
                'body' => 'First message',
                'created_at' => now()->subMinutes(10),
            ]);

            Message::factory()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
                'body' => 'Second message',
                'created_at' => now()->subMinutes(5),
            ]);

            Message::factory()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
                'body' => 'Third message',
                'created_at' => now(),
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");

            $response->assertStatus(200);

            $messages = $response->json('data');
            expect($messages[0]['body'])->toBe('First message');
            expect($messages[1]['body'])->toBe('Second message');
            expect($messages[2]['body'])->toBe('Third message');
        });

        it('is_mine is true for messages sent by the authenticated user', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            // Message sent by the merchant user themselves
            Message::factory()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $merchantUser->id,
                'body' => 'My own message',
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");

            $response->assertStatus(200);
            expect($response->json('data.0.is_mine'))->toBeTrue();
        });

        it('returns 403 when user is not a participant', function () {
            ['user' => $outsider] = createCustomerActor();
            $merchant = Merchant::factory()->create(['status' => 'active']);
            $otherCustomer = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $otherCustomer->id,
            ]);

            Passport::actingAs($outsider);
            $response = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");

            $response->assertStatus(403);
        });

        it('returns 404 when conversation does not exist', function () {
            ['user' => $merchantUser] = createMerchantActor();
            Passport::actingAs($merchantUser);

            $response = $this->getJson('/api/v1/conversations/99999/messages');

            $response->assertStatus(404);
        });

        it('returns 401 when unauthenticated', function () {
            app('auth')->forgetGuards();

            $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/conversations/1/messages');

            $response->assertStatus(401);
        });
    });

    // -----------------------------------------------------------------------
    // POST /conversations/{id}/messages
    // -----------------------------------------------------------------------

    describe('POST /conversations/{id}/messages', function () {

        it('merchant can send a message', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'body' => 'Hello from the merchant!',
            ]);

            $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'data' => [
                        'sender_id' => $merchantUser->id,
                        'body' => 'Hello from the merchant!',
                        'is_mine' => true,
                    ],
                ]);

            $this->assertDatabaseHas('messages', [
                'conversation_id' => $conversation->id,
                'sender_id' => $merchantUser->id,
                'body' => 'Hello from the merchant!',
            ]);
        });

        it('customer can send a message', function () {
            ['user' => $customerUser] = createCustomerActor();
            $merchant = Merchant::factory()->create(['status' => 'active']);

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Passport::actingAs($customerUser);
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'body' => 'Hello from the customer!',
            ]);

            $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'sender_id' => $customerUser->id,
                        'body' => 'Hello from the customer!',
                    ],
                ]);
        });

        it('message response includes sender information', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'body' => 'Test message',
            ]);

            $response->assertStatus(201)
                ->assertJsonStructure([
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

        it('sending a message updates last_message_at on the conversation', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();
            $originalTime = now()->subHour();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
                'last_message_at' => $originalTime,
            ]);

            Passport::actingAs($merchantUser);
            $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'body' => 'This should update last_message_at',
            ]);

            $conversation->refresh();
            expect($conversation->last_message_at->gt($originalTime))->toBeTrue();
        });

        it('returns 403 when user is not a participant', function () {
            ['user' => $outsider] = createCustomerActor();
            $merchant = Merchant::factory()->create(['status' => 'active']);
            $otherCustomer = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $otherCustomer->id,
            ]);

            Passport::actingAs($outsider);
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'body' => 'I should not be able to send this',
            ]);

            $response->assertStatus(403);
        });

        it('returns 404 when conversation does not exist', function () {
            ['user' => $merchantUser] = createMerchantActor();
            Passport::actingAs($merchantUser);

            $response = $this->postJson('/api/v1/conversations/99999/messages', [
                'body' => 'This conversation does not exist',
            ]);

            $response->assertStatus(404);
        });

        it('validates body is required', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['body']);
        });

        it('validates body cannot be empty string', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'body' => '',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['body']);
        });

        it('returns 401 when unauthenticated', function () {
            app('auth')->forgetGuards();

            $response = $this->withHeaders(['Authorization' => ''])->postJson('/api/v1/conversations/1/messages', [
                'body' => 'Unauthenticated message attempt',
            ]);

            $response->assertStatus(401);
        });
    });

    // -----------------------------------------------------------------------
    // POST /conversations/{id}/read
    // -----------------------------------------------------------------------

    describe('POST /conversations/{id}/read', function () {

        it('marks unread messages from the other party as read', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            // Customer sends 3 unread messages — merchant marks them as read
            Message::factory()->count(3)->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
                'read_at' => null,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/read");

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Conversation marked as read',
                ]);

            $stillUnread = Message::where('conversation_id', $conversation->id)
                ->where('sender_id', $customerUser->id)
                ->whereNull('read_at')
                ->count();

            expect($stillUnread)->toBe(0);
        });

        it('does not mark the actor\'s own messages as read', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            // Merchant sends their own messages (these should not be touched by markAsRead)
            Message::factory()->count(2)->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $merchantUser->id,
                'read_at' => null,
            ]);

            Passport::actingAs($merchantUser);
            $this->postJson("/api/v1/conversations/{$conversation->id}/read");

            // Merchant's own messages should remain unread (read_at = null)
            $ownUnread = Message::where('conversation_id', $conversation->id)
                ->where('sender_id', $merchantUser->id)
                ->whereNull('read_at')
                ->count();

            expect($ownUnread)->toBe(2);
        });

        it('does not overwrite a previously-set read_at timestamp', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            $originalReadAt = now()->subHour();

            Message::factory()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
                'read_at' => $originalReadAt,
            ]);

            Passport::actingAs($merchantUser);
            $this->postJson("/api/v1/conversations/{$conversation->id}/read");

            $message = Message::first();
            expect($message->fresh()->read_at->toDateTimeString())->toBe($originalReadAt->toDateTimeString());
        });

        it('customer can also mark a conversation as read', function () {
            ['user' => $customerUser] = createCustomerActor();
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            // Merchant sends unread messages
            Message::factory()->count(2)->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $merchantUser->id,
                'read_at' => null,
            ]);

            Passport::actingAs($customerUser);
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/read");

            $response->assertStatus(200);

            $stillUnread = Message::where('conversation_id', $conversation->id)
                ->where('sender_id', $merchantUser->id)
                ->whereNull('read_at')
                ->count();

            expect($stillUnread)->toBe(0);
        });

        it('returns 403 when user is not a participant', function () {
            ['user' => $outsider] = createCustomerActor();
            $merchant = Merchant::factory()->create(['status' => 'active']);
            $otherCustomer = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $otherCustomer->id,
            ]);

            Passport::actingAs($outsider);
            $response = $this->postJson("/api/v1/conversations/{$conversation->id}/read");

            $response->assertStatus(403);
        });

        it('returns 404 when conversation does not exist', function () {
            ['user' => $merchantUser] = createMerchantActor();
            Passport::actingAs($merchantUser);

            $response = $this->postJson('/api/v1/conversations/99999/read');

            $response->assertStatus(404);
        });

        it('returns 401 when unauthenticated', function () {
            app('auth')->forgetGuards();

            $response = $this->withHeaders(['Authorization' => ''])->postJson('/api/v1/conversations/1/read');

            $response->assertStatus(401);
        });
    });

    // -----------------------------------------------------------------------
    // GET /messages/unread-count
    // -----------------------------------------------------------------------

    describe('GET /messages/unread-count', function () {

        it('returns the correct unread count for a merchant', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            // 3 unread messages FROM the customer (merchant has not read them)
            Message::factory()->count(3)->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
                'read_at' => null,
            ]);

            // 1 already-read message from the customer (should not count)
            Message::factory()->read()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
            ]);

            // 1 message sent BY the merchant (should not count towards unread)
            Message::factory()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $merchantUser->id,
                'read_at' => null,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->getJson('/api/v1/messages/unread-count');

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => ['count' => 3],
                ]);
        });

        it('returns the correct unread count for a customer', function () {
            ['user' => $customerUser] = createCustomerActor();
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            // 2 unread messages from the merchant (customer has not read them)
            Message::factory()->count(2)->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $merchantUser->id,
                'read_at' => null,
            ]);

            Passport::actingAs($customerUser);
            $response = $this->getJson('/api/v1/messages/unread-count');

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => ['count' => 2],
                ]);
        });

        it('returns zero when the user has no unread messages', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerUser = User::factory()->create();

            $conversation = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerUser->id,
            ]);

            // All messages are already read
            Message::factory()->count(3)->read()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $customerUser->id,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->getJson('/api/v1/messages/unread-count');

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => ['count' => 0],
                ]);
        });

        it('returns zero when the user has no conversations at all', function () {
            ['user' => $merchantUser] = createMerchantActor();
            Passport::actingAs($merchantUser);

            $response = $this->getJson('/api/v1/messages/unread-count');

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => ['count' => 0],
                ]);
        });

        it('counts unread messages across multiple conversations', function () {
            ['user' => $merchantUser, 'merchant' => $merchant] = createMerchantActor();
            $customerA = User::factory()->create();
            $customerB = User::factory()->create();

            $convA = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerA->id,
            ]);

            $convB = Conversation::factory()->create([
                'merchant_id' => $merchant->id,
                'customer_id' => $customerB->id,
                'conversable_type' => 'reservation',
            ]);

            // 2 unread in conversation A
            Message::factory()->count(2)->create([
                'conversation_id' => $convA->id,
                'sender_id' => $customerA->id,
                'read_at' => null,
            ]);

            // 3 unread in conversation B
            Message::factory()->count(3)->create([
                'conversation_id' => $convB->id,
                'sender_id' => $customerB->id,
                'read_at' => null,
            ]);

            Passport::actingAs($merchantUser);
            $response = $this->getJson('/api/v1/messages/unread-count');

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => ['count' => 5],
                ]);
        });

        it('returns 401 when unauthenticated', function () {
            app('auth')->forgetGuards();

            $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/messages/unread-count');

            $response->assertStatus(401);
        });
    });
});
