<?php

use App\Models\DocumentType;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Document Type Index', function () {
    it('can list all document types', function () {
        DocumentType::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/document-types');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'description', 'is_required', 'level', 'is_active', 'sort_order', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter document types by name', function () {
        DocumentType::factory()->create(['name' => 'Business Permit']);
        DocumentType::factory()->create(['name' => 'BIR Certificate']);

        $response = $this->getJson('/api/v1/document-types?filter[name]=Business');

        $response->assertStatus(200);
        $data = $response->json('data');
        $filtered = collect($data)->filter(fn ($dt) => str_contains($dt['name'], 'Business'));
        expect($filtered)->toHaveCount(1);
    });

    it('can filter document types by level', function () {
        DocumentType::factory()->create(['level' => 'organization']);
        DocumentType::factory()->create(['level' => 'branch']);
        DocumentType::factory()->create(['level' => 'both']);

        $response = $this->getJson('/api/v1/document-types?filter[level]=organization');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(collect($data)->every(fn ($dt) => $dt['level'] === 'organization'))->toBeTrue();
    });

    it('can paginate document types', function () {
        DocumentType::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/document-types?per_page=5');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });
});

describe('Document Type Active', function () {
    it('can list active document types', function () {
        DocumentType::factory()->count(3)->create(['is_active' => true]);
        DocumentType::factory()->count(2)->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/document-types/active');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        expect(count($data))->toBe(3);
    });

    it('is accessible without authentication', function () {
        $this->app['auth']->forgetGuards();

        DocumentType::factory()->create(['is_active' => true]);

        $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/document-types/active');

        $response->assertStatus(200);
    });
});

describe('Document Type Store', function () {
    it('can create a document type', function () {
        $response = $this->postJson('/api/v1/document-types', [
            'name' => 'Tax Certificate',
            'description' => 'Annual tax certificate',
            'is_required' => true,
            'level' => 'both',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Document type created successfully',
                'data' => [
                    'name' => 'Tax Certificate',
                    'slug' => 'tax-certificate',
                    'is_required' => true,
                    'level' => 'both',
                ],
            ]);

        $this->assertDatabaseHas('document_types', [
            'name' => 'Tax Certificate',
            'slug' => 'tax-certificate',
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/document-types', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates name uniqueness', function () {
        DocumentType::factory()->create(['name' => 'Business Permit']);

        $response = $this->postJson('/api/v1/document-types', [
            'name' => 'Business Permit',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates level enum', function () {
        $response = $this->postJson('/api/v1/document-types', [
            'name' => 'Test Document',
            'level' => 'invalid',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['level']);
    });
});

describe('Document Type Show', function () {
    it('can show a specific document type', function () {
        $documentType = DocumentType::factory()->create();

        $response = $this->getJson("/api/v1/document-types/{$documentType->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $documentType->id,
                    'name' => $documentType->name,
                ],
            ]);
    });

    it('returns 404 for non-existent document type', function () {
        $response = $this->getJson('/api/v1/document-types/99999');

        $response->assertStatus(404);
    });
});

describe('Document Type Update', function () {
    it('can update a document type', function () {
        $documentType = DocumentType::factory()->create();

        $response = $this->putJson("/api/v1/document-types/{$documentType->id}", [
            'name' => 'Updated Name',
            'level' => 'organization',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Name',
                    'level' => 'organization',
                ],
            ]);

        $this->assertDatabaseHas('document_types', [
            'id' => $documentType->id,
            'name' => 'Updated Name',
            'level' => 'organization',
        ]);
    });

    it('validates name uniqueness on update', function () {
        $dt1 = DocumentType::factory()->create(['name' => 'Type A']);
        $dt2 = DocumentType::factory()->create(['name' => 'Type B']);

        $response = $this->putJson("/api/v1/document-types/{$dt1->id}", [
            'name' => 'Type B',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});

describe('Document Type Delete', function () {
    it('can delete a document type', function () {
        $documentType = DocumentType::factory()->create();

        $response = $this->deleteJson("/api/v1/document-types/{$documentType->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Document type deleted successfully',
            ]);

        $this->assertDatabaseMissing('document_types', [
            'id' => $documentType->id,
        ]);
    });

    it('returns error for non-existent document type', function () {
        $response = $this->deleteJson('/api/v1/document-types/99999');

        $response->assertStatus(422);
    });
});
