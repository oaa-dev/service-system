# Frontend Roles Module

## Route Files

| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(settings)/roles/page.tsx` | Page | Role list with CRUD actions, permission counts |
| `frontend/app/(system)/(settings)/roles/create/page.tsx` | Page | Create role with name + permission assignment |
| `frontend/app/(system)/(settings)/roles/[id]/edit/page.tsx` | Page | Edit role name + sync permissions |

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/roleService.ts` | getAllRoles, getAllRolesUnpaginated, getRole, createRole, updateRole, deleteRole, syncPermissions, getAllPermissions, getPermissionsGrouped |
| Hook | `frontend/hooks/useRoles.ts` | useRoles, useAllRoles, useRole, useCreateRole, useUpdateRole, useDeleteRole, useSyncPermissions, usePermissions, usePermissionsGrouped |
| Type | `frontend/types/api.ts` | Role, Permission, PermissionGroup interfaces |
| Validation | `frontend/lib/validations.ts` | createRoleSchema, updateRoleSchema |

## Notes
- Role create/edit uses a full page (not dialog) since permission assignment requires more space
- Permission assignment uses grouped checkboxes organized by module prefix
- `permissions/grouped` endpoint provides the module→permissions mapping for the UI
- Role list, create, and edit pages are under the Settings route group
- Gated by `roles.view`, `roles.create`, `roles.update`, `roles.delete` permissions
