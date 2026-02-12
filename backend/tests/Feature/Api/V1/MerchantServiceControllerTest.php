<?php

use App\Models\BusinessType;
use App\Models\BusinessTypeField;
use App\Models\Field;
use App\Models\FieldValue;
use App\Models\Merchant;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServiceSchedule;
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
                    '*' => ['id', 'merchant_id', 'name', 'slug', 'price', 'is_active', 'service_type', 'created_at', 'updated_at'],
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

    it('can filter services by service_type', function () {
        $merchant = Merchant::factory()->create(['can_sell_products' => true, 'can_take_bookings' => true]);
        Service::factory()->count(2)->create(['merchant_id' => $merchant->id, 'service_type' => 'sellable']);
        Service::factory()->create(['merchant_id' => $merchant->id, 'service_type' => 'bookable', 'duration' => 60]);

        $response = $this->getJson("/api/v1/merchants/{$merchant->id}/services?filter[service_type]=sellable");

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
    it('can create a sellable service', function () {
        $category = ServiceCategory::factory()->create();

        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/services", [
            'name' => 'Premium Haircut',
            'service_category_id' => $category->id,
            'description' => 'A premium haircut service',
            'price' => 25.00,
            'service_type' => 'sellable',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Service created successfully',
                'data' => [
                    'name' => 'Premium Haircut',
                    'slug' => 'premium-haircut',
                    'price' => '25.00',
                    'service_type' => 'sellable',
                ],
            ]);

        $this->assertDatabaseHas('services', [
            'merchant_id' => $this->merchant->id,
            'name' => 'Premium Haircut',
            'price' => 25.00,
            'service_type' => 'sellable',
        ]);
    });

    it('validates required fields', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/services", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'price', 'service_type']);
    });

    it('validates service_type must be valid enum', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/services", [
            'name' => 'Test Service',
            'price' => 10.00,
            'service_type' => 'invalid_type',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_type']);
    });

    it('validates price must be numeric', function () {
        $response = $this->postJson("/api/v1/merchants/{$this->merchant->id}/services", [
            'name' => 'Test Service',
            'price' => 'not-a-number',
            'service_type' => 'sellable',
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
                    'service_type' => 'sellable',
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

describe('Merchant Service Product Fields', function () {
    it('can create a sellable service with product fields', function () {
        $merchant = Merchant::factory()->create(['can_sell_products' => true]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Shampoo Bottle',
            'price' => 15.00,
            'service_type' => 'sellable',
            'sku' => 'SHP-001',
            'stock_quantity' => 100,
            'track_stock' => true,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'service_type' => 'sellable',
                    'sku' => 'SHP-001',
                    'stock_quantity' => 100,
                    'track_stock' => true,
                ],
            ]);
    });

    it('ignores product fields when merchant cannot sell products', function () {
        $merchant = Merchant::factory()->create(['can_sell_products' => false]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Basic Service',
            'price' => 10.00,
            'service_type' => 'sellable',
            'sku' => 'IGNORED-001',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'service_type' => 'sellable',
                    'sku' => null,
                ],
            ]);
    });

    it('enforces unique sku per merchant', function () {
        $merchant = Merchant::factory()->create(['can_sell_products' => true]);
        Service::factory()->create(['merchant_id' => $merchant->id, 'sku' => 'DUP-001']);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Duplicate SKU',
            'price' => 10.00,
            'service_type' => 'sellable',
            'sku' => 'DUP-001',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    });

    it('allows same sku on different merchants', function () {
        $merchant1 = Merchant::factory()->create(['can_sell_products' => true]);
        $merchant2 = Merchant::factory()->create(['can_sell_products' => true]);
        Service::factory()->create(['merchant_id' => $merchant1->id, 'sku' => 'SAME-001']);

        $response = $this->postJson("/api/v1/merchants/{$merchant2->id}/services", [
            'name' => 'Same SKU Different Merchant',
            'price' => 10.00,
            'service_type' => 'sellable',
            'sku' => 'SAME-001',
        ]);

        $response->assertStatus(201);
    });
});

describe('Merchant Service Booking Fields', function () {
    it('can create a bookable service when merchant can take bookings', function () {
        $merchant = Merchant::factory()->create(['can_take_bookings' => true]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Haircut',
            'price' => 25.00,
            'service_type' => 'bookable',
            'duration' => 60,
            'max_capacity' => 2,
            'requires_confirmation' => true,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'service_type' => 'bookable',
                    'duration' => 60,
                    'max_capacity' => 2,
                    'requires_confirmation' => true,
                ],
            ]);
    });

    it('ignores booking fields when merchant cannot take bookings', function () {
        $merchant = Merchant::factory()->create(['can_take_bookings' => false]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Basic Service',
            'price' => 10.00,
            'service_type' => 'bookable',
            'duration' => 30,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'service_type' => 'bookable',
                    'duration' => null,
                ],
            ]);
    });
});

describe('Merchant Service Reservation Fields', function () {
    it('can create a reservation-type service when merchant can rent units', function () {
        $merchant = Merchant::factory()->create(['can_rent_units' => true]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Deluxe Room',
            'price' => 3000.00,
            'service_type' => 'reservation',
            'price_per_night' => 2500.00,
            'floor' => '2nd',
            'unit_status' => 'available',
            'amenities' => ['WiFi', 'AC', 'TV'],
            'max_capacity' => 4,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'service_type' => 'reservation',
                    'price_per_night' => '2500.00',
                    'floor' => '2nd',
                    'unit_status' => 'available',
                    'amenities' => ['WiFi', 'AC', 'TV'],
                ],
            ]);
    });

    it('ignores reservation fields when merchant cannot rent units', function () {
        $merchant = Merchant::factory()->create(['can_rent_units' => false]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Basic Room',
            'price' => 1000.00,
            'service_type' => 'reservation',
            'price_per_night' => 1500.00,
            'floor' => '3rd',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'service_type' => 'reservation',
                    'price_per_night' => null,
                    'floor' => null,
                ],
            ]);
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

describe('Merchant Service Schedules', function () {
    it('can get service schedules', function () {
        $service = Service::factory()->bookable()->create(['merchant_id' => $this->merchant->id]);
        ServiceSchedule::create(['service_id' => $service->id, 'day_of_week' => 1, 'start_time' => '09:00', 'end_time' => '17:00', 'is_available' => true]);
        ServiceSchedule::create(['service_id' => $service->id, 'day_of_week' => 2, 'start_time' => '10:00', 'end_time' => '16:00', 'is_available' => true]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}/schedules");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'service_id', 'day_of_week', 'start_time', 'end_time', 'is_available'],
                ],
            ]);
    });

    it('can upsert service schedules', function () {
        $service = Service::factory()->bookable()->create(['merchant_id' => $this->merchant->id]);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}/schedules", [
            'schedules' => [
                ['day_of_week' => 1, 'start_time' => '09:00', 'end_time' => '17:00', 'is_available' => true],
                ['day_of_week' => 2, 'start_time' => '10:00', 'end_time' => '16:00', 'is_available' => true],
                ['day_of_week' => 0, 'start_time' => '00:00', 'end_time' => '00:01', 'is_available' => false],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Service schedules updated successfully'])
            ->assertJsonCount(3, 'data');

        $this->assertDatabaseCount('service_schedules', 3);
    });

    it('updates existing schedule for same day_of_week', function () {
        $service = Service::factory()->bookable()->create(['merchant_id' => $this->merchant->id]);
        ServiceSchedule::create(['service_id' => $service->id, 'day_of_week' => 1, 'start_time' => '09:00', 'end_time' => '17:00', 'is_available' => true]);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}/schedules", [
            'schedules' => [
                ['day_of_week' => 1, 'start_time' => '08:00', 'end_time' => '18:00', 'is_available' => true],
            ],
        ]);

        $response->assertStatus(200);

        // Should still be only 1 record for day 1, not 2
        expect(ServiceSchedule::where('service_id', $service->id)->where('day_of_week', 1)->count())->toBe(1);

        $this->assertDatabaseHas('service_schedules', [
            'service_id' => $service->id,
            'day_of_week' => 1,
            'start_time' => '08:00:00',
            'end_time' => '18:00:00',
        ]);
    });

    it('validates schedule fields', function () {
        $service = Service::factory()->create(['merchant_id' => $this->merchant->id]);

        $response = $this->putJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}/schedules", [
            'schedules' => [
                ['day_of_week' => 7, 'start_time' => 'invalid', 'end_time' => '17:00'],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['schedules.0.day_of_week', 'schedules.0.start_time']);
    });

    it('returns 404 for schedule of service belonging to another merchant', function () {
        $otherMerchant = Merchant::factory()->create();
        $service = Service::factory()->create(['merchant_id' => $otherMerchant->id]);

        $response = $this->getJson("/api/v1/merchants/{$this->merchant->id}/services/{$service->id}/schedules");

        $response->assertStatus(404);
    });
});

describe('Merchant Service Custom Fields', function () {
    it('can create a service with input custom field', function () {
        $businessType = BusinessType::factory()->create();
        $merchant = Merchant::factory()->create(['business_type_id' => $businessType->id]);

        $field = Field::factory()->input()->create(['label' => 'Room Size']);
        $btField = BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field->id,
            'is_required' => false,
        ]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Test Service',
            'price' => 100.00,
            'service_type' => 'sellable',
            'custom_fields' => [
                $btField->id => '150 sqm',
            ],
        ]);

        $response->assertStatus(201);
        expect($response->json('data.custom_fields'))->toHaveCount(1);
        expect($response->json('data.custom_fields.0.value'))->toBe('150 sqm');
        expect($response->json('data.custom_fields.0.field_value_id'))->toBeNull();
    });

    it('can create a service with select custom field', function () {
        $businessType = BusinessType::factory()->create();
        $merchant = Merchant::factory()->create(['business_type_id' => $businessType->id]);

        $field = Field::factory()->select()->create(['label' => 'Size']);
        $fv1 = FieldValue::factory()->create(['field_id' => $field->id, 'label' => 'Small', 'value' => 'small']);
        $fv2 = FieldValue::factory()->create(['field_id' => $field->id, 'label' => 'Large', 'value' => 'large']);

        $btField = BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field->id,
        ]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Test Service',
            'price' => 100.00,
            'service_type' => 'sellable',
            'custom_fields' => [
                $btField->id => $fv2->id,
            ],
        ]);

        $response->assertStatus(201);
        expect($response->json('data.custom_fields'))->toHaveCount(1);
        expect($response->json('data.custom_fields.0.field_value_id'))->toBe($fv2->id);
        expect($response->json('data.custom_fields.0.value'))->toBeNull();
    });

    it('can create a service with checkbox custom field (multiple values)', function () {
        $businessType = BusinessType::factory()->create();
        $merchant = Merchant::factory()->create(['business_type_id' => $businessType->id]);

        $field = Field::factory()->checkbox()->create(['label' => 'Amenities']);
        $fv1 = FieldValue::factory()->create(['field_id' => $field->id, 'label' => 'WiFi', 'value' => 'wifi']);
        $fv2 = FieldValue::factory()->create(['field_id' => $field->id, 'label' => 'Parking', 'value' => 'parking']);
        $fv3 = FieldValue::factory()->create(['field_id' => $field->id, 'label' => 'Pool', 'value' => 'pool']);

        $btField = BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field->id,
        ]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Test Service',
            'price' => 100.00,
            'service_type' => 'sellable',
            'custom_fields' => [
                $btField->id => [$fv1->id, $fv3->id],
            ],
        ]);

        $response->assertStatus(201);
        expect($response->json('data.custom_fields'))->toHaveCount(2);
    });

    it('can update custom field values', function () {
        $businessType = BusinessType::factory()->create();
        $merchant = Merchant::factory()->create(['business_type_id' => $businessType->id]);

        $field = Field::factory()->input()->create(['label' => 'Color']);
        $btField = BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field->id,
        ]);

        $service = Service::factory()->create(['merchant_id' => $merchant->id]);
        $service->customFieldValues()->create([
            'business_type_field_id' => $btField->id,
            'value' => 'Red',
        ]);

        $response = $this->putJson("/api/v1/merchants/{$merchant->id}/services/{$service->id}", [
            'custom_fields' => [
                $btField->id => 'Blue',
            ],
        ]);

        $response->assertStatus(200);
        expect($response->json('data.custom_fields'))->toHaveCount(1);
        expect($response->json('data.custom_fields.0.value'))->toBe('Blue');
    });

    it('shows custom fields on service detail', function () {
        $businessType = BusinessType::factory()->create();
        $merchant = Merchant::factory()->create(['business_type_id' => $businessType->id]);

        $field = Field::factory()->input()->create(['label' => 'Description']);
        $btField = BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field->id,
        ]);

        $service = Service::factory()->create(['merchant_id' => $merchant->id]);
        $service->customFieldValues()->create([
            'business_type_field_id' => $btField->id,
            'value' => 'Test value',
        ]);

        $response = $this->getJson("/api/v1/merchants/{$merchant->id}/services/{$service->id}");

        $response->assertStatus(200);
        expect($response->json('data.custom_fields'))->toHaveCount(1);
        expect($response->json('data.custom_fields.0.value'))->toBe('Test value');
        expect($response->json('data.custom_fields.0.business_type_field.field'))->not->toBeNull();
    });

    it('validates required custom fields on create', function () {
        $businessType = BusinessType::factory()->create();
        $merchant = Merchant::factory()->create(['business_type_id' => $businessType->id]);

        $field = Field::factory()->input()->create(['label' => 'Required Field']);
        BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field->id,
            'is_required' => true,
        ]);

        $response = $this->postJson("/api/v1/merchants/{$merchant->id}/services", [
            'name' => 'Test Service',
            'price' => 100.00,
            'service_type' => 'sellable',
            'custom_fields' => [],
        ]);

        $response->assertStatus(422);
    });
});
