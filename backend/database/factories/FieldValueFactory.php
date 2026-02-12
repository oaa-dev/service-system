<?php

namespace Database\Factories;

use App\Models\Field;
use App\Models\FieldValue;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class FieldValueFactory extends Factory
{
    protected $model = FieldValue::class;

    public function definition(): array
    {
        $label = fake()->unique()->word();

        return [
            'field_id' => Field::factory()->select(),
            'label' => ucfirst($label),
            'value' => Str::slug($label),
            'sort_order' => fake()->numberBetween(0, 10),
        ];
    }
}
