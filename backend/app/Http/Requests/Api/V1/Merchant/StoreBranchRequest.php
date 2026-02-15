<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'user_name' => ['required', 'string', 'max:255'],
            'user_email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'user_password' => ['required', 'string', 'min:8'],
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
