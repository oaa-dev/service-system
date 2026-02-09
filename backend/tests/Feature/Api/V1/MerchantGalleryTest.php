<?php

use App\Models\Merchant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Get Gallery', function () {
    it('returns empty gallery for new merchant', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->getJson("/api/v1/merchants/{$merchant->id}/gallery");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'gallery_photos' => [],
                    'gallery_interiors' => [],
                    'gallery_exteriors' => [],
                    'gallery_feature' => null,
                ],
            ]);
    });

    it('returns gallery with images', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();

        $merchant->addMedia(UploadedFile::fake()->image('photo.jpg', 400, 400))
            ->toMediaCollection('gallery_photos');

        $response = $this->getJson("/api/v1/merchants/{$merchant->id}/gallery");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        expect($data['gallery_photos'])->toHaveCount(1);
        expect($data['gallery_photos'][0])->toHaveKeys(['id', 'url', 'thumb', 'preview', 'name', 'size', 'mime_type', 'created_at']);
    });
});

describe('Upload Gallery Image', function () {
    it('can upload to photos collection', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/gallery/photos", [
            'image' => UploadedFile::fake()->image('photo.jpg', 400, 400),
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Gallery image uploaded successfully',
            ])
            ->assertJsonStructure([
                'data' => ['id', 'url', 'thumb', 'preview', 'name', 'size', 'mime_type', 'created_at'],
            ]);

        expect($merchant->fresh()->getMedia('gallery_photos'))->toHaveCount(1);
    });

    it('can upload to interiors collection', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/gallery/interiors", [
            'image' => UploadedFile::fake()->image('interior.jpg', 400, 400),
        ]);

        $response->assertStatus(201);
        expect($merchant->fresh()->getMedia('gallery_interiors'))->toHaveCount(1);
    });

    it('can upload to exteriors collection', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/gallery/exteriors", [
            'image' => UploadedFile::fake()->image('exterior.jpg', 400, 400),
        ]);

        $response->assertStatus(201);
        expect($merchant->fresh()->getMedia('gallery_exteriors'))->toHaveCount(1);
    });

    it('can upload to feature collection', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/gallery/feature", [
            'image' => UploadedFile::fake()->image('feature.jpg', 400, 400),
        ]);

        $response->assertStatus(201);
        expect($merchant->fresh()->getMedia('gallery_feature'))->toHaveCount(1);
    });

    it('feature image replaces existing one', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();

        $this->postJson("/api/v1/merchants/{$merchant->id}/gallery/feature", [
            'image' => UploadedFile::fake()->image('feature1.jpg', 400, 400),
        ]);

        $this->postJson("/api/v1/merchants/{$merchant->id}/gallery/feature", [
            'image' => UploadedFile::fake()->image('feature2.jpg', 400, 400),
        ]);

        expect($merchant->fresh()->getMedia('gallery_feature'))->toHaveCount(1);
    });

    it('rejects invalid collection name', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/gallery/invalid", [
            'image' => UploadedFile::fake()->image('photo.jpg', 400, 400),
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid collection. Must be one of: photos, interiors, exteriors, feature',
            ]);
    });

    it('validates image is required', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/gallery/photos", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    });

    it('validates file type', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/gallery/photos", [
            'image' => UploadedFile::fake()->create('document.pdf', 1024, 'application/pdf'),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    });
});

describe('Delete Gallery Image', function () {
    it('can delete a gallery image', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();

        $media = $merchant->addMedia(UploadedFile::fake()->image('photo.jpg', 400, 400))
            ->toMediaCollection('gallery_photos');

        $response = $this->deleteJson("/api/v1/merchants/{$merchant->id}/gallery/{$media->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Gallery image deleted successfully',
            ]);

        expect($merchant->fresh()->getMedia('gallery_photos'))->toHaveCount(0);
    });

    it('returns 404 for non-existent media', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->deleteJson("/api/v1/merchants/{$merchant->id}/gallery/99999");

        $response->assertStatus(404);
    });

    it('cannot delete logo via gallery endpoint', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();

        $media = $merchant->addMedia(UploadedFile::fake()->image('logo.jpg', 400, 400))
            ->toMediaCollection('logo');

        $response = $this->deleteJson("/api/v1/merchants/{$merchant->id}/gallery/{$media->id}");

        $response->assertStatus(404);
        expect($merchant->fresh()->hasMedia('logo'))->toBeTrue();
    });
});
