<?php

use App\Models\BusinessType;
use App\Models\DocumentType;
use App\Models\Merchant;
use App\Models\MerchantDocument;
use App\Models\PaymentMethod;
use App\Models\SocialPlatform;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Merchant Index', function () {
    it('can list all merchants', function () {
        Merchant::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/merchants');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'user_id', 'type', 'name', 'slug', 'status', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter merchants by name', function () {
        Merchant::factory()->create(['name' => 'Alpha Store']);
        Merchant::factory()->create(['name' => 'Beta Shop']);

        $response = $this->getJson('/api/v1/merchants?filter[name]=Alpha');

        $response->assertStatus(200);
        $data = $response->json('data');
        $filtered = collect($data)->filter(fn ($m) => str_contains($m['name'], 'Alpha'));
        expect($filtered)->toHaveCount(1);
    });

    it('can filter merchants by status', function () {
        Merchant::factory()->count(2)->create(['status' => 'pending']);
        Merchant::factory()->count(1)->active()->create();

        $response = $this->getJson('/api/v1/merchants?filter[status]=pending');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(collect($data)->every(fn ($m) => $m['status'] === 'pending'))->toBeTrue();
    });

    it('can filter merchants by type', function () {
        Merchant::factory()->count(2)->individual()->create();
        Merchant::factory()->count(1)->organization()->create();

        $response = $this->getJson('/api/v1/merchants?filter[type]=organization');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(collect($data)->every(fn ($m) => $m['type'] === 'organization'))->toBeTrue();
    });

    it('can paginate merchants', function () {
        Merchant::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/merchants?per_page=5');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonCount(5, 'data');
    });
});

describe('Merchant All', function () {
    it('can list all merchants without pagination', function () {
        Merchant::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/merchants/all');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    });
});

describe('Merchant Store', function () {
    it('can create an individual merchant with new user account', function () {
        $response = $this->postJson('/api/v1/merchants', [
            'user_first_name' => 'John',
            'user_last_name' => 'Doe',
            'user_email' => 'john@example.com',
            'user_password' => 'password123',
            'name' => 'Test Merchant',
            'type' => 'individual',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Merchant created successfully',
                'data' => [
                    'name' => 'Test Merchant',
                    'slug' => 'test-merchant',
                    'type' => 'individual',
                    'status' => 'pending',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $user = User::where('email', 'john@example.com')->first();
        expect($user->hasRole('merchant'))->toBeTrue();

        $this->assertDatabaseHas('merchants', [
            'user_id' => $user->id,
            'name' => 'Test Merchant',
            'type' => 'individual',
        ]);
    });

    it('can create an organization merchant', function () {
        $response = $this->postJson('/api/v1/merchants', [
            'user_first_name' => 'Jane',
            'user_last_name' => 'Org',
            'user_email' => 'jane@org.com',
            'user_password' => 'password123',
            'name' => 'Test Organization',
            'type' => 'organization',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'organization',
                ],
            ]);
    });

    it('can create a merchant with business type', function () {
        $businessType = BusinessType::factory()->create();

        $response = $this->postJson('/api/v1/merchants', [
            'user_first_name' => 'Biz',
            'user_last_name' => 'User',
            'user_email' => 'biz@example.com',
            'user_password' => 'password123',
            'name' => 'Typed Merchant',
            'business_type_id' => $businessType->id,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'business_type_id' => $businessType->id,
                ],
            ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/merchants', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'user_first_name', 'user_last_name', 'user_email', 'user_password']);
    });

    it('validates user_email uniqueness', function () {
        $existingUser = User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/v1/merchants', [
            'user_first_name' => 'Test',
            'user_last_name' => 'User',
            'user_email' => 'taken@example.com',
            'user_password' => 'password123',
            'name' => 'Duplicate Email Merchant',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_email']);
    });

    it('validates type enum', function () {
        $response = $this->postJson('/api/v1/merchants', [
            'user_first_name' => 'Test',
            'user_last_name' => 'User',
            'user_email' => 'type@example.com',
            'user_password' => 'password123',
            'name' => 'Test',
            'type' => 'invalid',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    });

    it('auto-sets contact_email from user_email', function () {
        $response = $this->postJson('/api/v1/merchants', [
            'user_first_name' => 'Auto',
            'user_last_name' => 'Email',
            'user_email' => 'auto@example.com',
            'user_password' => 'password123',
            'name' => 'Auto Email Merchant',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('merchants', [
            'name' => 'Auto Email Merchant',
            'contact_email' => 'auto@example.com',
        ]);
    });

    it('copies capability flags from business type on create', function () {
        $businessType = BusinessType::factory()->create([
            'can_sell_products' => true,
            'can_take_bookings' => true,
            'can_rent_units' => false,

        ]);

        $response = $this->postJson('/api/v1/merchants', [
            'user_first_name' => 'Cap',
            'user_last_name' => 'User',
            'user_email' => 'cap@example.com',
            'user_password' => 'password123',
            'name' => 'Capable Merchant',
            'business_type_id' => $businessType->id,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => true,
                    'can_rent_units' => false,
        
                ],
            ]);

        $this->assertDatabaseHas('merchants', [
            'name' => 'Capable Merchant',
            'can_sell_products' => true,
            'can_take_bookings' => true,
            'can_rent_units' => false,

        ]);
    });

    it('defaults capability flags to false without business type', function () {
        $response = $this->postJson('/api/v1/merchants', [
            'user_first_name' => 'No BT',
            'user_last_name' => 'User',
            'user_email' => 'nobt@example.com',
            'user_password' => 'password123',
            'name' => 'No BT Merchant',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'can_sell_products' => false,
                    'can_take_bookings' => false,
                    'can_rent_units' => false,
        
                ],
            ]);
    });
});

describe('Merchant Show', function () {
    it('can show a specific merchant', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->getJson("/api/v1/merchants/{$merchant->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $merchant->id,
                    'name' => $merchant->name,
                ],
            ]);
    });

    it('returns 404 for non-existent merchant', function () {
        $response = $this->getJson('/api/v1/merchants/99999');

        $response->assertStatus(404);
    });
});

describe('Merchant Update', function () {
    it('can update a merchant', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}", [
            'name' => 'Updated Name',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Name',
                    'description' => 'Updated description',
                ],
            ]);

        $this->assertDatabaseHas('merchants', [
            'id' => $merchant->id,
            'name' => 'Updated Name',
        ]);
    });

    it('cannot set parent_id to own id', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}", [
            'parent_id' => $merchant->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['parent_id']);
    });

    it('can update merchant capability flags', function () {
        $merchant = Merchant::factory()->create([
            'can_sell_products' => false,
            'can_take_bookings' => false,
        ]);

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}", [
            'can_sell_products' => true,
            'can_take_bookings' => true,
            'can_rent_units' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => true,
                    'can_rent_units' => true,
        
                ],
            ]);

        $this->assertDatabaseHas('merchants', [
            'id' => $merchant->id,
            'can_sell_products' => true,
            'can_take_bookings' => true,
            'can_rent_units' => true,

        ]);
    });

    it('can update a merchant with address', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}", [
            'name' => 'With Address',
            'address' => [
                'street' => '123 Main St',
                'postal_code' => '62701',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'With Address',
                    'address' => [
                        'street' => '123 Main St',
                        'postal_code' => '62701',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('addresses', [
            'addressable_type' => Merchant::class,
            'addressable_id' => $merchant->id,
            'street' => '123 Main St',
            'postal_code' => '62701',
        ]);
    });
});

describe('Merchant Delete', function () {
    it('can delete a merchant', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->deleteJson("/api/v1/merchants/{$merchant->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Merchant deleted successfully',
            ]);

        $this->assertDatabaseMissing('merchants', [
            'id' => $merchant->id,
        ]);
    });

    it('returns error for non-existent merchant', function () {
        $response = $this->deleteJson('/api/v1/merchants/99999');

        $response->assertStatus(422);
    });
});

describe('Merchant Status', function () {
    it('can approve a submitted merchant', function () {
        $merchant = Merchant::factory()->create(['status' => 'submitted', 'submitted_at' => now()]);

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'approved',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'approved',
                ],
            ]);

        $this->assertDatabaseHas('merchants', [
            'id' => $merchant->id,
            'status' => 'approved',
        ]);

        expect($response->json('data.approved_at'))->not->toBeNull();
    });

    it('can reject a submitted merchant with reason', function () {
        $merchant = Merchant::factory()->create(['status' => 'submitted', 'submitted_at' => now()]);

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'rejected',
            'status_reason' => 'Incomplete documents',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'rejected',
                    'status_reason' => 'Incomplete documents',
                ],
            ]);
    });

    it('can activate an approved merchant', function () {
        $merchant = Merchant::factory()->approved()->create();

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'active',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'active'],
            ]);
    });

    it('can suspend an active merchant', function () {
        $merchant = Merchant::factory()->active()->create();

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'suspended',
            'status_reason' => 'Policy violation',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'suspended'],
            ]);
    });

    it('can reactivate a suspended merchant', function () {
        $merchant = Merchant::factory()->suspended()->create();

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'active',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'active'],
            ]);
    });

    it('can re-submit a rejected merchant', function () {
        $merchant = Merchant::factory()->rejected()->create();

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'pending',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'pending'],
            ]);
    });

    it('rejects invalid status transitions', function () {
        $merchant = Merchant::factory()->create(['status' => 'pending']);

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'active',
        ]);

        $response->assertStatus(422);
    });

    it('rejects pending to approved without going through submitted', function () {
        $merchant = Merchant::factory()->create(['status' => 'pending']);

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'approved',
        ]);

        $response->assertStatus(422);
    });

    it('requires reason for rejection', function () {
        $merchant = Merchant::factory()->create(['status' => 'submitted', 'submitted_at' => now()]);

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'rejected',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status_reason']);
    });

    it('requires reason for suspension', function () {
        $merchant = Merchant::factory()->active()->create();

        $response = $this->patchJson("/api/v1/merchants/{$merchant->id}/status", [
            'status' => 'suspended',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status_reason']);
    });
});

describe('Merchant Account', function () {
    it('can update the merchant user email', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/account", [
            'email' => 'newemail@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Merchant account updated successfully',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $merchant->user_id,
            'email' => 'newemail@example.com',
        ]);
    });

    it('can update the merchant user password', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/account", [
            'password' => 'newpassword123',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $user = User::find($merchant->user_id);
        expect(\Illuminate\Support\Facades\Hash::check('newpassword123', $user->password))->toBeTrue();
    });

    it('can update both email and password', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/account", [
            'email' => 'both@example.com',
            'password' => 'bothpassword123',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $merchant->user_id,
            'email' => 'both@example.com',
        ]);
    });

    it('validates email uniqueness', function () {
        $existingUser = User::factory()->create(['email' => 'existing@example.com']);
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/account", [
            'email' => 'existing@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('validates email format', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/account", [
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('validates password minimum length', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/account", [
            'password' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    });
});

describe('Merchant Business Hours', function () {
    it('can set business hours for a merchant', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/business-hours", [
            'hours' => [
                ['day_of_week' => 1, 'open_time' => '09:00', 'close_time' => '17:00', 'is_closed' => false],
                ['day_of_week' => 2, 'open_time' => '09:00', 'close_time' => '17:00', 'is_closed' => false],
                ['day_of_week' => 0, 'is_closed' => true],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Business hours updated successfully']);

        $data = $response->json('data');
        expect($data)->toHaveCount(3);

        $this->assertDatabaseHas('merchant_business_hours', [
            'merchant_id' => $merchant->id,
            'day_of_week' => 1,
            'open_time' => '09:00:00',
            'close_time' => '17:00:00',
        ]);

        $this->assertDatabaseHas('merchant_business_hours', [
            'merchant_id' => $merchant->id,
            'day_of_week' => 0,
            'is_closed' => true,
        ]);
    });

    it('can update existing business hours', function () {
        $merchant = Merchant::factory()->create();

        // Set initial hours
        $this->putJson("/api/v1/merchants/{$merchant->id}/business-hours", [
            'hours' => [
                ['day_of_week' => 1, 'open_time' => '09:00', 'close_time' => '17:00'],
            ],
        ]);

        // Update same day
        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/business-hours", [
            'hours' => [
                ['day_of_week' => 1, 'open_time' => '10:00', 'close_time' => '18:00'],
            ],
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('merchant_business_hours', [
            'merchant_id' => $merchant->id,
            'day_of_week' => 1,
            'open_time' => '10:00:00',
            'close_time' => '18:00:00',
        ]);
    });

    it('validates business hours data', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/business-hours", [
            'hours' => [],
        ]);

        $response->assertStatus(422);
    });

    it('validates day_of_week range', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/business-hours", [
            'hours' => [
                ['day_of_week' => 7, 'open_time' => '09:00', 'close_time' => '17:00'],
            ],
        ]);

        $response->assertStatus(422);
    });
});

describe('Merchant Payment Methods', function () {
    it('can sync payment methods', function () {
        $merchant = Merchant::factory()->create();
        $pm1 = PaymentMethod::factory()->create();
        $pm2 = PaymentMethod::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/payment-methods", [
            'payment_method_ids' => [$pm1->id, $pm2->id],
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Payment methods synced successfully']);

        $data = $response->json('data');
        expect($data)->toHaveCount(2);

        $this->assertDatabaseHas('merchant_payment_method', [
            'merchant_id' => $merchant->id,
            'payment_method_id' => $pm1->id,
        ]);
    });

    it('can replace payment methods on re-sync', function () {
        $merchant = Merchant::factory()->create();
        $pm1 = PaymentMethod::factory()->create();
        $pm2 = PaymentMethod::factory()->create();
        $pm3 = PaymentMethod::factory()->create();

        // Initial sync
        $this->postJson("/api/v1/merchants/{$merchant->id}/payment-methods", [
            'payment_method_ids' => [$pm1->id, $pm2->id],
        ]);

        // Re-sync with different set
        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/payment-methods", [
            'payment_method_ids' => [$pm2->id, $pm3->id],
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        expect($data)->toHaveCount(2);

        $this->assertDatabaseMissing('merchant_payment_method', [
            'merchant_id' => $merchant->id,
            'payment_method_id' => $pm1->id,
        ]);

        $this->assertDatabaseHas('merchant_payment_method', [
            'merchant_id' => $merchant->id,
            'payment_method_id' => $pm3->id,
        ]);
    });

    it('validates payment method ids exist', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/payment-methods", [
            'payment_method_ids' => [99999],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_method_ids.0']);
    });
});

describe('Merchant Social Links', function () {
    it('can sync social links', function () {
        $merchant = Merchant::factory()->create();
        $fb = SocialPlatform::factory()->create(['name' => 'Facebook']);
        $ig = SocialPlatform::factory()->create(['name' => 'Instagram']);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/social-links", [
            'social_links' => [
                ['social_platform_id' => $fb->id, 'url' => 'https://facebook.com/testmerchant'],
                ['social_platform_id' => $ig->id, 'url' => 'https://instagram.com/testmerchant'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Social links synced successfully']);

        $data = $response->json('data');
        expect($data)->toHaveCount(2);

        $this->assertDatabaseHas('merchant_social_links', [
            'merchant_id' => $merchant->id,
            'social_platform_id' => $fb->id,
            'url' => 'https://facebook.com/testmerchant',
        ]);
    });

    it('can replace social links on re-sync', function () {
        $merchant = Merchant::factory()->create();
        $fb = SocialPlatform::factory()->create(['name' => 'Facebook']);
        $ig = SocialPlatform::factory()->create(['name' => 'Instagram']);

        // Initial sync
        $this->postJson("/api/v1/merchants/{$merchant->id}/social-links", [
            'social_links' => [
                ['social_platform_id' => $fb->id, 'url' => 'https://facebook.com/old'],
            ],
        ]);

        // Re-sync
        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/social-links", [
            'social_links' => [
                ['social_platform_id' => $ig->id, 'url' => 'https://instagram.com/new'],
            ],
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('merchant_social_links', [
            'merchant_id' => $merchant->id,
            'social_platform_id' => $fb->id,
        ]);

        $this->assertDatabaseHas('merchant_social_links', [
            'merchant_id' => $merchant->id,
            'social_platform_id' => $ig->id,
        ]);
    });

    it('validates social link data', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/social-links", [
            'social_links' => [
                ['social_platform_id' => 99999, 'url' => 'https://example.com'],
            ],
        ]);

        $response->assertStatus(422);
    });

    it('validates url format', function () {
        $merchant = Merchant::factory()->create();
        $fb = SocialPlatform::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/social-links", [
            'social_links' => [
                ['social_platform_id' => $fb->id, 'url' => 'not-a-url'],
            ],
        ]);

        $response->assertStatus(422);
    });
});

describe('Merchant Documents', function () {
    it('can upload a document', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();
        $docType = DocumentType::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/documents", [
            'document_type_id' => $docType->id,
            'document' => UploadedFile::fake()->create('permit.pdf', 1024, 'application/pdf'),
            'notes' => 'Business permit 2026',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => [
                    'document_type_id' => $docType->id,
                    'notes' => 'Business permit 2026',
                ],
            ]);

        $this->assertDatabaseHas('merchant_documents', [
            'merchant_id' => $merchant->id,
            'document_type_id' => $docType->id,
            'notes' => 'Business permit 2026',
        ]);
    });

    it('can replace a document for the same type', function () {
        Storage::fake('media');
        $merchant = Merchant::factory()->create();
        $docType = DocumentType::factory()->create();

        // Upload first
        $this->postJson("/api/v1/merchants/{$merchant->id}/documents", [
            'document_type_id' => $docType->id,
            'document' => UploadedFile::fake()->create('permit1.pdf', 1024, 'application/pdf'),
            'notes' => 'First upload',
        ]);

        // Upload same type again (should update)
        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/documents", [
            'document_type_id' => $docType->id,
            'document' => UploadedFile::fake()->create('permit2.pdf', 1024, 'application/pdf'),
            'notes' => 'Second upload',
        ]);

        $response->assertStatus(201);

        // Should still be one record
        expect($merchant->documents()->where('document_type_id', $docType->id)->count())->toBe(1);

        $this->assertDatabaseHas('merchant_documents', [
            'merchant_id' => $merchant->id,
            'document_type_id' => $docType->id,
            'notes' => 'Second upload',
        ]);
    });

    it('can delete a document', function () {
        $merchant = Merchant::factory()->create();
        $docType = DocumentType::factory()->create();
        $document = $merchant->documents()->create([
            'document_type_id' => $docType->id,
            'notes' => 'To be deleted',
        ]);

        $response = $this->deleteJson("/api/v1/merchants/{$merchant->id}/documents/{$document->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Document deleted successfully',
            ]);

        $this->assertDatabaseMissing('merchant_documents', [
            'id' => $document->id,
        ]);
    });

    it('returns error when deleting non-existent document', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->deleteJson("/api/v1/merchants/{$merchant->id}/documents/99999");

        $response->assertStatus(422);
    });

    it('validates document_type_id exists', function () {
        $merchant = Merchant::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/documents", [
            'document_type_id' => 99999,
            'document' => UploadedFile::fake()->create('permit.pdf', 1024, 'application/pdf'),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['document_type_id']);
    });
});
