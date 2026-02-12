<?php

namespace App\Http\Requests\Api\V1\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_type' => ['sometimes', 'string', Rule::in(['individual', 'corporate'])],
            'company_name' => ['nullable', 'string', 'max:255'],
            'customer_notes' => ['nullable', 'string'],
            'loyalty_points' => ['sometimes', 'integer', 'min:0'],
            'customer_tier' => ['sometimes', 'string', Rule::in(['regular', 'silver', 'gold', 'platinum'])],
            'preferred_payment_method' => ['nullable', 'string', Rule::in(['cash', 'e-wallet', 'card'])],
            'communication_preference' => ['sometimes', 'string', Rule::in(['sms', 'email', 'both'])],
        ];
    }
}
