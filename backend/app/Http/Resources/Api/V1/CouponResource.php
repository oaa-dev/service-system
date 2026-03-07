<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'target_merchant_id' => $this->target_merchant_id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'min_order_amount' => $this->min_order_amount,
            'max_uses' => $this->max_uses,
            'max_uses_per_customer' => $this->max_uses_per_customer,
            'used_count' => $this->used_count,
            'reset_period' => $this->reset_period,
            'applicable_to' => $this->applicable_to,
            'starts_at' => $this->starts_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'is_active' => $this->is_active,
            'is_public' => $this->is_public,
            'is_claimable' => $this->is_claimable,
            'claim_validity_hours' => $this->claim_validity_hours,
            'valid_schedule' => $this->valid_schedule,
            'is_valid' => $this->is_active
                && $this->starts_at <= now()
                && ($this->expires_at === null || $this->expires_at >= now())
                && ($this->max_uses === null || $this->used_count < $this->max_uses),
            'is_inherited' => $this->is_inherited ?? false,
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
                'slug' => $this->merchant->slug,
            ]),
            'target_merchant' => $this->whenLoaded('targetMerchant', fn () => [
                'id' => $this->targetMerchant->id,
                'name' => $this->targetMerchant->name,
                'slug' => $this->targetMerchant->slug,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'claim' => $this->whenLoaded('claims', function () {
                $claim = $this->claims->first();
                if (! $claim) {
                    return null;
                }

                return [
                    'claimed_at' => $claim->claimed_at->toISOString(),
                    'expires_at' => $claim->expires_at->toISOString(),
                    'used_at' => $claim->used_at?->toISOString(),
                    'is_expired' => $claim->isExpired(),
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
