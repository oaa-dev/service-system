<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'service_id' => $this->service_id,
            'customer_id' => $this->customer_id,
            'booking_date' => $this->booking_date?->format('Y-m-d'),
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'party_size' => $this->party_size,
            'service_price' => $this->service_price,
            'fee_rate' => $this->fee_rate,
            'fee_amount' => $this->fee_amount,
            'total_amount' => $this->total_amount,
            'discount_amount' => $this->discount_amount,
            'status' => $this->status,
            'notes' => $this->notes,
            'confirmed_at' => $this->confirmed_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'booking_slot_id' => $this->booking_slot_id,
            'booking_slot' => $this->whenLoaded('bookingSlot', fn () => [
                'id' => $this->bookingSlot->id,
                'start_time' => substr($this->bookingSlot->start_time, 0, 5),
                'end_time' => $this->bookingSlot->end_time ? substr($this->bookingSlot->end_time, 0, 5) : null,
                'max_capacity' => $this->bookingSlot->max_capacity,
            ]),
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
