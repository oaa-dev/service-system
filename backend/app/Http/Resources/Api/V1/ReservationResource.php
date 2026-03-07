<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'service_id' => $this->service_id,
            'customer_id' => $this->customer_id,
            'check_in' => $this->check_in?->format('Y-m-d'),
            'check_out' => $this->check_out?->format('Y-m-d'),
            'guest_count' => $this->guest_count,
            'nights' => $this->nights,
            'price_per_night' => $this->price_per_night,
            'total_price' => $this->total_price,
            'fee_rate' => $this->fee_rate,
            'fee_amount' => $this->fee_amount,
            'total_amount' => $this->total_amount,
            'discount_amount' => $this->discount_amount,
            'coupon_id' => $this->coupon_id,
            'coupon' => $this->whenLoaded('coupon', fn () => [
                'id' => $this->coupon->id,
                'code' => $this->coupon->code,
                'name' => $this->coupon->name,
                'discount_type' => $this->coupon->discount_type,
                'discount_value' => $this->coupon->discount_value,
            ]),
            'status' => $this->status,
            'notes' => $this->notes,
            'special_requests' => $this->special_requests,
            'confirmed_at' => $this->confirmed_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'checked_in_at' => $this->checked_in_at?->toISOString(),
            'checked_out_at' => $this->checked_out_at?->toISOString(),
            'service' => $this->whenLoaded('service', fn () => new ServiceResource($this->service)),
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
                'slug' => $this->merchant->slug,
                'logo' => $this->merchant->getFirstMediaUrl('logo', 'thumb') ?: null,
                'address' => $this->merchant->relationLoaded('address') && $this->merchant->address
                    ? new \App\Http\Resources\Api\V1\AddressResource($this->merchant->address)
                    : null,
            ]),
            'unit' => $this->whenLoaded('unit', fn () => [
                'id' => $this->unit->id,
                'name' => $this->unit->name,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
            ]),
            'payment_status' => $this->payment_status,
            'payment' => $this->whenLoaded('payment', fn () => new \App\Http\Resources\Api\V1\PaymentResource($this->payment)),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
