<?php

use App\Models\CustomerTag;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Customer Tag Index', function () {
    it('can list all customer tags', function () {
        CustomerTag::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/customer-tags');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'color', 'description', 'is_active', 'sort_order', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter customer tags by name', function () {
        CustomerTag::factory()->create(['name' => 'VIP']);
        CustomerTag::factory()->create(['name' => 'Wholesale']);

        $response = $this->getJson('/api/v1/customer-tags?filter[name]=VIP');

        $response->assertStatus(200);
        $data = $response->json('data');
        $filtered = collect($data)->filter(fn ($tag) => str_contains($tag['name'], 'VIP'));
        expect($filtered)->toHaveCount(1);
    });

    it('can paginate customer tags', function () {
        CustomerTag::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/customer-tags?per_page=5');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });
});

describe('Customer Tag All', function () {
    it('can list all customer tags without pagination', function () {
        CustomerTag::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/customer-tags/all');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    });
});

describe('Customer Tag Active', function () {
    it('can list active customer tags', function () {
        CustomerTag::factory()->count(3)->create(['is_active' => true]);
        CustomerTag::factory()->count(2)->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/customer-tags/active');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        expect(count($data))->toBe(3);
    });

    it('is accessible without authentication', function () {
        $this->app['auth']->forgetGuards();

        CustomerTag::factory()->create(['is_active' => true]);

        $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/customer-tags/active');

        $response->assertStatus(200);
    });
});

describe('Customer Tag Store', function () {
    it('can create a customer tag', function () {
        $response = $this->postJson('/api/v1/customer-tags', [
            'name' => 'Premium',
            'color' => '#FF5733',
            'description' => 'Premium customers',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Customer tag created successfully',
                'data' => [
                    'name' => 'Premium',
                    'slug' => 'premium',
                    'color' => '#FF5733',
                    'description' => 'Premium customers',
                ],
            ]);

        $this->assertDatabaseHas('customer_tags', [
            'name' => 'Premium',
            'slug' => 'premium',
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/customer-tags', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates name uniqueness', function () {
        CustomerTag::factory()->create(['name' => 'VIP']);

        $response = $this->postJson('/api/v1/customer-tags', [
            'name' => 'VIP',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});

describe('Customer Tag Show', function () {
    it('can show a specific customer tag', function () {
        $tag = CustomerTag::factory()->create();

        $response = $this->getJson("/api/v1/customer-tags/{$tag->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                ],
            ]);
    });

    it('returns 404 for non-existent customer tag', function () {
        $response = $this->getJson('/api/v1/customer-tags/99999');

        $response->assertStatus(404);
    });
});

describe('Customer Tag Update', function () {
    it('can update a customer tag', function () {
        $tag = CustomerTag::factory()->create();

        $response = $this->putJson("/api/v1/customer-tags/{$tag->id}", [
            'name' => 'Updated Tag',
            'color' => '#00FF00',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Tag',
                    'color' => '#00FF00',
                ],
            ]);

        $this->assertDatabaseHas('customer_tags', [
            'id' => $tag->id,
            'name' => 'Updated Tag',
        ]);
    });

    it('validates name uniqueness on update', function () {
        $tag1 = CustomerTag::factory()->create(['name' => 'VIP']);
        $tag2 = CustomerTag::factory()->create(['name' => 'Wholesale']);

        $response = $this->putJson("/api/v1/customer-tags/{$tag1->id}", [
            'name' => 'Wholesale',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});

describe('Customer Tag Delete', function () {
    it('can delete a customer tag', function () {
        $tag = CustomerTag::factory()->create();

        $response = $this->deleteJson("/api/v1/customer-tags/{$tag->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Customer tag deleted successfully',
            ]);

        $this->assertDatabaseMissing('customer_tags', [
            'id' => $tag->id,
        ]);
    });

    it('returns error for non-existent customer tag', function () {
        $response = $this->deleteJson('/api/v1/customer-tags/99999');

        $response->assertStatus(422);
    });
});
