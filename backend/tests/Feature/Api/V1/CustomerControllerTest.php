<?php

use App\Models\Customer;
use App\Models\CustomerInteraction;
use App\Models\CustomerTag;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Customer Index', function () {
    it('can list all customers', function () {
        Customer::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/customers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'customer_type', 'customer_tier', 'status', 'loyalty_points', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter customers by type', function () {
        Customer::factory()->count(3)->create(['customer_type' => 'individual']);
        Customer::factory()->corporate()->count(2)->create();

        $response = $this->getJson('/api/v1/customers?filter[customer_type]=corporate');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(count($data))->toBe(2);
    });

    it('can filter customers by status', function () {
        Customer::factory()->count(3)->create(['status' => 'active']);
        Customer::factory()->suspended()->count(2)->create();

        $response = $this->getJson('/api/v1/customers?filter[status]=suspended');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(count($data))->toBe(2);
    });

    it('can search customers by user name or email', function () {
        $user = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        Customer::factory()->create(['user_id' => $user->id]);
        Customer::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/customers?filter[search]=John');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(count($data))->toBe(1);
    });

    it('can filter customers by tag', function () {
        $tag = CustomerTag::factory()->create();
        $customer1 = Customer::factory()->create();
        $customer1->tags()->attach($tag);
        Customer::factory()->count(3)->create();

        $response = $this->getJson("/api/v1/customers?filter[tag_id]={$tag->id}");

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(count($data))->toBe(1);
    });

    it('can paginate customers', function () {
        Customer::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/customers?per_page=5');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });
});

describe('Customer Store', function () {
    it('can create a customer with user account', function () {
        $response = $this->postJson('/api/v1/customers', [
            'user_first_name' => 'Jane',
            'user_last_name' => 'Customer',
            'user_email' => 'jane@example.com',
            'user_password' => 'password123',
            'customer_type' => 'individual',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => [
                    'customer_type' => 'individual',
                    'status' => 'active',
                ],
            ]);

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
        $this->assertDatabaseHas('customers', ['customer_type' => 'individual']);

        $user = User::where('email', 'jane@example.com')->first();
        expect($user->hasRole('customer'))->toBeTrue();
    });

    it('can create a corporate customer', function () {
        $response = $this->postJson('/api/v1/customers', [
            'user_first_name' => 'Corp',
            'user_last_name' => 'Customer',
            'user_email' => 'corp@example.com',
            'user_password' => 'password123',
            'customer_type' => 'corporate',
            'company_name' => 'ACME Corp',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'customer_type' => 'corporate',
                    'company_name' => 'ACME Corp',
                ],
            ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/customers', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_first_name', 'user_last_name', 'user_email', 'user_password']);
    });

    it('validates unique email', function () {
        User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/v1/customers', [
            'user_first_name' => 'Test',
            'user_last_name' => 'User',
            'user_email' => 'taken@example.com',
            'user_password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_email']);
    });
});

describe('Customer Show', function () {
    it('can show a specific customer with relations', function () {
        $customer = Customer::factory()->create();
        $tag = CustomerTag::factory()->create();
        $customer->tags()->attach($tag);
        CustomerInteraction::factory()->create(['customer_id' => $customer->id]);

        $response = $this->getJson("/api/v1/customers/{$customer->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $customer->id,
                    'customer_type' => $customer->customer_type,
                ],
            ])
            ->assertJsonStructure([
                'data' => ['user', 'tags', 'interactions_count'],
            ]);
    });

    it('returns 404 for non-existent customer', function () {
        $response = $this->getJson('/api/v1/customers/99999');

        $response->assertStatus(404);
    });
});

describe('Customer Update', function () {
    it('can update customer fields', function () {
        $customer = Customer::factory()->create();

        $response = $this->putJson("/api/v1/customers/{$customer->id}", [
            'customer_type' => 'corporate',
            'company_name' => 'New Corp',
            'customer_notes' => 'VIP customer',
            'loyalty_points' => 500,
            'customer_tier' => 'gold',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'customer_type' => 'corporate',
                    'company_name' => 'New Corp',
                    'customer_notes' => 'VIP customer',
                    'loyalty_points' => 500,
                    'customer_tier' => 'gold',
                ],
            ]);
    });
});

describe('Customer Status', function () {
    it('can update customer status with valid transition', function () {
        $customer = Customer::factory()->create(['status' => 'active']);

        $response = $this->patchJson("/api/v1/customers/{$customer->id}/status", [
            'status' => 'suspended',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'suspended']]);
    });

    it('rejects invalid status transition', function () {
        $customer = Customer::factory()->create(['status' => 'banned']);

        $response = $this->patchJson("/api/v1/customers/{$customer->id}/status", [
            'status' => 'suspended',
        ]);

        $response->assertStatus(422);
    });

    it('can reactivate a suspended customer', function () {
        $customer = Customer::factory()->suspended()->create();

        $response = $this->patchJson("/api/v1/customers/{$customer->id}/status", [
            'status' => 'active',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['status' => 'active']]);
    });
});

describe('Customer Deactivate', function () {
    it('can deactivate a customer', function () {
        $customer = Customer::factory()->create(['status' => 'active']);

        $response = $this->deleteJson("/api/v1/customers/{$customer->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'banned'],
            ]);
    });

    it('returns error for already banned customer', function () {
        $customer = Customer::factory()->banned()->create();

        $response = $this->deleteJson("/api/v1/customers/{$customer->id}");

        $response->assertStatus(422);
    });
});

describe('Customer Tags', function () {
    it('can sync tags to a customer', function () {
        $customer = Customer::factory()->create();
        $tags = CustomerTag::factory()->count(3)->create();

        $response = $this->postJson("/api/v1/customers/{$customer->id}/tags", [
            'tag_ids' => $tags->pluck('id')->toArray(),
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        expect($customer->fresh()->tags)->toHaveCount(3);
    });

    it('can replace existing tags', function () {
        $customer = Customer::factory()->create();
        $oldTags = CustomerTag::factory()->count(2)->create();
        $customer->tags()->attach($oldTags);
        $newTag = CustomerTag::factory()->create();

        $response = $this->postJson("/api/v1/customers/{$customer->id}/tags", [
            'tag_ids' => [$newTag->id],
        ]);

        $response->assertStatus(200);
        expect($customer->fresh()->tags)->toHaveCount(1);
        expect($customer->fresh()->tags->first()->id)->toBe($newTag->id);
    });

    it('can clear all tags', function () {
        $customer = Customer::factory()->create();
        $tags = CustomerTag::factory()->count(2)->create();
        $customer->tags()->attach($tags);

        $response = $this->postJson("/api/v1/customers/{$customer->id}/tags", [
            'tag_ids' => [],
        ]);

        $response->assertStatus(200);
        expect($customer->fresh()->tags)->toHaveCount(0);
    });
});

describe('Customer Interactions', function () {
    it('can list interactions for a customer', function () {
        $customer = Customer::factory()->create();
        CustomerInteraction::factory()->count(5)->create(['customer_id' => $customer->id]);

        $response = $this->getJson("/api/v1/customers/{$customer->id}/interactions");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'type', 'description', 'logged_by', 'created_at', 'updated_at'],
                ],
                'meta',
                'links',
            ]);
    });

    it('can create an interaction', function () {
        $customer = Customer::factory()->create();

        $response = $this->postJson("/api/v1/customers/{$customer->id}/interactions", [
            'type' => 'call',
            'description' => 'Follow-up call about order',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'call',
                    'description' => 'Follow-up call about order',
                ],
            ]);

        $this->assertDatabaseHas('customer_interactions', [
            'customer_id' => $customer->id,
            'type' => 'call',
            'logged_by' => $this->actingUser->id,
        ]);
    });

    it('validates interaction required fields', function () {
        $customer = Customer::factory()->create();

        $response = $this->postJson("/api/v1/customers/{$customer->id}/interactions", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'description']);
    });

    it('validates interaction type enum', function () {
        $customer = Customer::factory()->create();

        $response = $this->postJson("/api/v1/customers/{$customer->id}/interactions", [
            'type' => 'invalid',
            'description' => 'Test',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    });

    it('can delete an interaction', function () {
        $customer = Customer::factory()->create();
        $interaction = CustomerInteraction::factory()->create(['customer_id' => $customer->id]);

        $response = $this->deleteJson("/api/v1/customers/{$customer->id}/interactions/{$interaction->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('customer_interactions', ['id' => $interaction->id]);
    });

    it('returns error when deleting non-existent interaction', function () {
        $customer = Customer::factory()->create();

        $response = $this->deleteJson("/api/v1/customers/{$customer->id}/interactions/99999");

        $response->assertStatus(422);
    });
});

describe('Customer Avatar', function () {
    it('can upload an avatar', function () {
        Storage::fake('media');
        $customer = Customer::factory()->create();

        $response = $this->postJson("/api/v1/customers/{$customer->id}/avatar", [
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Avatar uploaded successfully',
            ]);

        $profile = $customer->user->profile->fresh();
        expect($profile->hasMedia('avatar'))->toBeTrue();
    });

    it('can replace an existing avatar', function () {
        Storage::fake('media');
        $customer = Customer::factory()->create();

        // Upload first
        $this->postJson("/api/v1/customers/{$customer->id}/avatar", [
            'avatar' => UploadedFile::fake()->image('avatar1.jpg', 200, 200),
        ]);

        // Upload second
        $response = $this->postJson("/api/v1/customers/{$customer->id}/avatar", [
            'avatar' => UploadedFile::fake()->image('avatar2.jpg', 200, 200),
        ]);

        $response->assertStatus(200);
        expect($customer->user->profile->fresh()->getMedia('avatar'))->toHaveCount(1);
    });

    it('can delete an avatar', function () {
        Storage::fake('media');
        $customer = Customer::factory()->create();
        $customer->user->profile->addMedia(UploadedFile::fake()->image('avatar.jpg', 200, 200))
            ->toMediaCollection('avatar');

        $response = $this->deleteJson("/api/v1/customers/{$customer->id}/avatar");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Avatar deleted successfully',
            ]);

        expect($customer->user->profile->fresh()->hasMedia('avatar'))->toBeFalse();
    });

    it('validates avatar file is required', function () {
        $customer = Customer::factory()->create();

        $response = $this->postJson("/api/v1/customers/{$customer->id}/avatar", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    });
});

describe('Customer Documents', function () {
    it('can upload a document', function () {
        Storage::fake('media');
        $customer = Customer::factory()->create();
        $docType = DocumentType::factory()->create();

        $response = $this->postJson("/api/v1/customers/{$customer->id}/documents", [
            'document_type_id' => $docType->id,
            'document' => UploadedFile::fake()->create('permit.pdf', 1024, 'application/pdf'),
            'notes' => 'ID document',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => [
                    'document_type_id' => $docType->id,
                    'notes' => 'ID document',
                ],
            ]);

        $this->assertDatabaseHas('customer_documents', [
            'customer_id' => $customer->id,
            'document_type_id' => $docType->id,
            'notes' => 'ID document',
        ]);
    });

    it('can replace a document for the same type', function () {
        Storage::fake('media');
        $customer = Customer::factory()->create();
        $docType = DocumentType::factory()->create();

        // Upload first
        $this->postJson("/api/v1/customers/{$customer->id}/documents", [
            'document_type_id' => $docType->id,
            'document' => UploadedFile::fake()->create('doc1.pdf', 1024, 'application/pdf'),
            'notes' => 'First upload',
        ]);

        // Upload same type again (should update)
        $response = $this->postJson("/api/v1/customers/{$customer->id}/documents", [
            'document_type_id' => $docType->id,
            'document' => UploadedFile::fake()->create('doc2.pdf', 1024, 'application/pdf'),
            'notes' => 'Second upload',
        ]);

        $response->assertStatus(201);

        expect($customer->documents()->where('document_type_id', $docType->id)->count())->toBe(1);

        $this->assertDatabaseHas('customer_documents', [
            'customer_id' => $customer->id,
            'document_type_id' => $docType->id,
            'notes' => 'Second upload',
        ]);
    });

    it('can delete a document', function () {
        $customer = Customer::factory()->create();
        $docType = DocumentType::factory()->create();
        $document = $customer->documents()->create([
            'document_type_id' => $docType->id,
            'notes' => 'To be deleted',
        ]);

        $response = $this->deleteJson("/api/v1/customers/{$customer->id}/documents/{$document->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Document deleted successfully',
            ]);

        $this->assertDatabaseMissing('customer_documents', ['id' => $document->id]);
    });

    it('returns error when deleting non-existent document', function () {
        $customer = Customer::factory()->create();

        $response = $this->deleteJson("/api/v1/customers/{$customer->id}/documents/99999");

        $response->assertStatus(422);
    });

    it('validates required fields for document upload', function () {
        $customer = Customer::factory()->create();

        $response = $this->postJson("/api/v1/customers/{$customer->id}/documents", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['document_type_id', 'document']);
    });

    it('returns documents in customer detail response', function () {
        $customer = Customer::factory()->create();
        $docType = DocumentType::factory()->create();
        $customer->documents()->create([
            'document_type_id' => $docType->id,
            'notes' => 'Test doc',
        ]);

        $response = $this->getJson("/api/v1/customers/{$customer->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'documents' => [
                        '*' => ['id', 'document_type_id', 'notes', 'document_type'],
                    ],
                ],
            ]);
    });
});

describe('Customer Authorization', function () {
    it('rejects unauthorized access', function () {
        $user = User::factory()->create();
        $user->assignRole('user');
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/customers');

        $response->assertStatus(403);
    });
});
