# Config Module

## Overview
Public configuration endpoint exposing client-needed settings. Currently serves image upload configuration (accepted MIME types, size limits, dimension constraints, recommendations) from `config/images.php`.

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller | `app/Http/Controllers/Api/V1/ConfigController.php` | images() — returns `config('images')` |
| Config | `config/images.php` | Image upload settings per type: avatar, document, merchant_logo, service_image, gallery_photo, unit_type_image |

## Routes

### Public routes (no auth)

| Method | URI | Action | Notes |
|--------|-----|--------|-------|
| GET | `config/images` | images | Returns full image config for frontend upload validation |

## Notes
- No service/repository layer — controller directly returns config values
- Frontend uses this to display upload constraints and validate files client-side before upload
- Each image type config includes: mimes, max_size (KB), min_width, min_height, max_width, max_height, recommendation text
