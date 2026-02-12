<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'service_id' => $this->service_id,
            'customer_id' => $this->customer_id,
            'order_number' => $this->order_number,
            'quantity' => $this->quantity,
            'unit_label' => $this->unit_label,
            'unit_price' => $this->unit_price,
            'total_price' => $this->total_price,
            'fee_rate' => $this->fee_rate,
            'fee_amount' => $this->fee_amount,
            'total_amount' => $this->total_amount,
            'status' => $this->status,
            'notes' => $this->notes,
            'estimated_completion' => $this->estimated_completion?->toISOString(),
            'received_at' => $this->received_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'service' => $this->whenLoaded('service', fn () => new ServiceResource($this->service)),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
