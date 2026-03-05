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

## Notification Types in the System
| Notification Class | Trigger | Recipients |
|-------------------|---------|------------|
| `MerchantStatusChangedNotification` | Merchant status update (approved, rejected, suspended, etc.) | Merchant user |
| `MerchantApplicationSubmittedNotification` | Merchant submits application | All admin users |

Both notifications use both `mail` and `database` channels. The `DatabaseNotification` model's `NotificationObserver` auto-broadcasts `notification.created` on `PrivateChannel('App.Models.User.{id}')` when a notification is stored.

## Real-time Broadcast (NotificationObserver)
- Observer on `DatabaseNotification` (Laravel's built-in model)
- Registered in `AppServiceProvider::boot()`
- On `created`: broadcasts event `notification.created` on `private-App.Models.User.{id}` channel
- Event payload: id, type, data (title + message), read_at, created_at

## Broadcast Channel (routes/channels.php)
```
App.Models.User.{id}  →  private channel, authorized when (int) $user->id === (int) $id
```

## Admin Frontend
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/notificationService.ts` | getAll(params), getUnreadCount(), markAsRead(id), markAllAsRead(), delete(id) |
| Hook | `frontend/hooks/useNotifications.ts` | useNotifications(params), useUnreadCount(), useMarkAsRead(), useMarkAllAsRead(), useDeleteNotification(), useRealtimeNotifications() |
| Store | `frontend/stores/notificationStore.ts` | Zustand; notifications[], unreadCount; addNotification, markAsRead, markAllAsRead, removeNotification, setUnreadCount |
| Types | `frontend/types/api.ts` | Notification (id UUID, type, data: {title, message}, read_at, created_at), NotificationQueryParams |

### useRealtimeNotifications
- Subscribes to `PrivateChannel("App.Models.User.{userId}")` via Laravel Echo on `.notification.created` event
- On receive: adds notification to store, invalidates unread-count query, shows `toast.info(title, description: message)`
- Calls `reconnectEcho()` (not `getEcho()`) to ensure token is refreshed on user change
- Cleanup: leaves channel on unmount

## Notes
- Notification IDs are UUIDs (Laravel's default for database notifications)
- All endpoints scope to the authenticated user (no cross-user access)
- No dedicated permission — any authenticated, verified, onboarded user can manage their own notifications
- Notifications are created as side effects by other modules, not directly via this controller
- The admin frontend polls `useUnreadCount` every 30 seconds as a fallback even when WebSocket is connected
- Customer portal does not currently implement real-time notifications (no Echo integration for notifications)
