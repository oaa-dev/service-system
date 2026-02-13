<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMyMerchantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $merchantId = $this->user()->merchant?->id;

        return [
            'business_type_id' => ['nullable', 'integer', 'exists:business_types,id'],
            'type' => ['sometimes', 'string', Rule::in(['individual', 'organization'])],
            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('merchants', 'slug')->ignore($merchantId),
            ],
            'description' => ['nullable', 'string'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'address' => ['sometimes', 'nullable', 'array'],
            'address.street' => ['nullable', 'string', 'max:255'],
            'address.region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'address.province_id' => ['nullable', 'integer', 'exists:provinces,id'],
            'address.city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'address.barangay_id' => ['nullable', 'integer', 'exists:barangays,id'],
            'address.postal_code' => ['nullable', 'string', 'max:20'],
        ];
    }
}
