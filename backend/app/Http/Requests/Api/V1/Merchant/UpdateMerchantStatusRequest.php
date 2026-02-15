<?php

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMerchantStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(['pending', 'submitted', 'approved', 'active', 'rejected', 'suspended'])],
            'status_reason' => ['nullable', 'required_if:status,rejected,suspended', 'string', 'max:1000'],
        ];
    }
}
