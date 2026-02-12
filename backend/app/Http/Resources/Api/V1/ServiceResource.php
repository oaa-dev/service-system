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
            'service_type' => $this->service_type,
            // sellable fields
            'sku' => $this->sku,
            'stock_quantity' => $this->stock_quantity,
            'track_stock' => $this->track_stock,
            // bookable fields
            'duration' => $this->duration,
            'max_capacity' => $this->max_capacity,
            'requires_confirmation' => $this->requires_confirmation,
            // reservation fields
            'price_per_night' => $this->price_per_night,
            'floor' => $this->floor,
            'unit_status' => $this->unit_status,
            'amenities' => $this->amenities,
            'custom_fields' => BusinessTypeFieldValueResource::collection($this->whenLoaded('customFieldValues')),
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
