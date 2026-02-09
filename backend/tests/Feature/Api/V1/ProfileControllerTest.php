<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;

describe('Profile Show', function () {
    it('can get authenticated user profile', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/profile');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'bio',
                    'phone',
                    'address',
                    'date_of_birth',
                    'gender',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Profile retrieved successfully',
            ]);
    });

    it('returns null address when no address exists', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/profile');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'address' => null,
                ],
            ]);
    });

    it('returns nested address structure when address exists', function () {
        $user = User::factory()->create();
        $user->profile->updateOrCreateAddress([
            'street' => '123 Main St',
            'postal_code' => '10001',
        ]);
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/profile');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'address' => [
                        'street' => '123 Main St',
                        'postal_code' => '10001',
                    ],
                ],
            ]);
    });

    it('returns unauthorized when not authenticated', function () {
        $response = $this->getJson('/api/v1/profile');

        $response->assertStatus(401);
    });

    it('auto-creates profile when user is created', function () {
        $user = User::factory()->create();

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
        ]);
    });
});

describe('Profile Update', function () {
    it('can update profile with valid data including nested address', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'bio' => 'Updated bio',
            'phone' => '+1234567890',
            'address' => [
                'street' => '123 Main Street',
                'postal_code' => '10001',
            ],
            'date_of_birth' => '1990-01-15',
            'gender' => 'male',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'bio' => 'Updated bio',
                    'phone' => '+1234567890',
                    'address' => [
                        'street' => '123 Main Street',
                        'postal_code' => '10001',
                    ],
                    'date_of_birth' => '1990-01-15',
                    'gender' => 'male',
                ],
            ]);

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'bio' => 'Updated bio',
            'phone' => '+1234567890',
            'gender' => 'male',
        ]);

        $this->assertDatabaseHas('addresses', [
            'addressable_type' => 'App\\Models\\UserProfile',
            'addressable_id' => $user->profile->id,
            'street' => '123 Main Street',
            'postal_code' => '10001',
        ]);
    });

    it('can update profile with partial data', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'bio' => 'Just updating the bio',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'bio' => 'Just updating the bio',
                ],
            ]);
    });

    it('can update address partially without losing other address fields', function () {
        $user = User::factory()->create();
        $user->profile->updateOrCreateAddress([
            'street' => '123 Main St',
            'postal_code' => '10001',
        ]);
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'address' => [
                'street' => '456 Oak Ave',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'address' => [
                        'street' => '456 Oak Ave',
                        'postal_code' => '10001',
                    ],
                ],
            ]);
    });

    it('can set nullable fields to null', function () {
        $user = User::factory()->create();
        $user->profile->update(['bio' => 'Initial bio', 'phone' => '1234567890']);
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'bio' => null,
            'phone' => null,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'bio' => null,
                    'phone' => null,
                ],
            ]);
    });

    it('returns unauthorized when not authenticated', function () {
        $response = $this->putJson('/api/v1/profile', [
            'bio' => 'Updated bio',
        ]);

        $response->assertStatus(401);
    });

    it('validates bio max length', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'bio' => str_repeat('a', 1001),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['bio']);
    });

    it('validates phone max length', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'phone' => str_repeat('1', 21),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    });

    it('validates gender enum values', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'gender' => 'invalid',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['gender']);
    });

    it('validates date_of_birth is before today', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'date_of_birth' => now()->addDay()->format('Y-m-d'),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_of_birth']);
    });

    it('validates date_of_birth is a valid date', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'date_of_birth' => 'not-a-date',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_of_birth']);
    });

    it('validates address must be an array', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'address' => 'not an array',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['address']);
    });

    it('validates address.street max length', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'address' => [
                'street' => str_repeat('a', 256),
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['address.street']);
    });

    it('validates address.region_id exists', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'address' => [
                'region_id' => 99999,
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['address.region_id']);
    });

    it('validates address.postal_code max length', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile', [
            'address' => [
                'postal_code' => str_repeat('1', 21),
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['address.postal_code']);
    });
});

describe('Profile Avatar Upload', function () {
    it('can upload avatar', function () {
        Storage::fake('media');
        $user = User::factory()->create();
        Passport::actingAs($user);

        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $response = $this->postJson('/api/v1/profile/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Avatar uploaded successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'avatar' => [
                        'original',
                        'thumb',
                        'preview',
                    ],
                ],
            ]);

        $this->assertTrue($user->profile->fresh()->hasMedia('avatar'));
    });

    it('replaces existing avatar when uploading new one', function () {
        Storage::fake('media');
        $user = User::factory()->create();
        Passport::actingAs($user);

        // Upload first avatar
        $file1 = UploadedFile::fake()->image('avatar1.jpg', 200, 200);
        $this->postJson('/api/v1/profile/avatar', ['avatar' => $file1]);

        // Upload second avatar
        $file2 = UploadedFile::fake()->image('avatar2.jpg', 200, 200);
        $response = $this->postJson('/api/v1/profile/avatar', ['avatar' => $file2]);

        $response->assertStatus(200);
        $this->assertEquals(1, $user->profile->fresh()->getMedia('avatar')->count());
    });

    it('returns unauthorized when not authenticated', function () {
        $response = $this->postJson('/api/v1/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
        ]);

        $response->assertStatus(401);
    });

    it('validates avatar is required', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/profile/avatar', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    });

    it('validates avatar is an image', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->postJson('/api/v1/profile/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    });

    it('validates avatar mime type', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $file = UploadedFile::fake()->create('image.gif', 100, 'image/gif');

        $response = $this->postJson('/api/v1/profile/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    });

    it('validates avatar max size', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $file = UploadedFile::fake()->image('avatar.jpg')->size(6000); // 6MB

        $response = $this->postJson('/api/v1/profile/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    });

    it('validates avatar minimum dimensions', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $file = UploadedFile::fake()->image('avatar.jpg', 50, 50); // Too small

        $response = $this->postJson('/api/v1/profile/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    });

    it('validates avatar maximum dimensions', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $file = UploadedFile::fake()->image('avatar.jpg', 5000, 5000); // Too large

        $response = $this->postJson('/api/v1/profile/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    });
});

describe('Profile Avatar Delete', function () {
    it('can delete avatar', function () {
        Storage::fake('media');
        $user = User::factory()->create();
        Passport::actingAs($user);

        // First upload an avatar
        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);
        $this->postJson('/api/v1/profile/avatar', ['avatar' => $file]);
        $this->assertTrue($user->profile->fresh()->hasMedia('avatar'));

        // Now delete it
        $response = $this->deleteJson('/api/v1/profile/avatar');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Avatar deleted successfully',
            ]);

        $this->assertFalse($user->profile->fresh()->hasMedia('avatar'));
    });

    it('returns success even when no avatar exists', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->deleteJson('/api/v1/profile/avatar');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Avatar deleted successfully',
            ]);
    });

    it('returns unauthorized when not authenticated', function () {
        $response = $this->deleteJson('/api/v1/profile/avatar');

        $response->assertStatus(401);
    });
});

describe('Profile Avatar in Response', function () {
    it('does not include avatar key when no avatar exists', function () {
        $user = User::factory()->create();
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/profile');

        $response->assertStatus(200);
        $this->assertArrayNotHasKey('avatar', $response->json('data'));
    });

    it('includes avatar in profile response when avatar exists', function () {
        Storage::fake('media');
        $user = User::factory()->create();
        Passport::actingAs($user);

        // Upload avatar
        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);
        $this->postJson('/api/v1/profile/avatar', ['avatar' => $file]);

        // Get profile
        $response = $this->getJson('/api/v1/profile');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'avatar' => [
                        'original',
                        'thumb',
                        'preview',
                    ],
                ],
            ]);
    });

    it('includes avatar in auth me response when avatar exists', function () {
        Storage::fake('media');
        $user = User::factory()->create();
        Passport::actingAs($user);

        // Upload avatar
        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);
        $this->postJson('/api/v1/profile/avatar', ['avatar' => $file]);

        // Get auth/me
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'avatar' => [
                        'original',
                        'thumb',
                        'preview',
                    ],
                ],
            ]);
    });
});
