<?php

use App\Models\Field;
use App\Models\FieldValue;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->actingUser = User::factory()->create();
    $this->actingUser->assignRole('super-admin');
    Passport::actingAs($this->actingUser);
});

describe('Field Index', function () {
    it('can list fields with pagination', function () {
        Field::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/fields');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['*' => ['id', 'label', 'name', 'type', 'config', 'is_active', 'sort_order', 'values']],
                'meta',
            ])
            ->assertJson(['success' => true]);
    });

    it('can filter fields by type', function () {
        Field::factory()->input()->count(2)->create();
        Field::factory()->select()->create();

        $response = $this->getJson('/api/v1/fields?filter[type]=input');

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(2);
    });

    it('can search fields by label', function () {
        Field::factory()->create(['label' => 'Room Size']);
        Field::factory()->create(['label' => 'Color']);

        $response = $this->getJson('/api/v1/fields?filter[search]=Room');

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(1);
        expect($response->json('data.0.label'))->toBe('Room Size');
    });
});

describe('Field All', function () {
    it('returns all fields without pagination', function () {
        Field::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/fields/all');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
        expect($response->json('data'))->toHaveCount(3);
    });
});

describe('Field Active', function () {
    it('returns only active fields', function () {
        Field::factory()->count(2)->create(['is_active' => true]);
        Field::factory()->inactive()->create();

        $response = $this->getJson('/api/v1/fields/active');

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(2);
    });

    it('includes field values for active fields', function () {
        $field = Field::factory()->select()->create(['is_active' => true]);
        FieldValue::factory()->count(3)->create(['field_id' => $field->id]);

        $response = $this->getJson('/api/v1/fields/active');

        $response->assertStatus(200);
        expect($response->json('data.0.values'))->toHaveCount(3);
    });
});

describe('Field Store', function () {
    it('can create an input field', function () {
        $response = $this->postJson('/api/v1/fields', [
            'label' => 'Room Size',
            'type' => 'input',
            'config' => ['is_number' => true, 'min' => 1, 'max' => 500, 'placeholder' => 'Enter size in sqm'],
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'label' => 'Room Size',
                    'name' => 'room_size',
                    'type' => 'input',
                    'is_active' => true,
                ],
            ]);
        expect($response->json('data.config.is_number'))->toBeTrue();
        expect($response->json('data.values'))->toBeEmpty();
    });

    it('can create a select field with values', function () {
        $response = $this->postJson('/api/v1/fields', [
            'label' => 'Size',
            'type' => 'select',
            'values' => [
                ['value' => 'small', 'sort_order' => 0],
                ['value' => 'medium', 'sort_order' => 1],
                ['value' => 'large', 'sort_order' => 2],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'label' => 'Size',
                    'type' => 'select',
                ],
            ]);
        expect($response->json('data.values'))->toHaveCount(3);
        expect($response->json('data.values.0.label'))->toBe('small');
        expect($response->json('data.values.0.value'))->toBe('small');
    });

    it('can create a checkbox field with values', function () {
        $response = $this->postJson('/api/v1/fields', [
            'label' => 'Amenities',
            'type' => 'checkbox',
            'values' => [
                ['value' => 'wifi'],
                ['value' => 'parking'],
                ['value' => 'pool'],
            ],
        ]);

        $response->assertStatus(201);
        expect($response->json('data.values'))->toHaveCount(3);
        expect($response->json('data.type'))->toBe('checkbox');
    });

    it('can create a radio field with values', function () {
        $response = $this->postJson('/api/v1/fields', [
            'label' => 'Priority',
            'type' => 'radio',
            'values' => [
                ['value' => 'low'],
                ['value' => 'medium'],
                ['value' => 'high'],
            ],
        ]);

        $response->assertStatus(201);
        expect($response->json('data.values'))->toHaveCount(3);
        expect($response->json('data.type'))->toBe('radio');
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/fields', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['label', 'type']);
    });

    it('validates type must be valid enum', function () {
        $response = $this->postJson('/api/v1/fields', [
            'label' => 'Test',
            'type' => 'invalid',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    });

    it('requires values for select type', function () {
        $response = $this->postJson('/api/v1/fields', [
            'label' => 'Color',
            'type' => 'select',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['values']);
    });

    it('requires values for checkbox type', function () {
        $response = $this->postJson('/api/v1/fields', [
            'label' => 'Features',
            'type' => 'checkbox',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['values']);
    });

    it('auto-generates name from label', function () {
        $response = $this->postJson('/api/v1/fields', [
            'label' => 'Floor Number',
            'type' => 'input',
        ]);

        $response->assertStatus(201);
        expect($response->json('data.name'))->toBe('floor_number');
    });
});

describe('Field Show', function () {
    it('can show a specific field with values', function () {
        $field = Field::factory()->select()->create();
        FieldValue::factory()->count(3)->create(['field_id' => $field->id]);

        $response = $this->getJson("/api/v1/fields/{$field->id}");

        $response->assertStatus(200)
            ->assertJson(['data' => ['id' => $field->id]])
            ->assertJsonStructure(['data' => ['values']]);
        expect($response->json('data.values'))->toHaveCount(3);
    });
});

describe('Field Update', function () {
    it('can update a field', function () {
        $field = Field::factory()->create(['label' => 'Old Label']);

        $response = $this->putJson("/api/v1/fields/{$field->id}", [
            'label' => 'New Label',
            'is_active' => false,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'label' => 'New Label',
                    'is_active' => false,
                ],
            ]);
    });

    it('can update field values', function () {
        $field = Field::factory()->select()->create();
        FieldValue::factory()->count(2)->create(['field_id' => $field->id]);

        $response = $this->putJson("/api/v1/fields/{$field->id}", [
            'values' => [
                ['value' => 'option_a', 'sort_order' => 0],
                ['value' => 'option_b', 'sort_order' => 1],
                ['value' => 'option_c', 'sort_order' => 2],
            ],
        ]);

        $response->assertStatus(200);
        expect($response->json('data.values'))->toHaveCount(3);
        expect($response->json('data.values.0.label'))->toBe('option_a');
    });

    it('enforces unique name', function () {
        Field::factory()->create(['name' => 'existing_name']);
        $field = Field::factory()->create();

        $response = $this->putJson("/api/v1/fields/{$field->id}", [
            'name' => 'existing_name',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});

describe('Field Delete', function () {
    it('can delete a field', function () {
        $field = Field::factory()->create();

        $response = $this->deleteJson("/api/v1/fields/{$field->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('fields', ['id' => $field->id]);
    });

    it('cascades delete to field values', function () {
        $field = Field::factory()->select()->create();
        FieldValue::factory()->count(3)->create(['field_id' => $field->id]);

        $this->deleteJson("/api/v1/fields/{$field->id}");

        $this->assertDatabaseMissing('field_values', ['field_id' => $field->id]);
    });

    it('returns 422 for non-existent field', function () {
        $response = $this->deleteJson('/api/v1/fields/99999');

        $response->assertStatus(422);
    });
});
