# Notification Module

## Overview
User notification management using Laravel's built-in database notification system. Provides paginated listing, unread count, mark-as-read (single and bulk), and deletion. Notifications are created by other modules (e.g., MerchantStatusChangedNotification, MerchantApplicationSubmittedNotification).

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller | `app/Http/Controllers/Api/V1/NotificationController.php` | index, unreadCount, markAsRead, markAllAsRead, destroy |
| Service Interface | `app/Services/Contracts/NotificationServiceInterface.php` | getAllNotifications, getUnreadCount, markAsRead, markAllAsRead, delete |
| Service | `app/Services/NotificationService.php` | Operates on Laravel's DatabaseNotification model scoped to user |
| Resource | `app/Http/Resources/Api/V1/NotificationResource.php` | Serializes notification with id, type, data, read_at, created_at |
| Notification | `app/Notifications/MerchantStatusChangedNotification.php` | DB + mail; sent to merchant user on status change |
| Notification | `app/Notifications/MerchantApplicationSubmittedNotification.php` | DB + mail; sent to all admins on application submission |
| Provider Binding | `app/Providers/RepositoryServiceProvider.php` | NotificationServiceInterface → NotificationService |

## Routes

### Auth + verified + onboarded routes (no specific permission)

| Method | URI | Action | Notes |
|--------|-----|--------|-------|
| GET | `notifications` | index | Paginated list for authenticated user |
| GET | `notifications/unread-count` | unreadCount | Returns `{count: N}` |
| POST | `notifications/{id}/read` | markAsRead | UUID-based notification ID |
| POST | `notifications/read-all` | markAllAsRead | Returns count of marked notifications |
| DELETE | `notifications/{id}` | destroy | UUID-based notification ID |

## Notes
- Notification IDs are UUIDs (Laravel's default for database notifications)
- All endpoints scope to the authenticated user (no cross-user access)
- No dedicated permission — any authenticated, verified, onboarded user can manage their own notifications
- Notifications are created as side effects by other modules, not directly via this controller
