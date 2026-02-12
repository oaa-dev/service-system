<?php

namespace App\Http\Requests\Api\V1\BusinessType;

use Illuminate\Foundation\Http\FormRequest;

class StoreBusinessTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:business_types,name'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:business_types,slug'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'can_sell_products' => ['sometimes', 'boolean'],
            'can_take_bookings' => ['sometimes', 'boolean'],
            'can_rent_units' => ['sometimes', 'boolean'],
        ];
    }
}
