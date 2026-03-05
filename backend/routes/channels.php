<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = \App\Models\Conversation::find($conversationId);

    if (! $conversation) {
        return false;
    }

    // Allow if user is the customer
    if ((int) $conversation->customer_id === (int) $user->id) {
        return true;
    }

    // Allow if user owns the merchant
    $merchant = $user->merchant;

    return $merchant && (int) $merchant->id === (int) $conversation->merchant_id;
});

Broadcast::channel('presence-merchant.{merchantId}', function ($user, $merchantId) {
    // Any authenticated user can join to observe merchant presence
    return [
        'id' => $user->id,
        'name' => $user->name,
        'is_merchant_owner' => optional($user->merchant)->id === (int) $merchantId,
    ];
});
