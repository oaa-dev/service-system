<?php

namespace App\Http\Requests\Api\V1\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'preferred_payment_method' => ['nullable', 'string', Rule::in(['cash', 'e-wallet', 'card'])],
            'communication_preference' => ['sometimes', 'string', Rule::in(['sms', 'email', 'both'])],
        ];
    }
}
