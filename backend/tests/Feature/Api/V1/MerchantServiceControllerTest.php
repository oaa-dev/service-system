<?php

use App\Models\Merchant;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);

    $this->merchant = Merchant::factory()->create();
});

describe('Merchant Service Index', function () {
    it('can list merchant services', function () {
        Service::factory()->count(3)->create(['merchant_id' => $this->merchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/services");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'merchant_id', 'name', 'slug', 'price', 'is_active', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter services by name', function () {
        Service::factory()->create(['merchant_id' => $this->merchant->id, 'name' => 'Haircut']);
        Service::factory()->create(['merchant_id' => $this->merchant->id, 'name' => 'Massage']);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/services?filter[name]=Haircut");

        $response->assertStatus(200);
        $data = $response->json('data');
        $filtered = collect($data)->filter(fn ($s) => str_contains($s['name'], 'Haircut'));
        expect($filtered)->toHaveCount(1);
    });

    it('can filter services by category', function () {
        $category = ServiceCategory::factory()->create();
        Service::factory()->count(2)->create(['merchant_id' => $this->merchant->id, 'service_category_id' => $category->id]);
        Service::factory()->create(['merchant_id' => $this->merchant->id, 'service_category_id' => null]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/services?filter[service_category_id]={$category->id}");

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(2);
    });

    it('can paginate services', function () {
        Service::factory()->count(20)->create(['merchant_id' => $this->merchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/services?per_page=5");

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });

    it('only returns services for the specified merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        Service::factory()->count(2)->create(['merchant_id' => $this->merchant->id]);
        Service::factory()->count(3)->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/services");

        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBe(2);
    });
});

describe('Merchant Service Store', function () {
    it('can create a service', function () {
        $category = ServiceCategory::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/services", [
            'name' => 'Premium Haircut',
            'service_category_id' => $category->id,
            'description' => 'A premium haircut service',
            'price' => 25.00,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Service created successfully',
                'data' => [
                    'name' => 'Premium Haircut',
                    'slug' => 'premium-haircut',
                    'price' => '25.00',
                ],
            ]);

        $this->assertDatabaseHas('services', [
            'merchant_id' => $this->merchant->id,
            'name' => 'Premium Haircut',
            'price' => 25.00,
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/services", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'price']);
    });

    it('validates price must be numeric', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/services", [
            'name' => 'Test Service',
            'price' => 'not-a-number',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    });

});

describe('Merchant Service Show', function () {
    it('can show a specific service', function () {
        $service = Service::factory()->create(['merchant_id' => $this->merchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $service->id,
                    'name' => $service->name,
                ],
            ]);
    });

    it('returns 404 for service belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $service = Service::factory()->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}");

        $response->assertStatus(404);
    });
});

describe('Merchant Service Update', function () {
    it('can update a service', function () {
        $service = Service::factory()->create(['merchant_id' => $this->merchant->id]);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}", [
            'name' => 'Updated Service',
            'price' => 99.99,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Service',
                    'price' => '99.99',
                ],
            ]);

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'name' => 'Updated Service',
            'price' => 99.99,
        ]);
    });

    it('cannot update service belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $service = Service::factory()->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}", [
            'name' => 'Hacked Service',
        ]);

        $response->assertStatus(404);
    });
});

describe('Merchant Service Delete', function () {
    it('can delete a service', function () {
        $service = Service::factory()->create(['merchant_id' => $this->merchant->id]);

        $response = $this->deleteJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Service deleted successfully',
            ]);

        $this->assertDatabaseMissing('services', [
            'id' => $service->id,
        ]);
    });

    it('cannot delete service belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $service = Service::factory()->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->deleteJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}");

        $response->assertStatus(422);
    });
});

describe('Merchant Service Image', function () {
    it('can upload a service image', function () {
        Storage::fake('media');
        $service = Service::factory()->create(['merchant_id' => $this->merchant->id]);

        $file = UploadedFile::fake()->image('service.jpg', 400, 400);

        $response = $this->postJson(
            "/api/v1/merchants/{$this->merchant->id}/services/{$service->id}/image",
            ['image' => $file]
        );

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => ['image' => ['url', 'thumb', 'preview']],
            ]);
    });

    it('can delete a service image', function () {
        Storage::fake('media');
        $service = Service::factory()->create(['merchant_id' => $this->merchant->id]);

        $file = UploadedFile::fake()->image('service.jpg', 400, 400);
        $service->addMedia($file)->toMediaCollection('image');

        $response = $this->deleteJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}/image");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Service image deleted successfully',
            ]);

        expect($service->refresh()->hasMedia('image'))->toBeFalse();
    });
});
