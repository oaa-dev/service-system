<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()?->id;
        $otherUser = $currentUserId ? $this->getOtherUser($currentUserId) : $this->userOne;

        // Get unread count from the loaded participant relationship
        $participant = $this->whenLoaded('participants', function () {
            return $this->participants->first();
        });

        return [
            'id' => $this->id,
            'other_user' => [
                'id' => $otherUser->id,
                'name' => $otherUser->name,
                'avatar' => $otherUser->profile?->hasMedia('avatar')
                    ? [
                        'original' => $otherUser->profile->getFirstMediaUrl('avatar'),
                        'thumb' => $otherUser->profile->getFirstMediaUrl('avatar', 'thumb'),
                        'preview' => $otherUser->profile->getFirstMediaUrl('avatar', 'preview'),
                    ]
                    : null,
            ],
            'latest_message' => $this->whenLoaded('latestMessage', fn () => new MessageResource($this->latestMessage)),
            'unread_count' => $participant?->unread_count ?? 0,
            'last_message_at' => $this->last_message_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
