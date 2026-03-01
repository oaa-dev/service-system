# Frontend System Layout Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/layout.tsx` | Layout | Authenticated layout wrapper with sidebar, header, auth guards |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Hook | `hooks/useAuth.ts` | useMe (fetches current user on layout mount) |
| Store | `stores/authStore.ts` | isAuthenticated, isLoading, user (auth state and role checks) |
| Component | `components/layout/app-sidebar.tsx` | Main navigation sidebar with permission-gated menu items |
| Component | `components/theme-customizer.tsx` | Theme customization controls in header |
| Component | `components/notifications/notification-bell.tsx` | Notification bell icon with unread count |
| Component | `components/notifications/notification-provider.tsx` | Real-time notification state provider |
| Component | `components/messaging/messaging-provider.tsx` | Real-time messaging state provider |
| Store | `stores/notificationStore.ts` | Notification state management |
| Store | `stores/themeStore.ts` | Theme preferences |
| Service | `services/notificationService.ts` | Notification API calls |
| Hook | `hooks/useNotifications.ts` | Notification hooks |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- Auth guard: redirects unauthenticated users to `/login`
- Merchant-role guards:
  - Unverified email -> `/verify-email`
  - No merchant record -> `/onboarding`
  - `/dashboard` path -> redirect to `/my-store`
  - Non-active/approved merchants restricted from: categories, services, gallery, bookings, reservations, orders
  - Branch merchants restricted from: settings, gallery, application-log, categories, services, branches
- Layout structure: `NotificationProvider > MessagingProvider > SidebarProvider > AppSidebar + SidebarInset`
- Header contains: sidebar trigger, notification bell, theme customizer
- Main content area shows skeleton loading while user data is being fetched
- AppSidebar provides two nav groups (Main Menu + Settings) with items permission-gated via Spatie permissions
