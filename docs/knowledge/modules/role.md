# Role Module

## Overview
CRUD management for Spatie Permission roles with permission syncing. Uses the standard Service-Repository pattern. Note: Spatie's `Role` and `Permission` models are used directly (no custom models).

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller | `app/Http/Controllers/Api/V1/RoleController.php` | index, all, store, show, update, destroy, syncPermissions |
| Controller | `app/Http/Controllers/Api/V1/PermissionController.php` | index (flat list), grouped (by module) — uses RoleService |
| Service Interface | `app/Services/Contracts/RoleServiceInterface.php` | getAllRoles, getRoleById, createRole, updateRole, deleteRole, syncPermissions, getAllPermissions, getPermissionsGroupedByModule |
| Service | `app/Services/RoleService.php` | Business logic with QueryBuilder filtering |
| Repository Interface | `app/Repositories/Contracts/RoleRepositoryInterface.php` | Extends BaseRepositoryInterface |
| Repository | `app/Repositories/RoleRepository.php` | Extends BaseRepository for Spatie Role model |
| DTO | `app/Data/RoleData.php` | name, permissions (optional array) |
| Resource | `app/Http/Resources/Api/V1/RoleResource.php` | Serializes role with permissions |
| Resource | `app/Http/Resources/Api/V1/PermissionResource.php` | Serializes permission |
| FormRequest | `app/Http/Requests/Api/V1/Role/StoreRoleRequest.php` | name (unique), permissions (optional string array) |
| FormRequest | `app/Http/Requests/Api/V1/Role/UpdateRoleRequest.php` | name (unique except self), permissions |
| FormRequest | `app/Http/Requests/Api/V1/Role/SyncPermissionsRequest.php` | permissions (string array) |
| Provider Binding | `app/Providers/RepositoryServiceProvider.php` | RoleRepositoryInterface → RoleRepository; RoleServiceInterface → RoleService |

## Routes

### Auth + verified + onboarded routes

| Method | URI | Action | Permission |
|--------|-----|--------|------------|
| GET | `roles/all` | all | -- (auth only, for dropdowns) |
| GET | `roles` | index | roles.view |
| GET | `roles/{role}` | show | roles.view |
| POST | `roles` | store | roles.create |
| PUT | `roles/{role}` | update | roles.update |
| POST | `roles/{role}/permissions` | syncPermissions | roles.update |
| DELETE | `roles/{role}` | destroy | roles.delete |
| GET | `permissions` | PermissionController@index | roles.view |
| GET | `permissions/grouped` | PermissionController@grouped | roles.view |

## Notes
- Permission endpoints are gated by `roles.view` permission (not a separate `permissions.view`)
- `permissions/grouped` returns permissions organized by module prefix (e.g., `merchants` → [merchants.view, merchants.create, ...])
- Guard is always `'api'` (set on Spatie models via User's `$guard_name`)
- Role creation can optionally include permissions array (synced on create)
- `destroy()` uses try-catch with 422 response on error

## Tests

| Type | File |
|------|------|
| No dedicated test file | -- |
