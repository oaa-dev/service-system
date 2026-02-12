<?php

namespace App\Http\Requests\Api\V1\PlatformFee;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlatformFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('platform_fees', 'name')->ignore($this->route('platformFee'))],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('platform_fees', 'slug')->ignore($this->route('platformFee'))],
            'description' => ['nullable', 'string'],
            'transaction_type' => ['sometimes', 'in:booking,reservation,sell_product'],
            'rate_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
