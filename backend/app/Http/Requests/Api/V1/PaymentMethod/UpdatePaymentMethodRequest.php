<?php

namespace App\Http\Requests\Api\V1\PaymentMethod;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('payment_methods', 'name')->ignore($this->route('paymentMethod')),
            ],
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('payment_methods', 'slug')->ignore($this->route('paymentMethod')),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
