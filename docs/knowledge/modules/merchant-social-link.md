# MerchantSocialLink Module

## Model
- **Path**: `app/Models/MerchantSocialLink.php`
- **Table**: `merchant_social_links`
- **Fillable**: `merchant_id`, `social_platform_id`, `url`
- **Casts**: None
- **Relationships**:
  - `merchant()` -> BelongsTo -> `Merchant`
  - `socialPlatform()` -> BelongsTo -> `SocialPlatform`
- **Traits**: None
- **Scopes**: None

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Parent model | `app/Models/Merchant.php` | socialLinks() HasMany |
| Related model | `app/Models/SocialPlatform.php` | BelongsTo from MerchantSocialLink |
| Service | `app/Services/MerchantService.php` | syncSocialLinks() -- deletes all existing links for the merchant, recreates from input array |
| Resource | `app/Http/Resources/Api/V1/MerchantSocialLinkResource.php` | Returns id, social_platform_id, url, social_platform (SocialPlatformResource whenLoaded) |
| FormRequest | `app/Http/Requests/Api/V1/Merchant/SyncSocialLinksRequest.php` | Validates social_links array; each entry: social_platform_id (exists in social_platforms), url (valid URL format) |
| Controller (admin) | `app/Http/Controllers/Api/V1/MerchantController.php` | syncSocialLinks() action |
| Controller (self-service) | `app/Http/Controllers/Api/V1/MyMerchantController.php` | syncSocialLinks() action |

## Routes

| Method | URI | Middleware | Action | Permission |
|--------|-----|------------|--------|------------|
| POST | `api/v1/merchants/{merchant}/social-links` | auth:api, ensure.verified, onboarding | MerchantController@syncSocialLinks | merchants.update |
| POST | `api/v1/auth/merchant/social-links` | auth:api, ensure.verified, onboarding | MyMerchantController@syncSocialLinks | -- |

## Database

| Type | File |
|------|------|
| Migration (create) | `database/migrations/2026_02_08_100004_create_merchant_social_links_table.php` |
| Factory | -- (none) |
| Seeder | -- (none) |

## Tests

| Type | File |
|------|------|
| Feature (via MerchantControllerTest) | `tests/Feature/Api/V1/MerchantControllerTest.php` |
| Feature (via MyMerchantControllerTest) | `tests/Feature/Api/V1/MyMerchantControllerTest.php` |

## Notes
- Composite unique constraint on `[merchant_id, social_platform_id]` -- one link per platform per merchant.
- Managed via `MerchantService::syncSocialLinks()` using a **delete-and-recreate** strategy (not Eloquent `sync()`). This allows clean URL updates: all existing links are deleted first, then new ones are created from the input array.
- Each entry is created via `$merchant->socialLinks()->create(['social_platform_id' => ..., 'url' => ...])`.
- After sync, the method returns the merchant with `socialLinks.socialPlatform` eagerly loaded.
- No dedicated controller, repository, or service -- all operations go through `MerchantService` via `MerchantController` and `MyMerchantController`.
- The `MerchantResource` includes social_links as a `whenLoaded` conditional relation using `MerchantSocialLinkResource::collection()`.
- `MerchantService::getMerchantById()` eagerly loads `socialLinks.socialPlatform` as part of its standard relation set.
