<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdvertisementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $media = $this->getFirstMedia('ad_image');

        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'placement' => $this->placement,
            'target_audience' => $this->target_audience,
            'link_url' => $this->link_url,
            'link_text' => $this->link_text,
            'is_active' => $this->is_active,
            'starts_at' => $this->starts_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'sort_order' => $this->sort_order,
            'impressions' => $this->impressions,
            'clicks' => $this->clicks,
            'is_valid' => $this->is_active
                && $this->starts_at <= now()
                && ($this->expires_at === null || $this->expires_at >= now()),
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
                'slug' => $this->merchant->slug,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'image' => $media ? [
                'url' => $this->getFirstMediaUrl('ad_image'),
                'thumb' => $this->getFirstMediaUrl('ad_image', 'thumb'),
                'preview' => $this->getFirstMediaUrl('ad_image', 'preview'),
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
