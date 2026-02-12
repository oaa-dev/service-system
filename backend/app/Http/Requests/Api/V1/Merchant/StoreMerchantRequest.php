<?php

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMerchantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_first_name' => ['required', 'string', 'max:255'],
            'user_last_name' => ['required', 'string', 'max:255'],
            'user_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'user_password' => ['required', 'string', 'min:8'],
            'parent_id' => ['nullable', 'integer', 'exists:merchants,id'],
            'business_type_id' => ['nullable', 'integer', 'exists:business_types,id'],
            'type' => ['sometimes', 'string', Rule::in(['individual', 'organization'])],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:merchants,slug'],
            'description' => ['nullable', 'string'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
