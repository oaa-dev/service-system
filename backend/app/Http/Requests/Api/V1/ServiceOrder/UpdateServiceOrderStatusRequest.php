<?php

namespace App\Http\Requests\Api\V1\ServiceOrder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['received', 'processing', 'ready', 'delivering', 'completed', 'cancelled'])],
            'payment_action' => ['nullable', Rule::in(['request_payment', 'mark_cash'])],
        ];
    }
}
