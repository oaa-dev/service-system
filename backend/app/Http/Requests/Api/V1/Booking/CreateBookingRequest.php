<?php

namespace App\Http\Requests\Api\V1\Booking;

use Illuminate\Foundation\Http\FormRequest;

class CreateBookingRequest extends FormRequest
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
            'booking_slot_id' => ['nullable', 'integer', 'exists:merchant_booking_slots,id'],
            'start_time' => ['required_without:booking_slot_id', 'nullable', 'date_format:H:i'],
            'party_size' => ['sometimes', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'loyalty_reward_id' => ['nullable', 'integer', 'exists:loyalty_rewards,id'],
        ];
    }
}
