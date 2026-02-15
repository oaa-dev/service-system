<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $branchId = $this->route('branch');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('merchants', 'slug')->ignore($branchId),
            ],
            'business_type_id' => ['nullable', 'integer', 'exists:business_types,id'],
            'description' => ['nullable', 'string'],
            'contact_email' => ['nullable', 'string', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'address' => ['sometimes', 'nullable', 'array'],
            'address.street' => ['nullable', 'string', 'max:255'],
            'address.region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'address.province_id' => ['nullable', 'integer', 'exists:provinces,id'],
            'address.city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'address.barangay_id' => ['nullable', 'integer', 'exists:barangays,id'],
            'address.postal_code' => ['nullable', 'string', 'max:20'],
            'can_sell_products' => ['sometimes', 'boolean'],
            'can_take_bookings' => ['sometimes', 'boolean'],
            'can_rent_units' => ['sometimes', 'boolean'],
        ];
    }
}
