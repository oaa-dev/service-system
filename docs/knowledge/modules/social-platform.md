# SocialPlatform Module

## Model
- **Path**: app/Models/SocialPlatform.php
- **Table**: `social_platforms`
- **Fillable**: `name`, `slug`, `base_url`, `is_active`, `sort_order`
- **Casts**:
  - `is_active` → `boolean`
  - `sort_order` → `integer`
- **Relationships**: none defined on model (referenced by `MerchantSocialLink.social_platform_id` via BelongsTo)
- **Traits**: `HasFactory`, `InteractsWithMedia` (Spatie Media Library)
- **Scopes**: none (filtering handled in service layer via Spatie QueryBuilder)
- **Model Hooks (booted)**:
  - `creating` — auto-generates `slug` from `name` via `Str::slug()` if empty
  - `updating` — auto-updates `slug` when `name` changes and `slug` was not also changed
- **Media Collections**:
  - `icon` — single file, accepts `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`
  - `icon` conversion: `thumb` (64x64, sharpen 10)

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Model | app/Models/SocialPlatform.php | Core model |
| DTO | app/Data/SocialPlatformData.php | All fields use `string\|Optional` / `bool\|Optional` / `int\|Optional` pattern |
| Controller | app/Http/Controllers/Api/V1/SocialPlatformController.php | Full CRUD + `all()` + `active()` |
| Form Request (store) | app/Http/Requests/Api/V1/SocialPlatform/StoreSocialPlatformRequest.php | `name` required + unique; `base_url` optional, validated as URL format |
| Form Request (update) | app/Http/Requests/Api/V1/SocialPlatform/UpdateSocialPlatformRequest.php | All `sometimes`; uniqueness ignores current record; `base_url` re-validates URL format |
| Resource | app/Http/Resources/Api/V1/SocialPlatformResource.php | Includes `base_url`; conditional `icon` (url + thumb) when media loaded |
| Service Interface | app/Services/Contracts/SocialPlatformServiceInterface.php | Defines 7 methods |
| Service | app/Services/SocialPlatformService.php | Uses Spatie QueryBuilder for `index`; filters: name (partial), is_active (exact), search (callback); sorts: id, name, sort_order, is_active, created_at; default sort: sort_order |
| Repository Interface | app/Repositories/Contracts/SocialPlatformRepositoryInterface.php | Extends BaseRepositoryInterface; adds `findBySlug`, `getActive` |
| Repository | app/Repositories/SocialPlatformRepository.php | Extends BaseRepository; `findBySlug`, `getActive` (where is_active=true, ordered by sort_order) |
| Service Provider | app/Providers/RepositoryServiceProvider.php | Binds interface → implementation for both service and repository |
| Seeder | database/seeders/SocialPlatformSeeder.php | Seeds default platforms |
| Factory | database/factories/SocialPlatformFactory.php | States: `inactive()` |
| Migration | database/migrations/2026_02_08_000004_create_social_platforms_table.php | Creates `social_platforms` table; `base_url` is nullable |
| Test | tests/Feature/Api/V1/SocialPlatformControllerTest.php | Pest describe/it; 15 tests covering index, filter, pagination, active, store, URL validation, show, update, delete |
| Related Model | app/Models/MerchantSocialLink.php | Join table model with `merchant_id`, `social_platform_id`, `url`; has `socialPlatform()` BelongsTo |
| Related Resource | app/Http/Resources/Api/V1/MerchantSocialLinkResource.php | Wraps MerchantSocialLink with embedded SocialPlatform data |
| Merchant Service | app/Services/MerchantService.php | `syncMerchantSocialLinks()` — delete-and-recreate strategy (not sync) |
| Merchant Resource | app/Http/Resources/Api/V1/MerchantResource.php | Includes `social_links` via `whenLoaded` |
| Role Permission Seeder | database/seeders/RolePermissionSeeder.php | Defines permissions: `social_platforms.view/create/update/delete` |

## Routes
| Method | URI | Action | Auth | Permission |
|--------|-----|--------|------|------------|
| GET | `/api/v1/social-platforms/active` | `active()` | Public (no auth) | None |
| GET | `/api/v1/social-platforms/all` | `all()` | `auth:api` + verified + onboarded | None |
| GET | `/api/v1/social-platforms` | `index()` | `auth:api` + verified + onboarded | `social_platforms.view` |
| GET | `/api/v1/social-platforms/{socialPlatform}` | `show()` | `auth:api` + verified + onboarded | `social_platforms.view` |
| POST | `/api/v1/social-platforms` | `store()` | `auth:api` + verified + onboarded | `social_platforms.create` |
| PUT | `/api/v1/social-platforms/{socialPlatform}` | `update()` | `auth:api` + verified + onboarded | `social_platforms.update` |
| DELETE | `/api/v1/social-platforms/{socialPlatform}` | `destroy()` | `auth:api` + verified + onboarded | `social_platforms.delete` |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_08_000004_create_social_platforms_table.php |
| Factory | database/factories/SocialPlatformFactory.php |
| Seeder | database/seeders/SocialPlatformSeeder.php |

## Tests
| Type | File |
|------|------|
| Feature (controller, 15 tests) | tests/Feature/Api/V1/SocialPlatformControllerTest.php |
| Integration (merchant social links) | tests/Feature/Api/V1/MerchantControllerTest.php |
| Integration (self-service social links) | tests/Feature/Api/V1/MyMerchantControllerTest.php |

## Permissions
| Permission | Description |
|------------|-------------|
| `social_platforms.view` | List and view individual social platforms |
| `social_platforms.create` | Create new social platforms |
| `social_platforms.update` | Update existing social platforms |
| `social_platforms.delete` | Delete social platforms |

## Notes
- `base_url` is the platform profile base URL (e.g., `https://facebook.com/`); merchant provides only their handle/path, stored in `MerchantSocialLink.url`
- `slug` is auto-derived from `name` on create; auto-updated on name change unless explicitly provided
- `active` endpoint is public (no auth required) — used by storefront/public pages
- `all` endpoint returns unpaginated collection ordered by `sort_order` — used for dropdown data
- Icon upload via Spatie Media Library `icon` collection; response includes `icon.url` and `icon.thumb`
- Merchant social link management uses **delete-and-recreate** strategy (not `sync()`) — entire set of links is replaced on each update
- `MerchantSocialLink` is the pivot entity storing `social_platform_id` + merchant-specific `url`; unlike PaymentMethod (BelongsToMany), this is an explicit intermediate model with its own table
