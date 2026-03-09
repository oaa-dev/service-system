# Brainstorm: Super Admin Advertisement Creation

**Date:** 2026-03-07
**Status:** Draft

## Knowledge Context

- **Coupon module** is the closest existing pattern — supports both platform-wide (`merchant_id IS NULL`) and merchant-scoped coupons, with `target_merchant_id` for branch targeting. Same dual-ownership pattern applies here.
- **Media module** provides Spatie Media Library infrastructure — add `ad_image` config to `config/images.php`, create `ImageRule::adImage()` factory, use media collections with thumb/preview conversions.
- **Reference Data pattern** applies for the admin CRUD side — `is_active`, `sort_order`, permission middleware, Spatie QueryBuilder for filtering/sorting.
- **Authorization sync** lesson from coupon module — frontend UI gating must exactly match backend API authorization.

## Problem / Goal

Super admins need to create and manage advertisements that appear across the platform. Ads can be:
- **Platform-wide** (no merchant association) or **merchant-specific** (tied to a merchant)
- **Targeted** to specific audiences: customers, merchants, or both
- **Multiple formats**: banner images, rich promotional cards, popups, featured merchant spots

## Core Model: Advertisement

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | bigint | PK |
| `merchant_id` | FK nullable | Tied to merchant (null = platform-wide) |
| `title` | string | Ad title/headline |
| `description` | text nullable | Rich description / body text |
| `type` | enum | `banner`, `featured_merchant`, `promotional_card`, `popup` |
| `placement` | enum | `homepage_hero`, `homepage_sidebar`, `merchant_listing`, `merchant_detail`, `dashboard_banner`, `storefront_banner` |
| `target_audience` | enum | `customer`, `merchant`, `all` |
| `link_url` | string nullable | Click-through URL |
| `link_text` | string nullable | CTA button text (e.g., "Learn More", "Visit Store") |
| `is_active` | boolean | Active toggle (default true) |
| `starts_at` | datetime | When ad becomes visible |
| `expires_at` | datetime nullable | When ad stops showing (null = no expiry) |
| `sort_order` | integer | Display priority (lower = higher priority, default 0) |
| `impressions` | integer | View count (default 0) |
| `clicks` | integer | Click count (default 0) |
| `created_by` | FK | User who created it |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### Media Collections

- `ad_image` — Main banner/card image (single file, conversions: thumb 200x200, preview 1200x600)
- Could support multiple images for carousel-type ads later

### Relationships

- `merchant()` — BelongsTo Merchant (nullable, null = platform-wide)
- `creator()` — BelongsTo User (`created_by`)

## Approaches Considered

### Approach A: Single Advertisement Model (Recommended)

- **Description:** One `advertisements` table with `type`, `placement`, and `target_audience` fields to distinguish ad variants. Admin CRUD manages all types from one interface. Frontend filters by placement + audience when rendering.
- **Pros:**
  - Simple schema, one controller, one service
  - Easy to query: `WHERE placement = 'homepage_hero' AND target_audience IN ('customer', 'all') AND is_active = true`
  - Follows existing patterns (coupon has `applicable_to` array, similar concept)
  - Easy to add new types/placements without migrations
- **Cons:**
  - Ad types have different required fields (banner needs image, popup needs different dimensions)
  - Single form might get complex with conditional fields

### Approach B: Polymorphic Ad Types

- **Description:** Base `advertisements` table with shared fields, separate tables for type-specific data (`banner_ads`, `popup_ads`, `featured_merchant_ads`).
- **Pros:**
  - Clean separation of type-specific fields
  - Each type can have its own validation rules
- **Cons:**
  - Over-engineered for current needs
  - More migrations, models, and complexity
  - Harder to query across types

### Approach C: JSON Config Field

- **Description:** Single table with a `config` JSON column for type-specific settings (popup delay, banner aspect ratio, carousel slides, etc.).
- **Pros:**
  - Flexible without new columns/migrations
  - Single table simplicity
- **Cons:**
  - JSON not queryable efficiently
  - Validation is harder
  - No DB-level constraints on type-specific fields

## Decision

**Approach A: Single Advertisement Model** — simplest, follows existing patterns, type-specific behavior handled in frontend rendering. If complexity grows, Approach C's JSON config can be added later as an optional `metadata` column.

## Architecture

### Backend

```
Route → AdvertisementController → StoreAdvertisementRequest/UpdateAdvertisementRequest
      → AdvertisementData (DTO) → AdvertisementService → AdvertisementRepository → Advertisement Model
      → AdvertisementResource (JSON output)
```

### Routes

```
# Public (storefront)
GET /storefront/advertisements?placement=X&audience=customer

# Admin CRUD
GET    /advertisements              (permission: advertisements.view)
GET    /advertisements/{id}         (permission: advertisements.view)
POST   /advertisements              (permission: advertisements.create)
PUT    /advertisements/{id}         (permission: advertisements.update)
DELETE /advertisements/{id}         (permission: advertisements.delete)
POST   /advertisements/{id}/image   (permission: advertisements.update)
DELETE /advertisements/{id}/image   (permission: advertisements.update)

# Merchant self-service (view ads targeting their store)
GET    /auth/merchant/advertisements
```

### Permissions

- `advertisements.view` — View ads list and details
- `advertisements.create` — Create new ads
- `advertisements.update` — Edit ads, upload images
- `advertisements.delete` — Delete ads
- Assigned to: super-admin, admin

### Enums

**Type:** `banner`, `featured_merchant`, `promotional_card`, `popup`

**Placement:** `homepage_hero`, `homepage_sidebar`, `merchant_listing`, `merchant_detail`, `dashboard_banner`, `storefront_banner`

**Target Audience:** `customer`, `merchant`, `all`

### Frontend (Admin)

- Admin page at `/advertisements` with list table, create/edit dialogs
- Filters: type, placement, target_audience, is_active, merchant
- Image upload with crop (rect aspect ratio)
- Merchant selector (optional — null for platform-wide)
- Date range pickers for starts_at/expires_at

### Frontend (Customer Portal)

- Render ads by placement slot (e.g., `<AdBanner placement="homepage_hero" />` component)
- Fetch from storefront endpoint filtered by placement + audience
- Track impressions/clicks via lightweight API calls

### Frontend (Admin/Merchant Dashboard)

- Show merchant-targeted ads on merchant dashboard
- Show platform announcements

## Open Questions

- Should we track impressions/clicks server-side (API call per view/click) or client-side (batch/analytics)?
- Do we need ad scheduling beyond starts_at/expires_at (e.g., show only on weekends, like coupon's valid_schedule)?
- Should merchants be able to request/purchase ad placements, or is it admin-only creation?
- Do we need A/B testing support (multiple ads per slot, rotation)?

## Next Steps

- [ ] Create implementation plan with `/plan`
- [ ] Decide on impression/click tracking approach
- [ ] Design ad placement components for customer portal
- [ ] Define image dimensions per ad type/placement
