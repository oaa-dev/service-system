<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OtpManagementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'email_verified_at' => $this->user->email_verified_at?->toISOString(),
            ],
            'status' => $this->computeStatus(),
            'expires_at' => $this->expires_at?->toISOString(),
            'attempted_count' => $this->attempted_count,
            'locked_until' => $this->locked_until?->toISOString(),
            'last_resent_at' => $this->last_resent_at?->toISOString(),
            'verified_at' => $this->verified_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    private function computeStatus(): string
    {
        if ($this->isVerified()) {
            return 'verified';
        }
        if ($this->isLocked()) {
            return 'locked';
        }
        if ($this->isExpired()) {
            return 'expired';
        }

        return 'pending';
    }
}
