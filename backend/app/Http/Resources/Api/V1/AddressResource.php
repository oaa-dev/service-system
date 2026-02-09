<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'street' => $this->street,
            'postal_code' => $this->postal_code,
            'region' => $this->whenLoaded('region', fn () => $this->region ? [
                'id' => $this->region->id,
                'name' => $this->region->name,
            ] : null),
            'province' => $this->whenLoaded('province', fn () => $this->province ? [
                'id' => $this->province->id,
                'name' => $this->province->name,
            ] : null),
            'city' => $this->whenLoaded('geoCity', fn () => $this->geoCity ? [
                'id' => $this->geoCity->id,
                'name' => $this->geoCity->name,
            ] : null, $this->city),
            'barangay' => $this->whenLoaded('barangay', fn () => $this->barangay ? [
                'id' => $this->barangay->id,
                'name' => $this->barangay->name,
            ] : null),
        ];
    }
}
