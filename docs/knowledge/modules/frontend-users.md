# Frontend Users Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(users)/users/page.tsx` | Page | User list with search, pagination, CRUD actions |
| `frontend/app/(system)/(users)/users/create-user-dialog.tsx` | Component | Create user dialog with role assignment |
| `frontend/app/(system)/(users)/users/edit-user-dialog.tsx` | Component | Edit user dialog with role reassignment |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/userService.ts` | CRUD for users |
| Hook | `hooks/useUsers.ts` | useUsers, useCreateUser, useUpdateUser, useDeleteUser |
| Hook | `hooks/useRoles.ts` | useAllRoles (for role assignment in create/edit dialogs) |
| Type | `types/api.ts` | User, UserQueryParams |
| Validation | `lib/validations.ts` | createUserSchema, updateUserSchema |
| Utility | `lib/utils.ts` | formatDate, getInitials |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- User list displays avatar (with initials fallback), name, email, roles, verification status, creation date
- Create/edit dialogs include role selection dropdown sourced from useAllRoles hook
- Delete uses AlertDialog confirmation pattern
- Users page is also linked from the dashboard's "View All Users" button and "Add New User" quick action
