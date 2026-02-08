<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->otherUser = User::factory()->create();
    Passport::actingAs($this->user);
});

describe('Conversations', function () {
    it('can list conversations', function () {
        // Create a conversation between users
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        $response = $this->getJson('/api/v1/conversations');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'other_user', 'unread_count', 'created_at', 'updated_at'],
                ],
                'meta',
            ])
            ->assertJson(['success' => true]);
    });

    it('can start a new conversation', function () {
        $response = $this->postJson('/api/v1/conversations', [
            'recipient_id' => $this->otherUser->id,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Conversation started successfully',
            ])
            ->assertJsonStructure([
                'data' => ['id', 'other_user', 'unread_count'],
            ]);

        $this->assertDatabaseHas('conversations', [
            'user_one_id' => min($this->user->id, $this->otherUser->id),
            'user_two_id' => max($this->user->id, $this->otherUser->id),
        ]);
    });

    it('can start a conversation with initial message', function () {
        $response = $this->postJson('/api/v1/conversations', [
            'recipient_id' => $this->otherUser->id,
            'message' => 'Hello!',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('messages', [
            'sender_id' => $this->user->id,
            'body' => 'Hello!',
        ]);
    });

    it('cannot start a conversation with yourself', function () {
        $response = $this->postJson('/api/v1/conversations', [
            'recipient_id' => $this->user->id,
        ]);

        $response->assertStatus(400);
    });

    it('returns existing conversation if already exists', function () {
        // Create existing conversation
        $existingConversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        $response = $this->postJson('/api/v1/conversations', [
            'recipient_id' => $this->otherUser->id,
        ]);

        $response->assertStatus(201);
        expect($response->json('data.id'))->toBe($existingConversation->id);
    });

    it('can show a specific conversation', function () {
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        $response = $this->getJson("/api/v1/conversations/{$conversation->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $conversation->id,
                ],
            ]);
    });

    it('cannot access conversation you are not part of', function () {
        $thirdUser = User::factory()->create();
        $conversation = Conversation::create([
            'user_one_id' => $this->otherUser->id,
            'user_two_id' => $thirdUser->id,
        ]);

        $response = $this->getJson("/api/v1/conversations/{$conversation->id}");

        $response->assertStatus(403);
    });

    it('can delete a conversation', function () {
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        $response = $this->deleteJson("/api/v1/conversations/{$conversation->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Conversation deleted successfully',
            ]);

        // Verify participant is soft deleted
        $this->assertSoftDeleted('conversation_participants', [
            'conversation_id' => $conversation->id,
            'user_id' => $this->user->id,
        ]);
    });
});

describe('Messages', function () {
    it('can get messages for a conversation', function () {
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'Test message',
        ]);

        $response = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'conversation_id', 'sender_id', 'body', 'created_at'],
                ],
                'meta',
            ]);
    });

    it('can send a message', function () {
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'Hello, how are you?',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Message sent successfully',
            ])
            ->assertJsonPath('data.body', 'Hello, how are you?');

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'Hello, how are you?',
        ]);
    });

    it('cannot send empty message', function () {
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['body']);
    });

    it('can mark conversation as read', function () {
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        // Create an unread message from the other user
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->otherUser->id,
            'body' => 'Hello!',
        ]);

        // Update the participant unread count
        $participant = $conversation->participants()->where('user_id', $this->user->id)->first();
        $participant->update(['unread_count' => 1]);

        $response = $this->postJson("/api/v1/conversations/{$conversation->id}/read");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Conversation marked as read',
            ]);

        // Verify unread count is reset
        $participant->refresh();
        expect($participant->unread_count)->toBe(0);
    });

    it('can delete own message', function () {
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'Test message',
        ]);

        $response = $this->deleteJson("/api/v1/messages/{$message->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Message deleted successfully',
            ]);

        $this->assertSoftDeleted('messages', ['id' => $message->id]);
    });

    it('cannot delete other users message', function () {
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->otherUser->id,
            'body' => 'Test message',
        ]);

        $response = $this->deleteJson("/api/v1/messages/{$message->id}");

        $response->assertStatus(403);
    });
});

describe('Unread Count', function () {
    it('can get total unread message count', function () {
        $response = $this->getJson('/api/v1/messages/unread-count');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['count'],
            ]);
    });
});

describe('Message Search', function () {
    it('can search messages', function () {
        $conversation = Conversation::create([
            'user_one_id' => $this->user->id,
            'user_two_id' => $this->otherUser->id,
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'Hello world',
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'Goodbye world',
        ]);

        $response = $this->getJson('/api/v1/messages/search?q=Hello');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'meta',
            ]);
    });

    it('requires minimum search query length', function () {
        $response = $this->getJson('/api/v1/messages/search?q=H');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['q']);
    });
});

describe('Authentication', function () {
    it('requires authentication for conversations list', function () {
        $this->app['auth']->forgetGuards();

        $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/conversations');

        $response->assertStatus(401);
    });

    it('requires authentication for sending messages', function () {
        $this->app['auth']->forgetGuards();

        $response = $this->withHeaders(['Authorization' => ''])->postJson('/api/v1/conversations/1/messages', [
            'body' => 'Test',
        ]);

        $response->assertStatus(401);
    });
});
