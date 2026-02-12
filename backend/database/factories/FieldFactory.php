<?php

namespace Database\Factories;

use App\Models\Field;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class FieldFactory extends Factory
{
    protected $model = Field::class;

    public function definition(): array
    {
        $label = fake()->unique()->words(2, true);

        return [
            'label' => ucwords($label),
            'name' => Str::slug($label, '_'),
            'type' => 'input',
            'config' => null,
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }

    public function input(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'input',
            'config' => ['is_number' => false, 'placeholder' => '', 'default_value' => ''],
        ]);
    }

    public function numberInput(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'input',
            'config' => ['is_number' => true, 'min' => 0, 'max' => 100, 'placeholder' => '', 'default_value' => ''],
        ]);
    }

    public function select(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'select',
        ]);
    }

    public function checkbox(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'checkbox',
        ]);
    }

    public function radio(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'radio',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
