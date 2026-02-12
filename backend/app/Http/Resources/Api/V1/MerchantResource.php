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
            'logo' => $this->when($this->hasMedia('logo'), fn () => [
                'url' => $this->getFirstMediaUrl('logo'),
                'thumb' => $this->getFirstMediaUrl('logo', 'thumb'),
                'preview' => $this->getFirstMediaUrl('logo', 'preview'),
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
