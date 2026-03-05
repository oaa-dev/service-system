<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoyaltyStampResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'loyalty_card_id' => $this->loyalty_card_id,
            'qr_code_id' => $this->qr_code_id,
            'source' => $this->source,
            'notes' => $this->notes,
            'awarded_by' => $this->awarded_by,
            'earned_at' => $this->earned_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'expired' => $this->expired,
            'awarded_by_user' => $this->whenLoaded('awardedByUser', fn () => [
                'id' => $this->awardedByUser->id,
                'name' => $this->awardedByUser->name,
            ]),
        ];
    }
}
