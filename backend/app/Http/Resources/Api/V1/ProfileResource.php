<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'bio' => $this->bio,
            'phone' => $this->phone,
            'address' => $this->address ? new AddressResource($this->address) : null,
            'avatar' => $this->when($this->hasMedia('avatar'), fn () => [
                'original' => $this->getFirstMediaUrl('avatar'),
                'thumb' => $this->getFirstMediaUrl('avatar', 'thumb'),
                'preview' => $this->getFirstMediaUrl('avatar', 'preview'),
            ]),
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'gender' => $this->gender,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
