<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferralRewardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'referral_id' => $this->referral_id,
            'customer_id' => $this->customer_id,
            'reward_type' => $this->reward_type,
            'reward_value' => $this->reward_value,
            'role' => $this->role,
            'status' => $this->status,
            'redeemed_at' => $this->redeemed_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'user' => $this->customer->user ? [
                    'id' => $this->customer->user->id,
                    'name' => $this->customer->user->name,
                ] : null,
            ]),
            'referral' => $this->whenLoaded('referral', fn () => [
                'id' => $this->referral->id,
                'status' => $this->referral->status,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
