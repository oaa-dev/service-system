# Media Module

## Overview
File upload and media management using Spatie Laravel Media Library. Provides image and document uploads with automatic conversion (resize/sharpen) and URL generation. Upload config is centralized in `config/images.php` and exposed via a public API endpoint.

## Infrastructure
- **Package**: `spatie/laravel-medialibrary`
- **Storage**: Local disk (`storage/app/public`), served via Nginx at `http://localhost:8090/storage/`
- **Next.js image config**: Both `next.config.ts` files add `http://localhost:8090/storage/**` to `images.remotePatterns` (required for `<Image>` to load Laravel media)
- **URL pattern**: `http://localhost:8090/storage/{uuid}/{filename}` (original), `http://localhost:8090/storage/{uuid}/conversions/{name}-{size}.{ext}` (converted)

## Config File: `config/images.php`
All upload constraints are centralized here and exposed via `GET /api/v1/config/images`.

| Key | Mimes | Max Size | Notes |
|-----|-------|----------|-------|
| `avatar` | jpeg, png, webp | 5MB | Min 100x100, Max 4000x4000 |
| `document` | pdf, doc, docx | 10MB | For user documents |
| `merchant_logo` | jpeg, png, webp | 5MB | Min 100x100, Max 4000x4000 |
| `merchant_document` | pdf, doc, docx, jpeg, png | 10MB | For merchant compliance docs |
| `merchant_gallery` | jpeg, png, webp | 10MB | Min 200x200, Max 6000x6000 |
| `customer_document` | pdf, doc, docx, jpeg, png | 10MB | For customer identity docs |
| `service_image` | jpeg, png, webp | 5MB | Min 200x200, Max 4000x4000 |
| `reference_icon` | jpeg, png, webp, svg | 2MB | Min 32x32, Max 512x512 |

## ImageRule (Custom Validation Rule)
**Path**: `backend/app/Rules/ImageRule.php`

Static factory methods for type-safe upload validation:
```php
ImageRule::avatar()          // uses 'avatar' config key
ImageRule::merchantLogo()    // uses 'merchant_logo' config key
ImageRule::merchantGallery() // uses 'merchant_gallery' config key
ImageRule::serviceImage()    // uses 'service_image' config key
ImageRule::referenceIcon()   // uses 'reference_icon' config key
```
Each factory creates a rule that validates mime types, file size, and image dimensions using the config values.

## Media Collections by Model

### Merchant (`backend/app/Models/Merchant.php`)
| Collection | Type | Conversions |
|------------|------|-------------|
| `logo` | singleFile | thumb (100x100), preview (400x400) |
| `gallery_photos` | multi | thumb (200x200), preview (800x600) |
| `gallery_interiors` | multi | thumb (200x200), preview (800x600) |
| `gallery_exteriors` | multi | thumb (200x200), preview (800x600) |
| `gallery_feature` | singleFile | thumb (200x200), preview (800x600) |

### Service (`backend/app/Models/Service.php`)
| Collection | Type | Conversions |
|------------|------|-------------|
| `image` | singleFile | thumb (200x200), preview (600x400) |

### UserProfile (`backend/app/Models/UserProfile.php`)
| Collection | Type | Conversions |
|------------|------|-------------|
| `avatar` | singleFile | thumb (100x100) |

### PaymentMethod, DocumentType, BusinessType, SocialPlatform
| Collection | Type | Conversions |
|------------|------|-------------|
| `icon` | singleFile | thumb (64x64) |

### Customer (`backend/app/Models/Customer.php`)
| Collection | Type | Conversions |
|------------|------|-------------|
| `identity_document` | singleFile | none |

### MerchantDocument (merchant compliance docs)
Stored as Spatie Media Library items on the MerchantDocument model's `document` collection.

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Config | `backend/config/images.php` | All upload constraints |
| Config Controller | `backend/app/Http/Controllers/Api/V1/ConfigController.php` | `GET /config/images` — returns full images config |
| Custom Rule | `backend/app/Rules/ImageRule.php` | Static factories per upload type |
| Trait | `backend/app/Traits/HasAddress.php` | Uses `InteractsWithMedia` |

## Upload Endpoints

### Merchant
| Method | URI | Collection |
|--------|-----|------------|
| POST | `merchants/{id}/logo` | logo (singleFile) |
| DELETE | `merchants/{id}/logo` | removes logo |
| POST | `merchants/{id}/gallery/{collection}` | gallery_photos/interiors/exteriors/feature |
| DELETE | `merchants/{id}/gallery/{media}` | removes by media ID |
| POST | `auth/merchant/logo` | self-service logo |
| POST | `auth/merchant/gallery/{collection}` | self-service gallery (requires merchant.active) |

### Service
| Method | URI | Collection |
|--------|-----|------------|
| POST | `merchants/{id}/services/{service}/image` | image (singleFile) |
| DELETE | `merchants/{id}/services/{service}/image` | removes image |

### Profile / Avatar
| Method | URI | Collection |
|--------|-----|------------|
| POST | `profile/avatar` | avatar (singleFile on UserProfile) |
| DELETE | `profile/avatar` | removes avatar |

### Reference Data Icons
| Method | URI | Collection |
|--------|-----|------------|
| POST | `payment-methods/{id}/icon` | icon (singleFile) |
| POST | `document-types/{id}/icon` | icon |
| POST | `business-types/{id}/icon` | icon |
| POST | `social-platforms/{id}/icon` | icon |

### Customer Documents
| Method | URI | Collection |
|--------|-----|------------|
| POST | `customers/{id}/documents` | document (on CustomerDocument) |
| DELETE | `customers/{id}/documents/{document}` | removes document |
| POST | `customer/my/identity-document` | identity_document (on Customer) |

### Merchant Documents
| Method | URI | Collection |
|--------|-----|------------|
| POST | `merchants/{id}/documents` | document (on MerchantDocument) |
| DELETE | `merchants/{id}/documents/{document}` | removes document |
| POST | `auth/merchant/documents` | self-service upload |
| DELETE | `auth/merchant/documents/{document}` | self-service delete |

## URL Generation Pattern

In API Resources, media URLs are generated like:
```php
// Single file (logo, avatar, image)
'logo' => $this->whenLoaded('media', function () {
    $logo = $this->getFirstMedia('logo');
    return $logo ? [
        'url'     => $logo->getUrl(),
        'thumb'   => $logo->getUrl('thumb'),
        'preview' => $logo->getUrl('preview'),
    ] : null;
}),
```

For gallery collections, each MediaItem resource includes: `id`, `url`, `thumb`, `preview`, `collection_name`, `file_name`, `size`.

## Frontend Image Cropping
Both admin and customer portal use `react-easy-crop` for cropping images before upload:
- **Avatar**: `AvatarCropDialog` (round crop, 1:1 aspect ratio)
- **Service image**: `AvatarCropDialog` with `cropShape="rect"` (rectangular, 3:2 ratio)
- **Merchant gallery**: Direct upload (no crop UI)
- Crop produces a Blob, uploaded as FormData with `file` field

## Notes
- `singleFile()` on a collection replaces the existing file on upload (no accumulation)
- Multi-file collections (`gallery_*`) accumulate; delete by `media.id`
- All conversions (thumb, preview) are generated asynchronously after upload via Laravel's queue; in sync test mode they run immediately
- The `media` relationship must be eager-loaded for URL generation in Resources; missing eager load returns `null` for the media field
- Document uploads (PDF, DOC) do NOT use ImageRule (no dimension validation) — they use standard `mimes:pdf,doc,docx` + `max:` file validation
- `GET /api/v1/config/images` is public (no auth) — used by frontend on app boot to show upload constraints in forms
