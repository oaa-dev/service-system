# Merchant Gallery Module - Implementation Plan

## Context

New standalone Gallery module for merchants. Accessed at `/merchants/{id}/gallery` with 4 tabs: Photos, Interiors, Exteriors, Feature Image. Each tab is a separate Spatie Media Library collection on the Merchant model. Images support cropping before upload via the existing `AvatarCropDialog` component. No separate DB table needed -- just media collections on the existing Merchant model.

---

## Backend Changes (6 files modified, 2 new)

### B1. Image config + validation rule
- **`config/images.php`** -- Add `merchant_gallery` entry: jpeg/png/webp, 10MB, min 200x200, max 6000x6000
- **`app/Rules/ImageRule.php`** -- Add `merchantGallery()` static factory

### B2. Merchant model -- 4 new media collections
**`app/Models/Merchant.php`** -- In `registerMediaCollections()`:
- `gallery_photos` -- multiple, jpeg/png/webp
- `gallery_interiors` -- multiple, jpeg/png/webp
- `gallery_exteriors` -- multiple, jpeg/png/webp
- `gallery_feature` -- `singleFile()`, jpeg/png/webp

Each collection registers inline conversions: `thumb` (200x200) and `preview` (800x600). Uses collection-scoped `registerMediaConversions` callback to avoid conflict with logo's differently-sized thumb/preview.

### B3. Form request (NEW)
**`app/Http/Requests/Api/V1/Merchant/UploadMerchantGalleryImageRequest.php`**
- Validates `image` field with `ImageRule::merchantGallery()`

### B4. Controller -- 3 new methods
**`app/Http/Controllers/Api/V1/MerchantController.php`**
- `GALLERY_COLLECTIONS` constant: maps `photos` -> `gallery_photos`, `interiors` -> `gallery_interiors`, `exteriors` -> `gallery_exteriors`, `feature` -> `gallery_feature`
- `getGallery(int $id)` -- Returns all 4 collections as formatted arrays (id, url, thumb, preview, name, size, mime_type, created_at)
- `uploadGalleryImage(request, id, collection)` -- Validates collection name, uploads via `addMediaFromRequest('image')->toMediaCollection()`
- `deleteGalleryImage(id, mediaId)` -- Finds media by ID within gallery collections only, deletes it

### B5. Routes
**`routes/api.php`**
- `GET merchants/{merchant}/gallery` -- under `merchants.view` permission
- `POST merchants/{merchant}/gallery/{collection}` -- under `merchants.update` permission
- `DELETE merchants/{merchant}/gallery/{media}` -- under `merchants.update` permission

### B6. Tests (NEW)
**`tests/Feature/Api/V1/MerchantGalleryTest.php`** -- ~12 tests:
- Get empty gallery, get gallery with images
- Upload to each collection (photos, interiors, exteriors, feature)
- Feature image replaces existing (singleFile behavior)
- Rejects invalid collection name
- Validates image required, validates file type
- Delete image, 404 for non-existent, cannot delete logo via gallery endpoint

---

## Frontend Changes (4 new files, 5 modified)

### F1. Types
**`types/api.ts`** -- Add:
- `GalleryImage` interface (id, url, thumb, preview, name, size, mime_type, created_at)
- `MerchantGallery` interface (gallery_photos[], gallery_interiors[], gallery_exteriors[], gallery_feature|null)
- `GalleryCollection` type ('photos'|'interiors'|'exteriors'|'feature')

### F2. Service
**`services/merchantService.ts`** -- Add 3 methods:
- `getGallery(id)` -> `GET /merchants/{id}/gallery`
- `uploadGalleryImage(id, collection, file)` -> `POST /merchants/{id}/gallery/{collection}` (multipart)
- `deleteGalleryImage(merchantId, mediaId)` -> `DELETE /merchants/{merchantId}/gallery/{mediaId}`

### F3. Hooks
**`hooks/useMerchants.ts`** -- Add 3 hooks:
- `useMerchantGallery(id)` -- query with key `['merchants', id, 'gallery']`
- `useUploadGalleryImage()` -- mutation, invalidates gallery query
- `useDeleteGalleryImage()` -- mutation, invalidates gallery query

### F4. Gallery page (NEW)
**`app/(system)/(merchants)/merchants/[id]/gallery/page.tsx`**
- Fetches merchant + gallery data
- Header with back button to merchant edit, merchant name
- 4 tabs: Photos, Interiors, Exteriors, Feature Image
- Each tab renders shared `GalleryTab` component with different props

### F5. GalleryTab component (NEW)
**`app/(system)/(merchants)/merchants/[id]/gallery/gallery-tab.tsx`**
- Props: merchantId, collection, images[], title, description, multiple (bool)
- Upload button -> FileReader -> AvatarCropDialog (cropShape="rect") -> upload mutation
- Image grid (responsive: 2/3/4 cols) with hover overlay + delete button
- For single-file collections (feature): shows single image, upload replaces
- Empty state with icon

### F6. Navigation links
- **`merchants/[id]/page.tsx`** -- Add "Gallery" button next to "Edit" in header
- **`merchants/[id]/edit/page.tsx`** -- Add "Gallery" link button in header

---

## File Summary

| # | File | Action |
|---|------|--------|
| 1 | `backend/config/images.php` | Modify |
| 2 | `backend/app/Rules/ImageRule.php` | Modify |
| 3 | `backend/app/Models/Merchant.php` | Modify |
| 4 | `backend/app/Http/Requests/Api/V1/Merchant/UploadMerchantGalleryImageRequest.php` | Create |
| 5 | `backend/app/Http/Controllers/Api/V1/MerchantController.php` | Modify |
| 6 | `backend/routes/api.php` | Modify |
| 7 | `backend/tests/Feature/Api/V1/MerchantGalleryTest.php` | Create |
| 8 | `frontend/types/api.ts` | Modify |
| 9 | `frontend/services/merchantService.ts` | Modify |
| 10 | `frontend/hooks/useMerchants.ts` | Modify |
| 11 | `frontend/app/(system)/(merchants)/merchants/[id]/gallery/page.tsx` | Create |
| 12 | `frontend/app/(system)/(merchants)/merchants/[id]/gallery/gallery-tab.tsx` | Create |
| 13 | `frontend/app/(system)/(merchants)/merchants/[id]/page.tsx` | Modify |
| 14 | `frontend/app/(system)/(merchants)/merchants/[id]/edit/page.tsx` | Modify |

---

## API Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/merchants/{id}/gallery` | merchants.view | Get all gallery data (4 collections) |
| POST | `/merchants/{id}/gallery/{collection}` | merchants.update | Upload image to collection (photos/interiors/exteriors/feature) |
| DELETE | `/merchants/{id}/gallery/{mediaId}` | merchants.update | Delete specific gallery image |

### GET Response Format
```json
{
  "success": true,
  "data": {
    "gallery_photos": [
      { "id": 1, "url": "...", "thumb": "...", "preview": "...", "name": "photo.jpg", "size": 123456, "mime_type": "image/jpeg", "created_at": "..." }
    ],
    "gallery_interiors": [],
    "gallery_exteriors": [],
    "gallery_feature": null
  }
}
```

### POST Response Format
```json
{
  "success": true,
  "data": { "id": 1, "url": "...", "thumb": "...", "preview": "...", "name": "photo.jpg", "size": 123456, "mime_type": "image/jpeg", "created_at": "..." }
}
```

---

## Key Design Decisions

1. **No separate DB table** -- Gallery is just Spatie Media collections on the Merchant model
2. **Collection-scoped conversions** -- Gallery thumb/preview sizes (200x200 / 800x600) differ from logo (100x100 / 400x400), registered per-collection to avoid conflicts
3. **Single reusable GalleryTab component** -- Same component for all 4 tabs, configured via props (multiple vs single file)
4. **Feature image uses `singleFile()`** -- Auto-replaces old image on new upload
5. **Route parameter for collection** -- Single upload endpoint handles all 4 collections via URL param, validated against constant map
6. **Separate gallery endpoint** -- Gallery data fetched via dedicated `/gallery` endpoint, not embedded in MerchantResource (keeps main merchant responses lightweight)

---

## Verification

```bash
# Backend tests
docker compose exec app php artisan test --filter=MerchantGalleryTest

# Frontend
docker compose exec nextjs npx tsc --noEmit
docker compose exec nextjs npm run lint
```
