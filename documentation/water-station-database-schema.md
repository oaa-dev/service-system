# Water Station System - Database Schema

## Overview

This document defines the complete database schema for the Water Station marketplace platform. The schema is designed for Laravel 12 with MySQL/PostgreSQL.

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
3. [Products & Services](#3-products--services)
4. [Locations & Zones](#4-locations--zones)
5. [Orders & Transactions](#5-orders--transactions)
6. [Subscriptions](#6-subscriptions)
7. [Loyalty Program](#7-loyalty-program)
8. [Delivery Management](#8-delivery-management)
9. [Payments & Deposits](#9-payments--deposits)
10. [Reviews & Ratings](#10-reviews--ratings)
11. [Advertising](#11-advertising)
12. [Social & Community](#12-social--community)
13. [Gamification](#13-gamification)
14. [SMS Ordering](#14-sms-ordering)
15. [QR Code System](#15-qr-code-system)
16. [Gallon Commerce](#16-gallon-commerce)
17. [Notifications](#17-notifications)
18. [Support](#18-support)
19. [Media & Files](#19-media--files)

---

## 1. Multi-Tenant & Platform

### `stations`
Water station businesses (tenants)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | Public identifier |
| owner_id | BIGINT UNSIGNED | FK → users.id | Station owner |
| name | VARCHAR(255) | NOT NULL | Business name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly name |
| code | VARCHAR(10) | UNIQUE, NOT NULL | Short code (e.g., AQP) |
| description | TEXT | NULL | About the station |
| logo_path | VARCHAR(255) | NULL | Logo image path |
| cover_photo_path | VARCHAR(255) | NULL | Cover image path |
| email | VARCHAR(255) | NOT NULL | Contact email |
| phone | VARCHAR(20) | NOT NULL | Contact phone |
| website | VARCHAR(255) | NULL | Website URL |
| address | VARCHAR(500) | NOT NULL | Physical address |
| latitude | DECIMAL(10,8) | NULL | GPS latitude |
| longitude | DECIMAL(11,8) | NULL | GPS longitude |
| business_permit_number | VARCHAR(100) | NULL | Business permit |
| tax_id | VARCHAR(50) | NULL | TIN/Tax ID |
| operating_hours | JSON | NULL | {"mon": {"open": "08:00", "close": "18:00"}, ...} |
| settings | JSON | NULL | Station-specific settings |
| is_verified | BOOLEAN | DEFAULT FALSE | Verification status |
| is_featured | BOOLEAN | DEFAULT FALSE | Featured on platform |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| verified_at | TIMESTAMP | NULL | When verified |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Indexes:**
- `idx_stations_slug` (slug)
- `idx_stations_code` (code)
- `idx_stations_location` (latitude, longitude)
- `idx_stations_active` (is_active, is_verified)

---

### `station_applications`
Applications from new station owners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | Public identifier |
| business_name | VARCHAR(255) | NOT NULL | Proposed business name |
| owner_name | VARCHAR(255) | NOT NULL | Owner's full name |
| email | VARCHAR(255) | NOT NULL | Contact email |
| phone | VARCHAR(20) | NOT NULL | Contact phone |
| address | VARCHAR(500) | NOT NULL | Business address |
| business_permit_number | VARCHAR(100) | NULL | |
| services_offered | JSON | NULL | Types of services |
| service_areas | JSON | NULL | Proposed coverage |
| expected_monthly_orders | INT | NULL | Estimated volume |
| referral_source | VARCHAR(100) | NULL | How they heard about us |
| notes | TEXT | NULL | Additional notes |
| status | ENUM | NOT NULL | 'pending', 'reviewing', 'approved', 'rejected' |
| reviewed_by | BIGINT UNSIGNED | FK → users.id, NULL | Admin who reviewed |
| reviewed_at | TIMESTAMP | NULL | |
| rejection_reason | TEXT | NULL | If rejected |
| station_id | BIGINT UNSIGNED | FK → stations.id, NULL | Created station |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_applications_status` (status)
- `idx_applications_email` (email)

---

### `station_application_documents`
Documents uploaded with applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| application_id | BIGINT UNSIGNED | FK → station_applications.id | |
| document_type | VARCHAR(50) | NOT NULL | 'business_permit', 'dti', 'id', 'photo' |
| file_path | VARCHAR(500) | NOT NULL | Storage path |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| file_size | INT UNSIGNED | NOT NULL | Size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | |
| created_at | TIMESTAMP | | |

---

### `station_subscriptions`
Platform subscription plans for stations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| plan | ENUM | NOT NULL | 'basic', 'pro', 'enterprise' |
| price | DECIMAL(10,2) | NOT NULL | Monthly price |
| features | JSON | NULL | Plan features |
| starts_at | DATE | NOT NULL | Subscription start |
| ends_at | DATE | NULL | Subscription end |
| trial_ends_at | DATE | NULL | Trial period end |
| status | ENUM | NOT NULL | 'active', 'cancelled', 'past_due', 'trialing' |
| cancelled_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `station_users`
Staff members of a station

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| role | ENUM | NOT NULL | 'owner', 'admin', 'staff' |
| permissions | JSON | NULL | Specific permissions |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_station_users_unique` UNIQUE (station_id, user_id)

---

### `station_verifications`
Verification records for stations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| verification_type | VARCHAR(50) | NOT NULL | 'basic', 'verified', 'premium', 'certified' |
| verified_by | BIGINT UNSIGNED | FK → users.id | Admin |
| verification_notes | TEXT | NULL | |
| expires_at | DATE | NULL | Verification expiry |
| created_at | TIMESTAMP | | |

---

## 2. Users & Authentication

### `users`
All platform users (admins, customers, drivers)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | Public identifier |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| email_verified_at | TIMESTAMP | NULL | |
| phone | VARCHAR(20) | UNIQUE, NULL | |
| phone_verified_at | TIMESTAMP | NULL | |
| password | VARCHAR(255) | NOT NULL | Hashed |
| avatar_path | VARCHAR(255) | NULL | Profile photo |
| date_of_birth | DATE | NULL | For birthday promos |
| gender | ENUM | NULL | 'male', 'female', 'other' |
| user_type | ENUM | NOT NULL | 'customer', 'admin', 'super_admin' |
| customer_type | ENUM | NULL | 'residential', 'commercial' |
| company_name | VARCHAR(255) | NULL | For commercial customers |
| referral_code | VARCHAR(20) | UNIQUE, NULL | Customer's referral code |
| referred_by | BIGINT UNSIGNED | FK → users.id, NULL | Who referred them |
| settings | JSON | NULL | User preferences |
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
- `idx_users_type` (user_type)

---

### `customer_profiles`
Extended customer information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| user_id | BIGINT UNSIGNED | FK → users.id, UNIQUE | |
| default_station_id | BIGINT UNSIGNED | FK → stations.id, NULL | Preferred station |
| default_address_id | BIGINT UNSIGNED | FK → customer_addresses.id, NULL | |
| default_payment_method | VARCHAR(50) | NULL | |
| communication_preferences | JSON | NULL | SMS, email, push settings |
| notes | TEXT | NULL | Internal notes |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `drivers`
Delivery personnel

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| user_id | BIGINT UNSIGNED | FK → users.id, UNIQUE | Linked user account |
| station_id | BIGINT UNSIGNED | FK → stations.id | Employed by |
| employee_id | VARCHAR(50) | NULL | Internal employee ID |
| vehicle_type | ENUM | NOT NULL | 'motorcycle', 'tricycle', 'truck', 'van' |
| vehicle_plate_number | VARCHAR(20) | NULL | |
| license_number | VARCHAR(50) | NULL | |
| license_expiry | DATE | NULL | |
| photo_path | VARCHAR(255) | NULL | Driver photo |
| current_latitude | DECIMAL(10,8) | NULL | Real-time location |
| current_longitude | DECIMAL(11,8) | NULL | |
| status | ENUM | NOT NULL | 'available', 'on_delivery', 'offline', 'break' |
| rating_average | DECIMAL(3,2) | DEFAULT 0.00 | Average rating |
| rating_count | INT UNSIGNED | DEFAULT 0 | Number of ratings |
| total_deliveries | INT UNSIGNED | DEFAULT 0 | Lifetime deliveries |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Indexes:**
- `idx_drivers_station` (station_id)
- `idx_drivers_status` (status)
- `idx_drivers_location` (current_latitude, current_longitude)

---

### `driver_zones`
Zones assigned to drivers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| driver_id | BIGINT UNSIGNED | FK → drivers.id | |
| zone_id | BIGINT UNSIGNED | FK → zones.id | |
| is_primary | BOOLEAN | DEFAULT FALSE | Primary zone |
| created_at | TIMESTAMP | | |

**Indexes:**
- `idx_driver_zones_unique` UNIQUE (driver_id, zone_id)

---

## 3. Products & Services

### `product_categories`
Product categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id, NULL | NULL = global |
| parent_id | BIGINT UNSIGNED | FK → product_categories.id, NULL | For nesting |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(100) | NOT NULL | |
| description | TEXT | NULL | |
| image_path | VARCHAR(255) | NULL | |
| sort_order | INT | DEFAULT 0 | Display order |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `products`
Water products and services

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| category_id | BIGINT UNSIGNED | FK → product_categories.id, NULL | |
| name | VARCHAR(255) | NOT NULL | |
| slug | VARCHAR(255) | NOT NULL | |
| sku | VARCHAR(50) | NULL | Stock keeping unit |
| code | VARCHAR(10) | NULL | SMS order code |
| description | TEXT | NULL | |
| short_description | VARCHAR(500) | NULL | |
| product_type | ENUM | NOT NULL | 'water', 'container', 'equipment', 'accessory', 'service' |
| water_type | ENUM | NULL | 'purified', 'mineral', 'alkaline', 'distilled' |
| container_size | ENUM | NULL | '5_gallon', '10_gallon', 'slim', 'round', 'bottle' |
| price | DECIMAL(10,2) | NOT NULL | Regular price |
| subscription_price | DECIMAL(10,2) | NULL | Discounted subscription price |
| cost | DECIMAL(10,2) | NULL | Cost price (internal) |
| container_deposit | DECIMAL(10,2) | DEFAULT 0.00 | Deposit amount |
| stock_quantity | INT | DEFAULT 0 | Available stock |
| low_stock_threshold | INT | DEFAULT 10 | Alert threshold |
| track_inventory | BOOLEAN | DEFAULT TRUE | |
| is_featured | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| sort_order | INT | DEFAULT 0 | |
| metadata | JSON | NULL | Additional attributes |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Indexes:**
- `idx_products_station` (station_id)
- `idx_products_category` (category_id)
- `idx_products_code` (code)
- `idx_products_type` (product_type)
- `idx_products_active` (is_active)

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

### `product_price_tiers`
Bulk pricing tiers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| min_quantity | INT UNSIGNED | NOT NULL | Minimum qty for tier |
| max_quantity | INT UNSIGNED | NULL | Maximum qty (NULL = unlimited) |
| price | DECIMAL(10,2) | NOT NULL | Price at this tier |
| discount_percentage | DECIMAL(5,2) | NULL | Optional: show as discount |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_price_tiers_product` (product_id)

---

## 4. Locations & Zones

### `zones`
Delivery zones/areas

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| parent_id | BIGINT UNSIGNED | FK → zones.id, NULL | Parent zone |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(100) | NOT NULL | |
| description | TEXT | NULL | |
| polygon_coordinates | JSON | NULL | GeoJSON polygon |
| delivery_fee | DECIMAL(10,2) | DEFAULT 0.00 | |
| minimum_order | DECIMAL(10,2) | DEFAULT 0.00 | |
| estimated_delivery_minutes | INT | NULL | |
| available_days | JSON | NULL | ["mon", "tue", "wed"...] |
| same_day_cutoff | TIME | NULL | Cutoff for same-day |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_zones_station` (station_id)
- `idx_zones_active` (is_active)

---

### `locations`
Subdivisions, condos, commercial areas

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| zone_id | BIGINT UNSIGNED | FK → zones.id | |
| name | VARCHAR(255) | NOT NULL | |
| slug | VARCHAR(255) | NOT NULL | |
| location_type | ENUM | NOT NULL | 'subdivision', 'condominium', 'commercial', 'village' |
| address | VARCHAR(500) | NULL | |
| latitude | DECIMAL(10,8) | NULL | |
| longitude | DECIMAL(11,8) | NULL | |
| access_type | ENUM | NULL | 'open', 'guarded', 'strict' |
| access_instructions | TEXT | NULL | How to enter |
| guard_contact | VARCHAR(20) | NULL | |
| hoa_contact | VARCHAR(20) | NULL | |
| delivery_notes | TEXT | NULL | Special instructions |
| is_verified | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_locations_zone` (zone_id)
- `idx_locations_type` (location_type)
- `idx_locations_coords` (latitude, longitude)

---

### `location_units`
Blocks, towers, phases within locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| location_id | BIGINT UNSIGNED | FK → locations.id | |
| name | VARCHAR(100) | NOT NULL | "Block 5", "Tower A", "Phase 2" |
| unit_type | ENUM | NOT NULL | 'block', 'tower', 'phase', 'street', 'building' |
| floor_count | INT | NULL | For towers/buildings |
| unit_format | VARCHAR(50) | NULL | "Unit {floor}{letter}" |
| sort_order | INT | DEFAULT 0 | |
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
| code | VARCHAR(20) | NULL | SMS code: "HOME", "OFFICE" |
| address_type | ENUM | NOT NULL | 'house', 'subdivision', 'condo', 'commercial' |
| zone_id | BIGINT UNSIGNED | FK → zones.id, NULL | |
| location_id | BIGINT UNSIGNED | FK → locations.id, NULL | |
| location_unit_id | BIGINT UNSIGNED | FK → location_units.id, NULL | |
| street_address | VARCHAR(255) | NOT NULL | |
| unit_number | VARCHAR(50) | NULL | Lot number, unit number |
| floor | INT | NULL | For condos |
| building_name | VARCHAR(100) | NULL | |
| city | VARCHAR(100) | NOT NULL | |
| province | VARCHAR(100) | NULL | |
| postal_code | VARCHAR(10) | NULL | |
| landmarks | TEXT | NULL | |
| delivery_instructions | TEXT | NULL | |
| contact_name | VARCHAR(100) | NULL | If different from user |
| contact_phone | VARCHAR(20) | NULL | |
| latitude | DECIMAL(10,8) | NULL | |
| longitude | DECIMAL(11,8) | NULL | |
| is_default | BOOLEAN | DEFAULT FALSE | |
| is_verified | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Indexes:**
- `idx_addresses_user` (user_id)
- `idx_addresses_zone` (zone_id)
- `idx_addresses_code` (user_id, code)

---

## 5. Orders & Transactions

### `orders`
Customer orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| order_number | VARCHAR(20) | UNIQUE, NOT NULL | e.g., "ORD-20260125-001" |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| address_id | BIGINT UNSIGNED | FK → customer_addresses.id | |
| order_type | ENUM | NOT NULL | 'one_time', 'subscription', 'bulk' |
| order_source | ENUM | DEFAULT 'web' | 'web', 'app', 'sms', 'qr', 'phone' |
| delivery_date | DATE | NOT NULL | |
| delivery_time_slot | VARCHAR(50) | NULL | "8AM-10AM" |
| delivery_time_start | TIME | NULL | |
| delivery_time_end | TIME | NULL | |
| subtotal | DECIMAL(10,2) | NOT NULL | |
| delivery_fee | DECIMAL(10,2) | DEFAULT 0.00 | |
| container_deposit | DECIMAL(10,2) | DEFAULT 0.00 | |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| loyalty_discount | DECIMAL(10,2) | DEFAULT 0.00 | |
| tax_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| total_amount | DECIMAL(10,2) | NOT NULL | |
| promo_code_id | BIGINT UNSIGNED | FK → promo_codes.id, NULL | |
| status | ENUM | NOT NULL | See status enum below |
| payment_method | ENUM | NULL | 'cod', 'gcash', 'maya', 'card', 'bank_transfer', 'wallet' |
| payment_status | ENUM | DEFAULT 'pending' | 'pending', 'paid', 'partial', 'refunded' |
| driver_id | BIGINT UNSIGNED | FK → drivers.id, NULL | Assigned driver |
| assigned_at | TIMESTAMP | NULL | When driver assigned |
| picked_up_at | TIMESTAMP | NULL | Driver picked up |
| delivered_at | TIMESTAMP | NULL | Delivery completed |
| customer_notes | TEXT | NULL | Notes from customer |
| internal_notes | TEXT | NULL | Staff notes |
| rating | TINYINT UNSIGNED | NULL | 1-5 |
| rated_at | TIMESTAMP | NULL | |
| cancelled_at | TIMESTAMP | NULL | |
| cancellation_reason | TEXT | NULL | |
| cancelled_by | ENUM | NULL | 'customer', 'station', 'system' |
| metadata | JSON | NULL | Additional data |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Order Status Enum:**
- `pending` - Awaiting confirmation
- `confirmed` - Accepted by station
- `preparing` - Being prepared
- `ready` - Ready for pickup/delivery
- `out_for_delivery` - With driver
- `delivered` - Successfully delivered
- `completed` - Order finalized
- `cancelled` - Cancelled
- `failed` - Delivery failed

**Indexes:**
- `idx_orders_number` (order_number)
- `idx_orders_station` (station_id)
- `idx_orders_customer` (customer_id)
- `idx_orders_status` (status)
- `idx_orders_date` (delivery_date)
- `idx_orders_driver` (driver_id)

---

### `order_items`
Items within an order

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| product_name | VARCHAR(255) | NOT NULL | Snapshot of name |
| product_sku | VARCHAR(50) | NULL | Snapshot of SKU |
| quantity | INT UNSIGNED | NOT NULL | |
| unit_price | DECIMAL(10,2) | NOT NULL | Price at time of order |
| subtotal | DECIMAL(10,2) | NOT NULL | quantity × unit_price |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | |
| container_deposit | DECIMAL(10,2) | DEFAULT 0.00 | Per item |
| notes | TEXT | NULL | Item-specific notes |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_order_items_order` (order_id)
- `idx_order_items_product` (product_id)

---

### `order_status_history`
Order status change log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| status | VARCHAR(50) | NOT NULL | Status changed to |
| notes | TEXT | NULL | |
| changed_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| metadata | JSON | NULL | Additional context |
| created_at | TIMESTAMP | | Timestamp of change |

---

### `delivery_time_slots`
Available delivery time slots

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| zone_id | BIGINT UNSIGNED | FK → zones.id, NULL | NULL = all zones |
| name | VARCHAR(50) | NOT NULL | "Morning" |
| start_time | TIME | NOT NULL | |
| end_time | TIME | NOT NULL | |
| max_orders | INT UNSIGNED | NULL | Capacity limit |
| days_available | JSON | NULL | ["mon", "tue"...] |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 6. Subscriptions

### `customer_subscriptions`
Recurring water subscriptions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| address_id | BIGINT UNSIGNED | FK → customer_addresses.id | |
| frequency | ENUM | NOT NULL | 'weekly', 'biweekly', 'monthly', 'custom' |
| frequency_days | INT | NULL | For custom: every N days |
| preferred_day | ENUM | NULL | 'monday', 'tuesday', etc. |
| preferred_time_slot_id | BIGINT UNSIGNED | FK → delivery_time_slots.id, NULL | |
| start_date | DATE | NOT NULL | |
| next_delivery_date | DATE | NULL | |
| last_delivery_date | DATE | NULL | |
| payment_method | ENUM | NULL | |
| status | ENUM | NOT NULL | 'active', 'paused', 'cancelled' |
| paused_at | TIMESTAMP | NULL | |
| paused_until | DATE | NULL | |
| cancelled_at | TIMESTAMP | NULL | |
| cancellation_reason | TEXT | NULL | |
| auto_renew | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_subscriptions_customer` (customer_id)
- `idx_subscriptions_station` (station_id)
- `idx_subscriptions_status` (status)
- `idx_subscriptions_next` (next_delivery_date)

---

### `subscription_items`
Products in a subscription

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| subscription_id | BIGINT UNSIGNED | FK → customer_subscriptions.id | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| quantity | INT UNSIGNED | NOT NULL | |
| unit_price | DECIMAL(10,2) | NOT NULL | Subscription price |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `subscription_deliveries`
Individual subscription deliveries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| subscription_id | BIGINT UNSIGNED | FK → customer_subscriptions.id | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | Generated order |
| scheduled_date | DATE | NOT NULL | |
| status | ENUM | NOT NULL | 'scheduled', 'skipped', 'delivered', 'failed' |
| skipped_at | TIMESTAMP | NULL | |
| skip_reason | VARCHAR(255) | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 7. Loyalty Program

### `loyalty_programs`
Station loyalty program configuration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id, UNIQUE | |
| name | VARCHAR(100) | NOT NULL | "Buy 10 Get 1 Free" |
| program_type | ENUM | NOT NULL | 'stamps', 'points' |
| stamps_required | INT UNSIGNED | NULL | For stamp cards |
| points_per_peso | DECIMAL(5,2) | NULL | For points: pts/₱1 |
| reward_type | ENUM | NOT NULL | 'free_product', 'discount_percentage', 'discount_fixed', 'free_delivery' |
| reward_value | DECIMAL(10,2) | NULL | Discount amount or product_id |
| reward_product_id | BIGINT UNSIGNED | FK → products.id, NULL | Free product |
| min_order_amount | DECIMAL(10,2) | DEFAULT 0.00 | Minimum order to earn |
| qualifying_products | JSON | NULL | NULL = all products |
| expiry_days | INT UNSIGNED | NULL | Days until stamps/points expire |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `loyalty_cards`
Customer loyalty cards (per station)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| program_id | BIGINT UNSIGNED | FK → loyalty_programs.id | |
| current_stamps | INT UNSIGNED | DEFAULT 0 | Current progress |
| current_points | INT UNSIGNED | DEFAULT 0 | |
| lifetime_stamps | INT UNSIGNED | DEFAULT 0 | Total earned |
| lifetime_points | INT UNSIGNED | DEFAULT 0 | |
| tier | ENUM | DEFAULT 'bronze' | 'bronze', 'silver', 'gold', 'platinum' |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_loyalty_cards_unique` UNIQUE (customer_id, station_id)

---

### `loyalty_transactions`
Loyalty earning/redemption history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| loyalty_card_id | BIGINT UNSIGNED | FK → loyalty_cards.id | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| transaction_type | ENUM | NOT NULL | 'earn', 'redeem', 'expire', 'bonus', 'adjust' |
| stamps | INT | DEFAULT 0 | + or - |
| points | INT | DEFAULT 0 | + or - |
| description | VARCHAR(255) | NULL | |
| expires_at | DATE | NULL | For earned stamps/points |
| created_at | TIMESTAMP | | |

---

### `loyalty_rewards`
Available/earned rewards

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

## 8. Delivery Management

### `delivery_assignments`
Order delivery assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| driver_id | BIGINT UNSIGNED | FK → drivers.id | |
| assigned_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| assignment_type | ENUM | DEFAULT 'manual' | 'manual', 'auto' |
| status | ENUM | NOT NULL | 'assigned', 'accepted', 'picked_up', 'delivered', 'failed', 'reassigned' |
| accepted_at | TIMESTAMP | NULL | |
| picked_up_at | TIMESTAMP | NULL | |
| delivered_at | TIMESTAMP | NULL | |
| delivery_photo_path | VARCHAR(500) | NULL | Proof of delivery |
| delivery_notes | TEXT | NULL | |
| recipient_name | VARCHAR(100) | NULL | Who received |
| signature_path | VARCHAR(500) | NULL | If signature collected |
| failure_reason | TEXT | NULL | If failed |
| distance_km | DECIMAL(8,2) | NULL | Delivery distance |
| duration_minutes | INT | NULL | Actual duration |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_delivery_order` (order_id)
- `idx_delivery_driver` (driver_id)
- `idx_delivery_status` (status)

---

### `driver_locations`
Driver location history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| driver_id | BIGINT UNSIGNED | FK → drivers.id | |
| latitude | DECIMAL(10,8) | NOT NULL | |
| longitude | DECIMAL(11,8) | NOT NULL | |
| accuracy | DECIMAL(8,2) | NULL | GPS accuracy in meters |
| speed | DECIMAL(8,2) | NULL | Speed in km/h |
| heading | DECIMAL(5,2) | NULL | Direction 0-360 |
| recorded_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | | |

**Indexes:**
- `idx_driver_locations_driver` (driver_id)
- `idx_driver_locations_time` (recorded_at)

*Note: Consider partitioning by date or using time-series database for high volume*

---

## 9. Payments & Deposits

### `payments`
Payment records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| payment_type | ENUM | NOT NULL | 'order', 'deposit', 'subscription', 'top_up', 'tip' |
| payment_method | ENUM | NOT NULL | 'cod', 'gcash', 'maya', 'card', 'bank_transfer', 'wallet' |
| amount | DECIMAL(10,2) | NOT NULL | |
| currency | CHAR(3) | DEFAULT 'PHP' | |
| status | ENUM | NOT NULL | 'pending', 'processing', 'completed', 'failed', 'refunded' |
| gateway_reference | VARCHAR(255) | NULL | External payment ref |
| gateway_response | JSON | NULL | Full gateway response |
| paid_at | TIMESTAMP | NULL | |
| refunded_at | TIMESTAMP | NULL | |
| refund_amount | DECIMAL(10,2) | NULL | |
| refund_reason | TEXT | NULL | |
| metadata | JSON | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_payments_order` (order_id)
- `idx_payments_customer` (customer_id)
- `idx_payments_status` (status)
- `idx_payments_gateway_ref` (gateway_reference)

---

### `customer_wallets`
Customer wallet/credit balance

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id, UNIQUE | |
| balance | DECIMAL(10,2) | DEFAULT 0.00 | Current balance |
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
| transaction_type | ENUM | NOT NULL | 'deposit', 'payment', 'refund', 'bonus', 'withdrawal' |
| amount | DECIMAL(10,2) | NOT NULL | + or - |
| balance_after | DECIMAL(10,2) | NOT NULL | Balance after txn |
| reference_type | VARCHAR(50) | NULL | 'order', 'payment', 'promo' |
| reference_id | BIGINT UNSIGNED | NULL | |
| description | VARCHAR(255) | NULL | |
| created_at | TIMESTAMP | | |

---

### `container_deposits`
Container deposit tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| container_id | BIGINT UNSIGNED | FK → containers.id, NULL | If tracked |
| container_type | VARCHAR(50) | NOT NULL | "5_gallon", "10_gallon" |
| deposit_amount | DECIMAL(10,2) | NOT NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | Original order |
| status | ENUM | NOT NULL | 'active', 'returned', 'lost', 'damaged', 'refunded' |
| borrowed_at | TIMESTAMP | NOT NULL | |
| expected_return_date | DATE | NULL | |
| returned_at | TIMESTAMP | NULL | |
| refunded_at | TIMESTAMP | NULL | |
| refund_amount | DECIMAL(10,2) | NULL | |
| notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_deposits_customer` (customer_id)
- `idx_deposits_station` (station_id)
- `idx_deposits_status` (status)

---

## 10. Reviews & Ratings

### `reviews`
Customer reviews

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| driver_id | BIGINT UNSIGNED | FK → drivers.id, NULL | |
| overall_rating | TINYINT UNSIGNED | NOT NULL | 1-5 |
| water_quality_rating | TINYINT UNSIGNED | NULL | 1-5 |
| delivery_rating | TINYINT UNSIGNED | NULL | 1-5 |
| service_rating | TINYINT UNSIGNED | NULL | 1-5 |
| review_text | TEXT | NULL | |
| is_anonymous | BOOLEAN | DEFAULT FALSE | |
| status | ENUM | DEFAULT 'pending' | 'pending', 'published', 'hidden', 'flagged' |
| helpful_count | INT UNSIGNED | DEFAULT 0 | |
| report_count | INT UNSIGNED | DEFAULT 0 | |
| station_response | TEXT | NULL | |
| station_responded_at | TIMESTAMP | NULL | |
| published_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_reviews_order` (order_id)
- `idx_reviews_station` (station_id)
- `idx_reviews_status` (status)
- `idx_reviews_rating` (overall_rating)

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

### `review_helpful_votes`
Review helpfulness votes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| review_id | BIGINT UNSIGNED | FK → reviews.id | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| created_at | TIMESTAMP | | |

**Indexes:**
- `idx_helpful_unique` UNIQUE (review_id, user_id)

---

### `review_reports`
Reported reviews

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| review_id | BIGINT UNSIGNED | FK → reviews.id | |
| reported_by | BIGINT UNSIGNED | FK → users.id | |
| reason | ENUM | NOT NULL | 'spam', 'inappropriate', 'fake', 'other' |
| description | TEXT | NULL | |
| status | ENUM | DEFAULT 'pending' | 'pending', 'reviewed', 'actioned', 'dismissed' |
| reviewed_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| reviewed_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |

---

## 11. Advertising

### `ad_campaigns`
Advertising campaigns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| name | VARCHAR(255) | NOT NULL | |
| campaign_type | ENUM | NOT NULL | 'featured_listing', 'banner', 'video', 'sponsored_post' |
| objective | ENUM | NULL | 'awareness', 'traffic', 'orders' |
| target_zones | JSON | NULL | Zone IDs to target |
| target_customer_type | JSON | NULL | ['residential', 'commercial'] |
| budget_total | DECIMAL(10,2) | NULL | Total budget |
| budget_daily | DECIMAL(10,2) | NULL | Daily limit |
| cost_model | ENUM | NOT NULL | 'fixed', 'cpm', 'cpc' |
| cost_per_unit | DECIMAL(10,2) | NULL | Cost per impression/click |
| starts_at | TIMESTAMP | NOT NULL | |
| ends_at | TIMESTAMP | NULL | |
| status | ENUM | NOT NULL | 'draft', 'pending_review', 'approved', 'active', 'paused', 'completed', 'rejected' |
| rejection_reason | TEXT | NULL | |
| reviewed_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| reviewed_at | TIMESTAMP | NULL | |
| total_spent | DECIMAL(10,2) | DEFAULT 0.00 | |
| total_impressions | INT UNSIGNED | DEFAULT 0 | |
| total_clicks | INT UNSIGNED | DEFAULT 0 | |
| total_orders | INT UNSIGNED | DEFAULT 0 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_campaigns_station` (station_id)
- `idx_campaigns_status` (status)
- `idx_campaigns_dates` (starts_at, ends_at)

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
| thumbnail_path | VARCHAR(500) | NULL | For videos |
| click_url | VARCHAR(500) | NULL | |
| cta_text | VARCHAR(50) | NULL | Call to action |
| dimensions | VARCHAR(20) | NULL | "1200x400" |
| duration_seconds | INT | NULL | For videos |
| file_size_bytes | INT UNSIGNED | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `ad_placements`
Where ads can be shown

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| name | VARCHAR(100) | NOT NULL | "Home Banner", "Discovery Top" |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | |
| placement_type | ENUM | NOT NULL | 'banner', 'listing', 'interstitial' |
| dimensions | VARCHAR(20) | NULL | |
| max_file_size_mb | INT | NULL | |
| supported_types | JSON | NULL | ['image', 'video'] |
| price_per_day | DECIMAL(10,2) | NULL | For fixed pricing |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `ad_impressions`
Ad impression tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| campaign_id | BIGINT UNSIGNED | FK → ad_campaigns.id | |
| creative_id | BIGINT UNSIGNED | FK → ad_creatives.id | |
| placement_id | BIGINT UNSIGNED | FK → ad_placements.id | |
| user_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| session_id | VARCHAR(100) | NULL | |
| ip_address | VARCHAR(45) | NULL | |
| user_agent | VARCHAR(500) | NULL | |
| created_at | TIMESTAMP | | |

*Note: Consider batching or using analytics service for high volume*

---

### `ad_clicks`
Ad click tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| campaign_id | BIGINT UNSIGNED | FK → ad_campaigns.id | |
| creative_id | BIGINT UNSIGNED | FK → ad_creatives.id | |
| impression_id | BIGINT UNSIGNED | FK → ad_impressions.id, NULL | |
| user_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | Conversion |
| ip_address | VARCHAR(45) | NULL | |
| created_at | TIMESTAMP | | |

---

## 12. Social & Community

### `station_posts`
Station announcements/posts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| author_id | BIGINT UNSIGNED | FK → users.id | |
| post_type | ENUM | NOT NULL | 'announcement', 'promo', 'update', 'tip' |
| title | VARCHAR(255) | NULL | |
| content | TEXT | NOT NULL | |
| image_path | VARCHAR(500) | NULL | |
| video_path | VARCHAR(500) | NULL | |
| link_url | VARCHAR(500) | NULL | |
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
| post_id | BIGINT UNSIGNED | FK → station_posts.id | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| reaction_type | ENUM | DEFAULT 'like' | 'like', 'love', 'helpful' |
| created_at | TIMESTAMP | | |

**Indexes:**
- `idx_reactions_unique` UNIQUE (post_id, user_id)

---

### `post_comments`
Comments on posts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| post_id | BIGINT UNSIGNED | FK → station_posts.id | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| parent_id | BIGINT UNSIGNED | FK → post_comments.id, NULL | Reply to |
| content | TEXT | NOT NULL | |
| is_hidden | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

---

### `customer_follows`
Customers following stations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| created_at | TIMESTAMP | | |

**Indexes:**
- `idx_follows_unique` UNIQUE (customer_id, station_id)

---

### `referrals`
Customer referral tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| referrer_id | BIGINT UNSIGNED | FK → users.id | Who referred |
| referred_id | BIGINT UNSIGNED | FK → users.id | New customer |
| referral_code | VARCHAR(20) | NOT NULL | Code used |
| status | ENUM | NOT NULL | 'pending', 'completed', 'rewarded' |
| first_order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| referrer_reward_type | ENUM | NULL | 'credit', 'points', 'discount' |
| referrer_reward_value | DECIMAL(10,2) | NULL | |
| referred_reward_type | ENUM | NULL | |
| referred_reward_value | DECIMAL(10,2) | NULL | |
| rewarded_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 13. Gamification

### `badges`
Available badges

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | |
| description | VARCHAR(255) | NOT NULL | |
| icon_path | VARCHAR(255) | NULL | |
| criteria_type | VARCHAR(50) | NOT NULL | 'order_count', 'station_count', etc. |
| criteria_value | INT | NOT NULL | Threshold |
| points_reward | INT UNSIGNED | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `customer_badges`
Badges earned by customers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| badge_id | BIGINT UNSIGNED | FK → badges.id | |
| earned_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | | |

**Indexes:**
- `idx_customer_badges_unique` UNIQUE (customer_id, badge_id)

---

### `customer_levels`
Customer level/tier

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id, UNIQUE | |
| level | INT UNSIGNED | DEFAULT 1 | Current level |
| level_name | VARCHAR(50) | NOT NULL | "Newbie", "Regular", etc. |
| total_points | INT UNSIGNED | DEFAULT 0 | Lifetime points |
| current_points | INT UNSIGNED | DEFAULT 0 | Spendable points |
| level_progress | INT UNSIGNED | DEFAULT 0 | Progress to next level |
| next_level_points | INT UNSIGNED | NULL | Points needed |
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
| challenge_type | ENUM | NOT NULL | 'order_count', 'spend_amount', 'referral', 'review' |
| target_value | INT | NOT NULL | Goal to achieve |
| reward_type | ENUM | NOT NULL | 'points', 'badge', 'credit', 'discount' |
| reward_value | DECIMAL(10,2) | NULL | |
| reward_badge_id | BIGINT UNSIGNED | FK → badges.id, NULL | |
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
- `idx_challenge_progress_unique` UNIQUE (customer_id, challenge_id)

---

## 14. SMS Ordering

### `sms_messages`
SMS message log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| direction | ENUM | NOT NULL | 'inbound', 'outbound' |
| phone_number | VARCHAR(20) | NOT NULL | |
| message | TEXT | NOT NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| station_id | BIGINT UNSIGNED | FK → stations.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| message_type | VARCHAR(50) | NULL | 'order', 'status', 'promo', etc. |
| gateway_id | VARCHAR(100) | NULL | SMS gateway message ID |
| gateway_status | VARCHAR(50) | NULL | |
| cost | DECIMAL(8,4) | NULL | SMS cost |
| sent_at | TIMESTAMP | NULL | |
| delivered_at | TIMESTAMP | NULL | |
| failed_at | TIMESTAMP | NULL | |
| failure_reason | VARCHAR(255) | NULL | |
| created_at | TIMESTAMP | | |

**Indexes:**
- `idx_sms_phone` (phone_number)
- `idx_sms_customer` (customer_id)
- `idx_sms_direction` (direction)

---

### `sms_orders`
SMS order parsing log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| sms_message_id | BIGINT UNSIGNED | FK → sms_messages.id | |
| phone_number | VARCHAR(20) | NOT NULL | |
| raw_message | TEXT | NOT NULL | Original SMS |
| parsed_command | VARCHAR(50) | NULL | 'ORDER', 'REORDER', etc. |
| parsed_params | JSON | NULL | Extracted parameters |
| customer_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| station_id | BIGINT UNSIGNED | FK → stations.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | Created order |
| status | ENUM | NOT NULL | 'received', 'parsed', 'processed', 'failed' |
| error_message | VARCHAR(255) | NULL | |
| response_sent | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `product_sms_codes`
Short codes for SMS ordering

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| product_id | BIGINT UNSIGNED | FK → products.id | |
| code | VARCHAR(10) | NOT NULL | "5GAL", "ALK5" |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_sms_codes_unique` UNIQUE (station_id, code)

---

### `customer_phone_verifications`
Verified phone numbers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| phone_number | VARCHAR(20) | NOT NULL | |
| is_verified | BOOLEAN | DEFAULT FALSE | |
| verification_code | VARCHAR(10) | NULL | |
| verification_sent_at | TIMESTAMP | NULL | |
| verified_at | TIMESTAMP | NULL | |
| sms_opt_in | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 15. QR Code System

### `qr_codes`
QR code records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| qr_type | ENUM | NOT NULL | 'station', 'product', 'container', 'promo', 'driver', 'order' |
| reference_type | VARCHAR(50) | NULL | Polymorphic type |
| reference_id | BIGINT UNSIGNED | NULL | Polymorphic ID |
| short_code | VARCHAR(20) | UNIQUE, NOT NULL | URL short code |
| target_url | VARCHAR(500) | NOT NULL | Full URL |
| campaign_name | VARCHAR(100) | NULL | |
| scan_count | INT UNSIGNED | DEFAULT 0 | |
| unique_scan_count | INT UNSIGNED | DEFAULT 0 | |
| last_scanned_at | TIMESTAMP | NULL | |
| expires_at | TIMESTAMP | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| metadata | JSON | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_qr_short_code` (short_code)
- `idx_qr_station` (station_id)
- `idx_qr_type` (qr_type)

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
| action_taken | VARCHAR(50) | NULL | 'order', 'signup', 'review' |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | If order placed |
| scanned_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | | |

---

### `qr_templates`
QR sticker design templates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| name | VARCHAR(100) | NOT NULL | |
| description | VARCHAR(255) | NULL | |
| preview_image_path | VARCHAR(500) | NULL | |
| template_config | JSON | NOT NULL | Design configuration |
| dimensions | VARCHAR(20) | NOT NULL | "5x5cm" |
| is_default | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 16. Gallon Commerce

### `containers`
Individual container tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| station_id | BIGINT UNSIGNED | FK → stations.id | Owner station |
| container_type | ENUM | NOT NULL | '5_gallon', '10_gallon', 'slim' |
| material | ENUM | NULL | 'pc', 'pet', 'pp' |
| serial_number | VARCHAR(50) | NULL | |
| qr_code_id | BIGINT UNSIGNED | FK → qr_codes.id, NULL | |
| manufacturing_date | DATE | NULL | |
| current_holder_id | BIGINT UNSIGNED | FK → users.id, NULL | Customer |
| current_holder_type | ENUM | NULL | 'customer', 'station' |
| status | ENUM | NOT NULL | 'in_station', 'with_customer', 'in_repair', 'lost', 'damaged', 'retired' |
| condition | ENUM | DEFAULT 'good' | 'new', 'good', 'fair', 'poor' |
| deposit_paid_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| last_filled_at | TIMESTAMP | NULL | |
| last_inspected_at | TIMESTAMP | NULL | |
| total_refills | INT UNSIGNED | DEFAULT 0 | |
| notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_containers_station` (station_id)
- `idx_containers_holder` (current_holder_id)
- `idx_containers_status` (status)

---

### `container_history`
Container lifecycle history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| container_id | BIGINT UNSIGNED | FK → containers.id | |
| event_type | ENUM | NOT NULL | 'created', 'delivered', 'returned', 'filled', 'inspected', 'repaired', 'lost', 'retired' |
| from_holder_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| to_holder_id | BIGINT UNSIGNED | FK → users.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| notes | TEXT | NULL | |
| recorded_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| created_at | TIMESTAMP | | |

---

### `container_products`
Containers for sale

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| name | VARCHAR(255) | NOT NULL | |
| container_type | ENUM | NOT NULL | |
| condition | ENUM | NOT NULL | 'new', 'refurbished' |
| price | DECIMAL(10,2) | NOT NULL | |
| wholesale_price | DECIMAL(10,2) | NULL | |
| cost | DECIMAL(10,2) | NULL | |
| stock_quantity | INT | DEFAULT 0 | |
| warranty_months | INT | NULL | |
| description | TEXT | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `buyback_requests`
Customer gallon buyback requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| container_type | ENUM | NOT NULL | |
| estimated_quantity | INT UNSIGNED | NOT NULL | |
| estimated_condition | ENUM | NOT NULL | 'good', 'fair', 'damaged' |
| payout_method | ENUM | NOT NULL | 'cash', 'credit', 'discount' |
| pickup_or_dropoff | ENUM | NOT NULL | 'pickup', 'dropoff' |
| address_id | BIGINT UNSIGNED | FK → customer_addresses.id, NULL | |
| scheduled_date | DATE | NULL | |
| scheduled_time_slot | VARCHAR(50) | NULL | |
| status | ENUM | NOT NULL | 'pending', 'scheduled', 'completed', 'cancelled' |
| actual_quantity | INT UNSIGNED | NULL | |
| actual_condition | ENUM | NULL | |
| final_payout | DECIMAL(10,2) | NULL | |
| completed_at | TIMESTAMP | NULL | |
| notes | TEXT | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `repair_orders`
Gallon repair requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| container_id | BIGINT UNSIGNED | FK → containers.id, NULL | |
| issue_description | TEXT | NOT NULL | |
| photos_before | JSON | NULL | Array of photo paths |
| pickup_date | DATE | NULL | |
| inspection_notes | TEXT | NULL | |
| repair_types | JSON | NULL | ['cleaning', 'cap', 'handle'] |
| quoted_price | DECIMAL(10,2) | NULL | |
| approved_at | TIMESTAMP | NULL | |
| status | ENUM | NOT NULL | 'pending', 'received', 'inspecting', 'quoted', 'approved', 'repairing', 'ready', 'delivered', 'cancelled' |
| repaired_by | BIGINT UNSIGNED | FK → users.id, NULL | |
| photos_after | JSON | NULL | |
| completed_at | TIMESTAMP | NULL | |
| final_price | DECIMAL(10,2) | NULL | |
| warranty_until | DATE | NULL | |
| delivered_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `container_rentals`
Container rental agreements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id | |
| container_type | ENUM | NOT NULL | |
| quantity | INT UNSIGNED | NOT NULL | |
| monthly_rate | DECIMAL(10,2) | NOT NULL | |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NULL | |
| status | ENUM | NOT NULL | 'active', 'paused', 'ended' |
| next_billing_date | DATE | NULL | |
| auto_renew | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `trade_ins`
Container trade-in records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| order_id | BIGINT UNSIGNED | FK → orders.id | |
| old_container_type | ENUM | NOT NULL | |
| old_container_condition | ENUM | NOT NULL | |
| trade_value | DECIMAL(10,2) | NOT NULL | |
| new_container_product_id | BIGINT UNSIGNED | FK → container_products.id | |
| discount_applied | DECIMAL(10,2) | NOT NULL | |
| final_price | DECIMAL(10,2) | NOT NULL | |
| created_at | TIMESTAMP | | |

---

## 17. Notifications

### `notifications`
User notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PK | UUID |
| type | VARCHAR(255) | NOT NULL | Notification class |
| notifiable_type | VARCHAR(255) | NOT NULL | Polymorphic |
| notifiable_id | BIGINT UNSIGNED | NOT NULL | |
| data | JSON | NOT NULL | Notification data |
| read_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_notifications_notifiable` (notifiable_type, notifiable_id)
- `idx_notifications_read` (read_at)

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
| loyalty_updates | BOOLEAN | DEFAULT TRUE | |
| subscription_reminders | BOOLEAN | DEFAULT TRUE | |
| quiet_hours_start | TIME | NULL | |
| quiet_hours_end | TIME | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

### `push_subscriptions`
Push notification subscriptions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| user_id | BIGINT UNSIGNED | FK → users.id | |
| endpoint | VARCHAR(500) | NOT NULL | |
| public_key | VARCHAR(255) | NULL | |
| auth_token | VARCHAR(255) | NULL | |
| device_type | ENUM | NULL | 'web', 'ios', 'android' |
| device_name | VARCHAR(100) | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 18. Support

### `support_tickets`
Customer support tickets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| uuid | CHAR(36) | UNIQUE, NOT NULL | |
| ticket_number | VARCHAR(20) | UNIQUE, NOT NULL | "TKT-20260125-001" |
| customer_id | BIGINT UNSIGNED | FK → users.id | |
| station_id | BIGINT UNSIGNED | FK → stations.id, NULL | |
| order_id | BIGINT UNSIGNED | FK → orders.id, NULL | |
| category | ENUM | NOT NULL | 'order_issue', 'refund', 'delivery', 'quality', 'billing', 'other' |
| subject | VARCHAR(255) | NOT NULL | |
| description | TEXT | NOT NULL | |
| priority | ENUM | DEFAULT 'medium' | 'low', 'medium', 'high', 'urgent' |
| status | ENUM | DEFAULT 'open' | 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed' |
| assigned_to | BIGINT UNSIGNED | FK → users.id, NULL | |
| resolved_at | TIMESTAMP | NULL | |
| closed_at | TIMESTAMP | NULL | |
| resolution_notes | TEXT | NULL | |
| satisfaction_rating | TINYINT UNSIGNED | NULL | 1-5 |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:**
- `idx_tickets_customer` (customer_id)
- `idx_tickets_status` (status)
- `idx_tickets_priority` (priority)

---

### `ticket_messages`
Messages within tickets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| ticket_id | BIGINT UNSIGNED | FK → support_tickets.id | |
| sender_id | BIGINT UNSIGNED | FK → users.id | |
| sender_type | ENUM | NOT NULL | 'customer', 'support', 'system' |
| message | TEXT | NOT NULL | |
| attachments | JSON | NULL | Array of file paths |
| is_internal | BOOLEAN | DEFAULT FALSE | Internal note |
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
| content | TEXT | NOT NULL | Markdown |
| excerpt | VARCHAR(500) | NULL | |
| view_count | INT UNSIGNED | DEFAULT 0 | |
| helpful_count | INT UNSIGNED | DEFAULT 0 | |
| not_helpful_count | INT UNSIGNED | DEFAULT 0 | |
| is_featured | BOOLEAN | DEFAULT FALSE | |
| is_published | BOOLEAN | DEFAULT TRUE | |
| published_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## 19. Media & Files

### `media`
Spatie Media Library table

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

**Indexes:**
- `idx_media_model` (model_type, model_id)

---

## 20. Promotions

### `promo_codes`
Promotional/discount codes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK | |
| station_id | BIGINT UNSIGNED | FK → stations.id, NULL | NULL = platform-wide |
| code | VARCHAR(50) | NOT NULL | |
| description | VARCHAR(255) | NULL | |
| discount_type | ENUM | NOT NULL | 'percentage', 'fixed', 'free_delivery' |
| discount_value | DECIMAL(10,2) | NOT NULL | |
| minimum_order | DECIMAL(10,2) | DEFAULT 0.00 | |
| maximum_discount | DECIMAL(10,2) | NULL | Cap for percentage |
| usage_limit | INT UNSIGNED | NULL | Total uses allowed |
| usage_limit_per_customer | INT UNSIGNED | DEFAULT 1 | |
| current_usage | INT UNSIGNED | DEFAULT 0 | |
| applicable_products | JSON | NULL | Product IDs, NULL = all |
| applicable_zones | JSON | NULL | Zone IDs, NULL = all |
| customer_type | ENUM | NULL | NULL = all |
| first_order_only | BOOLEAN | DEFAULT FALSE | |
| starts_at | TIMESTAMP | NOT NULL | |
| ends_at | TIMESTAMP | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Indexes:**
- `idx_promo_code` UNIQUE (station_id, code)
- `idx_promo_active` (is_active, starts_at, ends_at)

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

## Relationships Diagram (Simplified)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   USERS     │────<│STATION_USERS│>────│  STATIONS   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                       │
      │ 1:N                              1:N  │
      ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│  ADDRESSES  │                         │  PRODUCTS   │
└─────────────┘                         └─────────────┘
      │                                       │
      │                                       │
      ▼                                       ▼
┌─────────────────────────────────────────────────────┐
│                      ORDERS                          │
│  (customer_id, station_id, address_id)              │
└─────────────────────────────────────────────────────┘
      │                    │
      │ 1:N                │ 1:N
      ▼                    ▼
┌─────────────┐     ┌─────────────┐
│ ORDER_ITEMS │     │  PAYMENTS   │
└─────────────┘     └─────────────┘
```

---

## Migration Order

Execute migrations in this order to respect foreign key dependencies:

1. `users`
2. `stations`
3. `station_applications`, `station_subscriptions`, `station_users`, `station_verifications`
4. `drivers`, `customer_profiles`
5. `product_categories`, `products`, `product_images`, `product_price_tiers`
6. `zones`, `locations`, `location_units`, `customer_addresses`
7. `delivery_time_slots`
8. `promo_codes`
9. `orders`, `order_items`, `order_status_history`
10. `customer_subscriptions`, `subscription_items`, `subscription_deliveries`
11. `loyalty_programs`, `loyalty_cards`, `loyalty_transactions`, `loyalty_rewards`
12. `delivery_assignments`, `driver_locations`, `driver_zones`
13. `payments`, `customer_wallets`, `wallet_transactions`, `container_deposits`
14. `reviews`, `review_photos`, `review_helpful_votes`, `review_reports`
15. `ad_campaigns`, `ad_creatives`, `ad_placements`, `ad_impressions`, `ad_clicks`
16. `station_posts`, `post_reactions`, `post_comments`, `customer_follows`, `referrals`
17. `badges`, `customer_badges`, `customer_levels`, `challenges`, `challenge_progress`
18. `sms_messages`, `sms_orders`, `product_sms_codes`, `customer_phone_verifications`
19. `qr_codes`, `qr_scans`, `qr_templates`
20. `containers`, `container_history`, `container_products`, `buyback_requests`, `repair_orders`, `container_rentals`, `trade_ins`
21. `notifications`, `notification_preferences`, `push_subscriptions`
22. `support_tickets`, `ticket_messages`, `help_articles`
23. `promo_code_usage`
24. `media`

---

## Notes

### Performance Considerations
- Add indexes for frequently queried columns
- Consider partitioning `orders` by date for large datasets
- Use read replicas for reporting queries
- Archive old `driver_locations`, `ad_impressions` data
- Use Redis for caching frequently accessed data

### Security
- Encrypt sensitive data (payment info)
- Use UUID for public-facing identifiers
- Implement row-level security for multi-tenant data
- Audit logging for sensitive operations

### Scalability
- Consider sharding by `station_id` for horizontal scaling
- Use message queues for async operations
- Implement soft deletes for data recovery
- Plan for data archival strategy

---

*Document created: January 2026*
*Last updated: January 2026*
*Total Tables: 75+*
