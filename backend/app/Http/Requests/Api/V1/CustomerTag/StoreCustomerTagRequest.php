<?php

namespace App\Http\Requests\Api\V1\CustomerTag;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:customer_tags,name'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:customer_tags,slug'],
            'color' => ['nullable', 'string', 'max:7'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
