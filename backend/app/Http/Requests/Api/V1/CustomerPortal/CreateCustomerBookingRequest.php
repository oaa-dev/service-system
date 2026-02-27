<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\CustomerPortal;

use Illuminate\Foundation\Http\FormRequest;

class CreateCustomerBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'exists:services,id'],
            'booking_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'party_size' => ['sometimes', 'integer', 'min:1'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
