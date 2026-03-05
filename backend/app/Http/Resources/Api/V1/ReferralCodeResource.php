<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferralCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'referral_program_id' => $this->referral_program_id,
            'customer_id' => $this->customer_id,
            'code' => $this->code,
            'uses_count' => $this->uses_count,
            'max_uses' => $this->max_uses,
            'expires_at' => $this->expires_at?->toISOString(),
            'is_active' => $this->is_active,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'user' => $this->customer->user ? [
                    'id' => $this->customer->user->id,
                    'name' => $this->customer->user->name,
                ] : null,
            ]),
            'referral_program' => $this->whenLoaded('referralProgram', fn () => new ReferralProgramResource($this->referralProgram)),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
