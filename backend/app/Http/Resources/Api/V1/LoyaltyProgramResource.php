<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoyaltyProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'name' => $this->name,
            'description' => $this->description,
            'required_stamps' => $this->required_stamps,
            'stamp_expiry_days' => $this->stamp_expiry_days,
            'reward_expiry_days' => $this->reward_expiry_days,
            'is_active' => $this->is_active,
            'tiers' => $this->whenLoaded('tiers', fn () => $this->tiers->map(fn ($tier) => [
                'id' => $tier->id,
                'required_stamps' => $tier->required_stamps,
                'reward_type' => $tier->reward_type,
                'reward_value' => $tier->reward_value,
                'reward_product_id' => $tier->reward_product_id,
                'reward_description' => $tier->reward_description,
                'reward_product' => $tier->relationLoaded('rewardProduct') && $tier->rewardProduct ? [
                    'id' => $tier->rewardProduct->id,
                    'name' => $tier->rewardProduct->name,
                    'price' => $tier->rewardProduct->price,
                ] : null,
            ])),
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
                'slug' => $this->merchant->slug,
            ]),
            'is_inherited' => $this->getAttribute('is_inherited') ?? false,
            'cards_count' => $this->whenCounted('loyaltyCards'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
