<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoyaltyRewardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'loyalty_card_id' => $this->loyalty_card_id,
            'loyalty_program_id' => $this->loyalty_program_id,
            'reward_type' => $this->reward_type,
            'reward_value' => $this->reward_value,
            'reward_product_id' => $this->reward_product_id,
            'reward_description' => $this->reward_description,
            'status' => $this->status,
            'earned_at' => $this->earned_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'redeemed_at' => $this->redeemed_at?->toISOString(),
            'reward_product' => $this->whenLoaded('rewardProduct', fn () => [
                'id' => $this->rewardProduct->id,
                'name' => $this->rewardProduct->name,
                'price' => $this->rewardProduct->price,
                'is_active' => $this->rewardProduct->is_active,
            ]),
            'loyalty_card' => $this->whenLoaded('loyaltyCard', fn () => [
                'id' => $this->loyaltyCard->id,
                'merchant' => $this->loyaltyCard->merchant ? [
                    'id' => $this->loyaltyCard->merchant->id,
                    'name' => $this->loyaltyCard->merchant->name,
                    'slug' => $this->loyaltyCard->merchant->slug,
                ] : null,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
