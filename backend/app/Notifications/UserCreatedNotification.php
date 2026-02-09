<?php

namespace App\Notifications;

use App\Events\NotificationCreated;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class UserCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $createdUser
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'user_created',
            'title' => 'New User Created',
            'message' => "A new user '{$this->createdUser->name}' has been created.",
            'user_id' => $this->createdUser->id,
            'user_name' => $this->createdUser->name,
            'user_email' => $this->createdUser->email,
        ];
    }

    /**
     * Dispatch the broadcast event after the notification is stored.
     */
    public function afterCommit(): bool
    {
        return true;
    }
}
