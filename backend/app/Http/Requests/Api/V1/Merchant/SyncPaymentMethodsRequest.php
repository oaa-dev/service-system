<?php

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;

class SyncPaymentMethodsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_method_ids' => ['required', 'array'],
            'payment_method_ids.*' => ['integer', 'exists:payment_methods,id'],
        ];
    }
}
