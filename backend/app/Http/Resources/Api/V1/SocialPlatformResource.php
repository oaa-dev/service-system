<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SocialPlatformResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'base_url' => $this->base_url,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'icon' => $this->when($this->relationLoaded('media'), function () {
                $media = $this->getFirstMedia('icon');

                return $media ? [
                    'url' => $media->getUrl(),
                    'thumb' => $media->getUrl('thumb'),
                ] : null;
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
