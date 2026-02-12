<?php

namespace App\Http\Requests\Api\V1\CustomerTag;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('customer_tags', 'name')->ignore($this->route('customerTag')),
            ],
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('customer_tags', 'slug')->ignore($this->route('customerTag')),
            ],
            'color' => ['nullable', 'string', 'max:7'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
