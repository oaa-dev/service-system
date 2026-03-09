<?php

use App\Models\Advertisement;
use App\Models\Merchant;
use App\Models\User;
use Laravel\Passport\Passport;

/*
|--------------------------------------------------------------------------
| Advertisement CRUD (Admin)
|--------------------------------------------------------------------------
*/
describe('index', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('super-admin');
        Passport::actingAs($this->user);
    });

    it('lists advertisements', function () {
        Advertisement::factory()->count(3)->create(['created_by' => $this->user->id]);

        $response = $this->getJson('/api/v1/advertisements');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    });

    it('filters by type', function () {
        Advertisement::factory()->banner()->create(['created_by' => $this->user->id]);
        Advertisement::factory()->popup()->create(['created_by' => $this->user->id]);

        $response = $this->getJson('/api/v1/advertisements?filter[type]=banner');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'banner');
    });

    it('filters by placement', function () {
        Advertisement::factory()->create([
            'created_by' => $this->user->id,
            'placement' => 'homepage_hero',
        ]);
        Advertisement::factory()->create([
            'created_by' => $this->user->id,
            'placement' => 'merchant_listing',
        ]);

        $response = $this->getJson('/api/v1/advertisements?filter[placement]=homepage_hero');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.placement', 'homepage_hero');
    });

    it('filters by target_audience', function () {
        Advertisement::factory()->create([
            'created_by' => $this->user->id,
            'target_audience' => 'customer',
        ]);
        Advertisement::factory()->create([
            'created_by' => $this->user->id,
            'target_audience' => 'merchant',
        ]);

        $response = $this->getJson('/api/v1/advertisements?filter[target_audience]=customer');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.target_audience', 'customer');
    });

    it('filters by is_active', function () {
        Advertisement::factory()->create(['created_by' => $this->user->id, 'is_active' => true]);
        Advertisement::factory()->inactive()->create(['created_by' => $this->user->id]);

        $response = $this->getJson('/api/v1/advertisements?filter[is_active]=1');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    });

    it('paginates results', function () {
        Advertisement::factory()->count(20)->create(['created_by' => $this->user->id]);

        $response = $this->getJson('/api/v1/advertisements?per_page=5');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 20)
            ->assertJsonPath('meta.per_page', 5);
    });
});

describe('store', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('super-admin');
        Passport::actingAs($this->user);
    });

    it('creates an advertisement', function () {
        $response = $this->postJson('/api/v1/advertisements', [
            'title' => 'Summer Sale Banner',
            'description' => 'Big summer discounts',
            'type' => 'banner',
            'placement' => 'homepage_hero',
            'target_audience' => 'all',
            'starts_at' => now()->toDateTimeString(),
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Summer Sale Banner')
            ->assertJsonPath('data.type', 'banner')
            ->assertJsonPath('data.placement', 'homepage_hero');

        $this->assertDatabaseHas('advertisements', [
            'title' => 'Summer Sale Banner',
            'type' => 'banner',
        ]);
    });

    it('auto-sets created_by to authenticated user', function () {
        $response = $this->postJson('/api/v1/advertisements', [
            'title' => 'Auto Creator Test',
            'type' => 'banner',
            'placement' => 'homepage_hero',
            'target_audience' => 'all',
            'starts_at' => now()->toDateTimeString(),
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('advertisements', [
            'title' => 'Auto Creator Test',
            'created_by' => $this->user->id,
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/advertisements', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'type', 'placement', 'target_audience', 'starts_at']);
    });

    it('validates type enum', function () {
        $response = $this->postJson('/api/v1/advertisements', [
            'title' => 'Test',
            'type' => 'invalid_type',
            'placement' => 'homepage_hero',
            'target_audience' => 'all',
            'starts_at' => now()->toDateTimeString(),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    });

    it('validates placement enum', function () {
        $response = $this->postJson('/api/v1/advertisements', [
            'title' => 'Test',
            'type' => 'banner',
            'placement' => 'invalid_placement',
            'target_audience' => 'all',
            'starts_at' => now()->toDateTimeString(),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['placement']);
    });

    it('validates target_audience enum', function () {
        $response = $this->postJson('/api/v1/advertisements', [
            'title' => 'Test',
            'type' => 'banner',
            'placement' => 'homepage_hero',
            'target_audience' => 'invalid_audience',
            'starts_at' => now()->toDateTimeString(),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['target_audience']);
    });

    it('allows nullable merchant_id', function () {
        $response = $this->postJson('/api/v1/advertisements', [
            'title' => 'No Merchant Ad',
            'type' => 'banner',
            'placement' => 'homepage_hero',
            'target_audience' => 'all',
            'starts_at' => now()->toDateTimeString(),
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.merchant_id', null);
    });

    it('validates merchant_id exists', function () {
        $response = $this->postJson('/api/v1/advertisements', [
            'title' => 'Test',
            'type' => 'banner',
            'placement' => 'homepage_hero',
            'target_audience' => 'all',
            'starts_at' => now()->toDateTimeString(),
            'merchant_id' => 99999,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['merchant_id']);
    });
});

describe('show', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('super-admin');
        Passport::actingAs($this->user);
    });

    it('retrieves an advertisement with relations', function () {
        $merchant = Merchant::factory()->create();
        $ad = Advertisement::factory()->create([
            'created_by' => $this->user->id,
            'merchant_id' => $merchant->id,
        ]);

        $response = $this->getJson("/api/v1/advertisements/{$ad->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $ad->id)
            ->assertJsonPath('data.title', $ad->title)
            ->assertJsonPath('data.merchant.id', $merchant->id);
    });
});

describe('update', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('super-admin');
        Passport::actingAs($this->user);
    });

    it('updates an advertisement', function () {
        $ad = Advertisement::factory()->create(['created_by' => $this->user->id]);

        $response = $this->putJson("/api/v1/advertisements/{$ad->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Updated Title');

        $this->assertDatabaseHas('advertisements', [
            'id' => $ad->id,
            'title' => 'Updated Title',
        ]);
    });

    it('validates enum fields on update', function () {
        $ad = Advertisement::factory()->create(['created_by' => $this->user->id]);

        $response = $this->putJson("/api/v1/advertisements/{$ad->id}", [
            'type' => 'invalid_type',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    });
});

describe('destroy', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('super-admin');
        Passport::actingAs($this->user);
    });

    it('deletes an advertisement', function () {
        $ad = Advertisement::factory()->create(['created_by' => $this->user->id]);

        $response = $this->deleteJson("/api/v1/advertisements/{$ad->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('advertisements', ['id' => $ad->id]);
    });

    it('returns 422 for non-existent advertisement', function () {
        $response = $this->deleteJson('/api/v1/advertisements/99999');

        $response->assertStatus(422);
    });
});

/*
|--------------------------------------------------------------------------
| Storefront (Public) Advertisements
|--------------------------------------------------------------------------
*/
describe('storefront', function () {
    it('returns only active and valid advertisements', function () {
        $user = User::factory()->create();

        // Active + valid (starts_at in past, no expiry)
        Advertisement::factory()->create([
            'created_by' => $user->id,
            'is_active' => true,
            'starts_at' => now()->subDay(),
            'expires_at' => null,
            'placement' => 'homepage_hero',
            'target_audience' => 'all',
        ]);

        // Inactive
        Advertisement::factory()->inactive()->create([
            'created_by' => $user->id,
            'starts_at' => now()->subDay(),
            'placement' => 'homepage_hero',
        ]);

        // Expired
        Advertisement::factory()->expired()->create([
            'created_by' => $user->id,
            'placement' => 'homepage_hero',
        ]);

        $response = $this->getJson('/api/v1/storefront/advertisements?placement=homepage_hero');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    });

    it('filters by placement', function () {
        $user = User::factory()->create();

        Advertisement::factory()->create([
            'created_by' => $user->id,
            'placement' => 'homepage_hero',
            'starts_at' => now()->subDay(),
        ]);
        Advertisement::factory()->create([
            'created_by' => $user->id,
            'placement' => 'merchant_listing',
            'starts_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/storefront/advertisements?placement=homepage_hero');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    });

    it('filters by audience', function () {
        $user = User::factory()->create();

        Advertisement::factory()->create([
            'created_by' => $user->id,
            'target_audience' => 'customer',
            'placement' => 'homepage_hero',
            'starts_at' => now()->subDay(),
        ]);
        Advertisement::factory()->create([
            'created_by' => $user->id,
            'target_audience' => 'merchant',
            'placement' => 'homepage_hero',
            'starts_at' => now()->subDay(),
        ]);
        Advertisement::factory()->create([
            'created_by' => $user->id,
            'target_audience' => 'all',
            'placement' => 'homepage_hero',
            'starts_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/storefront/advertisements?placement=homepage_hero&audience=customer');

        // Should return customer + all (forAudience scope includes 'all')
        $response->assertOk()
            ->assertJsonCount(2, 'data');
    });

    it('excludes expired advertisements', function () {
        $user = User::factory()->create();

        Advertisement::factory()->expired()->create([
            'created_by' => $user->id,
            'placement' => 'homepage_hero',
        ]);

        $response = $this->getJson('/api/v1/storefront/advertisements?placement=homepage_hero');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    });

    it('does not require authentication', function () {
        // No Passport::actingAs - completely unauthenticated
        $user = User::factory()->create();

        Advertisement::factory()->create([
            'created_by' => $user->id,
            'placement' => 'homepage_hero',
            'starts_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/storefront/advertisements?placement=homepage_hero');

        $response->assertOk();
    });
});

/*
|--------------------------------------------------------------------------
| Authorization
|--------------------------------------------------------------------------
*/
describe('authorization', function () {
    it('returns 403 without permission', function () {
        $user = User::factory()->create();
        $user->assignRole('user');
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/advertisements');

        $response->assertStatus(403);
    });

    it('returns 401 without authentication', function () {
        // No Passport::actingAs
        $response = $this->getJson('/api/v1/advertisements');

        $response->assertStatus(401);
    });
});

/*
|--------------------------------------------------------------------------
| Tracking (Public)
|--------------------------------------------------------------------------
*/
describe('tracking', function () {
    it('increments impressions', function () {
        $user = User::factory()->create();
        $ad = Advertisement::factory()->create([
            'created_by' => $user->id,
            'impressions' => 0,
        ]);

        $response = $this->postJson("/api/v1/advertisements/{$ad->id}/impression");

        $response->assertStatus(204);

        $this->assertDatabaseHas('advertisements', [
            'id' => $ad->id,
            'impressions' => 1,
        ]);
    });

    it('increments clicks', function () {
        $user = User::factory()->create();
        $ad = Advertisement::factory()->create([
            'created_by' => $user->id,
            'clicks' => 0,
        ]);

        $response = $this->postJson("/api/v1/advertisements/{$ad->id}/click");

        $response->assertStatus(204);

        $this->assertDatabaseHas('advertisements', [
            'id' => $ad->id,
            'clicks' => 1,
        ]);
    });

    it('tracking does not require authentication', function () {
        // No Passport::actingAs
        $user = User::factory()->create();
        $ad = Advertisement::factory()->create([
            'created_by' => $user->id,
            'impressions' => 0,
        ]);

        $response = $this->postJson("/api/v1/advertisements/{$ad->id}/impression");

        $response->assertStatus(204);
    });
});
