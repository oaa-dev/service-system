# Marketplace System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [User Flows](#user-flows)
6. [Frontend Structure](#frontend-structure)
7. [Permissions & Roles](#permissions--roles)
8. [Configuration](#configuration)

---

## Overview

### Purpose

The Marketplace System is a multi-vendor platform that enables:
- **Vendors** to register, create listings, and manage orders
- **Customers** to browse, book services, and purchase products
- **Administrators** to moderate content and manage the platform

### Supported Offering Types

| Type | Description | Booking Model |
|------|-------------|---------------|
| **Service** | Bookable appointments (consultations, repairs, classes) | Time slots or date ranges |
| **Product** | Physical or digital goods for purchase | Quantity-based |
| **Food** | Meals and food items | Quantity + delivery/pickup |
| **Digital** | Downloadable content (courses, templates, software) | Instant delivery |

### Key Features

- Hierarchical categories (unlimited depth)
- Flexible scheduling (time slots + date ranges)
- Admin approval workflow for vendors and listings
- Review and rating system
- Favorites/wishlist functionality
- Real-time search with filters
- Platform commission management

---

## Architecture

### Backend (Laravel)

```
Request Flow:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Route     │ -> │ Controller  │ -> │   Service   │ -> │ Repository  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                  │                   │
                          ▼                  ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │ FormRequest │    │     DTO     │    │    Model    │
                   │ (validation)│    │ (data xfer) │    │  (Eloquent) │
                   └─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Resource   │ -> JSON Response
                   │ (transform) │
                   └─────────────┘
```

### Frontend (Next.js)

```
Component Architecture:
┌─────────────────────────────────────────────────────┐
│                    App Router                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  (public)   │  │  (vendor)   │  │   (admin)   │  │
│  │   routes    │  │   routes    │  │   routes    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    Pages    │   │ Components  │   │    Hooks    │
└─────────────┘   └─────────────┘   └─────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
              ┌─────────────────────┐
              │      Services       │ -> API calls
              │   (React Query)     │
              └─────────────────────┘
                          │
              ┌─────────────────────┐
              │       Stores        │ -> UI state
              │      (Zustand)      │
              └─────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │ 1───1 │   Vendor    │ 1───* │   Listing   │
│             │       │             │       │             │
│ - id        │       │ - id        │       │ - id        │
│ - name      │       │ - user_id   │       │ - vendor_id │
│ - email     │       │ - bus_name  │       │ - title     │
│ - password  │       │ - slug      │       │ - type      │
└─────────────┘       │ - status    │       │ - price     │
                      │ - commission│       │ - status    │
                      └─────────────┘       └──────┬──────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              ▼
          ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
          │ ListingService  │           │ ListingProduct  │           │  ListingFood    │
          │                 │           │                 │           │                 │
          │ - duration      │           │ - sku           │           │ - prep_time     │
          │ - location_type │           │ - stock_qty     │           │ - allergens     │
          │ - cancellation  │           │ - is_digital    │           │ - dietary_info  │
          └─────────────────┘           └─────────────────┘           └─────────────────┘
```

### Core Tables

#### vendors

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| user_id | BIGINT | Foreign key to users (unique) |
| business_name | VARCHAR(255) | Display name |
| slug | VARCHAR(255) | URL-friendly identifier (unique) |
| description | TEXT | Business description |
| status | ENUM | pending, approved, suspended, rejected |
| verification_status | ENUM | unverified, pending, verified |
| commission_rate | DECIMAL(5,2) | Platform fee percentage |
| settings | JSON | Vendor-specific settings |
| approved_at | TIMESTAMP | When approved |
| approved_by | BIGINT | Admin who approved |
| rejection_reason | TEXT | Why rejected |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

#### categories

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| parent_id | BIGINT | Self-referential (nullable for root) |
| name | VARCHAR(255) | Category name |
| slug | VARCHAR(255) | URL-friendly (unique) |
| description | TEXT | Category description |
| icon | VARCHAR(100) | Icon identifier |
| sort_order | INT | Display order |
| is_active | BOOLEAN | Visibility flag |
| meta | JSON | SEO and metadata |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### listings

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| vendor_id | BIGINT | Foreign key to vendors |
| category_id | BIGINT | Primary category |
| type | ENUM | service, product, food, digital |
| title | VARCHAR(255) | Listing title |
| slug | VARCHAR(255) | URL-friendly (unique per vendor) |
| description | TEXT | Full description |
| short_description | VARCHAR(500) | Summary for cards |
| status | ENUM | draft, pending, approved, rejected, suspended, archived |
| visibility | ENUM | public, private, unlisted |
| base_price | DECIMAL(12,2) | Regular price |
| sale_price | DECIMAL(12,2) | Discounted price (nullable) |
| currency | VARCHAR(3) | Default: USD |
| is_featured | BOOLEAN | Featured flag |
| featured_until | TIMESTAMP | Feature expiration |
| moderation_status | ENUM | pending, approved, rejected |
| moderation_notes | TEXT | Internal notes |
| moderated_by | BIGINT | Admin who moderated |
| rejection_reason | TEXT | Why rejected |
| view_count | INT | Statistics |
| favorite_count | INT | Statistics |
| order_count | INT | Statistics |
| published_at | TIMESTAMP | When made public |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

#### listing_services

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| listing_id | BIGINT | Foreign key (unique) |
| duration_minutes | INT | Service duration |
| buffer_before_minutes | INT | Gap before booking |
| buffer_after_minutes | INT | Gap after booking |
| max_attendees | INT | For group services |
| location_type | ENUM | onsite, remote, customer_location, flexible |
| service_area_radius | INT | Radius in km |
| requires_consultation | BOOLEAN | Consultation required |
| cancellation_policy | ENUM | flexible, moderate, strict |
| cancellation_hours | INT | Free cancellation window |

#### listing_products

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| listing_id | BIGINT | Foreign key (unique) |
| sku | VARCHAR(100) | Stock keeping unit |
| stock_quantity | INT | Available inventory |
| stock_status | ENUM | in_stock, out_of_stock, backorder, preorder |
| track_inventory | BOOLEAN | Enable inventory tracking |
| low_stock_threshold | INT | Alert threshold |
| weight | DECIMAL(8,2) | Weight in kg |
| dimensions | JSON | {length, width, height} in cm |
| is_digital | BOOLEAN | Digital product flag |
| download_limit | INT | Max downloads allowed |
| download_expiry_days | INT | Download link expiration |

#### listing_food

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| listing_id | BIGINT | Foreign key (unique) |
| preparation_time_minutes | INT | Prep time |
| serves | INT | Number of servings |
| calories | INT | Nutritional info |
| allergens | JSON | Array of allergen codes |
| dietary_info | JSON | {vegetarian, vegan, gluten_free, ...} |
| ingredients | TEXT | Ingredient list |
| is_available_for_delivery | BOOLEAN | Delivery option |
| is_available_for_pickup | BOOLEAN | Pickup option |
| delivery_radius_km | INT | Delivery area |
| minimum_order_amount | DECIMAL(10,2) | Minimum order |

#### listing_variants

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| listing_id | BIGINT | Foreign key |
| name | VARCHAR(255) | Display name (e.g., "Large - Blue") |
| sku | VARCHAR(100) | Variant SKU |
| price_adjustment | DECIMAL(12,2) | +/- from base price |
| stock_quantity | INT | Variant inventory |
| attributes | JSON | {size: "L", color: "Blue"} |
| sort_order | INT | Display order |
| is_active | BOOLEAN | Availability |

#### listing_pricing_tiers

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| listing_id | BIGINT | Foreign key |
| tier_type | ENUM | quantity, duration, group_size |
| min_value | INT | Minimum threshold |
| max_value | INT | Maximum threshold (nullable) |
| price | DECIMAL(12,2) | Tier price |
| discount_percentage | DECIMAL(5,2) | Alternative: percentage off |
| description | VARCHAR(255) | Tier description |

### Scheduling Tables

#### availability_schedules (Polymorphic)

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| schedulable_type | VARCHAR(255) | Vendor or Listing model |
| schedulable_id | BIGINT | Model ID |
| day_of_week | TINYINT | 0=Sunday, 6=Saturday |
| start_time | TIME | Opening time |
| end_time | TIME | Closing time |
| is_active | BOOLEAN | Enabled flag |

#### availability_exceptions (Polymorphic)

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| schedulable_type | VARCHAR(255) | Vendor or Listing model |
| schedulable_id | BIGINT | Model ID |
| exception_date | DATE | Specific date |
| type | ENUM | unavailable, modified |
| start_time | TIME | Modified start (if type=modified) |
| end_time | TIME | Modified end (if type=modified) |
| reason | VARCHAR(255) | Holiday, vacation, etc. |

#### time_slots

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| listing_id | BIGINT | Foreign key |
| slot_date | DATE | Slot date |
| start_time | TIME | Slot start |
| end_time | TIME | Slot end |
| capacity | INT | Max bookings |
| booked_count | INT | Current bookings |
| status | ENUM | available, booked, blocked, past |
| price_override | DECIMAL(12,2) | Special pricing |

#### date_ranges

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| listing_id | BIGINT | Foreign key |
| start_date | DATE | Range start |
| end_date | DATE | Range end |
| type | ENUM | available, blocked, booked |
| price_per_day | DECIMAL(12,2) | Daily rate |
| minimum_days | INT | Minimum booking length |
| maximum_days | INT | Maximum booking length |
| booking_id | BIGINT | If type=booked |
| notes | VARCHAR(255) | Internal notes |

### Order Tables

#### orders

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| order_number | VARCHAR(32) | Unique order ID (e.g., ORD-20240115-ABCD) |
| customer_id | BIGINT | Foreign key to users |
| vendor_id | BIGINT | Foreign key to vendors |
| type | ENUM | purchase, booking |
| status | ENUM | pending, confirmed, processing, completed, cancelled, refunded |
| payment_status | ENUM | pending, paid, partially_paid, refunded, failed |
| payment_method | VARCHAR(50) | stripe, paypal, manual |
| subtotal | DECIMAL(12,2) | Before fees/taxes |
| discount_amount | DECIMAL(12,2) | Applied discounts |
| tax_amount | DECIMAL(12,2) | Taxes |
| total_amount | DECIMAL(12,2) | Final amount |
| currency | VARCHAR(3) | Currency code |
| platform_fee | DECIMAL(12,2) | Platform commission |
| vendor_payout | DECIMAL(12,2) | Vendor receives |
| customer_name | VARCHAR(255) | Snapshot at order time |
| customer_email | VARCHAR(255) | Snapshot |
| customer_phone | VARCHAR(20) | Snapshot |
| customer_notes | TEXT | Order notes |
| internal_notes | TEXT | Admin/vendor notes |
| cancelled_at | TIMESTAMP | When cancelled |
| cancelled_by | BIGINT | Who cancelled |
| cancellation_reason | TEXT | Why cancelled |
| completed_at | TIMESTAMP | When completed |

#### order_items

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| order_id | BIGINT | Foreign key |
| listing_id | BIGINT | Foreign key |
| listing_variant_id | BIGINT | Foreign key (nullable) |
| listing_title | VARCHAR(255) | Snapshot |
| listing_type | ENUM | Snapshot |
| variant_name | VARCHAR(255) | Snapshot |
| quantity | INT | Quantity ordered |
| unit_price | DECIMAL(12,2) | Price per unit |
| total_price | DECIMAL(12,2) | Line total |
| scheduled_start | TIMESTAMP | For bookings |
| scheduled_end | TIMESTAMP | For bookings |
| time_slot_id | BIGINT | For time-slot bookings |
| status | ENUM | pending, confirmed, in_progress, completed, cancelled |

### Review Tables

#### reviews (Polymorphic)

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| reviewable_type | VARCHAR(255) | Listing or Vendor |
| reviewable_id | BIGINT | Model ID |
| user_id | BIGINT | Reviewer |
| order_id | BIGINT | Associated order (nullable) |
| rating | TINYINT | 1-5 stars |
| title | VARCHAR(255) | Review title |
| comment | TEXT | Review body |
| is_verified_purchase | BOOLEAN | Purchased before reviewing |
| is_visible | BOOLEAN | Public visibility |
| vendor_response | TEXT | Vendor reply |
| vendor_responded_at | TIMESTAMP | Reply timestamp |
| moderation_status | ENUM | pending, approved, rejected |
| moderated_by | BIGINT | Moderator |

#### favorites (Polymorphic)

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| user_id | BIGINT | User |
| favoritable_type | VARCHAR(255) | Listing or Vendor |
| favoritable_id | BIGINT | Model ID |
| created_at | TIMESTAMP | When favorited |

---

## API Reference

### Authentication

All protected endpoints require:
```
Authorization: Bearer {access_token}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

### Public Endpoints

#### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories` | Get category tree |
| GET | `/api/v1/categories/{slug}` | Get category with listings |

**GET /api/v1/categories**

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Services",
      "slug": "services",
      "icon": "wrench",
      "children": [
        {
          "id": 2,
          "name": "Home Services",
          "slug": "home-services",
          "children": [...]
        }
      ]
    }
  ]
}
```

#### Listings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/listings` | Browse/search listings |
| GET | `/api/v1/listings/{slug}` | Get listing detail |
| GET | `/api/v1/listings/{id}/reviews` | Get listing reviews |
| GET | `/api/v1/listings/{id}/availability` | Get available slots/dates |

**GET /api/v1/listings**

Query Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number |
| per_page | int | Items per page (max 50) |
| sort | string | Sort field (price, -price, created_at, rating) |
| filter[search] | string | Full-text search |
| filter[type] | string | service, product, food, digital |
| filter[category] | string | Category slug |
| filter[vendor] | int | Vendor ID |
| filter[price_min] | number | Minimum price |
| filter[price_max] | number | Maximum price |
| filter[rating_min] | number | Minimum rating |

#### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendors` | Browse vendors |
| GET | `/api/v1/vendors/{slug}` | Get vendor profile |
| GET | `/api/v1/vendors/{id}/reviews` | Get vendor reviews |

### Customer Endpoints (Auth Required)

#### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders` | My orders |
| POST | `/api/v1/orders` | Create order |
| GET | `/api/v1/orders/{id}` | Order detail |
| POST | `/api/v1/orders/{id}/cancel` | Cancel order |

**POST /api/v1/orders**

Request:
```json
{
  "items": [
    {
      "listing_id": 1,
      "variant_id": null,
      "quantity": 2
    }
  ],
  "customer_notes": "Please deliver after 5pm"
}
```

#### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bookings` | Create booking |
| PUT | `/api/v1/bookings/{id}/reschedule` | Reschedule |
| POST | `/api/v1/bookings/{id}/cancel` | Cancel booking |

**POST /api/v1/bookings**

Request (time slot):
```json
{
  "listing_id": 1,
  "time_slot_id": 15,
  "customer_notes": "First time visit"
}
```

Request (date range):
```json
{
  "listing_id": 1,
  "start_date": "2024-02-01",
  "end_date": "2024-02-05",
  "customer_notes": "Need early check-in"
}
```

#### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/listings/{id}/reviews` | Submit review |
| PUT | `/api/v1/reviews/{id}` | Update my review |
| DELETE | `/api/v1/reviews/{id}` | Delete my review |

**POST /api/v1/listings/{id}/reviews**

Request:
```json
{
  "rating": 5,
  "title": "Excellent service",
  "comment": "Very professional and timely."
}
```

#### Favorites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/favorites` | My favorites |
| POST | `/api/v1/favorites` | Add favorite |
| DELETE | `/api/v1/favorites/{type}/{id}` | Remove favorite |

### Vendor Endpoints (Vendor Role Required)

#### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/vendor/register` | Register as vendor |
| GET | `/api/v1/vendor/profile` | My vendor profile |
| PUT | `/api/v1/vendor/profile` | Update profile |

**POST /api/v1/vendor/register**

Request:
```json
{
  "business_name": "John's Plumbing",
  "description": "Professional plumbing services since 2010",
  "settings": {
    "accept_bookings": true,
    "auto_confirm": false
  }
}
```

#### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendor/dashboard` | Dashboard stats |
| GET | `/api/v1/vendor/analytics` | Detailed analytics |

**GET /api/v1/vendor/dashboard**

Response:
```json
{
  "success": true,
  "data": {
    "total_listings": 15,
    "active_listings": 12,
    "pending_orders": 3,
    "completed_orders": 150,
    "revenue_this_month": 5420.00,
    "average_rating": 4.8,
    "total_reviews": 89
  }
}
```

#### Listings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendor/listings` | My listings |
| POST | `/api/v1/vendor/listings` | Create listing |
| GET | `/api/v1/vendor/listings/{id}` | Get listing |
| PUT | `/api/v1/vendor/listings/{id}` | Update listing |
| DELETE | `/api/v1/vendor/listings/{id}` | Delete listing |
| POST | `/api/v1/vendor/listings/{id}/submit` | Submit for moderation |
| POST | `/api/v1/vendor/listings/{id}/publish` | Publish approved listing |
| POST | `/api/v1/vendor/listings/{id}/archive` | Archive listing |
| POST | `/api/v1/vendor/listings/{id}/duplicate` | Duplicate listing |

**POST /api/v1/vendor/listings**

Request (Service):
```json
{
  "category_id": 5,
  "type": "service",
  "title": "Home Plumbing Repair",
  "description": "Professional plumbing repair service...",
  "short_description": "Fast, reliable plumbing repairs",
  "base_price": 75.00,
  "service": {
    "duration_minutes": 60,
    "buffer_before_minutes": 15,
    "buffer_after_minutes": 15,
    "location_type": "customer_location",
    "service_area_radius": 25,
    "cancellation_policy": "moderate",
    "cancellation_hours": 24
  }
}
```

Request (Product):
```json
{
  "category_id": 10,
  "type": "product",
  "title": "Wireless Bluetooth Headphones",
  "description": "Premium sound quality...",
  "base_price": 79.99,
  "sale_price": 59.99,
  "product": {
    "sku": "WBH-001",
    "stock_quantity": 100,
    "track_inventory": true,
    "weight": 0.3,
    "dimensions": {
      "length": 20,
      "width": 18,
      "height": 8
    }
  },
  "variants": [
    {
      "name": "Black",
      "sku": "WBH-001-BLK",
      "attributes": {"color": "Black"},
      "stock_quantity": 50
    },
    {
      "name": "White",
      "sku": "WBH-001-WHT",
      "attributes": {"color": "White"},
      "stock_quantity": 50
    }
  ]
}
```

#### Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/vendor/listings/{id}/media` | Upload images |
| DELETE | `/api/v1/vendor/listings/{id}/media/{mediaId}` | Delete image |
| PUT | `/api/v1/vendor/listings/{id}/media/reorder` | Reorder images |

#### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendor/availability` | My schedule |
| PUT | `/api/v1/vendor/availability` | Update schedule |
| POST | `/api/v1/vendor/availability/exceptions` | Add exception |
| DELETE | `/api/v1/vendor/availability/exceptions/{id}` | Remove exception |
| GET | `/api/v1/vendor/listings/{id}/availability` | Listing availability |
| PUT | `/api/v1/vendor/listings/{id}/availability` | Update listing availability |
| POST | `/api/v1/vendor/listings/{id}/slots/generate` | Generate time slots |

**PUT /api/v1/vendor/availability**

Request:
```json
{
  "schedules": [
    {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00", "is_active": true},
    {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00", "is_active": true},
    {"day_of_week": 3, "start_time": "09:00", "end_time": "17:00", "is_active": true},
    {"day_of_week": 4, "start_time": "09:00", "end_time": "17:00", "is_active": true},
    {"day_of_week": 5, "start_time": "09:00", "end_time": "17:00", "is_active": true},
    {"day_of_week": 6, "start_time": "10:00", "end_time": "14:00", "is_active": true},
    {"day_of_week": 0, "start_time": "00:00", "end_time": "00:00", "is_active": false}
  ]
}
```

#### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendor/orders` | Orders received |
| GET | `/api/v1/vendor/orders/{id}` | Order detail |
| POST | `/api/v1/vendor/orders/{id}/confirm` | Confirm order |
| POST | `/api/v1/vendor/orders/{id}/complete` | Mark complete |
| POST | `/api/v1/vendor/orders/{id}/cancel` | Cancel order |

#### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendor/reviews` | Reviews for my listings |
| POST | `/api/v1/vendor/reviews/{id}/respond` | Respond to review |

### Admin Endpoints (Admin Permission Required)

#### Vendor Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/vendors` | All vendors |
| GET | `/api/v1/admin/vendors/pending` | Pending approval |
| GET | `/api/v1/admin/vendors/{id}` | Vendor detail |
| POST | `/api/v1/admin/vendors/{id}/approve` | Approve vendor |
| POST | `/api/v1/admin/vendors/{id}/reject` | Reject vendor |
| POST | `/api/v1/admin/vendors/{id}/suspend` | Suspend vendor |
| PUT | `/api/v1/admin/vendors/{id}` | Update vendor |

#### Listing Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/listings` | All listings |
| GET | `/api/v1/admin/listings/pending` | Pending moderation |
| GET | `/api/v1/admin/listings/{id}` | Listing detail |
| POST | `/api/v1/admin/listings/{id}/approve` | Approve listing |
| POST | `/api/v1/admin/listings/{id}/reject` | Reject listing |
| POST | `/api/v1/admin/listings/{id}/suspend` | Suspend listing |

#### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/categories` | All categories |
| POST | `/api/v1/admin/categories` | Create category |
| PUT | `/api/v1/admin/categories/{id}` | Update category |
| DELETE | `/api/v1/admin/categories/{id}` | Delete category |
| PUT | `/api/v1/admin/categories/reorder` | Reorder categories |

#### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/reviews` | All reviews |
| GET | `/api/v1/admin/reviews/pending` | Pending moderation |
| POST | `/api/v1/admin/reviews/{id}/approve` | Approve review |
| POST | `/api/v1/admin/reviews/{id}/reject` | Reject review |

#### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Admin dashboard |
| GET | `/api/v1/admin/analytics` | Platform analytics |

---

## User Flows

### Vendor Registration Flow

```
1. User logs in or registers
           │
           ▼
2. User clicks "Become a Vendor"
           │
           ▼
3. Fill vendor registration form
   - Business name
   - Description
   - Business documents (optional)
           │
           ▼
4. Submit application
   Status: PENDING
           │
           ▼
5. Admin reviews application
           │
     ┌─────┴─────┐
     ▼           ▼
  APPROVE     REJECT
     │           │
     ▼           ▼
6a. Vendor      6b. Notification
    Dashboard       with reason
    Access
```

### Listing Creation Flow

```
1. Vendor creates listing
   Status: DRAFT
           │
           ▼
2. Add details
   - Title, description, price
   - Type-specific fields
   - Images
   - Availability (for services)
           │
           ▼
3. Submit for moderation
   Status: PENDING
           │
           ▼
4. Admin reviews listing
           │
     ┌─────┴─────┐
     ▼           ▼
  APPROVE     REJECT
     │           │
     ▼           ▼
5a. Vendor     5b. Vendor
    publishes      revises
    Status:        and
    APPROVED       resubmits
           │
           ▼
6. Listing goes live
   Status: APPROVED
   Visibility: PUBLIC
```

### Booking Flow (Service)

```
1. Customer views listing
           │
           ▼
2. Check availability calendar
           │
           ▼
3. Select time slot or date range
           │
           ▼
4. Review booking details
   - Price breakdown
   - Cancellation policy
           │
           ▼
5. Confirm booking
   Order Status: PENDING
           │
           ▼
6. Vendor confirms
   Order Status: CONFIRMED
           │
           ▼
7. Service delivered
   Order Status: COMPLETED
           │
           ▼
8. Customer can leave review
```

### Purchase Flow (Product)

```
1. Customer browses listings
           │
           ▼
2. Add to cart
   - Select variant (if any)
   - Set quantity
           │
           ▼
3. View cart
           │
           ▼
4. Checkout
   - Review items
   - Add notes
           │
           ▼
5. Submit order
   Order Status: PENDING
   Payment Status: PENDING
           │
           ▼
6. Payment (manual/future integration)
   Payment Status: PAID
           │
           ▼
7. Vendor processes order
   Order Status: PROCESSING
           │
           ▼
8. Order shipped/delivered
   Order Status: COMPLETED
           │
           ▼
9. Customer can leave review
```

---

## Frontend Structure

### Route Structure

```
frontend/app/
│
├── (public)/                    # No auth required
│   ├── page.tsx                 # Homepage
│   ├── search/page.tsx          # Search results
│   ├── categories/
│   │   ├── page.tsx             # All categories
│   │   └── [slug]/page.tsx      # Category listings
│   ├── listings/
│   │   └── [slug]/page.tsx      # Listing detail
│   └── vendors/
│       ├── page.tsx             # Vendor directory
│       └── [slug]/page.tsx      # Vendor profile
│
├── (auth)/                      # Auth pages
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── register/vendor/page.tsx # Vendor registration
│
├── (customer)/                  # Customer dashboard
│   ├── layout.tsx
│   ├── orders/
│   │   ├── page.tsx             # My orders
│   │   └── [id]/page.tsx        # Order detail
│   ├── bookings/page.tsx        # My bookings
│   └── favorites/page.tsx       # My favorites
│
├── (vendor)/                    # Vendor dashboard
│   ├── layout.tsx               # Sidebar layout
│   ├── dashboard/page.tsx       # Stats & overview
│   ├── listings/
│   │   ├── page.tsx             # My listings
│   │   ├── create/page.tsx      # Create listing
│   │   └── [id]/edit/page.tsx   # Edit listing
│   ├── orders/
│   │   ├── page.tsx             # Received orders
│   │   └── [id]/page.tsx        # Order detail
│   ├── reviews/page.tsx         # My reviews
│   ├── availability/page.tsx    # Schedule management
│   ├── analytics/page.tsx       # Analytics
│   └── settings/page.tsx        # Vendor settings
│
└── (admin)/                     # Admin dashboard
    ├── layout.tsx
    ├── dashboard/page.tsx
    ├── (vendors)/
    │   ├── vendors/page.tsx
    │   ├── vendors/pending/page.tsx
    │   └── vendors/[id]/page.tsx
    ├── (listings)/
    │   ├── listings/page.tsx
    │   ├── listings/pending/page.tsx
    │   └── listings/[id]/page.tsx
    ├── (categories)/
    │   ├── categories/page.tsx
    │   ├── categories/create/page.tsx
    │   └── categories/[id]/edit/page.tsx
    ├── (reviews)/reviews/page.tsx
    └── (analytics)/analytics/page.tsx
```

### Component Organization

```
frontend/components/
│
├── vendor/
│   ├── vendor-card.tsx
│   ├── vendor-profile-header.tsx
│   ├── vendor-stats.tsx
│   ├── vendor-registration-form.tsx
│   └── vendor-settings-form.tsx
│
├── listing/
│   ├── listing-card.tsx
│   ├── listing-grid.tsx
│   ├── listing-detail.tsx
│   ├── listing-gallery.tsx
│   ├── listing-pricing.tsx
│   ├── listing-availability.tsx
│   ├── listing-booking-form.tsx
│   ├── listing-review-list.tsx
│   └── listing-form/
│       ├── listing-form.tsx
│       ├── service-fields.tsx
│       ├── product-fields.tsx
│       ├── food-fields.tsx
│       ├── media-uploader.tsx
│       ├── pricing-tiers.tsx
│       └── variants-manager.tsx
│
├── category/
│   ├── category-tree.tsx
│   ├── category-nav.tsx
│   ├── category-filter.tsx
│   ├── category-breadcrumb.tsx
│   └── category-form.tsx
│
├── order/
│   ├── order-list.tsx
│   ├── order-card.tsx
│   ├── order-detail.tsx
│   ├── order-status-badge.tsx
│   └── order-timeline.tsx
│
├── booking/
│   ├── booking-calendar.tsx
│   ├── booking-time-picker.tsx
│   ├── booking-summary.tsx
│   └── date-range-picker.tsx
│
├── review/
│   ├── review-card.tsx
│   ├── review-list.tsx
│   ├── review-form.tsx
│   ├── review-stats.tsx
│   └── vendor-response.tsx
│
├── search/
│   ├── search-bar.tsx
│   ├── search-filters.tsx
│   ├── search-results.tsx
│   ├── filter-sidebar.tsx
│   └── sort-selector.tsx
│
├── availability/
│   ├── weekly-schedule.tsx
│   ├── schedule-editor.tsx
│   ├── exception-manager.tsx
│   ├── time-slot-grid.tsx
│   └── calendar-view.tsx
│
├── moderation/
│   ├── moderation-queue.tsx
│   ├── moderation-actions.tsx
│   ├── approval-dialog.tsx
│   └── rejection-dialog.tsx
│
└── common/
    ├── price-display.tsx
    ├── rating-stars.tsx
    ├── favorite-button.tsx
    ├── share-button.tsx
    ├── status-badge.tsx
    └── image-gallery.tsx
```

### State Management

**Zustand Stores:**

```typescript
// stores/cartStore.ts
interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

// stores/searchStore.ts
interface SearchState {
  query: string;
  filters: SearchFilters;
  setQuery: (query: string) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
}

// stores/bookingStore.ts
interface BookingState {
  selectedListing: Listing | null;
  selectedSlot: TimeSlot | null;
  selectedDateRange: DateRange | null;
  setListing: (listing: Listing) => void;
  setSlot: (slot: TimeSlot) => void;
  setDateRange: (range: DateRange) => void;
  clear: () => void;
}
```

---

## Permissions & Roles

### Permissions

```php
// Vendor permissions
'vendors.view'      // View vendor list
'vendors.create'    // Register new vendors
'vendors.update'    // Update vendor profiles
'vendors.delete'    // Delete vendors
'vendors.approve'   // Approve/reject vendor applications
'vendors.suspend'   // Suspend vendors

// Listing permissions
'listings.view'     // View all listings (including draft/pending)
'listings.create'   // Create listings
'listings.update'   // Update listings
'listings.delete'   // Delete listings
'listings.moderate' // Approve/reject listings
'listings.feature'  // Feature/unfeature listings

// Category permissions
'categories.view'   // View categories
'categories.create' // Create categories
'categories.update' // Update categories
'categories.delete' // Delete categories

// Order permissions
'orders.view'       // View all orders
'orders.create'     // Create orders
'orders.update'     // Update order status
'orders.cancel'     // Cancel orders
'orders.refund'     // Process refunds

// Review permissions
'reviews.view'      // View all reviews
'reviews.create'    // Create reviews
'reviews.update'    // Update reviews
'reviews.delete'    // Delete reviews
'reviews.moderate'  // Moderate reviews

// Analytics permissions
'analytics.view'    // View analytics
'analytics.export'  // Export analytics data
```

### Roles

```php
// Vendor role - assigned when vendor is approved
'vendor' => [
    'listings.create',
    'listings.update',
    'listings.delete',
    'orders.view',
    'reviews.view',
]

// Moderator role - content moderation
'moderator' => [
    'vendors.view',
    'vendors.approve',
    'listings.view',
    'listings.moderate',
    'reviews.view',
    'reviews.moderate',
]

// Admin role - full platform access
'admin' => [
    // All permissions
]

// Super Admin - cannot be modified
'super-admin' => [
    // All permissions (implicit)
]
```

---

## Configuration

### Marketplace Configuration

Create `config/marketplace.php`:

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Vendor Configuration
    |--------------------------------------------------------------------------
    */
    'vendor' => [
        // Default commission percentage for new vendors
        'default_commission_rate' => env('MARKETPLACE_COMMISSION_RATE', 10.00),

        // Auto-approve vendor applications (skip moderation)
        'auto_approve' => env('MARKETPLACE_VENDOR_AUTO_APPROVE', false),

        // Require document verification
        'require_verification' => env('MARKETPLACE_VENDOR_VERIFICATION', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Listing Configuration
    |--------------------------------------------------------------------------
    */
    'listing' => [
        // Maximum images per listing
        'max_images' => env('MARKETPLACE_MAX_IMAGES', 10),

        // Maximum file size for images (KB)
        'max_image_size' => env('MARKETPLACE_MAX_IMAGE_SIZE', 5120),

        // Require moderation before publishing
        'require_moderation' => env('MARKETPLACE_LISTING_MODERATION', true),

        // Days to auto-generate time slots in advance
        'auto_generate_slots_days' => env('MARKETPLACE_SLOTS_DAYS', 30),

        // Allowed listing types
        'allowed_types' => ['service', 'product', 'food', 'digital'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Booking Configuration
    |--------------------------------------------------------------------------
    */
    'booking' => [
        // Default cancellation window (hours before booking)
        'default_cancellation_hours' => env('MARKETPLACE_CANCELLATION_HOURS', 24),

        // Allow same-day bookings
        'allow_same_day_booking' => env('MARKETPLACE_SAME_DAY_BOOKING', true),

        // Minimum advance booking time (hours)
        'minimum_advance_hours' => env('MARKETPLACE_MIN_ADVANCE_HOURS', 2),

        // Buffer time between bookings (minutes)
        'default_buffer_minutes' => env('MARKETPLACE_DEFAULT_BUFFER', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | Order Configuration
    |--------------------------------------------------------------------------
    */
    'order' => [
        // Order number prefix
        'number_prefix' => env('MARKETPLACE_ORDER_PREFIX', 'ORD'),

        // Auto-complete orders after X days
        'auto_complete_days' => env('MARKETPLACE_AUTO_COMPLETE_DAYS', 7),

        // Default currency
        'default_currency' => env('MARKETPLACE_CURRENCY', 'USD'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Review Configuration
    |--------------------------------------------------------------------------
    */
    'review' => [
        // Require moderation for reviews
        'require_moderation' => env('MARKETPLACE_REVIEW_MODERATION', false),

        // Only allow verified purchases to review
        'verified_only' => env('MARKETPLACE_VERIFIED_REVIEWS', false),

        // Days after order completion to allow review
        'review_window_days' => env('MARKETPLACE_REVIEW_WINDOW', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Search Configuration
    |--------------------------------------------------------------------------
    */
    'search' => [
        // Default results per page
        'per_page' => env('MARKETPLACE_SEARCH_PER_PAGE', 20),

        // Maximum results per page
        'max_per_page' => env('MARKETPLACE_SEARCH_MAX_PER_PAGE', 50),

        // Enable full-text search
        'full_text_enabled' => env('MARKETPLACE_FULL_TEXT_SEARCH', true),
    ],
];
```

### Environment Variables

Add to `.env`:

```env
# Marketplace Configuration
MARKETPLACE_COMMISSION_RATE=10.00
MARKETPLACE_VENDOR_AUTO_APPROVE=false
MARKETPLACE_VENDOR_VERIFICATION=false
MARKETPLACE_MAX_IMAGES=10
MARKETPLACE_MAX_IMAGE_SIZE=5120
MARKETPLACE_LISTING_MODERATION=true
MARKETPLACE_SLOTS_DAYS=30
MARKETPLACE_CANCELLATION_HOURS=24
MARKETPLACE_SAME_DAY_BOOKING=true
MARKETPLACE_MIN_ADVANCE_HOURS=2
MARKETPLACE_DEFAULT_BUFFER=15
MARKETPLACE_ORDER_PREFIX=ORD
MARKETPLACE_AUTO_COMPLETE_DAYS=7
MARKETPLACE_CURRENCY=USD
MARKETPLACE_REVIEW_MODERATION=false
MARKETPLACE_VERIFIED_REVIEWS=false
MARKETPLACE_REVIEW_WINDOW=30
MARKETPLACE_SEARCH_PER_PAGE=20
MARKETPLACE_SEARCH_MAX_PER_PAGE=50
MARKETPLACE_FULL_TEXT_SEARCH=true
```

---

## Events & Notifications

### Events

```php
// Vendor events
App\Events\VendorRegistered::class
App\Events\VendorApproved::class
App\Events\VendorRejected::class
App\Events\VendorSuspended::class

// Listing events
App\Events\ListingSubmitted::class
App\Events\ListingApproved::class
App\Events\ListingRejected::class
App\Events\ListingPublished::class

// Order events
App\Events\OrderCreated::class
App\Events\OrderConfirmed::class
App\Events\OrderCompleted::class
App\Events\OrderCancelled::class

// Booking events
App\Events\BookingCreated::class
App\Events\BookingConfirmed::class
App\Events\BookingRescheduled::class
App\Events\BookingCancelled::class
App\Events\BookingReminder::class  // Scheduled

// Review events
App\Events\ReviewReceived::class
App\Events\ReviewResponded::class
```

### Notifications

```php
// Vendor notifications
App\Notifications\VendorApprovedNotification::class
App\Notifications\VendorRejectedNotification::class
App\Notifications\VendorSuspendedNotification::class

// Listing notifications
App\Notifications\ListingApprovedNotification::class
App\Notifications\ListingRejectedNotification::class

// Order notifications
App\Notifications\NewOrderNotification::class           // To vendor
App\Notifications\OrderConfirmedNotification::class     // To customer
App\Notifications\OrderCompletedNotification::class     // To customer
App\Notifications\OrderCancelledNotification::class     // To both

// Booking notifications
App\Notifications\BookingConfirmedNotification::class
App\Notifications\BookingReminderNotification::class    // 24h before
App\Notifications\BookingRescheduledNotification::class
App\Notifications\BookingCancelledNotification::class

// Review notifications
App\Notifications\NewReviewNotification::class          // To vendor
App\Notifications\ReviewResponseNotification::class     // To customer
```

---

## Appendix

### Status Flow Diagrams

**Vendor Status:**
```
PENDING ──approve──> APPROVED
    │                    │
    └──reject──> REJECTED│
                         │
                    suspend
                         │
                         ▼
                    SUSPENDED
```

**Listing Status:**
```
DRAFT ──submit──> PENDING ──approve──> APPROVED ──publish──> PUBLISHED
                     │                     │
                     └──reject──> REJECTED │
                                           │
                                      suspend
                                           │
                                           ▼
                                      SUSPENDED
                                           │
                                       archive
                                           │
                                           ▼
                                       ARCHIVED
```

**Order Status:**
```
PENDING ──confirm──> CONFIRMED ──process──> PROCESSING ──complete──> COMPLETED
    │                    │                      │
    └────────────────────┴──────────────────────┴──cancel──> CANCELLED
                                                                 │
                                                             refund
                                                                 │
                                                                 ▼
                                                             REFUNDED
```

### Cancellation Policies

| Policy | Description | Refund Rules |
|--------|-------------|--------------|
| **Flexible** | Cancel anytime | Full refund if > 24h before |
| **Moderate** | Cancel with notice | Full refund if > 48h before, 50% if > 24h |
| **Strict** | Limited cancellation | Full refund if > 7 days before, no refund after |

### Allergen Codes

```json
{
  "gluten": "Contains gluten",
  "dairy": "Contains dairy",
  "eggs": "Contains eggs",
  "nuts": "Contains tree nuts",
  "peanuts": "Contains peanuts",
  "soy": "Contains soy",
  "fish": "Contains fish",
  "shellfish": "Contains shellfish",
  "sesame": "Contains sesame"
}
```

### Dietary Info Flags

```json
{
  "vegetarian": true,
  "vegan": false,
  "gluten_free": false,
  "dairy_free": true,
  "keto": false,
  "halal": true,
  "kosher": false
}
```
