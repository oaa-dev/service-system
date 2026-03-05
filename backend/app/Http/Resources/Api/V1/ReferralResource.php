<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferralResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'referral_code_id' => $this->referral_code_id,
            'referral_program_id' => $this->referral_program_id,
            'referrer_customer_id' => $this->referrer_customer_id,
            'referee_customer_id' => $this->referee_customer_id,
            'status' => $this->status,
            'completed_at' => $this->completed_at?->toISOString(),
            'qualifying_type' => $this->qualifying_type,
            'qualifying_id' => $this->qualifying_id,
            'referrer_customer' => $this->whenLoaded('referrerCustomer', fn () => [
                'id' => $this->referrerCustomer->id,
                'user' => $this->referrerCustomer->user ? [
                    'id' => $this->referrerCustomer->user->id,
                    'name' => $this->referrerCustomer->user->name,
                ] : null,
            ]),
            'referee_customer' => $this->whenLoaded('refereeCustomer', fn () => [
                'id' => $this->refereeCustomer->id,
                'user' => $this->refereeCustomer->user ? [
                    'id' => $this->refereeCustomer->user->id,
                    'name' => $this->refereeCustomer->user->name,
                ] : null,
            ]),
            'rewards' => $this->whenLoaded('rewards', fn () => ReferralRewardResource::collection($this->rewards)),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
