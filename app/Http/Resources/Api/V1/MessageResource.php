<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id' => $this->sender_id,
            'sender' => $this->whenLoaded('sender', fn () => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'avatar' => $this->sender->profile?->hasMedia('avatar')
                    ? [
                        'original' => $this->sender->profile->getFirstMediaUrl('avatar'),
                        'thumb' => $this->sender->profile->getFirstMediaUrl('avatar', 'thumb'),
                        'preview' => $this->sender->profile->getFirstMediaUrl('avatar', 'preview'),
                    ]
                    : null,
            ]),
            'body' => $this->body,
            'read_at' => $this->read_at?->toISOString(),
            'is_mine' => $request->user()?->id === $this->sender_id,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
