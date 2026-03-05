<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoyaltyStampQrCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'token' => $this->token,
            'mode' => $this->mode,
            'expires_at' => $this->expires_at?->toISOString(),
            'is_used' => $this->is_used,
            'scan_count' => $this->scan_count,
            'is_expired' => $this->isExpired(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
