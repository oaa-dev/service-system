<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payable_type' => $this->payable_type,
            'payable_id' => $this->payable_id,
            'payment_method' => $this->payment_method,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'refund_status' => $this->refund_status,
            'gateway' => $this->gateway,
            'gateway_reference' => $this->gateway_reference,
            'checkout_url' => $this->checkout_url,
            'paid_at' => $this->paid_at?->toISOString(),
            'refunded_at' => $this->refunded_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'is_expired' => $this->isExpired(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
