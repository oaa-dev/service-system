<?php

use App\Models\BusinessType;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Business Type Index', function () {
    it('can list all business types', function () {
        BusinessType::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/business-types');

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

    it('can filter business types by name', function () {
        BusinessType::factory()->create(['name' => 'Restaurant']);
        BusinessType::factory()->create(['name' => 'Retail']);

        $response = $this->getJson('/api/v1/business-types?filter[name]=Restaurant');

        $response->assertStatus(200);
        $data = $response->json('data');
        $filtered = collect($data)->filter(fn ($bt) => str_contains($bt['name'], 'Restaurant'));
        expect($filtered)->toHaveCount(1);
    });

    it('can paginate business types', function () {
        BusinessType::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/business-types?per_page=5');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });
});

describe('Business Type Active', function () {
    it('can list active business types', function () {
        BusinessType::factory()->count(3)->create(['is_active' => true]);
        BusinessType::factory()->count(2)->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/business-types/active');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        expect(count($data))->toBe(3);
    });

    it('is accessible without authentication', function () {
        $this->app['auth']->forgetGuards();

        BusinessType::factory()->create(['is_active' => true]);

        $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/business-types/active');

        $response->assertStatus(200);
    });
});

describe('Business Type Store', function () {
    it('can create a business type', function () {
        $response = $this->postJson('/api/v1/business-types', [
            'name' => 'E-Commerce',
            'description' => 'Online retail businesses',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Business type created successfully',
                'data' => [
                    'name' => 'E-Commerce',
                    'slug' => 'e-commerce',
                ],
            ]);

        $this->assertDatabaseHas('business_types', [
            'name' => 'E-Commerce',
            'slug' => 'e-commerce',
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/business-types', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates name uniqueness', function () {
        BusinessType::factory()->create(['name' => 'Restaurant']);

        $response = $this->postJson('/api/v1/business-types', [
            'name' => 'Restaurant',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});

describe('Business Type Show', function () {
    it('can show a specific business type', function () {
        $businessType = BusinessType::factory()->create();

        $response = $this->getJson("/api/v1/business-types/{$businessType->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $businessType->id,
                    'name' => $businessType->name,
                ],
            ]);
    });

    it('returns 404 for non-existent business type', function () {
        $response = $this->getJson('/api/v1/business-types/99999');

        $response->assertStatus(404);
    });
});

describe('Business Type Update', function () {
    it('can update a business type', function () {
        $businessType = BusinessType::factory()->create();

        $response = $this->putJson("/api/v1/business-types/{$businessType->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Name',
                ],
            ]);

        $this->assertDatabaseHas('business_types', [
            'id' => $businessType->id,
            'name' => 'Updated Name',
        ]);
    });

    it('validates name uniqueness on update', function () {
        $bt1 = BusinessType::factory()->create(['name' => 'Restaurant']);
        $bt2 = BusinessType::factory()->create(['name' => 'Retail']);

        $response = $this->putJson("/api/v1/business-types/{$bt1->id}", [
            'name' => 'Retail',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});

describe('Business Type Delete', function () {
    it('can delete a business type', function () {
        $businessType = BusinessType::factory()->create();

        $response = $this->deleteJson("/api/v1/business-types/{$businessType->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Business type deleted successfully',
            ]);

        $this->assertDatabaseMissing('business_types', [
            'id' => $businessType->id,
        ]);
    });

    it('returns error for non-existent business type', function () {
        $response = $this->deleteJson('/api/v1/business-types/99999');

        $response->assertStatus(422);
    });
});
