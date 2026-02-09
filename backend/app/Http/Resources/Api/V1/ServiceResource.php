<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'service_category_id' => $this->service_category_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'is_active' => $this->is_active,
            'service_category' => $this->whenLoaded('serviceCategory', fn () => new ServiceCategoryResource($this->serviceCategory)),
            'image' => $this->when($this->hasMedia('image'), fn () => [
                'url' => $this->getFirstMediaUrl('image'),
                'thumb' => $this->getFirstMediaUrl('image', 'thumb'),
                'preview' => $this->getFirstMediaUrl('image', 'preview'),
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
