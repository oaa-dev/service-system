<?php

namespace App\Services;

use App\Models\User;
use App\Services\Contracts\NotificationServiceInterface;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationService implements NotificationServiceInterface
{
    public function getAllNotifications(int $userId, array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;
        $user = User::findOrFail($userId);

        return $user->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getUnreadCount(int $userId): int
    {
        $user = User::findOrFail($userId);

        return $user->unreadNotifications()->count();
    }

    public function markAsRead(int $userId, string $notificationId): DatabaseNotification
    {
        $user = User::findOrFail($userId);
        $notification = $user->notifications()->findOrFail($notificationId);
        $notification->markAsRead();

        return $notification->fresh();
    }

    public function markAllAsRead(int $userId): int
    {
        $user = User::findOrFail($userId);

        return $user->unreadNotifications()->update(['read_at' => now()]);
    }

    public function delete(int $userId, string $notificationId): bool
    {
        $user = User::findOrFail($userId);
        $notification = $user->notifications()->findOrFail($notificationId);

        return $notification->delete();
    }
}
