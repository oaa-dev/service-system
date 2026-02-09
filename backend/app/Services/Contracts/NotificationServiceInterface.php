<?php

namespace App\Services\Contracts;

use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Pagination\LengthAwarePaginator;

interface NotificationServiceInterface
{
    public function getAllNotifications(int $userId, array $filters = []): LengthAwarePaginator;

    public function getUnreadCount(int $userId): int;

    public function markAsRead(int $userId, string $notificationId): DatabaseNotification;

    public function markAllAsRead(int $userId): int;

    public function delete(int $userId, string $notificationId): bool;
}
