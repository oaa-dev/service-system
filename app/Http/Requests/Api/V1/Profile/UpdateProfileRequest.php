<?php

namespace App\Http\Requests\Api\V1\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today'],
            'gender' => ['sometimes', 'nullable', 'in:male,female,other'],
            'address' => ['sometimes', 'nullable', 'array'],
            'address.street' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address.city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'address.state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'address.postal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'address.country' => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }
}
