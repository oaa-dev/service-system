<?php

use App\Models\Merchant;
use App\Models\ServiceCategory;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);

    $this->merchant = Merchant::factory()->create();
});

describe('Merchant Service Category Index', function () {
    it('can list merchant service categories', function () {
        ServiceCategory::factory()->count(5)->create(['merchant_id' => $this->merchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-categories");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'merchant_id', 'name', 'slug', 'description', 'is_active', 'sort_order', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter service categories by name', function () {
        ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id, 'name' => 'Hair Services']);
        ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id, 'name' => 'Spa & Massage']);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-categories?filter[name]=Hair");

        $response->assertStatus(200);
        $data = $response->json('data');
        $filtered = collect($data)->filter(fn ($sc) => str_contains($sc['name'], 'Hair'));
        expect($filtered)->toHaveCount(1);
    });

    it('can paginate service categories', function () {
        ServiceCategory::factory()->count(20)->create(['merchant_id' => $this->merchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-categories?per_page=5");

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });

    it('only returns service categories for the specified merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        ServiceCategory::factory()->count(2)->create(['merchant_id' => $this->merchant->id]);
        ServiceCategory::factory()->count(3)->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-categories");

        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBe(2);
    });
});

describe('Merchant Service Category Active', function () {
    it('can list active service categories for a merchant', function () {
        ServiceCategory::factory()->count(3)->create(['merchant_id' => $this->merchant->id, 'is_active' => true]);
        ServiceCategory::factory()->count(2)->create(['merchant_id' => $this->merchant->id, 'is_active' => false]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-categories/active");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        expect(count($data))->toBe(3);
    });
});

describe('Merchant Service Category Store', function () {
    it('can create a service category for a merchant', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-categories", [
            'name' => 'Hair Services',
            'description' => 'All hair-related services',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Service category created successfully',
                'data' => [
                    'merchant_id' => $this->merchant->id,
                    'name' => 'Hair Services',
                    'slug' => 'hair-services',
                ],
            ]);

        $this->assertDatabaseHas('service_categories', [
            'merchant_id' => $this->merchant->id,
            'name' => 'Hair Services',
            'slug' => 'hair-services',
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-categories", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates name uniqueness within the same merchant', function () {
        ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id, 'name' => 'Hair Services']);

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-categories", [
            'name' => 'Hair Services',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('allows same name for different merchants', function () {
        $otherMerchant = Merchant::factory()->create();
        ServiceCategory::factory()->create(['merchant_id' => $otherMerchant->id, 'name' => 'Hair Services']);

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/service-categories", [
            'name' => 'Hair Services',
        ]);

        $response->assertStatus(201);
    });
});

describe('Merchant Service Category Show', function () {
    it('can show a specific service category', function () {
        $serviceCategory = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-categories/{$serviceCategory->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $serviceCategory->id,
                    'name' => $serviceCategory->name,
                ],
            ]);
    });

    it('returns 404 for service category belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $serviceCategory = ServiceCategory::factory()->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/service-categories/{$serviceCategory->id}");

        $response->assertStatus(404);
    });
});

describe('Merchant Service Category Update', function () {
    it('can update a service category', function () {
        $serviceCategory = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id]);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/service-categories/{$serviceCategory->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Name',
                ],
            ]);

        $this->assertDatabaseHas('service_categories', [
            'id' => $serviceCategory->id,
            'name' => 'Updated Name',
        ]);
    });

    it('validates name uniqueness on update within the same merchant', function () {
        $sc1 = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id, 'name' => 'Hair Services']);
        $sc2 = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id, 'name' => 'Spa & Massage']);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/service-categories/{$sc1->id}", [
            'name' => 'Spa & Massage',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('cannot update service category belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $serviceCategory = ServiceCategory::factory()->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/service-categories/{$serviceCategory->id}", [
            'name' => 'Hacked Category',
        ]);

        $response->assertStatus(404);
    });
});

describe('Merchant Service Category Delete', function () {
    it('can delete a service category', function () {
        $serviceCategory = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id]);

        $response = $this->deleteJson("/api/v1/merchants/{$this->merchant->id}/service-categories/{$serviceCategory->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Service category deleted successfully',
            ]);

        $this->assertDatabaseMissing('service_categories', [
            'id' => $serviceCategory->id,
        ]);
    });

    it('cannot delete service category belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $serviceCategory = ServiceCategory::factory()->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->deleteJson("/api/v1/merchants/{$this->merchant->id}/service-categories/{$serviceCategory->id}");

        $response->assertStatus(422);
    });
});
