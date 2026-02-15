<?php

use App\Models\Booking;
use App\Models\DocumentType;
use App\Models\Merchant;
use App\Models\PaymentMethod;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServiceOrder;
use App\Models\SocialPlatform;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;

beforeEach(function () {
    Storage::fake('public');

    // Merchant-role user WITH a merchant (the happy path)
    $this->merchantUser = User::factory()->create();
    $this->merchantUser->assignRole('merchant');
    $this->merchant = Merchant::factory()->active()->create([
        'user_id' => $this->merchantUser->id,
    ]);

    // Admin user WITHOUT a merchant (bypasses onboarding, hits 404 in controller)
    $this->adminWithoutMerchant = User::factory()->create();
    $this->adminWithoutMerchant->assignRole('admin');

    // Merchant-role user WITHOUT a merchant (blocked by onboarding middleware = 403)
    $this->merchantUserIncomplete = User::factory()->create();
    $this->merchantUserIncomplete->assignRole('merchant');
});

describe('My Merchant Show', function () {
    it('returns the authenticated user merchant with full relations', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Merchant retrieved successfully',
                'data' => [
                    'id' => $this->merchant->id,
                    'name' => $this->merchant->name,
                ],
            ]);
    });

    it('returns merchant with full structure', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'user_id',
                    'type',
                    'name',
                    'slug',
                    'description',
                    'contact_email',
                    'contact_phone',
                    'status',
                    'can_sell_products',
                    'can_take_bookings',
                    'can_rent_units',
                    'created_at',
                    'updated_at',
                ],
            ]);
    });

    it('returns only own merchant not other merchants', function () {
        Passport::actingAs($this->merchantUser);

        $otherUser = User::factory()->create();
        $otherUser->assignRole('merchant');
        $otherMerchant = Merchant::factory()->active()->create([
            'user_id' => $otherUser->id,
            'name' => 'Other Merchant Store',
        ]);

        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(200)
            ->assertJson(['data' => ['id' => $this->merchant->id]]);
        expect($response->json('data.id'))->not->toBe($otherMerchant->id);
    });

    it('returns 404 when non-merchant-role user has no merchant', function () {
        Passport::actingAs($this->adminWithoutMerchant);

        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'No merchant associated with your account',
            ]);
    });

    it('returns 403 when merchant-role user has incomplete onboarding', function () {
        Passport::actingAs($this->merchantUserIncomplete);

        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Merchant profile setup required',
            ]);
    });

    it('returns 401 when not authenticated', function () {
        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(401);
    });
});

describe('My Merchant Stats', function () {
    it('returns basic service stats', function () {
        Passport::actingAs($this->merchantUser);

        $category = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id]);
        Service::factory()->count(3)->create([
            'merchant_id' => $this->merchant->id,
            'service_category_id' => $category->id,
            'is_active' => true,
        ]);
        Service::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_category_id' => $category->id,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/stats');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'services' => [
                        'total' => 4,
                        'active' => 3,
                    ],
                ],
            ]);
    });

    it('returns zero service stats when no services exist', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/stats');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'services' => ['total' => 0, 'active' => 0],
                ],
            ]);
    });

    it('includes booking stats when merchant can_take_bookings', function () {
        $this->merchant->update(['can_take_bookings' => true]);
        Passport::actingAs($this->merchantUser);

        $category = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id]);
        $service = Service::factory()->bookable()->create([
            'merchant_id' => $this->merchant->id,
            'service_category_id' => $category->id,
        ]);
        $customer = User::factory()->create();

        Booking::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
        ]);
        Booking::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $customer->id,
        ]);
        Booking::factory()->cancelled()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/stats');

        $response->assertStatus(200)
            ->assertJsonPath('data.bookings.total', 4)
            ->assertJsonPath('data.bookings.pending', 2)
            ->assertJsonPath('data.bookings.confirmed', 1)
            ->assertJsonPath('data.bookings.cancelled', 1);

        expect($response->json('data.recent_bookings'))->toBeArray();
    });

    it('excludes booking stats when merchant cannot take bookings', function () {
        $this->merchant->update(['can_take_bookings' => false]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/stats');

        $response->assertStatus(200);
        expect($response->json('data'))->not->toHaveKey('bookings');
        expect($response->json('data'))->not->toHaveKey('recent_bookings');
    });

    it('includes order stats when merchant can_sell_products', function () {
        $this->merchant->update(['can_sell_products' => true]);
        Passport::actingAs($this->merchantUser);

        $category = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id]);
        $service = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
            'service_category_id' => $category->id,
        ]);
        $customer = User::factory()->create();

        ServiceOrder::factory()->count(3)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/stats');

        $response->assertStatus(200)
            ->assertJsonPath('data.orders.total', 3)
            ->assertJsonPath('data.orders.pending', 3);

        expect($response->json('data.recent_orders'))->toBeArray();
    });

    it('excludes order stats when merchant cannot sell products', function () {
        $this->merchant->update(['can_sell_products' => false]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/stats');

        $response->assertStatus(200);
        expect($response->json('data'))->not->toHaveKey('orders');
        expect($response->json('data'))->not->toHaveKey('recent_orders');
    });

    it('includes reservation stats when merchant can_rent_units', function () {
        $this->merchant->update(['can_rent_units' => true]);
        Passport::actingAs($this->merchantUser);

        $category = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id]);
        $service = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
            'service_category_id' => $category->id,
        ]);
        $customer = User::factory()->create();

        Reservation::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
        ]);
        Reservation::factory()->confirmed()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/stats');

        $response->assertStatus(200)
            ->assertJsonPath('data.reservations.total', 3)
            ->assertJsonPath('data.reservations.pending', 2)
            ->assertJsonPath('data.reservations.confirmed', 1);

        expect($response->json('data.recent_reservations'))->toBeArray();
    });

    it('excludes reservation stats when merchant cannot rent units', function () {
        $this->merchant->update(['can_rent_units' => false]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/stats');

        $response->assertStatus(200);
        expect($response->json('data'))->not->toHaveKey('reservations');
        expect($response->json('data'))->not->toHaveKey('recent_reservations');
    });

    it('only counts own merchant stats not other merchants', function () {
        $this->merchant->update(['can_take_bookings' => true]);
        Passport::actingAs($this->merchantUser);

        $category = ServiceCategory::factory()->create(['merchant_id' => $this->merchant->id]);
        $service = Service::factory()->bookable()->create([
            'merchant_id' => $this->merchant->id,
            'service_category_id' => $category->id,
        ]);
        $customer = User::factory()->create();

        Booking::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'customer_id' => $customer->id,
        ]);

        // Other merchant bookings should NOT be counted
        $otherMerchant = Merchant::factory()->create(['can_take_bookings' => true]);
        $otherCategory = ServiceCategory::factory()->create(['merchant_id' => $otherMerchant->id]);
        $otherService = Service::factory()->bookable()->create([
            'merchant_id' => $otherMerchant->id,
            'service_category_id' => $otherCategory->id,
        ]);
        Booking::factory()->count(5)->create([
            'merchant_id' => $otherMerchant->id,
            'service_id' => $otherService->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/stats');

        $response->assertStatus(200);
        expect($response->json('data.bookings.total'))->toBe(2);
    });
});

describe('My Merchant Update', function () {
    it('updates the merchant name and description', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => 'Updated Store Name',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Merchant updated successfully',
                'data' => [
                    'name' => 'Updated Store Name',
                    'description' => 'Updated description',
                ],
            ]);

        $this->assertDatabaseHas('merchants', [
            'id' => $this->merchant->id,
            'name' => 'Updated Store Name',
            'description' => 'Updated description',
        ]);
    });

    it('updates the merchant contact phone', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'contact_phone' => '09171234567',
        ]);

        $response->assertStatus(200)
            ->assertJson(['data' => ['contact_phone' => '09171234567']]);
    });

    it('updates the merchant with address', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => 'With Address',
            'address' => [
                'street' => '456 Main St',
                'postal_code' => '12345',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'With Address',
                ],
            ]);

        $this->assertDatabaseHas('addresses', [
            'addressable_type' => Merchant::class,
            'addressable_id' => $this->merchant->id,
            'street' => '456 Main St',
            'postal_code' => '12345',
        ]);
    });

    it('validates unique slug scoped to own merchant', function () {
        Passport::actingAs($this->merchantUser);

        Merchant::factory()->create(['slug' => 'taken-slug']);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'slug' => 'taken-slug',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    });

    it('allows setting own existing slug', function () {
        Passport::actingAs($this->merchantUser);

        $currentSlug = $this->merchant->slug;

        $response = $this->putJson('/api/v1/auth/merchant', [
            'slug' => $currentSlug,
        ]);

        $response->assertStatus(200);
    });

    it('can update capability flags independently', function () {
        Passport::actingAs($this->merchantUser);

        $this->merchant->update([
            'can_sell_products' => false,
            'can_take_bookings' => false,
            'can_rent_units' => false,
        ]);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'can_sell_products' => true,
            'can_take_bookings' => true,
            'can_rent_units' => true,
        ]);

        $response->assertStatus(200);

        $this->merchant->refresh();
        expect($this->merchant->can_sell_products)->toBeTrue();
        expect($this->merchant->can_take_bookings)->toBeTrue();
        expect($this->merchant->can_rent_units)->toBeTrue();
    });

    it('overrides capabilities when business type changes', function () {
        Passport::actingAs($this->merchantUser);

        $this->merchant->update([
            'can_sell_products' => true,
            'can_take_bookings' => true,
            'can_rent_units' => true,
        ]);

        $businessType = \App\Models\BusinessType::factory()->create([
            'can_sell_products' => true,
            'can_take_bookings' => false,
            'can_rent_units' => false,
        ]);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'business_type_id' => $businessType->id,
            'can_sell_products' => true,
            'can_take_bookings' => true,
            'can_rent_units' => true,
        ]);

        $response->assertStatus(200);

        $this->merchant->refresh();
        expect($this->merchant->can_sell_products)->toBeTrue();
        expect($this->merchant->can_take_bookings)->toBeFalse();
        expect($this->merchant->can_rent_units)->toBeFalse();
    });

    it('cannot update parent_id which is admin-only', function () {
        Passport::actingAs($this->merchantUser);

        $otherMerchant = Merchant::factory()->create();

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => 'Good Name',
            'parent_id' => $otherMerchant->id,
        ]);

        $response->assertStatus(200);

        $this->merchant->refresh();
        expect($this->merchant->parent_id)->toBeNull();
    });

    it('validates name max length', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => str_repeat('a', 256),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('returns 404 when non-merchant-role user has no merchant', function () {
        Passport::actingAs($this->adminWithoutMerchant);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => 'Some Name',
        ]);

        $response->assertStatus(404);
    });

    it('copies capabilities from business type when business_type_id is updated', function () {
        Passport::actingAs($this->merchantUser);

        $businessType = \App\Models\BusinessType::factory()->create([
            'can_sell_products' => true,
            'can_take_bookings' => true,
            'can_rent_units' => false,
        ]);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'business_type_id' => $businessType->id,
        ]);

        $response->assertOk();

        $this->merchant->refresh();
        expect($this->merchant->can_sell_products)->toBeTrue();
        expect($this->merchant->can_take_bookings)->toBeTrue();
        expect($this->merchant->can_rent_units)->toBeFalse();
        expect($this->merchant->business_type_id)->toBe($businessType->id);
    });
});

describe('My Merchant Business Hours', function () {
    it('updates business hours', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->putJson('/api/v1/auth/merchant/business-hours', [
            'hours' => [
                ['day_of_week' => 1, 'open_time' => '09:00', 'close_time' => '17:00', 'is_closed' => false],
                ['day_of_week' => 2, 'open_time' => '09:00', 'close_time' => '17:00', 'is_closed' => false],
                ['day_of_week' => 0, 'is_closed' => true],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Business hours updated successfully',
            ]);

        $this->assertDatabaseHas('merchant_business_hours', [
            'merchant_id' => $this->merchant->id,
            'day_of_week' => 1,
            'open_time' => '09:00:00',
            'close_time' => '17:00:00',
        ]);

        $this->assertDatabaseHas('merchant_business_hours', [
            'merchant_id' => $this->merchant->id,
            'day_of_week' => 0,
            'is_closed' => true,
        ]);
    });

    it('upserts business hours by day_of_week', function () {
        Passport::actingAs($this->merchantUser);

        $this->putJson('/api/v1/auth/merchant/business-hours', [
            'hours' => [
                ['day_of_week' => 1, 'open_time' => '09:00', 'close_time' => '17:00'],
            ],
        ]);

        $response = $this->putJson('/api/v1/auth/merchant/business-hours', [
            'hours' => [
                ['day_of_week' => 1, 'open_time' => '10:00', 'close_time' => '18:00'],
            ],
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('merchant_business_hours', [
            'merchant_id' => $this->merchant->id,
            'day_of_week' => 1,
            'open_time' => '10:00:00',
            'close_time' => '18:00:00',
        ]);

        expect($this->merchant->businessHours()->where('day_of_week', 1)->count())->toBe(1);
    });

    it('validates hours array is required', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->putJson('/api/v1/auth/merchant/business-hours', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['hours']);
    });

    it('validates day_of_week range', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->putJson('/api/v1/auth/merchant/business-hours', [
            'hours' => [
                ['day_of_week' => 7, 'open_time' => '09:00', 'close_time' => '17:00'],
            ],
        ]);

        $response->assertStatus(422);
    });
});

describe('My Merchant Payment Methods', function () {
    it('syncs payment methods', function () {
        Passport::actingAs($this->merchantUser);

        $paymentMethods = PaymentMethod::factory()->count(2)->create(['is_active' => true]);

        $response = $this->postJson('/api/v1/auth/merchant/payment-methods', [
            'payment_method_ids' => $paymentMethods->pluck('id')->toArray(),
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Payment methods synced successfully',
            ]);

        expect($this->merchant->paymentMethods()->count())->toBe(2);
    });

    it('replaces payment methods on re-sync', function () {
        Passport::actingAs($this->merchantUser);

        $pm1 = PaymentMethod::factory()->create(['is_active' => true]);
        $pm2 = PaymentMethod::factory()->create(['is_active' => true]);
        $pm3 = PaymentMethod::factory()->create(['is_active' => true]);

        $this->postJson('/api/v1/auth/merchant/payment-methods', [
            'payment_method_ids' => [$pm1->id, $pm2->id],
        ]);

        $response = $this->postJson('/api/v1/auth/merchant/payment-methods', [
            'payment_method_ids' => [$pm2->id, $pm3->id],
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('merchant_payment_method', [
            'merchant_id' => $this->merchant->id,
            'payment_method_id' => $pm1->id,
        ]);

        $this->assertDatabaseHas('merchant_payment_method', [
            'merchant_id' => $this->merchant->id,
            'payment_method_id' => $pm3->id,
        ]);
    });

    it('validates payment_method_ids is required', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/payment-methods', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_method_ids']);
    });

    it('validates payment method ids exist', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/payment-methods', [
            'payment_method_ids' => [99999],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_method_ids.0']);
    });
});

describe('My Merchant Social Links', function () {
    it('syncs social links', function () {
        Passport::actingAs($this->merchantUser);

        $platform = SocialPlatform::factory()->create(['is_active' => true]);

        $response = $this->postJson('/api/v1/auth/merchant/social-links', [
            'social_links' => [
                ['social_platform_id' => $platform->id, 'url' => 'https://facebook.com/mystore'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Social links synced successfully',
            ]);

        expect($this->merchant->socialLinks()->count())->toBe(1);
    });

    it('replaces social links on re-sync', function () {
        Passport::actingAs($this->merchantUser);

        $fb = SocialPlatform::factory()->create(['name' => 'Facebook', 'is_active' => true]);
        $ig = SocialPlatform::factory()->create(['name' => 'Instagram', 'is_active' => true]);

        $this->postJson('/api/v1/auth/merchant/social-links', [
            'social_links' => [
                ['social_platform_id' => $fb->id, 'url' => 'https://facebook.com/old'],
            ],
        ]);

        $response = $this->postJson('/api/v1/auth/merchant/social-links', [
            'social_links' => [
                ['social_platform_id' => $ig->id, 'url' => 'https://instagram.com/new'],
            ],
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('merchant_social_links', [
            'merchant_id' => $this->merchant->id,
            'social_platform_id' => $fb->id,
        ]);

        $this->assertDatabaseHas('merchant_social_links', [
            'merchant_id' => $this->merchant->id,
            'social_platform_id' => $ig->id,
        ]);
    });

    it('validates social_links is required', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/social-links', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['social_links']);
    });

    it('validates url format', function () {
        Passport::actingAs($this->merchantUser);

        $platform = SocialPlatform::factory()->create(['is_active' => true]);

        $response = $this->postJson('/api/v1/auth/merchant/social-links', [
            'social_links' => [
                ['social_platform_id' => $platform->id, 'url' => 'not-a-url'],
            ],
        ]);

        $response->assertStatus(422);
    });
});

describe('My Merchant Documents', function () {
    it('uploads a document', function () {
        Passport::actingAs($this->merchantUser);

        $documentType = DocumentType::factory()->create(['is_active' => true]);
        $file = UploadedFile::fake()->create('permit.pdf', 500, 'application/pdf');

        $response = $this->postJson('/api/v1/auth/merchant/documents', [
            'document_type_id' => $documentType->id,
            'document' => $file,
            'notes' => 'Business permit 2026',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Document uploaded successfully',
            ]);

        $this->assertDatabaseHas('merchant_documents', [
            'merchant_id' => $this->merchant->id,
            'document_type_id' => $documentType->id,
            'notes' => 'Business permit 2026',
        ]);
    });

    it('deletes a document', function () {
        Passport::actingAs($this->merchantUser);

        $documentType = DocumentType::factory()->create(['is_active' => true]);
        $document = $this->merchant->documents()->create([
            'document_type_id' => $documentType->id,
            'notes' => 'Test document',
        ]);

        $response = $this->deleteJson("/api/v1/auth/merchant/documents/{$document->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Document deleted successfully',
            ]);

        $this->assertDatabaseMissing('merchant_documents', ['id' => $document->id]);
    });

    it('cannot delete another merchant document', function () {
        Passport::actingAs($this->merchantUser);

        $otherMerchant = Merchant::factory()->create();
        $documentType = DocumentType::factory()->create(['is_active' => true]);
        $document = $otherMerchant->documents()->create([
            'document_type_id' => $documentType->id,
        ]);

        $response = $this->deleteJson("/api/v1/auth/merchant/documents/{$document->id}");

        $response->assertStatus(422);

        $this->assertDatabaseHas('merchant_documents', ['id' => $document->id]);
    });

    it('validates document_type_id exists', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/documents', [
            'document_type_id' => 99999,
            'document' => UploadedFile::fake()->create('permit.pdf', 500, 'application/pdf'),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['document_type_id']);
    });

    it('validates document file is required', function () {
        Passport::actingAs($this->merchantUser);

        $documentType = DocumentType::factory()->create(['is_active' => true]);

        $response = $this->postJson('/api/v1/auth/merchant/documents', [
            'document_type_id' => $documentType->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['document']);
    });
});

describe('My Merchant Logo', function () {
    it('uploads a logo', function () {
        Passport::actingAs($this->merchantUser);

        $file = UploadedFile::fake()->image('logo.jpg', 400, 400);

        $response = $this->postJson('/api/v1/auth/merchant/logo', [
            'logo' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Merchant logo uploaded successfully',
            ]);
    });

    it('replaces existing logo on re-upload', function () {
        Passport::actingAs($this->merchantUser);

        $this->postJson('/api/v1/auth/merchant/logo', [
            'logo' => UploadedFile::fake()->image('logo1.jpg', 400, 400),
        ]);

        $this->postJson('/api/v1/auth/merchant/logo', [
            'logo' => UploadedFile::fake()->image('logo2.jpg', 400, 400),
        ]);

        expect($this->merchant->refresh()->getMedia('logo'))->toHaveCount(1);
    });

    it('deletes a logo', function () {
        Passport::actingAs($this->merchantUser);

        $this->postJson('/api/v1/auth/merchant/logo', [
            'logo' => UploadedFile::fake()->image('logo.jpg', 400, 400),
        ]);

        $response = $this->deleteJson('/api/v1/auth/merchant/logo');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Merchant logo deleted successfully',
            ]);

        expect($this->merchant->refresh()->getMedia('logo'))->toHaveCount(0);
    });

    it('validates logo file is required', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/logo', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['logo']);
    });

    it('validates logo must be an image', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/logo', [
            'logo' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['logo']);
    });
});

describe('My Merchant Gallery', function () {
    it('returns gallery with all collections', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/gallery');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Gallery retrieved successfully',
            ])
            ->assertJsonStructure([
                'data' => [
                    'gallery_photos',
                    'gallery_interiors',
                    'gallery_exteriors',
                    'gallery_feature',
                ],
            ]);
    });

    it('returns empty gallery when no images uploaded', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/gallery');

        $response->assertStatus(200);
        expect($response->json('data.gallery_photos'))->toBeArray()->toBeEmpty();
        expect($response->json('data.gallery_interiors'))->toBeArray()->toBeEmpty();
        expect($response->json('data.gallery_exteriors'))->toBeArray()->toBeEmpty();
        expect($response->json('data.gallery_feature'))->toBeNull();
    });

    it('uploads a gallery photo', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/gallery/photos', [
            'image' => UploadedFile::fake()->image('photo.jpg', 800, 600),
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => ['id', 'url', 'thumb', 'preview', 'name', 'size', 'mime_type', 'created_at'],
            ]);
    });

    it('uploads multiple photos to the same collection', function () {
        Passport::actingAs($this->merchantUser);

        $this->postJson('/api/v1/auth/merchant/gallery/photos', [
            'image' => UploadedFile::fake()->image('photo1.jpg', 800, 600),
        ])->assertStatus(201);

        $this->postJson('/api/v1/auth/merchant/gallery/photos', [
            'image' => UploadedFile::fake()->image('photo2.jpg', 800, 600),
        ])->assertStatus(201);

        expect($this->merchant->refresh()->getMedia('gallery_photos'))->toHaveCount(2);
    });

    it('rejects invalid gallery collection', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/gallery/invalid', [
            'image' => UploadedFile::fake()->image('photo.jpg', 800, 600),
        ]);

        $response->assertStatus(422);
    });

    it('deletes a gallery image', function () {
        Passport::actingAs($this->merchantUser);

        $uploadResponse = $this->postJson('/api/v1/auth/merchant/gallery/photos', [
            'image' => UploadedFile::fake()->image('photo.jpg', 800, 600),
        ]);

        $mediaId = $uploadResponse->json('data.id');

        $response = $this->deleteJson("/api/v1/auth/merchant/gallery/{$mediaId}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Gallery image deleted successfully',
            ]);

        expect($this->merchant->refresh()->getMedia('gallery_photos'))->toHaveCount(0);
    });

    it('returns 404 when deleting non-existent gallery image', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->deleteJson('/api/v1/auth/merchant/gallery/99999');

        $response->assertStatus(404);
    });

    it('validates image file is required for gallery upload', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->postJson('/api/v1/auth/merchant/gallery/photos', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    });
});

describe('My Merchant Access Control', function () {
    it('allows merchant user without merchants.view to access show endpoint', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        $merchant = Merchant::factory()->active()->create(['user_id' => $user->id]);
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(200)
            ->assertJson(['data' => ['id' => $merchant->id]]);
    });

    it('allows merchant user without merchants.update to update own merchant', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Merchant::factory()->active()->create(['user_id' => $user->id]);
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => 'My Updated Store',
        ]);

        $response->assertStatus(200);
    });

    it('prevents merchant user from accessing admin merchant list endpoint', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        Merchant::factory()->active()->create(['user_id' => $user->id]);
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/merchants');

        $response->assertStatus(403);
    });

    it('prevents merchant user from accessing admin merchant update endpoint', function () {
        $user = User::factory()->create();
        $user->assignRole('merchant');
        $merchant = Merchant::factory()->active()->create(['user_id' => $user->id]);
        Passport::actingAs($user);

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}", [
            'name' => 'Trying Admin Endpoint',
        ]);

        $response->assertStatus(403);
    });

    it('allows admin user to also use self-service endpoints if they have a merchant', function () {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $merchant = Merchant::factory()->active()->create(['user_id' => $admin->id]);
        Passport::actingAs($admin);

        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(200)
            ->assertJson(['data' => ['id' => $merchant->id]]);
    });

    it('returns 404 for admin user who has no merchant', function () {
        Passport::actingAs($this->adminWithoutMerchant);

        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(404);
    });

    it('returns 403 for merchant-role user with incomplete onboarding', function () {
        Passport::actingAs($this->merchantUserIncomplete);

        $response = $this->getJson('/api/v1/auth/merchant');

        $response->assertStatus(403);
    });

    it('returns 401 for unauthenticated requests', function () {
        $response = $this->getJson('/api/v1/auth/merchant');
        $response->assertStatus(401);

        $response = $this->putJson('/api/v1/auth/merchant', ['name' => 'Test']);
        $response->assertStatus(401);

        $response = $this->getJson('/api/v1/auth/merchant/stats');
        $response->assertStatus(401);

        $response = $this->getJson('/api/v1/auth/merchant/gallery');
        $response->assertStatus(401);
    });
});
