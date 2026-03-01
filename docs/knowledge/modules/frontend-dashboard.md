# Frontend Dashboard Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(dashboard)/dashboard/page.tsx` | Page | Admin dashboard with stats grid, recent users list, quick actions |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Hook | `hooks/useUsers.ts` | useUsers (fetches recent 5 users for dashboard display) |
| Store | `stores/authStore.ts` | user (displays welcome message with user's first name) |
| Type | `types/api.ts` | User interface (name, email, avatar, profile, email_verified_at, created_at) |
| Utility | `lib/utils.ts` | formatDate, getInitials |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- Displays 4 stat cards: Total Users, Active Users, Sessions, Growth (some values are calculated/hardcoded)
- Recent users section shows last 5 registered users with avatar, verification status, and creation date
- Quick actions link to: Add New User (`/users`), Manage Profile (`/profile`), API Documentation
- Activity Overview section is a placeholder ("coming soon")
- Merchant-role users are redirected away from `/dashboard` to `/my-store` by the system layout
