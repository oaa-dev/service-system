<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'first_name' => $this->whenLoaded('profile', fn () => $this->profile?->first_name),
            'last_name' => $this->whenLoaded('profile', fn () => $this->profile?->last_name),
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'avatar' => $this->when(
                $this->relationLoaded('profile') && $this->profile?->hasMedia('avatar'),
                fn () => [
                    'original' => $this->profile->getFirstMediaUrl('avatar'),
                    'thumb' => $this->profile->getFirstMediaUrl('avatar', 'thumb'),
                    'preview' => $this->profile->getFirstMediaUrl('avatar', 'preview'),
                ]
            ),
            'profile' => $this->whenLoaded('profile', fn () => new ProfileResource($this->profile)),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'permissions' => $this->when(
                $this->relationLoaded('roles'),
                fn () => $this->getAllPermissions()->pluck('name')
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
