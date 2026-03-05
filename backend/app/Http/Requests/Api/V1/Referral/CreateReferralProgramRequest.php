<?php

namespace App\Http\Requests\Api\V1\Referral;

use Illuminate\Foundation\Http\FormRequest;

class CreateReferralProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'referrer_reward_type' => ['required', 'in:percentage,fixed'],
            'referrer_reward_value' => ['required', 'numeric', 'min:0'],
            'referee_reward_type' => ['required', 'in:percentage,fixed'],
            'referee_reward_value' => ['required', 'numeric', 'min:0'],
            'max_referrals_per_customer' => ['nullable', 'integer', 'min:1'],
            'code_expiry_days' => ['required', 'integer', 'min:1', 'max:365'],
            'reward_expiry_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
        ];
    }
}
