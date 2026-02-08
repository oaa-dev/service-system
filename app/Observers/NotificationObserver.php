<?php

namespace App\Observers;

use App\Events\NotificationCreated;
use Illuminate\Notifications\DatabaseNotification;

class NotificationObserver
{
    public function created(DatabaseNotification $notification): void
    {
        broadcast(new NotificationCreated($notification, $notification->notifiable_id));
    }
}
