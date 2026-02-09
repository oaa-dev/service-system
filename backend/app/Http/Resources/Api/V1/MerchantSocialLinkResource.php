<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MerchantSocialLinkResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'social_platform_id' => $this->social_platform_id,
            'url' => $this->url,
            'social_platform' => $this->whenLoaded('socialPlatform', fn () => new SocialPlatformResource($this->socialPlatform)),
        ];
    }
}
