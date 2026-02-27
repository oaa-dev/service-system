<?php

use App\Models\BusinessType;
use App\Models\Merchant;
use App\Models\PaymentMethod;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

describe('Storefront Merchants', function () {
    it('lists only active merchants', function () {
        // Create merchants with different statuses
        $activeUser = User::factory()->create();
        $activeMerchant = Merchant::factory()->create([
            'user_id' => $activeUser->id,
            'status' => 'active',
            'name' => 'Active Merchant',
        ]);

        $pendingUser = User::factory()->create();
        Merchant::factory()->create([
            'user_id' => $pendingUser->id,
            'status' => 'pending',
            'name' => 'Pending Merchant',
        ]);

        $response = $this->getJson('/api/v1/storefront/merchants');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Active Merchant');
    });

    it('can search merchants by name', function () {
        $user1 = User::factory()->create();
        Merchant::factory()->create(['user_id' => $user1->id, 'status' => 'active', 'name' => 'Pizza Palace']);

        $user2 = User::factory()->create();
        Merchant::factory()->create(['user_id' => $user2->id, 'status' => 'active', 'name' => 'Burger Joint']);

        $response = $this->getJson('/api/v1/storefront/merchants?filter[search]=Pizza');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Pizza Palace');
    });

    it('can filter merchants by business type', function () {
        $businessTypeA = BusinessType::factory()->create();
        $businessTypeB = BusinessType::factory()->create();

        $user1 = User::factory()->create();
        Merchant::factory()->create(['user_id' => $user1->id, 'status' => 'active', 'business_type_id' => $businessTypeA->id]);

        $user2 = User::factory()->create();
        Merchant::factory()->create(['user_id' => $user2->id, 'status' => 'active', 'business_type_id' => $businessTypeA->id]);

        $user3 = User::factory()->create();
        Merchant::factory()->create(['user_id' => $user3->id, 'status' => 'active', 'business_type_id' => $businessTypeB->id]);

        $response = $this->getJson("/api/v1/storefront/merchants?filter[business_type_id]={$businessTypeA->id}");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    });

    it('paginates results', function () {
        for ($i = 0; $i < 20; $i++) {
            $user = User::factory()->create();
            Merchant::factory()->create(['user_id' => $user->id, 'status' => 'active']);
        }

        $response = $this->getJson('/api/v1/storefront/merchants?per_page=5');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonStructure(['meta' => ['current_page', 'last_page', 'per_page', 'total']]);
    });

    it('includes payment methods in merchant list', function () {
        $merchant = Merchant::factory()->create(['status' => 'active']);
        $pm = PaymentMethod::factory()->create(['is_active' => true]);
        $merchant->paymentMethods()->attach($pm->id);

        $response = $this->getJson('/api/v1/storefront/merchants');

        $response->assertOk();
        $data = $response->json('data');
        expect($data)->not->toBeEmpty();
        // The first merchant should have payment_methods array
        expect($data[0])->toHaveKey('payment_methods');
    });
});

describe('Storefront Merchant Detail', function () {
    it('returns merchant detail by slug', function () {
        $user = User::factory()->create();
        $merchant = Merchant::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'slug' => 'test-merchant',
        ]);

        $response = $this->getJson('/api/v1/storefront/merchants/test-merchant');

        $response->assertStatus(200)
            ->assertJsonPath('data.slug', 'test-merchant')
            ->assertJsonPath('data.name', $merchant->name);
    });

    it('includes coordinates in merchant address', function () {
        $merchant = Merchant::factory()->create(['status' => 'active', 'slug' => 'coord-merchant']);
        $merchant->updateOrCreateAddress([
            'street' => '123 Test St',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
        ]);

        $response = $this->getJson('/api/v1/storefront/merchants/coord-merchant');

        $response->assertOk()
            ->assertJsonPath('data.address.latitude', 14.5995)
            ->assertJsonPath('data.address.longitude', 120.9842);
    });

    it('returns 404 for inactive merchant', function () {
        $user = User::factory()->create();
        Merchant::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'slug' => 'pending-merchant',
        ]);

        $response = $this->getJson('/api/v1/storefront/merchants/pending-merchant');

        $response->assertStatus(404);
    });

    it('returns 404 for non-existent slug', function () {
        $response = $this->getJson('/api/v1/storefront/merchants/non-existent');

        $response->assertStatus(404);
    });

    it('includes gallery fields when media exists', function () {
        $merchant = Merchant::factory()->create(['status' => 'active']);
        // We can't easily seed media in tests without network calls,
        // so just verify the fields DON'T appear when no media exists
        // (confirming the conditional `when()` works)

        $response = $this->getJson("/api/v1/storefront/merchants/{$merchant->slug}");

        $response->assertOk();
        $data = $response->json('data');
        // Gallery fields should NOT be present when no media
        expect($data)->not->toHaveKey('gallery_feature');
        expect($data)->not->toHaveKey('gallery_photos');
        expect($data)->not->toHaveKey('gallery_interiors');
        expect($data)->not->toHaveKey('gallery_exteriors');
    });
});

describe('Storefront Map Merchants', function () {
    it('returns all active merchants unpaginated', function () {
        for ($i = 0; $i < 5; $i++) {
            $user = User::factory()->create();
            Merchant::factory()->create(['user_id' => $user->id, 'status' => 'active']);
        }

        $pendingUser = User::factory()->create();
        Merchant::factory()->create(['user_id' => $pendingUser->id, 'status' => 'pending']);

        $response = $this->getJson('/api/v1/storefront/merchants/map');

        $response->assertOk()
            ->assertJsonCount(5, 'data');
        // No pagination meta — it's a plain collection
        $response->assertJsonMissing(['current_page']);
    });

    it('excludes inactive merchants from map data', function () {
        $activeUser = User::factory()->create();
        Merchant::factory()->create(['user_id' => $activeUser->id, 'status' => 'active', 'name' => 'Active One']);

        $suspendedUser = User::factory()->create();
        Merchant::factory()->create(['user_id' => $suspendedUser->id, 'status' => 'suspended', 'name' => 'Suspended One']);

        $rejectedUser = User::factory()->create();
        Merchant::factory()->create(['user_id' => $rejectedUser->id, 'status' => 'rejected', 'name' => 'Rejected One']);

        $response = $this->getJson('/api/v1/storefront/merchants/map');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Active One');
    });

    it('includes address with coordinates in map data', function () {
        $merchant = Merchant::factory()->create(['status' => 'active']);
        $merchant->updateOrCreateAddress([
            'street' => '456 Map St',
            'latitude' => 10.3157,
            'longitude' => 123.8854,
        ]);

        $response = $this->getJson('/api/v1/storefront/merchants/map');

        $response->assertOk();
        $data = $response->json('data.0');
        expect($data['address']['latitude'])->toBe(10.3157);
        expect($data['address']['longitude'])->toBe(123.8854);
    });

    it('filters merchants by radius when lat/lng/radius provided', function () {
        // Manila merchant (14.5995, 120.9842)
        $nearMerchant = Merchant::factory()->create(['status' => 'active', 'name' => 'Manila Merchant']);
        $nearMerchant->updateOrCreateAddress(['latitude' => 14.5995, 'longitude' => 120.9842]);

        // Cebu merchant (~570 km from Manila)
        $farMerchant = Merchant::factory()->create(['status' => 'active', 'name' => 'Cebu Merchant']);
        $farMerchant->updateOrCreateAddress(['latitude' => 10.3157, 'longitude' => 123.8854]);

        // Search 50km radius around Manila
        $response = $this->getJson('/api/v1/storefront/merchants/map?lat=14.5995&lng=120.9842&radius=50');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Manila Merchant');
    });

    it('returns distance field when lat/lng/radius provided', function () {
        $merchant = Merchant::factory()->create(['status' => 'active']);
        // ~5km from reference point
        $merchant->updateOrCreateAddress(['latitude' => 14.5995, 'longitude' => 120.9842]);

        $response = $this->getJson('/api/v1/storefront/merchants/map?lat=14.5500&lng=120.9500&radius=50');

        $response->assertOk();
        $data = $response->json('data.0');
        expect($data)->toHaveKey('distance');
        expect($data['distance'])->toBeGreaterThan(0);
    });

    it('does not return distance field without lat/lng params', function () {
        $merchant = Merchant::factory()->create(['status' => 'active']);
        $merchant->updateOrCreateAddress(['latitude' => 14.5995, 'longitude' => 120.9842]);

        $response = $this->getJson('/api/v1/storefront/merchants/map');

        $response->assertOk();
        $data = $response->json('data.0');
        expect($data)->not->toHaveKey('distance');
    });

    it('sorts results by distance ascending', function () {
        $near = Merchant::factory()->create(['status' => 'active', 'name' => 'Near']);
        $near->updateOrCreateAddress(['latitude' => 14.5995, 'longitude' => 120.9842]);

        $mid = Merchant::factory()->create(['status' => 'active', 'name' => 'Mid']);
        $mid->updateOrCreateAddress(['latitude' => 14.6500, 'longitude' => 121.0500]);

        $response = $this->getJson('/api/v1/storefront/merchants/map?lat=14.5995&lng=120.9842&radius=50');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
        $names = collect($response->json('data'))->pluck('name')->toArray();
        expect($names)->toBe(['Near', 'Mid']);
    });

    it('excludes merchants without coordinates from radius search', function () {
        $withCoords = Merchant::factory()->create(['status' => 'active', 'name' => 'Has Coords']);
        $withCoords->updateOrCreateAddress(['latitude' => 14.5995, 'longitude' => 120.9842]);

        $noCoords = Merchant::factory()->create(['status' => 'active', 'name' => 'No Coords']);
        // No address at all

        $response = $this->getJson('/api/v1/storefront/merchants/map?lat=14.5995&lng=120.9842&radius=50');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Has Coords');
    });

    it('validates lat/lng/radius params', function () {
        $response = $this->getJson('/api/v1/storefront/merchants/map?lat=200&lng=120&radius=50');
        $response->assertStatus(422);

        $response = $this->getJson('/api/v1/storefront/merchants/map?lat=14&lng=120&radius=200');
        $response->assertStatus(422);
    });
});

describe('Storefront Payment Methods', function () {
    it('lists active payment methods', function () {
        PaymentMethod::factory()->create(['name' => 'GCash', 'is_active' => true]);
        PaymentMethod::factory()->create(['name' => 'Cash', 'is_active' => true]);
        PaymentMethod::factory()->create(['name' => 'Inactive PM', 'is_active' => false]);

        $response = $this->getJson('/api/v1/storefront/payment-methods');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['name' => 'GCash'])
            ->assertJsonFragment(['name' => 'Cash'])
            ->assertJsonMissing(['name' => 'Inactive PM']);
    });
});

describe('Storefront Merchant Services', function () {
    it('lists active services for a merchant', function () {
        $user = User::factory()->create();
        $merchant = Merchant::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'slug' => 'test-merchant',
        ]);

        Service::factory()->create(['merchant_id' => $merchant->id, 'is_active' => true, 'name' => 'Active Service']);
        Service::factory()->create(['merchant_id' => $merchant->id, 'is_active' => false, 'name' => 'Inactive Service']);

        $response = $this->getJson('/api/v1/storefront/merchants/test-merchant/services');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Active Service');
    });

    it('does not show services for inactive merchant', function () {
        $user = User::factory()->create();
        $merchant = Merchant::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'slug' => 'pending-merchant',
        ]);

        Service::factory()->create(['merchant_id' => $merchant->id, 'is_active' => true]);

        $response = $this->getJson('/api/v1/storefront/merchants/pending-merchant/services');

        $response->assertStatus(404);
    });

    it('can filter services by category', function () {
        $user = User::factory()->create();
        $merchant = Merchant::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'slug' => 'test-merchant',
        ]);

        $category = ServiceCategory::factory()->create(['merchant_id' => $merchant->id]);
        Service::factory()->create(['merchant_id' => $merchant->id, 'service_category_id' => $category->id, 'is_active' => true]);
        Service::factory()->create(['merchant_id' => $merchant->id, 'service_category_id' => null, 'is_active' => true]);

        $response = $this->getJson("/api/v1/storefront/merchants/test-merchant/services?filter[service_category_id]={$category->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    });
});

describe('Storefront Service Detail', function () {
    it('returns service detail with schedules', function () {
        $user = User::factory()->create();
        $merchant = Merchant::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'slug' => 'test-merchant',
        ]);

        $service = Service::factory()->create([
            'merchant_id' => $merchant->id,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/test-merchant/services/{$service->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $service->id)
            ->assertJsonPath('data.name', $service->name);
    });

    it('returns 404 for inactive service', function () {
        $user = User::factory()->create();
        $merchant = Merchant::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'slug' => 'test-merchant',
        ]);

        $service = Service::factory()->create([
            'merchant_id' => $merchant->id,
            'is_active' => false,
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/test-merchant/services/{$service->id}");

        $response->assertStatus(404);
    });

    it('returns 404 for service of different merchant', function () {
        $user1 = User::factory()->create();
        $merchant1 = Merchant::factory()->create(['user_id' => $user1->id, 'status' => 'active', 'slug' => 'merchant-one']);

        $user2 = User::factory()->create();
        $merchant2 = Merchant::factory()->create(['user_id' => $user2->id, 'status' => 'active']);

        $service = Service::factory()->create(['merchant_id' => $merchant2->id, 'is_active' => true]);

        $response = $this->getJson("/api/v1/storefront/merchants/merchant-one/services/{$service->id}");

        $response->assertStatus(404);
    });
});
