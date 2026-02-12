<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'first_name' => $this->user->profile?->first_name,
                'last_name' => $this->user->profile?->last_name,
                'email' => $this->user->email,
                'profile' => $this->user->relationLoaded('profile') && $this->user->profile ? new ProfileResource($this->user->profile) : null,
            ]),
            'customer_type' => $this->customer_type,
            'company_name' => $this->company_name,
            'customer_notes' => $this->customer_notes,
            'loyalty_points' => $this->loyalty_points,
            'customer_tier' => $this->customer_tier,
            'preferred_payment_method' => $this->preferred_payment_method,
            'communication_preference' => $this->communication_preference,
            'status' => $this->status,
            'tags' => $this->whenLoaded('tags', fn () => CustomerTagResource::collection($this->tags)),
            'documents' => $this->whenLoaded('documents', fn () => CustomerDocumentResource::collection($this->documents)),
            'interactions_count' => $this->when($this->relationLoaded('interactions'), fn () => $this->interactions->count()),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
