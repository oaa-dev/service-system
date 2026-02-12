<?php

namespace App\Http\Requests\Api\V1\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
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
            'customer_type' => ['sometimes', 'string', Rule::in(['individual', 'corporate'])],
            'company_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
