<?php

use App\Models\Customer;
use App\Models\Merchant;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->assignRole('customer');
    $this->customer = Customer::factory()->create(['user_id' => $this->user->id]);
    Passport::actingAs($this->user);

    $merchantUser = User::factory()->create();
    $merchantUser->assignRole('merchant');
    $this->merchant = Merchant::factory()->create([
        'user_id' => $merchantUser->id,
        'status' => 'active',
    ]);
});

describe('Toggle Favorite Merchant', function () {
    it('can favorite a merchant', function () {
        $response = $this->postJson("/api/v1/customer/my/favorite-merchants/{$this->merchant->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['is_favorited' => true],
            ]);

        expect($this->customer->favoriteMerchants()->where('merchant_id', $this->merchant->id)->exists())->toBeTrue();
    });

    it('can unfavorite a merchant by toggling again', function () {
        $this->customer->favoriteMerchants()->attach($this->merchant->id);

        $response = $this->postJson("/api/v1/customer/my/favorite-merchants/{$this->merchant->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['is_favorited' => false],
            ]);

        expect($this->customer->favoriteMerchants()->where('merchant_id', $this->merchant->id)->exists())->toBeFalse();
    });

    it('returns 404 for non-existent merchant', function () {
        $response = $this->postJson('/api/v1/customer/my/favorite-merchants/99999');

        $response->assertStatus(404);
    });

    it('returns 404 for inactive merchant', function () {
        $inactiveMerchantUser = User::factory()->create();
        $inactiveMerchant = Merchant::factory()->create([
            'user_id' => $inactiveMerchantUser->id,
            'status' => 'pending',
        ]);

        $response = $this->postJson("/api/v1/customer/my/favorite-merchants/{$inactiveMerchant->id}");

        $response->assertStatus(404);
    });

    it('requires authentication', function () {
        app('auth')->forgetGuards();

        $response = $this->postJson("/api/v1/customer/my/favorite-merchants/{$this->merchant->id}");

        $response->assertStatus(401);
    });
});

describe('My Favorite Merchants', function () {
    it('lists favorited merchants', function () {
        $merchant2User = User::factory()->create();
        $merchant2 = Merchant::factory()->create([
            'user_id' => $merchant2User->id,
            'status' => 'active',
        ]);

        $this->customer->favoriteMerchants()->attach([$this->merchant->id, $merchant2->id]);

        $response = $this->getJson('/api/v1/customer/my/favorite-merchants');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'data');
    });

    it('only lists active merchants', function () {
        $inactiveMerchantUser = User::factory()->create();
        $inactiveMerchant = Merchant::factory()->create([
            'user_id' => $inactiveMerchantUser->id,
            'status' => 'suspended',
        ]);

        $this->customer->favoriteMerchants()->attach([$this->merchant->id, $inactiveMerchant->id]);

        $response = $this->getJson('/api/v1/customer/my/favorite-merchants');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->merchant->id);
    });

    it('returns empty list when no favorites', function () {
        $response = $this->getJson('/api/v1/customer/my/favorite-merchants');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(0, 'data');
    });

    it('can search favorites by name', function () {
        $merchant2User = User::factory()->create();
        $merchant2 = Merchant::factory()->create([
            'user_id' => $merchant2User->id,
            'status' => 'active',
            'name' => 'Coffee Shop',
        ]);
        $this->merchant->update(['name' => 'Pizza Place']);

        $this->customer->favoriteMerchants()->attach([$this->merchant->id, $merchant2->id]);

        $response = $this->getJson('/api/v1/customer/my/favorite-merchants?filter[search]=Coffee');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Coffee Shop');
    });

    it('paginates results', function () {
        for ($i = 0; $i < 20; $i++) {
            $user = User::factory()->create();
            $merchant = Merchant::factory()->create(['user_id' => $user->id, 'status' => 'active']);
            $this->customer->favoriteMerchants()->attach($merchant->id);
        }

        $response = $this->getJson('/api/v1/customer/my/favorite-merchants?per_page=5');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonStructure(['meta' => ['current_page', 'last_page', 'per_page', 'total']]);
    });

    it('requires authentication', function () {
        app('auth')->forgetGuards();

        $response = $this->getJson('/api/v1/customer/my/favorite-merchants');

        $response->assertStatus(401);
    });
});

describe('Storefront is_favorited Field', function () {
    it('includes is_favorited in merchant list when authenticated', function () {
        $this->customer->favoriteMerchants()->attach($this->merchant->id);

        $response = $this->getJson('/api/v1/storefront/merchants');

        $response->assertStatus(200);
        $data = $response->json('data');
        $merchantData = collect($data)->firstWhere('id', $this->merchant->id);
        expect($merchantData['is_favorited'])->toBeTrue();
    });

    it('returns is_favorited false for non-favorited merchant', function () {
        $response = $this->getJson('/api/v1/storefront/merchants');

        $response->assertStatus(200);
        $data = $response->json('data');
        $merchantData = collect($data)->firstWhere('id', $this->merchant->id);
        expect($merchantData['is_favorited'])->toBeFalse();
    });

    it('includes is_favorited in merchant detail when authenticated', function () {
        $this->customer->favoriteMerchants()->attach($this->merchant->id);

        $response = $this->getJson("/api/v1/storefront/merchants/{$this->merchant->slug}");

        $response->assertStatus(200)
            ->assertJsonPath('data.is_favorited', true);
    });

    it('does not include is_favorited when unauthenticated', function () {
        app('auth')->forgetGuards();

        $response = $this->getJson('/api/v1/storefront/merchants');

        $response->assertStatus(200);
        $data = $response->json('data');
        if (count($data) > 0) {
            expect($data[0])->not->toHaveKey('is_favorited');
        }
    });

    it('does not include is_favorited for non-customer user', function () {
        $adminUser = User::factory()->create();
        $adminUser->assignRole('admin');
        Passport::actingAs($adminUser);

        $response = $this->getJson('/api/v1/storefront/merchants');

        $response->assertStatus(200);
        $data = $response->json('data');
        if (count($data) > 0) {
            expect($data[0])->not->toHaveKey('is_favorited');
        }
    });
});
