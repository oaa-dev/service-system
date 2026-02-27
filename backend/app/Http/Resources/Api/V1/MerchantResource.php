<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MerchantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'parent_id' => $this->parent_id,
            'business_type_id' => $this->business_type_id,
            'type' => $this->type,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'website' => $this->website,
            'status' => $this->status,
            'status_changed_at' => $this->status_changed_at?->toISOString(),
            'status_reason' => $this->status_reason,
            'approved_at' => $this->approved_at?->toISOString(),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'accepted_terms_at' => $this->accepted_terms_at?->toISOString(),
            'terms_version' => $this->terms_version,
            'can_sell_products' => $this->can_sell_products,
            'can_take_bookings' => $this->can_take_bookings,
            'can_rent_units' => $this->can_rent_units,
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
            'business_type' => $this->whenLoaded('businessType', fn () => new BusinessTypeResource($this->businessType)),
            'address' => $this->whenLoaded('address', fn () => $this->address ? new AddressResource($this->address) : null),
            'parent' => $this->whenLoaded('parent', fn () => $this->parent ? [
                'id' => $this->parent->id,
                'name' => $this->parent->name,
            ] : null),
            'payment_methods' => $this->whenLoaded('paymentMethods', fn () => PaymentMethodResource::collection($this->paymentMethods)),
            'social_links' => $this->whenLoaded('socialLinks', fn () => MerchantSocialLinkResource::collection($this->socialLinks)),
            'documents' => $this->whenLoaded('documents', fn () => MerchantDocumentResource::collection($this->documents)),
            'business_hours' => $this->whenLoaded('businessHours', fn () => MerchantBusinessHourResource::collection($this->businessHours)),
            'children' => $this->whenLoaded('children', fn () => MerchantResource::collection($this->children)),
            'children_count' => $this->when($this->children_count !== null, $this->children_count),
            'status_logs' => $this->whenLoaded('statusLogs', fn () => MerchantStatusLogResource::collection($this->statusLogs)),
            'service_categories' => $this->whenLoaded('serviceCategories', fn () => ServiceCategoryResource::collection($this->serviceCategories)),
            'logo' => $this->when($this->hasMedia('logo'), fn () => [
                'url' => $this->getFirstMediaUrl('logo'),
                'thumb' => $this->getFirstMediaUrl('logo', 'thumb'),
                'preview' => $this->getFirstMediaUrl('logo', 'preview'),
            ]),
            'gallery_feature' => $this->when($this->hasMedia('gallery_feature'), fn () => [
                'url' => $this->getFirstMediaUrl('gallery_feature'),
                'thumb' => $this->getFirstMediaUrl('gallery_feature', 'thumb'),
                'preview' => $this->getFirstMediaUrl('gallery_feature', 'preview'),
            ]),
            'gallery_photos' => $this->when($this->getMedia('gallery_photos')->isNotEmpty(), fn () =>
                $this->getMedia('gallery_photos')->map(fn ($m) => [
                    'id' => $m->id,
                    'url' => $m->getUrl(),
                    'thumb' => $m->getUrl('thumb'),
                    'preview' => $m->getUrl('preview'),
                    'name' => $m->file_name,
                ])->values()
            ),
            'gallery_interiors' => $this->when($this->getMedia('gallery_interiors')->isNotEmpty(), fn () =>
                $this->getMedia('gallery_interiors')->map(fn ($m) => [
                    'id' => $m->id,
                    'url' => $m->getUrl(),
                    'thumb' => $m->getUrl('thumb'),
                    'preview' => $m->getUrl('preview'),
                    'name' => $m->file_name,
                ])->values()
            ),
            'gallery_exteriors' => $this->when($this->getMedia('gallery_exteriors')->isNotEmpty(), fn () =>
                $this->getMedia('gallery_exteriors')->map(fn ($m) => [
                    'id' => $m->id,
                    'url' => $m->getUrl(),
                    'thumb' => $m->getUrl('thumb'),
                    'preview' => $m->getUrl('preview'),
                    'name' => $m->file_name,
                ])->values()
            ),
            'distance' => $this->when($this->resource->getAttribute('distance') !== null, fn () => round((float) $this->distance, 2)),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
