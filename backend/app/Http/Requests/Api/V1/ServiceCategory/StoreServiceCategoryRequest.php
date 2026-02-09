<?php

namespace App\Http\Requests\Api\V1\ServiceCategory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $merchantId = $this->route('merchant');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('service_categories', 'name')->where('merchant_id', $merchantId),
            ],
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('service_categories', 'slug')->where('merchant_id', $merchantId),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
