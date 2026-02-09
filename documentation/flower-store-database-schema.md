# Flower Store System - Database Schema

## Overview

This document defines the complete database schema for the Flower Store marketplace platform. The schema is designed for Laravel 12 with MySQL/PostgreSQL.

**Conventions:**
- All tables use `id` as primary key (BIGINT UNSIGNED AUTO_INCREMENT)
- All tables include `created_at` and `updated_at` timestamps
- Soft deletes (`deleted_at`) where applicable
- Foreign keys use `{table}_id` naming convention
- JSON columns for flexible/dynamic data
- UUIDs for public-facing identifiers

---

## Table of Contents

1. [Multi-Tenant & Platform](#1-multi-tenant--platform)
2. [Users & Authentication](#2-users--authentication)
3. [Products & Inventory](#3-products--inventory)
4. [Flower Inventory & Freshness](#4-flower-inventory--freshness)
5. [Locations & Delivery](#5-locations--delivery)
6. [Occasions & Important Dates](#6-occasions--important-dates)
7. [Gift & Recipients](#7-gift--recipients)
8. [Orders & Transactions](#8-orders--transactions)
9. [Bouquet Customization](#9-bouquet-customization)
10. [3D Visualization & AR](#10-3d-visualization--ar)
11. [Subscriptions](#11-subscriptions)
12. [Weddings & Events](#12-weddings--events)
13. [Loyalty Program](#13-loyalty-program)
14. [Delivery Management](#14-delivery-management)
15. [Payments](#15-payments)
16. [Reviews & Ratings](#16-reviews--ratings)
17. [Advertising](#17-advertising)
18. [Social & Community](#18-social--community)
19. [Gamification](#19-gamification)
20. [SMS Ordering](#20-sms-ordering)
21. [QR Code System](#21-qr-code-system)
22. [Corporate Accounts](#22-corporate-accounts)
23. [Notifications](#23-notifications)
24. [Support](#24-support)
25. [Promotions](#25-promotions)
26. [Media & Files](#26-media--files)

---

## 1. Multi-Tenant & Platform

### `shops`
Flower shop businesses (tenants)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | Public identifier |
| owner_id | BIGINT UNSIGNED | FK → users.id | Shop owner |
| name | VARCHAR(255) | NOT NULL | Business name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly name |
| code | VARCHAR(10) | UNIQUE, NOT NULL | Short code (e.g., PNB) |
| tagline | VARCHAR(255) | NULL | Shop tagline |
| description | TEXT | NULL | About the shop |
| logo_path | VARCHAR(255) | NULL | Logo image |
| cover_photo_path | VARCHAR(255) | NULL | Cover image |
| intro_video_path | VARCHAR(255) | NULL | Intro video |
| email | VARCHAR(255) | NOT NULL | Contact email |
| phone | VARCHAR(20) | NOT NULL | Contact phone |
| whatsapp | VARCHAR(20) | NULL | WhatsApp number |
| website | VARCHAR(255) | NULL | Website URL |
| facebook_url | VARCHAR(255) | NULL | |
| instagram_url | VARCHAR(255) | NULL | |
| address | VARCHAR(500) | NOT NULL | Physical address |
| latitude | DECIMAL(10,8) | NULL | GPS latitude |
| longitude | DECIMAL(11,8) | NULL | GPS longitude |
| business_permit_number | VARCHAR(100) | NULL | |
| tax_id | VARCHAR(50) | NULL | TIN |
| operating_hours | JSON | NULL | {"mon": {"open": "09:00", "close": "20:00"}, ...} |
| same_day_cutoff | TIME | NULL | Cutoff for same-day orders |
| express_available | BOOLEAN | DEFAULT FALSE | Offers express delivery |
| wedding_services | BOOLEAN | DEFAULT FALSE | Offers wedding services |
| funeral_services | BOOLEAN | DEFAULT FALSE | Offers funeral services |
| settings | JSON | NULL | Shop-specific settings |
| is_verified | BOOLEAN | DEFAULT FALSE | |
| is_featured | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| verified_at | TIMESTAMP | NULL | |
| rating_average | DECIMAL(3,2) | DEFAULT 0.00 | |
| rating_count | INT UNSIGNED | DEFAULT 0 | |
| total_orders | INT UNSIGNED | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Indexes:**
- `idx_shops_slug` (slug)
- `idx_shops_code` (code)
- `idx_shops_location` (latitude, longitude)
- `idx_shops_active` (is_active, is_verified)
- `idx_shops_rating` (rating_average)

---

### `shop_applications`
Applications from new shop owners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| business_name | VARCHAR(255) | NOT NULL | |
| owner_name | VARCHAR(255) | NOT NULL | |
| email | VARCHAR(255) | NOT NULL | |
| phone | VARCHAR(20) | NOT NULL | |
| address | VARCHAR(500) | NOT NULL | |
| business_permit_number | VARCHAR(100) | NULL | |
| years_in_business | INT | NULL | |
| services_offered | JSON | NULL | ['bouquets', 'weddings', 'events'] |
| service_areas | JSON | NULL | |
| portfolio_urls | JSON | NULL | Links to portfolio |
| referral_source | VARCHAR(100) | NULL | |
| notes | TEXT | NULL | |
| status | ENUM | NOT NULL | 'pending', 'reviewing', 'approved', 'rejected' |
| reviewed_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| reviewed_at | TIMESTAMP | NULL | |
| rejection_reason | TEXT | NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id, NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `shop_application_documents`
Documents uploaded with applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| application_id | BIGINT UNSIGNED | FK → shop_applications.id | |
| document_type | VARCHAR(50) | NOT NULL | 'business_permit', 'portfolio', 'id', 'photo' |
| file_path | VARCHAR(500) | NOT NULL | |
| file_name | VARCHAR(255) | NOT NULL | |
| file_size | INT UNSIGNED | NOT NULL | |
| mime_type | VARCHAR(100) | NOT NULL | |
| created_at | TIMESTAMP | | |

---

### `shop_subscriptions`
Platform subscription plans for shops

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| plan | ENUM | NOT NULL | 'basic', 'pro', 'enterprise' |
| price | DECIMAL(10,2) | NOT NULL | |
| features | JSON | NULL | |
| starts_at | DATE | NOT NULL | |
| ends_at | DATE | NULL | |
| trial_ends_at | DATE | NULL | |
| status | ENUM | NOT NULL | 'active', 'cancelled', 'past_due', 'trialing' |
| cancelled_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `shop_users`
Staff members of a shop

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| role | ENUM | NOT NULL | 'owner', 'admin', 'florist', 'staff' |
| permissions | JSON | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_shop_users_unique` UNIQUE (shop_id, user_id)

---

### `shop_gallery`
Shop portfolio/gallery images

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| image_path | VARCHAR(500) | NOT NULL | |
| caption | VARCHAR(255) | NULL | |
| category | VARCHAR(50) | NULL | 'bouquet', 'wedding', 'event', 'shop' |
| is_featured | BOOLEAN | DEFAULT FALSE | |
| sort_order | INT | DEFAULT 0 | |
| created_at | TIMESTAMP | | |

---

## 2. Users & Authentication

### `users`
All platform users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| email_verified_at | TIMESTAMP | NULL | |
| phone | VARCHAR(20) | UNIQUE, NULL | |
| phone_verified_at | TIMESTAMP | NULL | |
| password | VARCHAR(255) | NOT NULL | |
| avatar_path | VARCHAR(255) | NULL | |
| date_of_birth | DATE | NULL | |
| gender | ENUM | NULL | 'male', 'female', 'other' |
| user_type | ENUM | NOT NULL | 'customer', 'admin', 'super_admin' |
| referral_code | VARCHAR(20) | UNIQUE, NULL | |
| referred_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| settings | JSON | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| last_login_at | TIMESTAMP | NULL | |
| remember_token | VARCHAR(100) | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Indexes:**
- `idx_users_email` (email)
- `idx_users_phone` (phone)
- `idx_users_referral_code` (referral_code)

---

### `customer_profiles`
Extended customer information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| user_id | BIGINT UNSIGNED | FK → users.id, UNIQUE | |
| default_shop_id | BIGINT UNSIGNED | FK → shops.id, NULL | Preferred shop |
| default_address_id | BIGINT UNSIGNED | FK → customer_addresses.id, NULL | |
| default_payment_method | VARCHAR(50) | NULL | |
| flower_preferences | JSON | NULL | Preferred flowers, colors |
| allergies | TEXT | NULL | Flower allergies |
| communication_preferences | JSON | NULL | |
| notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `drivers`
Delivery personnel

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| user_id | BIGINT UNSIGNED | FK → users.id, UNIQUE | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| employee_id | VARCHAR(50) | NULL | |
| vehicle_type | ENUM | NOT NULL | 'motorcycle', 'car', 'van', 'bicycle' |
| vehicle_plate_number | VARCHAR(20) | NULL | |
| license_number | VARCHAR(50) | NULL | |
| photo_path | VARCHAR(255) | NULL | |
| current_latitude | DECIMAL(10,8) | NULL | |
| current_longitude | DECIMAL(11,8) | NULL | |
| status | ENUM | NOT NULL | 'available', 'on_delivery', 'offline', 'break' |
| rating_average | DECIMAL(3,2) | DEFAULT 0.00 | |
| rating_count | INT UNSIGNED | DEFAULT 0 | |
| total_deliveries | INT UNSIGNED | DEFAULT 0 | |
| flower_handling_certified | BOOLEAN | DEFAULT FALSE | Trained for flowers |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

---

## 3. Products & Inventory

### `product_categories`
Product categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id, NULL | NULL = global |
| parent_id | BIGINT UNSIGNED | FK → product_categories.id, NULL | |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(100) | NOT NULL | |
| description | TEXT | NULL | |
| image_path | VARCHAR(255) | NULL | |
| icon | VARCHAR(50) | NULL | Emoji or icon class |
| sort_order | INT | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `products`
Flower products and arrangements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| category_id | BIGINT UNSIGNED | FK → product_categories.id, NULL | |
| name | VARCHAR(255) | NOT NULL | |
| slug | VARCHAR(255) | NOT NULL | |
| sku | VARCHAR(50) | NULL | |
| sms_code | VARCHAR(10) | NULL | SMS order code |
| description | TEXT | NULL | |
| short_description | VARCHAR(500) | NULL | |
| product_type | ENUM | NOT NULL | 'bouquet', 'arrangement', 'box', 'basket', 'single_stem', 'plant', 'dried', 'add_on' |
| size | ENUM | NULL | 'small', 'medium', 'large', 'extra_large' |
| price | DECIMAL(10,2) | NOT NULL | |
| compare_price | DECIMAL(10,2) | NULL | Original price if on sale |
| cost | DECIMAL(10,2) | NULL | Cost price |
| preparation_time_hours | INT | DEFAULT 2 | Hours to prepare |
| is_customizable | BOOLEAN | DEFAULT FALSE | Can be customized |
| has_3d_model | BOOLEAN | DEFAULT FALSE | 3D preview available |
| is_seasonal | BOOLEAN | DEFAULT FALSE | |
| available_from | DATE | NULL | Seasonal start |
| available_until | DATE | NULL | Seasonal end |
| stock_status | ENUM | DEFAULT 'in_stock' | 'in_stock', 'low_stock', 'out_of_stock', 'made_to_order' |
| is_featured | BOOLEAN | DEFAULT FALSE | |
| is_bestseller | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| sort_order | INT | DEFAULT 0 | |
| view_count | INT UNSIGNED | DEFAULT 0 | |
| order_count | INT UNSIGNED | DEFAULT 0 | |
| metadata | JSON | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Indexes:**
- `idx_products_shop` (shop_id)
- `idx_products_category` (category_id)
- `idx_products_type` (product_type)
- `idx_products_active` (is_active)
- `idx_products_sms_code` (shop_id, sms_code)

---

### `product_images`
Product images

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| image_path | VARCHAR(500) | NOT NULL | |
| alt_text | VARCHAR(255) | NULL | |
| sort_order | INT | DEFAULT 0 | |
| is_primary | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |

---

### `product_size_variants`
Size variations with different prices

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| size | ENUM | NOT NULL | 'small', 'medium', 'large', 'extra_large' |
| name | VARCHAR(50) | NOT NULL | "Petite", "Classic", "Grand" |
| price | DECIMAL(10,2) | NOT NULL | |
| stem_count | INT | NULL | Number of main flowers |
| description | VARCHAR(255) | NULL | |
| is_default | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `product_occasions`
Link products to occasions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| occasion_id | BIGINT UNSIGNED | FK → occasions.id | |
| is_featured | BOOLEAN | DEFAULT FALSE | Featured for this occasion |
| created_at | TIMESTAMP | | |

**Indexes:**
- `idx_product_occasions_unique` UNIQUE (product_id, occasion_id)

---

### `add_ons`
Add-on products (chocolates, bears, etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| name | VARCHAR(255) | NOT NULL | |
| slug | VARCHAR(255) | NOT NULL | |
| description | TEXT | NULL | |
| category | ENUM | NOT NULL | 'chocolate', 'stuffed_toy', 'balloon', 'cake', 'wine', 'card', 'vase', 'candle', 'other' |
| price | DECIMAL(10,2) | NOT NULL | |
| image_path | VARCHAR(255) | NULL | |
| stock_quantity | INT | NULL | NULL = unlimited |
| is_active | BOOLEAN | DEFAULT TRUE | |
| sort_order | INT | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `product_add_ons`
Default add-ons suggested for products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| add_on_id | BIGINT UNSIGNED | FK → add_ons.id | |
| is_recommended | BOOLEAN | DEFAULT FALSE | |
| sort_order | INT | DEFAULT 0 | |
| created_at | TIMESTAMP | | |

---

## 4. Flower Inventory & Freshness

### `flower_types`
Master list of flower types

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| name | VARCHAR(100) | NOT NULL | "Rose", "Tulip", "Lily" |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | |
| scientific_name | VARCHAR(255) | NULL | |
| description | TEXT | NULL | |
| image_path | VARCHAR(255) | NULL | |
| default_vase_life_days | INT | NULL | Typical lifespan |
| care_instructions | TEXT | NULL | |
| available_colors | JSON | NULL | ['red', 'pink', 'white'] |
| peak_seasons | JSON | NULL | ['spring', 'summer'] |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `flower_batches`
Flower inventory batches (perishable tracking)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| flower_type_id | BIGINT UNSIGNED | FK → flower_types.id | |
| supplier_id | BIGINT UNSIGNED | FK → suppliers.id, NULL | |
| batch_number | VARCHAR(50) | NULL | |
| color | VARCHAR(50) | NOT NULL | |
| quantity_received | INT UNSIGNED | NOT NULL | |
| quantity_remaining | INT UNSIGNED | NOT NULL | |
| quantity_wasted | INT UNSIGNED | DEFAULT 0 | |
| cost_per_stem | DECIMAL(8,2) | NOT NULL | |
| received_date | DATE | NOT NULL | |
| harvest_date | DATE | NULL | |
| best_before_date | DATE | NOT NULL | |
| days_until_expiry | INT | GENERATED | Computed |
| freshness_status | ENUM | NOT NULL | 'fresh', 'good', 'use_soon', 'expiring', 'expired' |
| storage_location | VARCHAR(100) | NULL | |
| quality_grade | ENUM | NULL | 'A', 'B', 'C' |
| notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_batches_shop` (shop_id)
- `idx_batches_flower` (flower_type_id)
- `idx_batches_expiry` (best_before_date)
- `idx_batches_status` (freshness_status)

---

### `suppliers`
Flower suppliers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| name | VARCHAR(255) | NOT NULL | |
| contact_name | VARCHAR(100) | NULL | |
| email | VARCHAR(255) | NULL | |
| phone | VARCHAR(20) | NULL | |
| address | TEXT | NULL | |
| flowers_supplied | JSON | NULL | Flower type IDs |
| lead_time_days | INT | NULL | |
| minimum_order | DECIMAL(10,2) | NULL | |
| payment_terms | VARCHAR(100) | NULL | |
| quality_rating | DECIMAL(3,2) | NULL | 1-5 |
| freshness_rating | DECIMAL(3,2) | NULL | 1-5 |
| is_active | BOOLEAN | DEFAULT TRUE | |
| notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `product_flowers`
Flowers used in a product/arrangement

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| flower_type_id | BIGINT UNSIGNED | FK → flower_types.id | |
| color | VARCHAR(50) | NULL | |
| quantity | INT UNSIGNED | NOT NULL | Stems per arrangement |
| is_main_flower | BOOLEAN | DEFAULT FALSE | Primary flower |
| is_substitutable | BOOLEAN | DEFAULT TRUE | Can substitute |
| substitute_flower_id | BIGINT UNSIGNED | FK → flower_types.id, NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `inventory_alerts`
Low stock and expiry alerts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| alert_type | ENUM | NOT NULL | 'low_stock', 'expiring', 'expired', 'out_of_stock' |
| flower_type_id | BIGINT UNSIGNED | FK → flower_types.id, NULL | |
| batch_id | BIGINT UNSIGNED | FK → flower_batches.id, NULL | |
| message | VARCHAR(255) | NOT NULL | |
| is_read | BOOLEAN | DEFAULT FALSE | |
| read_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |

---

### `waste_logs`
Flower waste tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| batch_id | BIGINT UNSIGNED | FK → flower_batches.id | |
| quantity | INT UNSIGNED | NOT NULL | |
| reason | ENUM | NOT NULL | 'expired', 'damaged', 'quality', 'other' |
| notes | TEXT | NULL | |
| recorded_by | BIGINT UNSIGNED | FK → users.id | |
| created_at | TIMESTAMP | | |

---

## 5. Locations & Delivery

### `zones`
Delivery zones

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| parent_id | BIGINT UNSIGNED | FK → zones.id, NULL | |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(100) | NOT NULL | |
| polygon_coordinates | JSON | NULL | GeoJSON |
| delivery_fee | DECIMAL(10,2) | DEFAULT 0.00 | |
| express_fee | DECIMAL(10,2) | NULL | Express delivery fee |
| minimum_order | DECIMAL(10,2) | DEFAULT 0.00 | |
| estimated_delivery_minutes | INT | NULL | |
| same_day_available | BOOLEAN | DEFAULT TRUE | |
| express_available | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `locations`
Subdivisions, condos, landmarks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| zone_id | BIGINT UNSIGNED | FK → zones.id | |
| name | VARCHAR(255) | NOT NULL | |
| slug | VARCHAR(255) | NOT NULL | |
| location_type | ENUM | NOT NULL | 'subdivision', 'condominium', 'commercial', 'hospital', 'hotel', 'church', 'funeral_home', 'school' |
| address | VARCHAR(500) | NULL | |
| latitude | DECIMAL(10,8) | NULL | |
| longitude | DECIMAL(11,8) | NULL | |
| contact_name | VARCHAR(100) | NULL | Lobby/reception contact |
| contact_phone | VARCHAR(20) | NULL | |
| delivery_instructions | TEXT | NULL | |
| operating_hours | JSON | NULL | For hospitals, hotels |
| is_verified | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `customer_addresses`
Customer delivery addresses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| label | VARCHAR(50) | NULL | "Home", "Office" |
| recipient_name | VARCHAR(100) | NULL | If different from user |
| recipient_phone | VARCHAR(20) | NULL | |
| address_type | ENUM | NOT NULL | 'house', 'condo', 'office', 'hospital', 'hotel', 'church', 'other' |
| zone_id | BIGINT UNSIGNED | FK → zones.id, NULL | |
| location_id | BIGINT UNSIGNED | FK → locations.id, NULL | |
| street_address | VARCHAR(255) | NOT NULL | |
| unit_number | VARCHAR(50) | NULL | |
| floor | INT | NULL | |
| building_name | VARCHAR(100) | NULL | |
| city | VARCHAR(100) | NOT NULL | |
| province | VARCHAR(100) | NULL | |
| postal_code | VARCHAR(10) | NULL | |
| landmarks | TEXT | NULL | |
| delivery_instructions | TEXT | NULL | |
| latitude | DECIMAL(10,8) | NULL | |
| longitude | DECIMAL(11,8) | NULL | |
| is_default | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

---

### `delivery_time_slots`
Available delivery time slots

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| zone_id | BIGINT UNSIGNED | FK → zones.id, NULL | |
| name | VARCHAR(50) | NOT NULL | "Morning", "Afternoon" |
| start_time | TIME | NOT NULL | |
| end_time | TIME | NOT NULL | |
| slot_type | ENUM | DEFAULT 'standard' | 'standard', 'express', 'exact_time' |
| premium_fee | DECIMAL(10,2) | DEFAULT 0.00 | |
| max_orders | INT UNSIGNED | NULL | |
| days_available | JSON | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 6. Occasions & Important Dates

### `occasions`
Occasion types

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| name | VARCHAR(100) | NOT NULL | "Birthday", "Valentine's Day" |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | |
| description | TEXT | NULL | |
| icon | VARCHAR(50) | NULL | Emoji or icon |
| image_path | VARCHAR(255) | NULL | |
| is_date_specific | BOOLEAN | DEFAULT FALSE | Has fixed date (Valentine's) |
| specific_date | DATE | NULL | If date-specific |
| is_peak_season | BOOLEAN | DEFAULT FALSE | |
| peak_start_date | DATE | NULL | |
| peak_end_date | DATE | NULL | |
| sort_order | INT | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `customer_important_dates`
Customer's saved important dates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| recipient_id | BIGINT UNSIGNED | FK → recipients.id, NULL | |
| occasion_id | BIGINT UNSIGNED | FK → occasions.id | |
| person_name | VARCHAR(100) | NOT NULL | "Mom", "Wife" |
| relationship | VARCHAR(50) | NULL | |
| date_month | INT UNSIGNED | NOT NULL | 1-12 |
| date_day | INT UNSIGNED | NOT NULL | 1-31 |
| date_year | INT UNSIGNED | NULL | If specific year |
| reminder_days_before | JSON | DEFAULT '[7, 3, 1]' | Days to remind |
| last_gift_date | DATE | NULL | |
| last_order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| notes | TEXT | NULL | Preferences, favorites |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_important_dates_customer` (customer_id)
- `idx_important_dates_date` (date_month, date_day)

---

### `occasion_reminders`
Scheduled reminders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| important_date_id | BIGINT UNSIGNED | FK → customer_important_dates.id | |
| reminder_date | DATE | NOT NULL | |
| days_before | INT UNSIGNED | NOT NULL | |
| status | ENUM | NOT NULL | 'scheduled', 'sent', 'cancelled' |
| sent_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |

---

## 7. Gift & Recipients

### `recipients`
Saved recipients for gift orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| name | VARCHAR(100) | NOT NULL | |
| relationship | VARCHAR(50) | NULL | "Mother", "Wife", "Friend" |
| phone | VARCHAR(20) | NULL | |
| email | VARCHAR(255) | NULL | |
| default_address_id | BIGINT UNSIGNED | FK → recipient_addresses.id, NULL | |
| flower_preferences | JSON | NULL | Preferred flowers/colors |
| dislikes | TEXT | NULL | Flowers to avoid |
| notes | TEXT | NULL | |
| last_sent_date | DATE | NULL | |
| total_orders | INT UNSIGNED | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

---

### `recipient_addresses`
Addresses for recipients

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| recipient_id | BIGINT UNSIGNED | FK → recipients.id | |
| label | VARCHAR(50) | NULL | "Home", "Office" |
| address_type | ENUM | NOT NULL | |
| zone_id | BIGINT UNSIGNED | FK → zones.id, NULL | |
| location_id | BIGINT UNSIGNED | FK → locations.id, NULL | |
| street_address | VARCHAR(255) | NOT NULL | |
| unit_number | VARCHAR(50) | NULL | |
| floor | INT | NULL | |
| building_name | VARCHAR(100) | NULL | |
| city | VARCHAR(100) | NOT NULL | |
| landmarks | TEXT | NULL | |
| delivery_instructions | TEXT | NULL | |
| latitude | DECIMAL(10,8) | NULL | |
| longitude | DECIMAL(11,8) | NULL | |
| is_default | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `gift_messages`
Gift message templates and custom messages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id, NULL | NULL = global templates |
| occasion_id | BIGINT UNSIGNED | FK → occasions.id, NULL | |
| message_text | TEXT | NOT NULL | |
| is_template | BOOLEAN | DEFAULT FALSE | Reusable template |
| usage_count | INT UNSIGNED | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `card_styles`
Gift card design styles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| name | VARCHAR(100) | NOT NULL | "Elegant", "Playful", "Sympathy" |
| occasion_id | BIGINT UNSIGNED | FK → occasions.id, NULL | |
| preview_image_path | VARCHAR(255) | NOT NULL | |
| template_config | JSON | NULL | Design config |
| is_default | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| sort_order | INT | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 8. Orders & Transactions

### `orders`
Customer orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| order_number | VARCHAR(20) | UNIQUE, NOT NULL | "FL-20260125-001" |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id | Sender |
| recipient_id | BIGINT UNSIGNED | FK → recipients.id, NULL | |
| delivery_address_id | BIGINT UNSIGNED | FK → customer_addresses.id, NULL | |
| recipient_address_id | BIGINT UNSIGNED | FK → recipient_addresses.id, NULL | |
| order_type | ENUM | NOT NULL | 'standard', 'same_day', 'express', 'scheduled', 'subscription', 'event' |
| order_source | ENUM | DEFAULT 'web' | 'web', 'app', 'sms', 'qr', 'phone' |
| occasion_id | BIGINT UNSIGNED | FK → occasions.id, NULL | |
| recipient_name | VARCHAR(100) | NOT NULL | |
| recipient_phone | VARCHAR(20) | NULL | |
| delivery_address | TEXT | NOT NULL | Full address snapshot |
| delivery_date | DATE | NOT NULL | |
| delivery_time_slot_id | BIGINT UNSIGNED | FK → delivery_time_slots.id, NULL | |
| delivery_time_start | TIME | NULL | |
| delivery_time_end | TIME | NULL | |
| exact_delivery_time | TIME | NULL | For exact time orders |
| gift_message | TEXT | NULL | |
| card_style_id | BIGINT UNSIGNED | FK → card_styles.id, NULL | |
| is_anonymous | BOOLEAN | DEFAULT FALSE | Hide sender name |
| is_surprise | BOOLEAN | DEFAULT FALSE | Don't notify recipient |
| photo_confirmation_requested | BOOLEAN | DEFAULT TRUE | |
| subtotal | DECIMAL(10,2) | NOT NULL | |
| delivery_fee | DECIMAL(10,2) | DEFAULT 0.00 | |
| express_fee | DECIMAL(10,2) | DEFAULT 0.00 | |
| add_ons_total | DECIMAL(10,2) | DEFAULT 0.00 | |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| loyalty_discount | DECIMAL(10,2) | DEFAULT 0.00 | |
| tax_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| tip_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| total_amount | DECIMAL(10,2) | NOT NULL | |
| promo_code_id | BIGINT UNSIGNED | FK → promo_codes.id, NULL | |
| status | ENUM | NOT NULL | See below |
| payment_method | ENUM | NULL | 'cod', 'gcash', 'maya', 'card', 'bank_transfer', 'paypal' |
| payment_status | ENUM | DEFAULT 'pending' | 'pending', 'paid', 'partial', 'refunded' |
| florist_id | BIGINT UNSIGNED | FK → users.id, NULL | Assigned florist |
| driver_id | BIGINT UNSIGNED | FK → drivers.id, NULL | |
| preparation_started_at | TIMESTAMP | NULL | |
| preparation_completed_at | TIMESTAMP | NULL | |
| preparation_photo_path | VARCHAR(500) | NULL | Photo of arrangement |
| picked_up_at | TIMESTAMP | NULL | |
| delivered_at | TIMESTAMP | NULL | |
| delivery_photo_path | VARCHAR(500) | NULL | Proof of delivery |
| customer_notes | TEXT | NULL | |
| internal_notes | TEXT | NULL | |
| rating | TINYINT UNSIGNED | NULL | |
| rated_at | TIMESTAMP | NULL | |
| cancelled_at | TIMESTAMP | NULL | |
| cancellation_reason | TEXT | NULL | |
| cancelled_by | ENUM | NULL | 'customer', 'shop', 'system' |
| refund_amount | DECIMAL(10,2) | NULL | |
| refunded_at | TIMESTAMP | NULL | |
| metadata | JSON | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Order Status Enum:**
- `pending_payment` - Awaiting payment
- `confirmed` - Payment received
- `preparing` - Florist working on it
- `quality_check` - Final inspection
- `ready` - Ready for pickup/delivery
- `out_for_delivery` - With driver
- `delivered` - Successfully delivered
- `completed` - Finalized
- `cancelled` - Cancelled
- `refunded` - Refund processed

**Indexes:**
- `idx_orders_number` (order_number)
- `idx_orders_shop` (shop_id)
- `idx_orders_customer` (customer_id)
- `idx_orders_recipient` (recipient_id)
- `idx_orders_status` (status)
- `idx_orders_date` (delivery_date)
- `idx_orders_driver` (driver_id)

---

### `order_items`
Products in an order

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| product_id | BIGINT UNSIGNED | FK → products.id, NULL | |
| custom_bouquet_id | BIGINT UNSIGNED | FK → custom_bouquets.id, NULL | |
| product_name | VARCHAR(255) | NOT NULL | |
| product_sku | VARCHAR(50) | NULL | |
| size_variant_id | BIGINT UNSIGNED | FK → product_size_variants.id, NULL | |
| size_name | VARCHAR(50) | NULL | |
| quantity | INT UNSIGNED | NOT NULL | |
| unit_price | DECIMAL(10,2) | NOT NULL | |
| subtotal | DECIMAL(10,2) | NOT NULL | |
| customization_notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `order_add_ons`
Add-ons included in order

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| add_on_id | BIGINT UNSIGNED | FK → add_ons.id | |
| add_on_name | VARCHAR(255) | NOT NULL | |
| quantity | INT UNSIGNED | NOT NULL | |
| unit_price | DECIMAL(10,2) | NOT NULL | |
| subtotal | DECIMAL(10,2) | NOT NULL | |
| created_at | TIMESTAMP | | |

---

### `order_status_history`
Order status changes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| status | VARCHAR(50) | NOT NULL | |
| notes | TEXT | NULL | |
| changed_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| photo_path | VARCHAR(500) | NULL | |
| metadata | JSON | NULL | |
| created_at | TIMESTAMP | | |

---

### `delivery_photos`
Delivery confirmation photos

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| photo_type | ENUM | NOT NULL | 'with_recipient', 'at_door', 'at_reception', 'arrangement' |
| photo_path | VARCHAR(500) | NOT NULL | |
| caption | VARCHAR(255) | NULL | |
| taken_by | BIGINT UNSIGNED | FK → users.id | Driver |
| taken_at | TIMESTAMP | NOT NULL | |
| sent_to_sender | BOOLEAN | DEFAULT FALSE | |
| sent_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |

---

## 9. Bouquet Customization

### `custom_bouquets`
Custom bouquet configurations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| name | VARCHAR(255) | NULL | Customer's name for it |
| arrangement_style | ENUM | NULL | 'round', 'cascade', 'hand_tied', 'presentation' |
| size | ENUM | NULL | 'small', 'medium', 'large' |
| color_scheme | JSON | NULL | Selected colors |
| wrapping_type | ENUM | NULL | 'kraft', 'tissue', 'fabric', 'box', 'basket' |
| wrapping_color | VARCHAR(50) | NULL | |
| ribbon_color | VARCHAR(50) | NULL | |
| include_greenery | BOOLEAN | DEFAULT TRUE | |
| total_price | DECIMAL(10,2) | NOT NULL | |
| is_saved | BOOLEAN | DEFAULT FALSE | Customer saved it |
| is_ordered | BOOLEAN | DEFAULT FALSE | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| preview_image_path | VARCHAR(500) | NULL | |
| threed_model_path | VARCHAR(500) | NULL | |
| metadata | JSON | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `custom_bouquet_flowers`
Flowers in a custom bouquet

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| custom_bouquet_id | BIGINT UNSIGNED | FK → custom_bouquets.id | |
| flower_type_id | BIGINT UNSIGNED | FK → flower_types.id | |
| color | VARCHAR(50) | NOT NULL | |
| quantity | INT UNSIGNED | NOT NULL | |
| price_per_stem | DECIMAL(8,2) | NOT NULL | |
| subtotal | DECIMAL(10,2) | NOT NULL | |
| is_main_flower | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |

---

### `custom_bouquet_fillers`
Fillers/greenery in custom bouquet

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| custom_bouquet_id | BIGINT UNSIGNED | FK → custom_bouquets.id | |
| filler_type | VARCHAR(100) | NOT NULL | "Baby's Breath", "Eucalyptus" |
| price | DECIMAL(8,2) | NOT NULL | |
| created_at | TIMESTAMP | | |

---

### `custom_bouquet_extras`
Extras added to custom bouquet

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| custom_bouquet_id | BIGINT UNSIGNED | FK → custom_bouquets.id | |
| extra_type | ENUM | NOT NULL | 'ribbon', 'wrapper_upgrade', 'vase', 'card' |
| description | VARCHAR(255) | NULL | |
| price | DECIMAL(8,2) | NOT NULL | |
| created_at | TIMESTAMP | | |

---

## 10. 3D Visualization & AR

### `bouquet_3d_designs`
3D bouquet designs from AI/user

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id, NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| source_type | ENUM | NOT NULL | 'ai_generated', 'user_created', 'shop_template' |
| source_image_path | VARCHAR(500) | NULL | Original uploaded photo |
| ai_analysis | JSON | NULL | AI detection results |
| design_config | JSON | NOT NULL | 3D scene configuration |
| thumbnail_path | VARCHAR(500) | NULL | Preview image |
| threed_model_path | VARCHAR(500) | NULL | GLB/GLTF file |
| estimated_price | DECIMAL(10,2) | NULL | |
| is_saved | BOOLEAN | DEFAULT FALSE | |
| is_featured | BOOLEAN | DEFAULT FALSE | Shop showcase |
| is_public | BOOLEAN | DEFAULT FALSE | Visible to others |
| view_count | INT UNSIGNED | DEFAULT 0 | |
| order_count | INT UNSIGNED | DEFAULT 0 | |
| custom_bouquet_id | BIGINT UNSIGNED | FK → custom_bouquets.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| metadata | JSON | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `flower_3d_assets`
3D model assets for flowers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| flower_type_id | BIGINT UNSIGNED | FK → flower_types.id, NULL | |
| asset_type | ENUM | NOT NULL | 'flower', 'filler', 'wrapper', 'vase', 'accessory' |
| name | VARCHAR(100) | NOT NULL | |
| color | VARCHAR(50) | NULL | |
| model_path | VARCHAR(500) | NOT NULL | GLB/GLTF file |
| thumbnail_path | VARCHAR(255) | NULL | |
| base_price | DECIMAL(8,2) | NULL | For pricing |
| metadata | JSON | NULL | Scale, rotation defaults |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `ai_recognition_logs`
AI flower recognition logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| image_path | VARCHAR(500) | NOT NULL | |
| detection_results | JSON | NOT NULL | AI response |
| confidence_scores | JSON | NULL | |
| flowers_detected | JSON | NULL | Parsed flowers |
| processing_time_ms | INT | NULL | |
| model_version | VARCHAR(50) | NULL | |
| created_at | TIMESTAMP | | |

---

### `ar_sessions`
AR preview sessions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| design_id | BIGINT UNSIGNED | FK → bouquet_3d_designs.id, NULL | |
| product_id | BIGINT UNSIGNED | FK → products.id, NULL | |
| session_token | VARCHAR(100) | UNIQUE, NOT NULL | |
| photos_taken | INT UNSIGNED | DEFAULT 0 | |
| shared | BOOLEAN | DEFAULT FALSE | |
| converted_to_order | BOOLEAN | DEFAULT FALSE | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| device_info | JSON | NULL | |
| created_at | TIMESTAMP | | |
| expires_at | TIMESTAMP | NOT NULL | |

---

### `ar_photos`
Photos taken in AR

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| session_id | BIGINT UNSIGNED | FK → ar_sessions.id | |
| photo_path | VARCHAR(500) | NOT NULL | |
| share_url | VARCHAR(255) | NULL | |
| created_at | TIMESTAMP | | |

---

## 11. Subscriptions

### `flower_subscriptions`
Recurring flower subscriptions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| recipient_id | BIGINT UNSIGNED | FK → recipients.id, NULL | |
| delivery_address_id | BIGINT UNSIGNED | FK → customer_addresses.id, NULL | |
| recipient_address_id | BIGINT UNSIGNED | FK → recipient_addresses.id, NULL | |
| plan_type | ENUM | NOT NULL | 'petite', 'classic', 'luxe', 'designer' |
| frequency | ENUM | NOT NULL | 'weekly', 'biweekly', 'monthly', 'seasonal' |
| preferred_day | ENUM | NULL | 'monday', 'tuesday', etc. |
| preferred_time_slot_id | BIGINT UNSIGNED | FK → delivery_time_slots.id, NULL | |
| style_preference | JSON | NULL | ['romantic', 'modern', 'tropical'] |
| color_preference | JSON | NULL | ['pink', 'white'] |
| flower_dislikes | TEXT | NULL | |
| include_vase | BOOLEAN | DEFAULT FALSE | |
| gift_message | TEXT | NULL | Standing message |
| price_per_delivery | DECIMAL(10,2) | NOT NULL | |
| start_date | DATE | NOT NULL | |
| next_delivery_date | DATE | NULL | |
| last_delivery_date | DATE | NULL | |
| total_deliveries | INT UNSIGNED | DEFAULT 0 | |
| payment_method | ENUM | NULL | |
| status | ENUM | NOT NULL | 'active', 'paused', 'cancelled' |
| paused_at | TIMESTAMP | NULL | |
| paused_until | DATE | NULL | |
| cancelled_at | TIMESTAMP | NULL | |
| cancellation_reason | TEXT | NULL | |
| is_gift | BOOLEAN | DEFAULT FALSE | Gift subscription |
| gifted_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| gift_duration_months | INT | NULL | |
| gift_expires_at | DATE | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `subscription_deliveries`
Individual subscription deliveries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| subscription_id | BIGINT UNSIGNED | FK → flower_subscriptions.id | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| scheduled_date | DATE | NOT NULL | |
| status | ENUM | NOT NULL | 'scheduled', 'skipped', 'delivered', 'failed' |
| skip_reason | VARCHAR(255) | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 12. Weddings & Events

### `consultations`
Wedding/event consultation requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| event_type | ENUM | NOT NULL | 'wedding', 'debut', 'corporate', 'funeral', 'other' |
| client_name | VARCHAR(100) | NOT NULL | |
| client_email | VARCHAR(255) | NOT NULL | |
| client_phone | VARCHAR(20) | NOT NULL | |
| partner_name | VARCHAR(100) | NULL | For weddings |
| event_date | DATE | NULL | |
| event_venue | VARCHAR(255) | NULL | |
| guest_count | INT | NULL | |
| budget_range | VARCHAR(50) | NULL | "50k-100k" |
| services_interested | JSON | NULL | ['bridal', 'centerpieces', 'arch'] |
| style_preferences | TEXT | NULL | |
| inspiration_images | JSON | NULL | Uploaded image paths |
| pinterest_board_url | VARCHAR(500) | NULL | |
| notes | TEXT | NULL | |
| preferred_contact_method | ENUM | DEFAULT 'phone' | 'phone', 'email', 'video_call' |
| preferred_date | DATE | NULL | Consultation date |
| preferred_time | TIME | NULL | |
| status | ENUM | NOT NULL | 'pending', 'scheduled', 'completed', 'cancelled' |
| scheduled_at | TIMESTAMP | NULL | |
| completed_at | TIMESTAMP | NULL | |
| assigned_to | BIGINT UNSIGNED | FK → users.id, NULL | |
| consultation_notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `event_quotes`
Event quotations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| consultation_id | BIGINT UNSIGNED | FK → consultations.id, NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| quote_number | VARCHAR(20) | UNIQUE, NOT NULL | |
| event_type | ENUM | NOT NULL | |
| event_date | DATE | NULL | |
| event_venue | VARCHAR(255) | NULL | |
| subtotal | DECIMAL(12,2) | NOT NULL | |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| total_amount | DECIMAL(12,2) | NOT NULL | |
| deposit_required | DECIMAL(10,2) | NULL | |
| deposit_percentage | INT | NULL | |
| valid_until | DATE | NOT NULL | |
| terms_and_conditions | TEXT | NULL | |
| notes | TEXT | NULL | |
| status | ENUM | NOT NULL | 'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired' |
| sent_at | TIMESTAMP | NULL | |
| viewed_at | TIMESTAMP | NULL | |
| accepted_at | TIMESTAMP | NULL | |
| declined_at | TIMESTAMP | NULL | |
| decline_reason | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `event_quote_items`
Items in event quote

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| quote_id | BIGINT UNSIGNED | FK → event_quotes.id | |
| category | VARCHAR(100) | NOT NULL | "Bridal Party", "Ceremony", "Reception" |
| item_name | VARCHAR(255) | NOT NULL | |
| description | TEXT | NULL | |
| quantity | INT UNSIGNED | NOT NULL | |
| unit_price | DECIMAL(10,2) | NOT NULL | |
| subtotal | DECIMAL(10,2) | NOT NULL | |
| image_path | VARCHAR(255) | NULL | Reference image |
| notes | TEXT | NULL | |
| sort_order | INT | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `event_bookings`
Confirmed event bookings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| quote_id | BIGINT UNSIGNED | FK → event_quotes.id | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| booking_number | VARCHAR(20) | UNIQUE, NOT NULL | |
| event_type | ENUM | NOT NULL | |
| event_date | DATE | NOT NULL | |
| event_time | TIME | NULL | |
| event_venue | VARCHAR(255) | NOT NULL | |
| venue_address | TEXT | NULL | |
| setup_time | TIME | NULL | |
| total_amount | DECIMAL(12,2) | NOT NULL | |
| deposit_amount | DECIMAL(10,2) | NOT NULL | |
| deposit_paid | BOOLEAN | DEFAULT FALSE | |
| deposit_paid_at | TIMESTAMP | NULL | |
| balance_amount | DECIMAL(10,2) | NOT NULL | |
| balance_due_date | DATE | NULL | |
| balance_paid | BOOLEAN | DEFAULT FALSE | |
| balance_paid_at | TIMESTAMP | NULL | |
| status | ENUM | NOT NULL | 'confirmed', 'in_progress', 'completed', 'cancelled' |
| assigned_florists | JSON | NULL | User IDs |
| setup_team | JSON | NULL | |
| contact_person | VARCHAR(100) | NULL | On-site contact |
| contact_phone | VARCHAR(20) | NULL | |
| special_instructions | TEXT | NULL | |
| completed_at | TIMESTAMP | NULL | |
| cancelled_at | TIMESTAMP | NULL | |
| cancellation_reason | TEXT | NULL | |
| refund_amount | DECIMAL(10,2) | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `event_booking_items`
Items in confirmed booking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| booking_id | BIGINT UNSIGNED | FK → event_bookings.id | |
| quote_item_id | BIGINT UNSIGNED | FK → event_quote_items.id, NULL | |
| category | VARCHAR(100) | NOT NULL | |
| item_name | VARCHAR(255) | NOT NULL | |
| description | TEXT | NULL | |
| quantity | INT UNSIGNED | NOT NULL | |
| unit_price | DECIMAL(10,2) | NOT NULL | |
| subtotal | DECIMAL(10,2) | NOT NULL | |
| status | ENUM | DEFAULT 'pending' | 'pending', 'preparing', 'ready', 'delivered' |
| notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 13. Loyalty Program

### `loyalty_programs`
Shop loyalty program config

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id, UNIQUE | |
| name | VARCHAR(100) | NOT NULL | "Petal Points" |
| program_type | ENUM | NOT NULL | 'stamps', 'points' |
| stamps_required | INT UNSIGNED | NULL | |
| points_per_peso | DECIMAL(5,2) | NULL | |
| points_per_order | INT UNSIGNED | NULL | Fixed points per order |
| reward_type | ENUM | NOT NULL | |
| reward_value | DECIMAL(10,2) | NULL | |
| reward_product_id | BIGINT UNSIGNED | FK → products.id, NULL | |
| min_order_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| expiry_days | INT UNSIGNED | NULL | |
| bonus_on_birthday | INT UNSIGNED | NULL | Extra points |
| bonus_on_referral | INT UNSIGNED | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `loyalty_tiers`
Loyalty tier levels

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| program_id | BIGINT UNSIGNED | FK → loyalty_programs.id | |
| name | VARCHAR(50) | NOT NULL | "Seed", "Bud", "Bloom" |
| min_points | INT UNSIGNED | NOT NULL | Points to reach tier |
| benefits | JSON | NOT NULL | Tier benefits |
| icon_path | VARCHAR(255) | NULL | |
| sort_order | INT | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `loyalty_cards`
Customer loyalty cards

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| program_id | BIGINT UNSIGNED | FK → loyalty_programs.id | |
| tier_id | BIGINT UNSIGNED | FK → loyalty_tiers.id, NULL | |
| current_stamps | INT UNSIGNED | DEFAULT 0 | |
| current_points | INT UNSIGNED | DEFAULT 0 | |
| lifetime_stamps | INT UNSIGNED | DEFAULT 0 | |
| lifetime_points | INT UNSIGNED | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_loyalty_cards_unique` UNIQUE (customer_id, shop_id)

---

### `loyalty_transactions`
Loyalty earning/redemption

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| loyalty_card_id | BIGINT UNSIGNED | FK → loyalty_cards.id | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| transaction_type | ENUM | NOT NULL | 'earn', 'redeem', 'expire', 'bonus', 'adjust' |
| stamps | INT | DEFAULT 0 | |
| points | INT | DEFAULT 0 | |
| description | VARCHAR(255) | NULL | |
| expires_at | DATE | NULL | |
| created_at | TIMESTAMP | | |

---

### `loyalty_rewards`
Earned rewards

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| loyalty_card_id | BIGINT UNSIGNED | FK → loyalty_cards.id | |
| reward_type | ENUM | NOT NULL | |
| reward_value | DECIMAL(10,2) | NULL | |
| reward_product_id | BIGINT UNSIGNED | FK → products.id, NULL | |
| status | ENUM | NOT NULL | 'available', 'redeemed', 'expired' |
| earned_at | TIMESTAMP | NOT NULL | |
| redeemed_at | TIMESTAMP | NULL | |
| redeemed_order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| expires_at | DATE | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 14. Delivery Management

### `delivery_assignments`
Order delivery assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| driver_id | BIGINT UNSIGNED | FK → drivers.id | |
| assigned_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| assignment_type | ENUM | DEFAULT 'manual' | |
| status | ENUM | NOT NULL | 'assigned', 'accepted', 'picked_up', 'delivered', 'failed' |
| accepted_at | TIMESTAMP | NULL | |
| picked_up_at | TIMESTAMP | NULL | |
| delivered_at | TIMESTAMP | NULL | |
| delivery_notes | TEXT | NULL | |
| recipient_name | VARCHAR(100) | NULL | |
| recipient_relationship | VARCHAR(50) | NULL | "Wife", "Receptionist" |
| signature_path | VARCHAR(500) | NULL | |
| failure_reason | TEXT | NULL | |
| distance_km | DECIMAL(8,2) | NULL | |
| duration_minutes | INT | NULL | |
| tip_amount | DECIMAL(8,2) | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `driver_locations`
Driver location history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| driver_id | BIGINT UNSIGNED | FK → drivers.id | |
| latitude | DECIMAL(10,8) | NOT NULL | |
| longitude | DECIMAL(11,8) | NOT NULL | |
| accuracy | DECIMAL(8,2) | NULL | |
| speed | DECIMAL(8,2) | NULL | |
| recorded_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | | |

---

### `flower_care_instructions`
Care instructions for flower types

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| flower_type_id | BIGINT UNSIGNED | FK → flower_types.id, NULL | NULL = general |
| title | VARCHAR(255) | NOT NULL | |
| content | TEXT | NOT NULL | Markdown |
| video_url | VARCHAR(500) | NULL | Tutorial video |
| expected_lifespan_days | INT | NULL | |
| water_change_days | INT | DEFAULT 2 | |
| sort_order | INT | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `care_reminders`
Care reminder notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| reminder_type | ENUM | NOT NULL | 'water_change', 'trim_stems', 'check_freshness' |
| scheduled_date | DATE | NOT NULL | |
| status | ENUM | NOT NULL | 'scheduled', 'sent', 'cancelled' |
| sent_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |

---

## 15. Payments

### `payments`
Payment records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| booking_id | BIGINT UNSIGNED | FK → event_bookings.id, NULL | |
| subscription_id | BIGINT UNSIGNED | FK → flower_subscriptions.id, NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| payment_type | ENUM | NOT NULL | 'order', 'subscription', 'event_deposit', 'event_balance', 'tip' |
| payment_method | ENUM | NOT NULL | |
| amount | DECIMAL(10,2) | NOT NULL | |
| currency | CHAR(3) | DEFAULT 'PHP' | |
| status | ENUM | NOT NULL | 'pending', 'processing', 'completed', 'failed', 'refunded' |
| gateway_reference | VARCHAR(255) | NULL | |
| gateway_response | JSON | NULL | |
| paid_at | TIMESTAMP | NULL | |
| refunded_at | TIMESTAMP | NULL | |
| refund_amount | DECIMAL(10,2) | NULL | |
| refund_reason | TEXT | NULL | |
| metadata | JSON | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `customer_wallets`
Customer wallet balance

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id, UNIQUE | |
| balance | DECIMAL(10,2) | DEFAULT 0.00 | |
| lifetime_deposits | DECIMAL(10,2) | DEFAULT 0.00 | |
| lifetime_spent | DECIMAL(10,2) | DEFAULT 0.00 | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `wallet_transactions`
Wallet transaction history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| wallet_id | BIGINT UNSIGNED | FK → customer_wallets.id | |
| transaction_type | ENUM | NOT NULL | 'deposit', 'payment', 'refund', 'bonus' |
| amount | DECIMAL(10,2) | NOT NULL | |
| balance_after | DECIMAL(10,2) | NOT NULL | |
| reference_type | VARCHAR(50) | NULL | |
| reference_id | BIGINT UNSIGNED | NULL | |
| description | VARCHAR(255) | NULL | |
| created_at | TIMESTAMP | | |

---

## 16. Reviews & Ratings

### `reviews`
Customer reviews

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| product_id | BIGINT UNSIGNED | FK → products.id, NULL | |
| driver_id | BIGINT UNSIGNED | FK → drivers.id, NULL | |
| overall_rating | TINYINT UNSIGNED | NOT NULL | |
| flower_quality_rating | TINYINT UNSIGNED | NULL | |
| arrangement_rating | TINYINT UNSIGNED | NULL | |
| delivery_rating | TINYINT UNSIGNED | NULL | |
| value_rating | TINYINT UNSIGNED | NULL | |
| recipient_reaction | ENUM | NULL | 'loved_it', 'happy', 'okay', 'disappointed' |
| review_text | TEXT | NULL | |
| is_anonymous | BOOLEAN | DEFAULT FALSE | |
| status | ENUM | DEFAULT 'pending' | 'pending', 'published', 'hidden', 'flagged' |
| helpful_count | INT UNSIGNED | DEFAULT 0 | |
| shop_response | TEXT | NULL | |
| shop_responded_at | TIMESTAMP | NULL | |
| published_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `review_photos`
Photos attached to reviews

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| review_id | BIGINT UNSIGNED | FK → reviews.id | |
| photo_path | VARCHAR(500) | NOT NULL | |
| caption | VARCHAR(255) | NULL | |
| sort_order | INT | DEFAULT 0 | |
| created_at | TIMESTAMP | | |

---

## 17. Advertising

### `ad_campaigns`
Advertising campaigns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| name | VARCHAR(255) | NOT NULL | |
| campaign_type | ENUM | NOT NULL | 'featured_listing', 'banner', 'video', 'occasion_spotlight' |
| occasion_id | BIGINT UNSIGNED | FK → occasions.id, NULL | For occasion spotlight |
| target_zones | JSON | NULL | |
| budget_total | DECIMAL(10,2) | NULL | |
| budget_daily | DECIMAL(10,2) | NULL | |
| cost_model | ENUM | NOT NULL | 'fixed', 'cpm', 'cpc' |
| cost_per_unit | DECIMAL(10,2) | NULL | |
| starts_at | TIMESTAMP | NOT NULL | |
| ends_at | TIMESTAMP | NULL | |
| status | ENUM | NOT NULL | 'draft', 'pending_review', 'approved', 'active', 'paused', 'completed', 'rejected' |
| rejection_reason | TEXT | NULL | |
| total_spent | DECIMAL(10,2) | DEFAULT 0.00 | |
| total_impressions | INT UNSIGNED | DEFAULT 0 | |
| total_clicks | INT UNSIGNED | DEFAULT 0 | |
| total_orders | INT UNSIGNED | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `ad_creatives`
Ad creative assets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| campaign_id | BIGINT UNSIGNED | FK → ad_campaigns.id | |
| creative_type | ENUM | NOT NULL | 'image', 'video' |
| title | VARCHAR(255) | NULL | |
| description | TEXT | NULL | |
| file_path | VARCHAR(500) | NOT NULL | |
| thumbnail_path | VARCHAR(500) | NULL | |
| click_url | VARCHAR(500) | NULL | |
| cta_text | VARCHAR(50) | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `ad_impressions`
Ad impressions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| campaign_id | BIGINT UNSIGNED | FK → ad_campaigns.id | |
| creative_id | BIGINT UNSIGNED | FK → ad_creatives.id | |
| user_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| session_id | VARCHAR(100) | NULL | |
| ip_address | VARCHAR(45) | NULL | |
| created_at | TIMESTAMP | | |

---

### `ad_clicks`
Ad clicks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| campaign_id | BIGINT UNSIGNED | FK → ad_campaigns.id | |
| creative_id | BIGINT UNSIGNED | FK → ad_creatives.id | |
| impression_id | BIGINT UNSIGNED | FK → ad_impressions.id, NULL | |
| user_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| created_at | TIMESTAMP | | |

---

## 18. Social & Community

### `shop_posts`
Shop announcements/posts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| author_id | BIGINT UNSIGNED | FK → users.id | |
| post_type | ENUM | NOT NULL | 'announcement', 'promo', 'new_arrival', 'tip', 'behind_scenes' |
| title | VARCHAR(255) | NULL | |
| content | TEXT | NOT NULL | |
| image_path | VARCHAR(500) | NULL | |
| video_path | VARCHAR(500) | NULL | |
| link_url | VARCHAR(500) | NULL | |
| product_id | BIGINT UNSIGNED | FK → products.id, NULL | Featured product |
| is_pinned | BOOLEAN | DEFAULT FALSE | |
| is_published | BOOLEAN | DEFAULT TRUE | |
| published_at | TIMESTAMP | NULL | |
| reaction_count | INT UNSIGNED | DEFAULT 0 | |
| comment_count | INT UNSIGNED | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

---

### `post_reactions`
Reactions to posts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| post_id | BIGINT UNSIGNED | FK → shop_posts.id | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| reaction_type | ENUM | DEFAULT 'like' | 'like', 'love', 'beautiful' |
| created_at | TIMESTAMP | | |

**Indexes:**
- UNIQUE (post_id, user_id)

---

### `post_comments`
Comments on posts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| post_id | BIGINT UNSIGNED | FK → shop_posts.id | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| parent_id | BIGINT UNSIGNED | FK → post_comments.id, NULL | |
| content | TEXT | NOT NULL | |
| is_hidden | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

---

### `customer_follows`
Customers following shops

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| created_at | TIMESTAMP | | |

**Indexes:**
- UNIQUE (customer_id, shop_id)

---

### `referrals`
Customer referrals

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| referrer_id | BIGINT UNSIGNED | FK → users.id | |
| referred_id | BIGINT UNSIGNED | FK → users.id | |
| referral_code | VARCHAR(20) | NOT NULL | |
| status | ENUM | NOT NULL | 'pending', 'completed', 'rewarded' |
| first_order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| referrer_reward_type | ENUM | NULL | |
| referrer_reward_value | DECIMAL(10,2) | NULL | |
| referred_reward_type | ENUM | NULL | |
| referred_reward_value | DECIMAL(10,2) | NULL | |
| rewarded_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 19. Gamification

### `badges`
Available badges

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | |
| description | VARCHAR(255) | NOT NULL | |
| icon_path | VARCHAR(255) | NULL | |
| criteria_type | VARCHAR(50) | NOT NULL | |
| criteria_value | INT | NOT NULL | |
| points_reward | INT UNSIGNED | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `customer_badges`
Earned badges

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| badge_id | BIGINT UNSIGNED | FK → badges.id | |
| earned_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | | |

**Indexes:**
- UNIQUE (customer_id, badge_id)

---

### `customer_levels`
Customer levels

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id, UNIQUE | |
| level | INT UNSIGNED | DEFAULT 1 | |
| level_name | VARCHAR(50) | NOT NULL | |
| total_points | INT UNSIGNED | DEFAULT 0 | |
| current_points | INT UNSIGNED | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `challenges`
Gamification challenges

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| name | VARCHAR(100) | NOT NULL | |
| description | TEXT | NOT NULL | |
| challenge_type | ENUM | NOT NULL | |
| target_value | INT | NOT NULL | |
| reward_type | ENUM | NOT NULL | |
| reward_value | DECIMAL(10,2) | NULL | |
| starts_at | TIMESTAMP | NOT NULL | |
| ends_at | TIMESTAMP | NOT NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `challenge_progress`
Customer challenge progress

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| challenge_id | BIGINT UNSIGNED | FK → challenges.id | |
| current_value | INT UNSIGNED | DEFAULT 0 | |
| status | ENUM | NOT NULL | 'in_progress', 'completed', 'rewarded' |
| completed_at | TIMESTAMP | NULL | |
| rewarded_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- UNIQUE (customer_id, challenge_id)

---

## 20. SMS Ordering

### `sms_messages`
SMS message log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| direction | ENUM | NOT NULL | 'inbound', 'outbound' |
| phone_number | VARCHAR(20) | NOT NULL | |
| message | TEXT | NOT NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| message_type | VARCHAR(50) | NULL | |
| gateway_id | VARCHAR(100) | NULL | |
| gateway_status | VARCHAR(50) | NULL | |
| cost | DECIMAL(8,4) | NULL | |
| sent_at | TIMESTAMP | NULL | |
| delivered_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |

---

### `sms_orders`
SMS order parsing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| sms_message_id | BIGINT UNSIGNED | FK → sms_messages.id | |
| phone_number | VARCHAR(20) | NOT NULL | |
| raw_message | TEXT | NOT NULL | |
| parsed_command | VARCHAR(50) | NULL | |
| parsed_params | JSON | NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id, NULL | |
| recipient_id | BIGINT UNSIGNED | FK → recipients.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| status | ENUM | NOT NULL | 'received', 'parsed', 'processed', 'failed' |
| error_message | VARCHAR(255) | NULL | |
| response_sent | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `product_sms_codes`
SMS short codes for products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| code | VARCHAR(10) | NOT NULL | "ROSES12" |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- UNIQUE (shop_id, code)

---

### `recipient_sms_codes`
SMS codes for saved recipients

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| recipient_id | BIGINT UNSIGNED | FK → recipients.id | |
| code | VARCHAR(10) | NOT NULL | "MOM", "WIFE" |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- UNIQUE (customer_id, code)

---

## 21. QR Code System

### `qr_codes`
QR code records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| qr_type | ENUM | NOT NULL | 'shop', 'product', 'order', 'promo', 'driver', 'care_instructions' |
| reference_type | VARCHAR(50) | NULL | |
| reference_id | BIGINT UNSIGNED | NULL | |
| short_code | VARCHAR(20) | UNIQUE, NOT NULL | |
| target_url | VARCHAR(500) | NOT NULL | |
| campaign_name | VARCHAR(100) | NULL | |
| scan_count | INT UNSIGNED | DEFAULT 0 | |
| last_scanned_at | TIMESTAMP | NULL | |
| expires_at | TIMESTAMP | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| metadata | JSON | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `qr_scans`
QR scan history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| qr_code_id | BIGINT UNSIGNED | FK → qr_codes.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| session_id | VARCHAR(100) | NULL | |
| ip_address | VARCHAR(45) | NULL | |
| user_agent | VARCHAR(500) | NULL | |
| latitude | DECIMAL(10,8) | NULL | |
| longitude | DECIMAL(11,8) | NULL | |
| action_taken | VARCHAR(50) | NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| scanned_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | | |

---

## 22. Corporate Accounts

### `corporate_accounts`
B2B corporate accounts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| shop_id | BIGINT UNSIGNED | FK → shops.id | |
| company_name | VARCHAR(255) | NOT NULL | |
| industry | VARCHAR(100) | NULL | |
| contact_name | VARCHAR(100) | NOT NULL | |
| contact_email | VARCHAR(255) | NOT NULL | |
| contact_phone | VARCHAR(20) | NOT NULL | |
| billing_address | TEXT | NOT NULL | |
| tax_id | VARCHAR(50) | NULL | |
| credit_limit | DECIMAL(12,2) | NULL | |
| payment_terms | VARCHAR(50) | DEFAULT 'NET_30' | |
| discount_percentage | DECIMAL(5,2) | DEFAULT 0.00 | |
| notes | TEXT | NULL | |
| status | ENUM | NOT NULL | 'pending', 'approved', 'suspended' |
| approved_at | TIMESTAMP | NULL | |
| approved_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `corporate_users`
Users linked to corporate accounts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| corporate_account_id | BIGINT UNSIGNED | FK → corporate_accounts.id | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| role | ENUM | NOT NULL | 'admin', 'orderer', 'viewer' |
| spending_limit | DECIMAL(10,2) | NULL | |
| requires_approval | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `corporate_delivery_addresses`
Corporate delivery locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| corporate_account_id | BIGINT UNSIGNED | FK → corporate_accounts.id | |
| label | VARCHAR(100) | NOT NULL | "Head Office", "Branch 1" |
| contact_name | VARCHAR(100) | NULL | |
| contact_phone | VARCHAR(20) | NULL | |
| address | TEXT | NOT NULL | |
| city | VARCHAR(100) | NOT NULL | |
| zone_id | BIGINT UNSIGNED | FK → zones.id, NULL | |
| delivery_instructions | TEXT | NULL | |
| is_default | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `corporate_invoices`
Monthly invoices for corporate

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| corporate_account_id | BIGINT UNSIGNED | FK → corporate_accounts.id | |
| invoice_number | VARCHAR(20) | UNIQUE, NOT NULL | |
| billing_period_start | DATE | NOT NULL | |
| billing_period_end | DATE | NOT NULL | |
| subtotal | DECIMAL(12,2) | NOT NULL | |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| tax_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| total_amount | DECIMAL(12,2) | NOT NULL | |
| due_date | DATE | NOT NULL | |
| status | ENUM | NOT NULL | 'draft', 'sent', 'paid', 'overdue', 'void' |
| sent_at | TIMESTAMP | NULL | |
| paid_at | TIMESTAMP | NULL | |
| payment_reference | VARCHAR(100) | NULL | |
| notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `corporate_invoice_items`
Line items in invoice

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| invoice_id | BIGINT UNSIGNED | FK → corporate_invoices.id | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| order_number | VARCHAR(20) | NOT NULL | |
| order_date | DATE | NOT NULL | |
| recipient | VARCHAR(100) | NULL | |
| description | VARCHAR(255) | NOT NULL | |
| amount | DECIMAL(10,2) | NOT NULL | |
| created_at | TIMESTAMP | | |

---

## 23. Notifications

### `notifications`
User notifications (Laravel default)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PK | UUID |
| type | VARCHAR(255) | NOT NULL | |
| notifiable_type | VARCHAR(255) | NOT NULL | |
| notifiable_id | BIGINT UNSIGNED | NOT NULL | |
| data | JSON | NOT NULL | |
| read_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `notification_preferences`
User notification settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| user_id | BIGINT UNSIGNED | FK → users.id, UNIQUE | |
| email_enabled | BOOLEAN | DEFAULT TRUE | |
| sms_enabled | BOOLEAN | DEFAULT TRUE | |
| push_enabled | BOOLEAN | DEFAULT TRUE | |
| order_updates | BOOLEAN | DEFAULT TRUE | |
| promotions | BOOLEAN | DEFAULT TRUE | |
| occasion_reminders | BOOLEAN | DEFAULT TRUE | |
| care_reminders | BOOLEAN | DEFAULT TRUE | |
| subscription_reminders | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 24. Support

### `support_tickets`
Customer support tickets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| ticket_number | VARCHAR(20) | UNIQUE, NOT NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| shop_id | BIGINT UNSIGNED | FK → shops.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| category | ENUM | NOT NULL | 'order_issue', 'refund', 'delivery', 'quality', 'billing', 'other' |
| subject | VARCHAR(255) | NOT NULL | |
| description | TEXT | NOT NULL | |
| priority | ENUM | DEFAULT 'medium' | |
| status | ENUM | DEFAULT 'open' | |
| assigned_to | BIGINT UNSIGNED | FK → users.id, NULL | |
| resolved_at | TIMESTAMP | NULL | |
| closed_at | TIMESTAMP | NULL | |
| resolution_notes | TEXT | NULL | |
| satisfaction_rating | TINYINT UNSIGNED | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `ticket_messages`
Ticket message thread

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| ticket_id | BIGINT UNSIGNED | FK → support_tickets.id | |
| sender_id | BIGINT UNSIGNED | FK → users.id | |
| sender_type | ENUM | NOT NULL | 'customer', 'support', 'system' |
| message | TEXT | NOT NULL | |
| attachments | JSON | NULL | |
| is_internal | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |

---

### `help_articles`
Help center articles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| category | VARCHAR(100) | NOT NULL | |
| title | VARCHAR(255) | NOT NULL | |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | |
| content | TEXT | NOT NULL | |
| excerpt | VARCHAR(500) | NULL | |
| view_count | INT UNSIGNED | DEFAULT 0 | |
| helpful_count | INT UNSIGNED | DEFAULT 0 | |
| is_featured | BOOLEAN | DEFAULT FALSE | |
| is_published | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 25. Promotions

### `promo_codes`
Promotional codes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| shop_id | BIGINT UNSIGNED | FK → shops.id, NULL | |
| code | VARCHAR(50) | NOT NULL | |
| description | VARCHAR(255) | NULL | |
| discount_type | ENUM | NOT NULL | 'percentage', 'fixed', 'free_delivery' |
| discount_value | DECIMAL(10,2) | NOT NULL | |
| minimum_order | DECIMAL(10,2) | DEFAULT 0.00 | |
| maximum_discount | DECIMAL(10,2) | NULL | |
| usage_limit | INT UNSIGNED | NULL | |
| usage_limit_per_customer | INT UNSIGNED | DEFAULT 1 | |
| current_usage | INT UNSIGNED | DEFAULT 0 | |
| applicable_products | JSON | NULL | |
| applicable_occasions | JSON | NULL | |
| applicable_zones | JSON | NULL | |
| first_order_only | BOOLEAN | DEFAULT FALSE | |
| starts_at | TIMESTAMP | NOT NULL | |
| ends_at | TIMESTAMP | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

---

### `promo_code_usage`
Promo code usage tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| promo_code_id | BIGINT UNSIGNED | FK → promo_codes.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| discount_amount | DECIMAL(10,2) | NOT NULL | |
| created_at | TIMESTAMP | | |

---

## 26. Media & Files

### `media`
Spatie Media Library

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| model_type | VARCHAR(255) | NOT NULL | |
| model_id | BIGINT UNSIGNED | NOT NULL | |
| uuid | CHAR(36) | UNIQUE, NULL | |
| collection_name | VARCHAR(255) | NOT NULL | |
| name | VARCHAR(255) | NOT NULL | |
| file_name | VARCHAR(255) | NOT NULL | |
| mime_type | VARCHAR(255) | NULL | |
| disk | VARCHAR(255) | NOT NULL | |
| conversions_disk | VARCHAR(255) | NULL | |
| size | BIGINT UNSIGNED | NOT NULL | |
| manipulations | JSON | NOT NULL | |
| custom_properties | JSON | NOT NULL | |
| generated_conversions | JSON | NOT NULL | |
| responsive_images | JSON | NOT NULL | |
| order_column | INT UNSIGNED | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## Entity Relationship Diagram (Simplified)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   USERS     │────<│ SHOP_USERS  │>────│   SHOPS     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                       │
      │                                       │
      ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│ RECIPIENTS  │                         │  PRODUCTS   │
└─────────────┘                         └─────────────┘
      │                                       │
      │                                       │
      ▼                                       ▼
┌─────────────────────────────────────────────────────┐
│                      ORDERS                          │
│  (customer_id, shop_id, recipient_id, product_id)   │
└─────────────────────────────────────────────────────┘
      │                    │                    │
      │                    │                    │
      ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ ORDER_ITEMS │     │  PAYMENTS   │     │  DELIVERY   │
└─────────────┘     └─────────────┘     └─────────────┘


┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ FLOWER_TYPES│────<│FLOWER_BATCH │>────│ SUPPLIERS   │
└─────────────┘     └─────────────┘     └─────────────┘


┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  CUSTOMERS  │────<│CUSTOM_BOUQUETS  │>────│3D_DESIGNS   │
└─────────────┘     └─────────────────┘     └─────────────┘
```

---

## Migration Order

Execute in this order to respect foreign key dependencies:

1. `users`
2. `shops`, `shop_applications`, `shop_subscriptions`, `shop_users`, `shop_gallery`
3. `drivers`, `customer_profiles`
4. `flower_types`, `suppliers`
5. `product_categories`, `products`, `product_images`, `product_size_variants`
6. `add_ons`, `product_add_ons`
7. `flower_batches`, `product_flowers`, `inventory_alerts`, `waste_logs`
8. `zones`, `locations`, `customer_addresses`, `delivery_time_slots`
9. `occasions`, `product_occasions`
10. `recipients`, `recipient_addresses`
11. `customer_important_dates`, `occasion_reminders`
12. `gift_messages`, `card_styles`
13. `custom_bouquets`, `custom_bouquet_flowers`, `custom_bouquet_fillers`, `custom_bouquet_extras`
14. `flower_3d_assets`, `bouquet_3d_designs`, `ai_recognition_logs`, `ar_sessions`, `ar_photos`
15. `promo_codes`
16. `orders`, `order_items`, `order_add_ons`, `order_status_history`, `delivery_photos`
17. `flower_subscriptions`, `subscription_deliveries`
18. `consultations`, `event_quotes`, `event_quote_items`, `event_bookings`, `event_booking_items`
19. `loyalty_programs`, `loyalty_tiers`, `loyalty_cards`, `loyalty_transactions`, `loyalty_rewards`
20. `delivery_assignments`, `driver_locations`
21. `flower_care_instructions`, `care_reminders`
22. `payments`, `customer_wallets`, `wallet_transactions`
23. `reviews`, `review_photos`
24. `ad_campaigns`, `ad_creatives`, `ad_impressions`, `ad_clicks`
25. `shop_posts`, `post_reactions`, `post_comments`, `customer_follows`, `referrals`
26. `badges`, `customer_badges`, `customer_levels`, `challenges`, `challenge_progress`
27. `sms_messages`, `sms_orders`, `product_sms_codes`, `recipient_sms_codes`
28. `qr_codes`, `qr_scans`
29. `corporate_accounts`, `corporate_users`, `corporate_delivery_addresses`, `corporate_invoices`, `corporate_invoice_items`
30. `notifications`, `notification_preferences`
31. `support_tickets`, `ticket_messages`, `help_articles`
32. `promo_code_usage`
33. `media`

---

## Key Differences from Water Station Schema

| Feature | Water Station | Flower Store |
|---------|--------------|--------------|
| Container tracking | Yes (deposits, returns) | No |
| Gallon commerce | Yes (buy/sell/repair) | No |
| Perishable inventory | No | Yes (flower batches, freshness) |
| Gift/Recipient | No | Yes (comprehensive) |
| Occasions | No | Yes (birthdays, etc.) |
| 3D/AR | No | Yes (bouquet visualization) |
| Customization | No | Yes (build your own bouquet) |
| Wedding/Events | No | Yes (consultations, quotes, bookings) |
| Care instructions | No | Yes (flower care) |
| Corporate accounts | No | Yes (B2B) |
| Subscriptions | Simple | Advanced (flower clubs, gifts) |

---

## Notes

### Performance Considerations
- Index `flower_batches.best_before_date` for expiry queries
- Partition `orders` by date for large datasets
- Cache frequently accessed flower types and occasions
- Use read replicas for reporting

### Data Retention
- Archive old `driver_locations` data (30 days)
- Archive `ad_impressions` (90 days)
- Archive `ar_sessions` (30 days)
- Keep `orders` indefinitely (soft delete only)

### Security
- Encrypt payment gateway responses
- Use UUIDs for all public-facing identifiers
- Audit logging for order modifications
- Row-level security for multi-tenant data

---

*Document created: January 2026*
*Last updated: January 2026*
*Total Tables: 95+*
