<?php

namespace App\Http\Requests\Api\V1\Loyalty;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLoyaltyProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'required_stamps' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'stamp_expiry_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'reward_expiry_days' => ['nullable', 'integer', 'min:1', 'max:365'],

            // Reward tiers (optional on update — if sent, replaces all tiers)
            'tiers' => ['sometimes', 'array', 'min:1'],
            'tiers.*.required_stamps' => ['required', 'integer', 'min:1', 'max:100'],
            'tiers.*.reward_type' => ['required', 'in:free_product,discount_percentage,discount_fixed'],
            'tiers.*.reward_value' => ['nullable', 'numeric', 'min:0'],
            'tiers.*.reward_product_id' => ['nullable', 'integer', 'exists:services,id'],
            'tiers.*.reward_description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
