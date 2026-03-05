<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'customer_id' => $this->customer_id,
            'rating' => $this->rating,
            'title' => $this->title,
            'comment' => $this->comment,
            'is_verified' => $this->is_verified,
            'is_published' => $this->is_published,
            'merchant_reply' => $this->merchant_reply,
            'merchant_replied_at' => $this->merchant_replied_at?->toISOString(),
            'admin_notes' => $this->admin_notes,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->user?->name,
                'avatar' => $this->customer->user?->profile?->hasMedia('avatar')
                    ? $this->customer->user->profile->getFirstMediaUrl('avatar', 'thumb')
                    : null,
            ]),
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
                'slug' => $this->merchant->slug,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
