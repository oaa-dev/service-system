<?php

namespace App\Http\Requests\Api\V1\PlatformFee;

use Illuminate\Foundation\Http\FormRequest;

class StorePlatformFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:platform_fees,name'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:platform_fees,slug'],
            'description' => ['nullable', 'string'],
            'transaction_type' => ['required', 'in:booking,reservation,sell_product'],
            'rate_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
