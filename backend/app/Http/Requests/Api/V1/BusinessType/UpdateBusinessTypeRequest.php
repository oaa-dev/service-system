<?php

namespace App\Http\Requests\Api\V1\BusinessType;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBusinessTypeRequest extends FormRequest
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
                Rule::unique('business_types', 'name')->ignore($this->route('businessType')),
            ],
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('business_types', 'slug')->ignore($this->route('businessType')),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
