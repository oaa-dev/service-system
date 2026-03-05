<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoyaltyCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'merchant_id' => $this->merchant_id,
            'loyalty_program_id' => $this->loyalty_program_id,
            'current_stamps' => $this->current_stamps,
            'total_stamps_earned' => $this->total_stamps_earned,
            'total_rewards_earned' => $this->total_rewards_earned,
            'total_rewards_redeemed' => $this->total_rewards_redeemed,
            'last_stamp_at' => $this->last_stamp_at?->toISOString(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->user?->name,
            ]),
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
                'slug' => $this->merchant->slug,
                'logo' => $this->merchant->hasMedia('logo')
                    ? $this->merchant->getFirstMediaUrl('logo', 'thumb')
                    : null,
            ]),
            'loyalty_program' => $this->whenLoaded('loyaltyProgram', fn () => new LoyaltyProgramResource($this->loyaltyProgram)),
            'stamps' => $this->whenLoaded('stamps', fn () => LoyaltyStampResource::collection($this->stamps)),
            'rewards' => $this->whenLoaded('rewards', fn () => LoyaltyRewardResource::collection($this->rewards)),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
