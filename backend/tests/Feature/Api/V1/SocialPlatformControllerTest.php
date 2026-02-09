<?php

use App\Models\SocialPlatform;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Social Platform Index', function () {
    it('can list all social platforms', function () {
        SocialPlatform::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/social-platforms');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'base_url', 'is_active', 'sort_order', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter social platforms by name', function () {
        SocialPlatform::factory()->create(['name' => 'Facebook']);
        SocialPlatform::factory()->create(['name' => 'Instagram']);

        $response = $this->getJson('/api/v1/social-platforms?filter[name]=Facebook');

        $response->assertStatus(200);
        $data = $response->json('data');
        $filtered = collect($data)->filter(fn ($sp) => str_contains($sp['name'], 'Facebook'));
        expect($filtered)->toHaveCount(1);
    });

    it('can paginate social platforms', function () {
        SocialPlatform::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/social-platforms?per_page=5');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });
});

describe('Social Platform Active', function () {
    it('can list active social platforms', function () {
        SocialPlatform::factory()->count(3)->create(['is_active' => true]);
        SocialPlatform::factory()->count(2)->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/social-platforms/active');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        expect(count($data))->toBe(3);
    });

    it('is accessible without authentication', function () {
        $this->app['auth']->forgetGuards();

        SocialPlatform::factory()->create(['is_active' => true]);

        $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/social-platforms/active');

        $response->assertStatus(200);
    });
});

describe('Social Platform Store', function () {
    it('can create a social platform', function () {
        $response = $this->postJson('/api/v1/social-platforms', [
            'name' => 'Pinterest',
            'base_url' => 'https://pinterest.com/',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Social platform created successfully',
                'data' => [
                    'name' => 'Pinterest',
                    'slug' => 'pinterest',
                    'base_url' => 'https://pinterest.com/',
                ],
            ]);

        $this->assertDatabaseHas('social_platforms', [
            'name' => 'Pinterest',
            'slug' => 'pinterest',
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/social-platforms', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates name uniqueness', function () {
        SocialPlatform::factory()->create(['name' => 'Facebook']);

        $response = $this->postJson('/api/v1/social-platforms', [
            'name' => 'Facebook',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates base_url format', function () {
        $response = $this->postJson('/api/v1/social-platforms', [
            'name' => 'Test Platform',
            'base_url' => 'not-a-url',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['base_url']);
    });
});

describe('Social Platform Show', function () {
    it('can show a specific social platform', function () {
        $socialPlatform = SocialPlatform::factory()->create();

        $response = $this->getJson("/api/v1/social-platforms/{$socialPlatform->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $socialPlatform->id,
                    'name' => $socialPlatform->name,
                ],
            ]);
    });

    it('returns 404 for non-existent social platform', function () {
        $response = $this->getJson('/api/v1/social-platforms/99999');

        $response->assertStatus(404);
    });
});

describe('Social Platform Update', function () {
    it('can update a social platform', function () {
        $socialPlatform = SocialPlatform::factory()->create();

        $response = $this->putJson("/api/v1/social-platforms/{$socialPlatform->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Name',
                ],
            ]);

        $this->assertDatabaseHas('social_platforms', [
            'id' => $socialPlatform->id,
            'name' => 'Updated Name',
        ]);
    });

    it('validates name uniqueness on update', function () {
        $sp1 = SocialPlatform::factory()->create(['name' => 'Facebook']);
        $sp2 = SocialPlatform::factory()->create(['name' => 'Instagram']);

        $response = $this->putJson("/api/v1/social-platforms/{$sp1->id}", [
            'name' => 'Instagram',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});

describe('Social Platform Delete', function () {
    it('can delete a social platform', function () {
        $socialPlatform = SocialPlatform::factory()->create();

        $response = $this->deleteJson("/api/v1/social-platforms/{$socialPlatform->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Social platform deleted successfully',
            ]);

        $this->assertDatabaseMissing('social_platforms', [
            'id' => $socialPlatform->id,
        ]);
    });

    it('returns error for non-existent social platform', function () {
        $response = $this->deleteJson('/api/v1/social-platforms/99999');

        $response->assertStatus(422);
    });
});
