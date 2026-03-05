<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferralProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'name' => $this->name,
            'description' => $this->description,
            'referrer_reward_type' => $this->referrer_reward_type,
            'referrer_reward_value' => $this->referrer_reward_value,
            'referee_reward_type' => $this->referee_reward_type,
            'referee_reward_value' => $this->referee_reward_value,
            'max_referrals_per_customer' => $this->max_referrals_per_customer,
            'code_expiry_days' => $this->code_expiry_days,
            'reward_expiry_days' => $this->reward_expiry_days,
            'is_active' => $this->is_active,
            'starts_at' => $this->starts_at?->toISOString(),
            'ends_at' => $this->ends_at?->toISOString(),
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
                'slug' => $this->merchant->slug,
            ]),
            'is_inherited' => $this->getAttribute('is_inherited') ?? false,
            'referrals_count' => $this->whenCounted('referrals'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
