<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\CustomerPortal;

use Illuminate\Foundation\Http\FormRequest;

class CreateCustomerOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'exists:services,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit_label' => ['required', 'string', 'max:50'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
