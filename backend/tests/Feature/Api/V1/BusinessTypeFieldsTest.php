<?php

use App\Models\BusinessType;
use App\Models\BusinessTypeField;
use App\Models\Field;
use App\Models\FieldValue;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('BusinessType Fields Get', function () {
    it('can get fields linked to a business type', function () {
        $businessType = BusinessType::factory()->create();
        $field1 = Field::factory()->select()->create();
        $field2 = Field::factory()->input()->create();
        FieldValue::factory()->count(3)->create(['field_id' => $field1->id]);

        BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field1->id,
            'is_required' => true,
            'sort_order' => 0,
        ]);
        BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field2->id,
            'is_required' => false,
            'sort_order' => 1,
        ]);

        $response = $this->getJson("/api/v1/business-types/{$businessType->id}/fields");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
        expect($response->json('data'))->toHaveCount(2);
        expect($response->json('data.0.field'))->not->toBeNull();
        expect($response->json('data.0.field.values'))->toHaveCount(3);
    });

    it('returns empty array when no fields linked', function () {
        $businessType = BusinessType::factory()->create();

        $response = $this->getJson("/api/v1/business-types/{$businessType->id}/fields");

        $response->assertStatus(200);
        expect($response->json('data'))->toBeEmpty();
    });
});

describe('BusinessType Fields Sync', function () {
    it('can sync fields to a business type', function () {
        $businessType = BusinessType::factory()->create();
        $field1 = Field::factory()->create();
        $field2 = Field::factory()->create();

        $response = $this->putJson("/api/v1/business-types/{$businessType->id}/fields", [
            'fields' => [
                ['field_id' => $field1->id, 'is_required' => true, 'sort_order' => 0],
                ['field_id' => $field2->id, 'is_required' => false, 'sort_order' => 1],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
        expect($response->json('data'))->toHaveCount(2);
        expect($response->json('data.0.is_required'))->toBeTrue();
        expect($response->json('data.0.field'))->not->toBeNull();
    });

    it('replaces existing fields on sync', function () {
        $businessType = BusinessType::factory()->create();
        $field1 = Field::factory()->create();
        $field2 = Field::factory()->create();
        $field3 = Field::factory()->create();

        // Initial sync
        $this->putJson("/api/v1/business-types/{$businessType->id}/fields", [
            'fields' => [
                ['field_id' => $field1->id],
                ['field_id' => $field2->id],
            ],
        ]);

        // Re-sync with different fields
        $response = $this->putJson("/api/v1/business-types/{$businessType->id}/fields", [
            'fields' => [
                ['field_id' => $field3->id, 'is_required' => true],
            ],
        ]);

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(1);
        expect($response->json('data.0.field_id'))->toBe($field3->id);

        $this->assertDatabaseMissing('business_type_fields', [
            'business_type_id' => $businessType->id,
            'field_id' => $field1->id,
        ]);
    });

    it('validates field_id must exist', function () {
        $businessType = BusinessType::factory()->create();

        $response = $this->putJson("/api/v1/business-types/{$businessType->id}/fields", [
            'fields' => [
                ['field_id' => 99999],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['fields.0.field_id']);
    });

    it('validates fields array is required', function () {
        $businessType = BusinessType::factory()->create();

        $response = $this->putJson("/api/v1/business-types/{$businessType->id}/fields", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['fields']);
    });

    it('includes field values in sync response', function () {
        $businessType = BusinessType::factory()->create();
        $field = Field::factory()->select()->create();
        FieldValue::factory()->count(3)->create(['field_id' => $field->id]);

        $response = $this->putJson("/api/v1/business-types/{$businessType->id}/fields", [
            'fields' => [
                ['field_id' => $field->id, 'is_required' => true],
            ],
        ]);

        $response->assertStatus(200);
        expect($response->json('data.0.field.values'))->toHaveCount(3);
    });
});

describe('BusinessType Show includes fields', function () {
    it('includes fields when showing a business type', function () {
        $businessType = BusinessType::factory()->create();
        $field = Field::factory()->select()->create();
        FieldValue::factory()->count(2)->create(['field_id' => $field->id]);

        BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field->id,
            'is_required' => true,
        ]);

        $response = $this->getJson("/api/v1/business-types/{$businessType->id}");

        $response->assertStatus(200);
        expect($response->json('data.fields'))->toHaveCount(1);
        expect($response->json('data.fields.0.field.values'))->toHaveCount(2);
    });
});

describe('BusinessType Active includes fields', function () {
    it('includes fields when listing active business types', function () {
        $businessType = BusinessType::factory()->create(['is_active' => true]);
        $field = Field::factory()->create();

        BusinessTypeField::create([
            'business_type_id' => $businessType->id,
            'field_id' => $field->id,
        ]);

        $response = $this->getJson('/api/v1/business-types/active');

        $response->assertStatus(200);
        $data = collect($response->json('data'))->firstWhere('id', $businessType->id);
        expect($data['fields'])->toHaveCount(1);
    });
});
