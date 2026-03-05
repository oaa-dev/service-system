<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()?->id;

        return [
            'id' => $this->id,
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
            ]),
            'conversable_type' => $this->conversable_type,
            'conversable_id' => $this->conversable_id,
            'conversable_label' => $this->deriveConversableLabel(),
            'other_user' => $this->resolveOtherUser($currentUserId),
            'latest_message' => $this->whenLoaded('latestMessage', fn () => new MessageResource($this->latestMessage)),
            'unread_count' => $this->unread_count ?? 0,
            'last_message_at' => $this->last_message_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }

    /**
     * Determine the "other" user relative to the current authenticated user.
     *
     * If the current user owns the merchant, the other user is the customer.
     * Otherwise, the other user is the merchant owner.
     */
    private function resolveOtherUser(?int $currentUserId): ?array
    {
        if (! $currentUserId) {
            return null;
        }

        // If the current user is the merchant owner, the other user is the customer
        $isMerchantOwner = $this->relationLoaded('merchant')
            && $this->merchant
            && $this->merchant->user_id === $currentUserId;

        if ($isMerchantOwner) {
            // Other user is the customer
            $otherUser = $this->relationLoaded('customer') ? $this->customer : null;
        } else {
            // Other user is the merchant owner
            $otherUser = $this->relationLoaded('merchant') && $this->merchant
                ? ($this->merchant->relationLoaded('user') ? $this->merchant->user : null)
                : null;
        }

        if (! $otherUser) {
            return null;
        }

        return [
            'id' => $otherUser->id,
            'name' => $otherUser->name,
            'avatar' => $otherUser->profile?->hasMedia('avatar')
                ? [
                    'original' => $otherUser->profile->getFirstMediaUrl('avatar'),
                    'thumb' => $otherUser->profile->getFirstMediaUrl('avatar', 'thumb'),
                    'preview' => $otherUser->profile->getFirstMediaUrl('avatar', 'preview'),
                ]
                : null,
        ];
    }

    /**
     * Derive a human-readable label for the conversable entity.
     */
    private function deriveConversableLabel(): ?string
    {
        if (! $this->conversable_type) {
            return null;
        }

        // Extract the short type from the full class name or short string
        $type = $this->conversable_type;

        // If it's a full class name (e.g., App\Models\Booking), extract the short name
        if (str_contains($type, '\\')) {
            $type = class_basename($type);
        }

        $normalizedType = strtolower($type);

        return match ($normalizedType) {
            'booking' => "Booking #{$this->conversable_id}",
            'reservation' => "Reservation #{$this->conversable_id}",
            'serviceorder', 'service_order' => $this->deriveServiceOrderLabel(),
            'inquiry' => 'General Inquiry',
            default => ucfirst($normalizedType) . " #{$this->conversable_id}",
        };
    }

    /**
     * Derive the label for a service order, using order_number if the conversable is loaded.
     */
    private function deriveServiceOrderLabel(): string
    {
        if ($this->relationLoaded('conversable') && $this->conversable && isset($this->conversable->order_number)) {
            return "Order {$this->conversable->order_number}";
        }

        return "Order #{$this->conversable_id}";
    }
}
