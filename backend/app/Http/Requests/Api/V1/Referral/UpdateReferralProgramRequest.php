<?php

namespace App\Http\Requests\Api\V1\Referral;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReferralProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'referrer_reward_type' => ['sometimes', 'in:percentage,fixed'],
            'referrer_reward_value' => ['sometimes', 'numeric', 'min:0'],
            'referee_reward_type' => ['sometimes', 'in:percentage,fixed'],
            'referee_reward_value' => ['sometimes', 'numeric', 'min:0'],
            'max_referrals_per_customer' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'code_expiry_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'reward_expiry_days' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:365'],
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date', 'after:starts_at'],
        ];
    }
}
