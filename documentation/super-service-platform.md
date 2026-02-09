# Super Service Platform - Unified Multi-Vertical Marketplace

## Vision

A single platform that connects customers with multiple local service providers across different industries. One app, one account, multiple services - similar to Grab, Gojek, or Rappi.

**Tagline:** *"Everything you need, delivered."*

---

## Platform Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPER SERVICE PLATFORM                              │
│                     "One App, All Services"                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  💧     │ │  💐     │ │  🧺     │ │  💊     │ │  🐕     │          │
│  │ Water   │ │ Flowers │ │ Laundry │ │Pharmacy │ │  Pets   │          │
│  │ Station │ │  Store  │ │         │ │         │ │         │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  🍱     │ │  🚗     │ │  🧹     │ │  ⛽     │ │  🔧     │          │
│  │  Meal   │ │Car Wash │ │ Home    │ │  Fuel   │ │ Repair  │          │
│  │  Prep   │ │         │ │ Clean   │ │Delivery │ │Services │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     SHARED PLATFORM CORE                          │ │
│  │  • User Management    • Payments      • Delivery Fleet            │ │
│  │  • Location Services  • Notifications • Loyalty & Rewards         │ │
│  │  • Reviews & Ratings  • Support       • Analytics                 │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Philosophy

### 1. Modular Vertical Design

Each service type (water, flowers, laundry, etc.) is a **"Vertical"** - a pluggable module that extends the core platform.

```
Platform Architecture:
├── Core Platform (shared by all)
│   ├── User Management
│   ├── Authentication
│   ├── Payment Processing
│   ├── Delivery Management
│   ├── Location Services
│   ├── Notifications
│   ├── Reviews & Ratings
│   ├── Loyalty Program
│   ├── Support System
│   ├── Analytics
│   └── Admin Dashboard
│
├── Vertical Modules (pluggable)
│   ├── Water Station Vertical
│   ├── Flower Store Vertical
│   ├── Laundry Vertical
│   ├── Pharmacy Vertical
│   ├── Pet Services Vertical
│   ├── Meal Prep Vertical
│   ├── Car Wash Vertical
│   ├── Home Cleaning Vertical
│   ├── Fuel Delivery Vertical
│   └── [Future Verticals...]
│
└── Shared Components
    ├── Subscription Engine
    ├── Booking Engine
    ├── Inventory Management
    ├── QR Code System
    ├── SMS Ordering
    ├── Corporate/B2B Module
    └── Advertising System
```

### 2. One Customer, Many Services

```
Customer Experience:
┌─────────────────────────────────────────────────────────────┐
│  Single Account → Access All Services                       │
│                                                             │
│  • One wallet balance                                       │
│  • One loyalty program (universal points)                   │
│  • One address book                                         │
│  • One payment method saved                                 │
│  • One order history (all services)                         │
│  • One support channel                                      │
│                                                             │
│  Cross-Service Benefits:                                    │
│  • "Order flowers + meal prep for anniversary"              │
│  • "Water refill + laundry pickup same day"                 │
│  • "Pet grooming + buy pet food"                            │
│  • Bundle discounts across services                         │
└─────────────────────────────────────────────────────────────┘
```

### 3. One Merchant, One or Many Verticals

```
Merchant Options:
┌─────────────────────────────────────────────────────────────┐
│  Single Vertical Merchant:                                  │
│  • Water Station only                                       │
│  • Flower Shop only                                         │
│                                                             │
│  Multi-Vertical Merchant:                                   │
│  • Convenience Store: Water + Pharmacy + Pet Supplies       │
│  • Home Services Co: Cleaning + Laundry + Repairs           │
│  • Wellness Hub: Meal Prep + Pharmacy + Pet Food            │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Verticals

### Phase 1: Launch Verticals

| Vertical | Icon | Description | Key Features |
|----------|------|-------------|--------------|
| **Water Station** | 💧 | Water refill delivery | Container tracking, subscriptions, bulk orders |
| **Flower Store** | 💐 | Flower arrangements | Gift orders, occasions, 3D preview, weddings |
| **Laundry** | 🧺 | Laundry & dry cleaning | Pickup/delivery, weight-based, subscriptions |

### Phase 2: Growth Verticals

| Vertical | Icon | Description | Key Features |
|----------|------|-------------|--------------|
| **Pharmacy** | 💊 | Medicine delivery | Prescription upload, refill reminders, health records |
| **Pet Services** | 🐕 | Grooming, boarding, supplies | Pet profiles, vaccination tracking, live cam |
| **Meal Prep** | 🍱 | Healthy meal delivery | Diet plans, macros, weekly subscriptions |

### Phase 3: Expansion Verticals

| Vertical | Icon | Description | Key Features |
|----------|------|-------------|--------------|
| **Car Wash** | 🚗 | Wash & detailing | Mobile service, subscriptions, fleet management |
| **Home Cleaning** | 🧹 | House cleaning services | Booking, recurring, deep clean packages |
| **Fuel Delivery** | ⛽ | Gas/diesel delivery | Fleet accounts, scheduled delivery |
| **Home Repair** | 🔧 | Handyman services | Plumbing, electrical, aircon, appliances |

### Future Verticals

| Vertical | Icon | Description |
|----------|------|-------------|
| **Grocery** | 🛒 | Grocery delivery |
| **Catering** | 🍽️ | Event catering |
| **Beauty/Spa** | 💅 | Salon bookings |
| **Tutoring** | 📚 | Education services |
| **Moving** | 📦 | Moving & logistics |

---

## Core Platform Modules

### Module 1: User Management

```
Unified User System:
├── Customer Accounts
│   ├── Single sign-up for all services
│   ├── Profile (name, photo, preferences)
│   ├── Universal address book
│   ├── Saved payment methods
│   ├── Service preferences per vertical
│   └── Family/household accounts
│
├── Merchant Accounts
│   ├── Business registration
│   ├── Multi-vertical capability
│   ├── Staff management
│   ├── Custom role creation (see Module 9)
│   ├── Role-based permissions (customizable)
│   └── Verification levels
│
├── Service Provider Accounts
│   ├── Drivers/delivery personnel
│   ├── Technicians/specialists
│   ├── Freelance service providers
│   ├── Custom provider roles
│   └── Skill-based matching
│
├── Admin Accounts
│   ├── Super admin (platform)
│   ├── Vertical admins
│   ├── Support staff
│   └── Custom admin roles (platform level)
│
└── Role & Permission Features
    ├── Create custom roles per merchant
    ├── Assign granular permissions
    ├── Role inheritance (from parent roles)
    ├── Scoped access (by merchant/location/vertical)
    ├── Temporary role assignments
    └── Full audit trail
    (See Module 9 for complete role management)
```

### Module 2: Universal Wallet & Payments

```
Payment System:
├── Customer Wallet
│   ├── Single balance for all services
│   ├── Top-up via multiple methods
│   ├── Auto-reload option
│   ├── Send to other users
│   └── Cashback deposits
│
├── Payment Methods
│   ├── Cash on delivery
│   ├── E-wallets (GCash, Maya)
│   ├── Credit/Debit cards
│   ├── Bank transfer
│   ├── PayPal
│   └── Buy now, pay later
│
├── Merchant Payouts
│   ├── Daily/weekly settlements
│   ├── Commission deductions
│   ├── Invoice generation
│   └── Tax reporting
│
└── Financial Features
    ├── Split payments
    ├── Tipping
    ├── Refunds
    └── Dispute resolution
```

### Module 3: Universal Delivery Fleet

```
Delivery Management:
├── Fleet Types
│   ├── Motorcycle (small items)
│   ├── Car (medium, fragile items)
│   ├── Van (large items, bulk)
│   ├── Truck (heavy, commercial)
│   └── Bicycle (eco-friendly, nearby)
│
├── Driver Pool
│   ├── Platform drivers (employed)
│   ├── Merchant drivers (shop-owned)
│   ├── Freelance drivers (gig)
│   └── Specialized (medical, hazmat)
│
├── Smart Assignment
│   ├── Multi-stop optimization
│   ├── Skill matching (flowers need care)
│   ├── Vehicle matching (size, type)
│   ├── Zone-based assignment
│   └── Load balancing
│
├── Cross-Vertical Delivery
│   ├── "Pick up laundry + deliver water" same trip
│   ├── Bundle delivery discount
│   └── Efficient routing
│
└── Tracking & Communication
    ├── Real-time GPS tracking
    ├── ETA updates
    ├── In-app chat
    ├── Photo confirmation
    └── Digital signature
```

### Module 4: Universal Loyalty Program

```
Cross-Platform Loyalty:
├── Universal Points
│   ├── Earn from any vertical
│   ├── Redeem across all services
│   ├── Points never expire (gold+)
│   └── Bonus events
│
├── Membership Tiers
│   ├── Bronze: Basic benefits
│   ├── Silver: 5% bonus points
│   ├── Gold: 10% bonus, free delivery
│   ├── Platinum: 15% bonus, priority support
│   └── VIP: Exclusive perks
│
├── Tier Calculation
│   ├── Based on total spend across ALL verticals
│   ├── Monthly/yearly evaluation
│   └── Tier protection period
│
├── Cross-Vertical Rewards
│   ├── "Order 5x any service = free delivery"
│   ├── Bundle rewards
│   ├── Birthday rewards (all services)
│   └── Anniversary rewards
│
└── Partner Rewards
    ├── Airline miles conversion
    ├── Hotel points
    └── Retail partners
```

### Module 5: Universal Subscription Engine

```
Subscription System:
├── Single-Vertical Subscriptions
│   ├── Water: Weekly refill
│   ├── Flowers: Monthly delivery
│   ├── Laundry: Weekly pickup
│   ├── Meals: Daily/weekly plans
│   └── Car wash: Monthly unlimited
│
├── Multi-Vertical Bundles
│   ├── "Home Essentials": Water + Cleaning + Laundry
│   ├── "Pet Parent": Grooming + Food + Vet
│   ├── "Wellness": Meals + Pharmacy + Cleaning
│   ├── "Auto Care": Car wash + Fuel + Repairs
│   └── Custom bundles
│
├── Subscription Management
│   ├── Unified billing date
│   ├── Pause all / pause individual
│   ├── Skip deliveries
│   ├── Upgrade/downgrade
│   └── Family sharing
│
└── Subscription Discounts
    ├── Bundle discount (10-20%)
    ├── Annual payment discount
    └── Loyalty tier discounts
```

### Module 6: Universal Location Services

```
Location Management:
├── Customer Addresses
│   ├── Single address book for all services
│   ├── Home, office, others
│   ├── Recipient addresses (for gifts)
│   └── Temporary addresses
│
├── Service Area Management
│   ├── Platform-wide zones
│   ├── Vertical-specific coverage
│   ├── Merchant-specific areas
│   └── Dynamic expansion
│
├── Location Intelligence
│   ├── "Services available at this address"
│   ├── Delivery time estimates
│   ├── Coverage gaps identification
│   └── Demand heatmaps
│
└── Maps Integration
    ├── Address autocomplete
    ├── Pin drop
    ├── Polygon zone drawing
    └── Route optimization
```

### Module 7: Universal Review System

```
Reviews & Ratings:
├── Unified Review Display
│   ├── Overall merchant rating
│   ├── Per-vertical ratings
│   ├── Per-service ratings
│   └── Driver ratings
│
├── Review Categories
│   ├── Product/service quality
│   ├── Delivery experience
│   ├── Value for money
│   ├── Communication
│   └── Vertical-specific criteria
│
├── Trust System
│   ├── Verified purchase badge
│   ├── Photo reviews
│   ├── Video reviews
│   ├── Helpful votes
│   └── Reviewer levels
│
└── Merchant Response
    ├── Reply to reviews
    ├── Issue resolution
    └── Review analytics
```

### Module 8: Universal Support System

```
Customer Support:
├── Unified Ticket System
│   ├── Single support channel
│   ├── Auto-route to vertical team
│   ├── Cross-vertical issues
│   └── Escalation paths
│
├── Support Channels
│   ├── In-app chat
│   ├── Phone hotline
│   ├── Email
│   ├── Social media
│   └── Help center
│
├── Self-Service
│   ├── FAQ per vertical
│   ├── Order issues (cancel, refund)
│   ├── Account management
│   └── Chatbot assistance
│
└── Merchant Support
    ├── Dedicated account managers
    ├── Onboarding assistance
    └── Technical support
```

### Module 9: Custom Role & Permission Management

```
Role & Permission System:
├── Role Levels (Hierarchy)
│   ├── Platform Level
│   │   ├── Super Admin (full system access)
│   │   ├── Platform Admin (manage all merchants/verticals)
│   │   ├── Vertical Admin (manage specific vertical)
│   │   ├── Support Admin (customer support)
│   │   ├── Finance Admin (payments, payouts)
│   │   └── Custom Platform Roles...
│   │
│   ├── Merchant Level
│   │   ├── Merchant Owner (full merchant access)
│   │   ├── Store Manager (operations)
│   │   ├── Inventory Manager
│   │   ├── Order Manager
│   │   ├── Finance Manager
│   │   ├── Staff (limited access)
│   │   └── Custom Merchant Roles...
│   │
│   └── Service Provider Level
│       ├── Driver Lead
│       ├── Driver
│       ├── Technician Lead
│       ├── Technician
│       └── Custom Provider Roles...
│
├── Permission Categories
│   ├── User Management
│   │   ├── users.view
│   │   ├── users.create
│   │   ├── users.update
│   │   ├── users.delete
│   │   ├── users.assign_roles
│   │   └── users.manage_permissions
│   │
│   ├── Role Management
│   │   ├── roles.view
│   │   ├── roles.create
│   │   ├── roles.update
│   │   ├── roles.delete
│   │   └── roles.assign_permissions
│   │
│   ├── Merchant Management
│   │   ├── merchants.view
│   │   ├── merchants.create
│   │   ├── merchants.update
│   │   ├── merchants.delete
│   │   ├── merchants.verify
│   │   └── merchants.suspend
│   │
│   ├── Product Management
│   │   ├── products.view
│   │   ├── products.create
│   │   ├── products.update
│   │   ├── products.delete
│   │   ├── products.publish
│   │   └── products.manage_pricing
│   │
│   ├── Order Management
│   │   ├── orders.view
│   │   ├── orders.view_own (scoped)
│   │   ├── orders.create
│   │   ├── orders.update
│   │   ├── orders.cancel
│   │   ├── orders.refund
│   │   └── orders.assign_driver
│   │
│   ├── Inventory Management
│   │   ├── inventory.view
│   │   ├── inventory.update
│   │   ├── inventory.adjust
│   │   └── inventory.transfer
│   │
│   ├── Financial Permissions
│   │   ├── finance.view_reports
│   │   ├── finance.manage_payouts
│   │   ├── finance.process_refunds
│   │   ├── finance.view_transactions
│   │   └── finance.manage_pricing
│   │
│   ├── Delivery Management
│   │   ├── delivery.view
│   │   ├── delivery.assign
│   │   ├── delivery.reassign
│   │   ├── delivery.manage_drivers
│   │   └── delivery.manage_zones
│   │
│   ├── Support Permissions
│   │   ├── support.view_tickets
│   │   ├── support.respond_tickets
│   │   ├── support.escalate
│   │   └── support.resolve
│   │
│   ├── Analytics & Reports
│   │   ├── analytics.view_dashboard
│   │   ├── analytics.view_sales
│   │   ├── analytics.view_customers
│   │   ├── analytics.export_reports
│   │   └── analytics.view_all_merchants
│   │
│   ├── Settings & Configuration
│   │   ├── settings.view
│   │   ├── settings.update
│   │   ├── settings.manage_verticals
│   │   └── settings.manage_integrations
│   │
│   └── Vertical-Specific Permissions
│       ├── water.manage_containers
│       ├── water.manage_stations
│       ├── flower.manage_occasions
│       ├── flower.manage_arrangements
│       ├── laundry.manage_services
│       ├── pharmacy.manage_prescriptions
│       ├── pet.manage_appointments
│       └── [vertical].[specific_action]
│
├── Role Builder Interface
│   ├── Create New Role
│   │   ├── Role name (custom)
│   │   ├── Role description
│   │   ├── Role level (platform/merchant/provider)
│   │   ├── Inherit from existing role (optional)
│   │   └── Select permissions (checkbox tree)
│   │
│   ├── Permission Presets
│   │   ├── "Read Only" preset
│   │   ├── "Full Access" preset
│   │   ├── "Manager" preset
│   │   └── Custom preset creation
│   │
│   ├── Role Templates
│   │   ├── Copy from existing role
│   │   ├── Industry templates
│   │   └── Vertical-specific templates
│   │
│   └── Role Restrictions
│       ├── Cannot exceed own permission level
│       ├── Cannot create higher-level roles
│       └── Certain permissions reserved for super admin
│
├── User-Role Assignment
│   ├── Assign Roles to Users
│   │   ├── Single role assignment
│   │   ├── Multiple roles (combined permissions)
│   │   ├── Time-limited roles (temporary access)
│   │   └── Conditional roles (by vertical/merchant)
│   │
│   ├── Bulk Operations
│   │   ├── Assign role to multiple users
│   │   ├── Remove role from multiple users
│   │   └── Import/export assignments
│   │
│   └── Role Inheritance
│       ├── Child roles inherit parent permissions
│       ├── Override specific permissions
│       └── Block specific permissions
│
├── Permission Scoping
│   ├── Global Scope
│   │   └── Access across entire platform
│   │
│   ├── Merchant Scope
│   │   ├── Access limited to own merchant
│   │   └── Multi-merchant access (franchises)
│   │
│   ├── Vertical Scope
│   │   └── Access limited to specific verticals
│   │
│   ├── Location Scope
│   │   ├── Access limited to specific zones
│   │   └── Regional access control
│   │
│   └── Data Scope
│       ├── Own data only
│       ├── Team data
│       └── All data
│
├── Audit & Compliance
│   ├── Permission Change Logs
│   │   ├── Who changed what
│   │   ├── When changed
│   │   ├── Before/after values
│   │   └── Reason for change
│   │
│   ├── Role Assignment History
│   │   ├── Role assignment/removal logs
│   │   ├── Temporary role expirations
│   │   └── Bulk operation logs
│   │
│   ├── Access Logs
│   │   ├── Who accessed what
│   │   ├── Permission denials logged
│   │   └── Sensitive action tracking
│   │
│   └── Compliance Reports
│       ├── Permission matrix report
│       ├── User access report
│       └── Orphaned permissions check
│
└── Security Features
    ├── Two-Factor for Sensitive Roles
    ├── Session Management by Role
    ├── IP Restrictions by Role
    ├── Permission Expiration
    └── Emergency Role Revocation
```

#### Role Builder UI Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Settings > User Management > Roles                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  EXISTING ROLES                                    [+ Create New Role]  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Role Name           │ Level      │ Users │ Permissions │ Actions│   │
│  │─────────────────────│────────────│───────│─────────────│────────│   │
│  │ Super Admin         │ Platform   │ 2     │ All         │ 👁️     │   │
│  │ Platform Admin      │ Platform   │ 5     │ 156         │ ✏️ 👁️  │   │
│  │ Merchant Owner      │ Merchant   │ 500+  │ 89          │ ✏️ 👁️  │   │
│  │ Store Manager       │ Merchant   │ 1200+ │ 67          │ ✏️ 👁️  │   │
│  │ Inventory Staff     │ Merchant   │ 800+  │ 23          │ ✏️ 👁️  │   │
│  │ >> Custom Role 1    │ Merchant   │ 45    │ 34          │ ✏️ 🗑️ 👁️│   │
│  │ >> Custom Role 2    │ Merchant   │ 12    │ 51          │ ✏️ 🗑️ 👁️│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ✏️ Create/Edit Role                                          [Save]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Role Name: [___Shift Supervisor___________________]                   │
│  Description: [___Manages daily operations and staff_]                 │
│  Level: [Merchant ▼]                                                   │
│  Inherit From: [Store Manager ▼] (optional)                            │
│                                                                         │
│  PERMISSIONS                                      [Expand All] [Presets]│
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ▼ User Management                                               │   │
│  │   ☑️ users.view                                                  │   │
│  │   ☑️ users.create (staff only)                                   │   │
│  │   ☐ users.delete                                                 │   │
│  │   ☐ users.assign_roles                                           │   │
│  │                                                                   │   │
│  │ ▼ Order Management                                               │   │
│  │   ☑️ orders.view                                                  │   │
│  │   ☑️ orders.update                                                │   │
│  │   ☑️ orders.cancel                                                │   │
│  │   ☐ orders.refund                                                 │   │
│  │                                                                   │   │
│  │ ▼ Inventory Management                                           │   │
│  │   ☑️ inventory.view                                               │   │
│  │   ☑️ inventory.update                                             │   │
│  │   ☐ inventory.adjust                                              │   │
│  │                                                                   │   │
│  │ ▶ Financial (collapsed)                                          │   │
│  │ ▶ Analytics (collapsed)                                          │   │
│  │ ▶ Delivery (collapsed)                                           │   │
│  │ ▶ Water Station Specific (collapsed)                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Cancel]                                                    [Save Role]│
└─────────────────────────────────────────────────────────────────────────┘
```

#### User Assignment Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  👤 User: Juan dela Cruz                              [Edit User]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ASSIGNED ROLES                                      [+ Assign Role]    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Role              │ Scope           │ Expires    │ Actions       │   │
│  │───────────────────│─────────────────│────────────│───────────────│   │
│  │ Store Manager     │ Aqua Pure BGC   │ Never      │ [Remove]      │   │
│  │ Shift Supervisor  │ Aqua Pure Makati│ Never      │ [Remove]      │   │
│  │ Inventory Staff   │ All Locations   │ Mar 2026   │ [Remove][Ext] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  EFFECTIVE PERMISSIONS (Combined from all roles)                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✓ users.view              ✓ orders.view         ✓ inventory.view│   │
│  │ ✓ users.create            ✓ orders.update       ✓ inventory.updt│   │
│  │ ✗ users.delete            ✓ orders.cancel       ✗ inventory.adj │   │
│  │ ✗ users.assign_roles      ✗ orders.refund       ...              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ACTIVITY LOG                                                          │
│  • Jan 25, 2026 - Role "Inventory Staff" assigned by Admin             │
│  • Jan 20, 2026 - Role "Shift Supervisor" assigned by Admin            │
│  • Jan 15, 2026 - Role "Store Manager" assigned by Admin               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Database Schema for Roles & Permissions

```sql
-- Roles table
roles:
  - id: BIGINT UNSIGNED PK
  - uuid: CHAR(36) UNIQUE
  - name: VARCHAR(100)
  - slug: VARCHAR(100) UNIQUE
  - description: TEXT NULL
  - level: ENUM('platform', 'merchant', 'provider')
  - is_system: BOOLEAN DEFAULT FALSE -- System roles can't be deleted
  - parent_role_id: BIGINT NULL FK -- For inheritance
  - merchant_id: BIGINT NULL FK -- NULL for platform roles
  - metadata: JSON NULL
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP
  - deleted_at: TIMESTAMP NULL

-- Permissions table
permissions:
  - id: BIGINT UNSIGNED PK
  - name: VARCHAR(100)
  - slug: VARCHAR(100) UNIQUE -- e.g., "orders.view"
  - description: TEXT NULL
  - category: VARCHAR(50) -- e.g., "orders", "users", "inventory"
  - is_sensitive: BOOLEAN DEFAULT FALSE
  - requires_2fa: BOOLEAN DEFAULT FALSE
  - vertical: VARCHAR(50) NULL -- NULL for core, 'water', 'flower', etc.
  - created_at: TIMESTAMP

-- Role-Permission pivot
role_permissions:
  - role_id: BIGINT FK
  - permission_id: BIGINT FK
  - granted_at: TIMESTAMP
  - granted_by: BIGINT FK (users)
  - PRIMARY KEY (role_id, permission_id)

-- User-Role pivot with scoping
user_roles:
  - id: BIGINT UNSIGNED PK
  - user_id: BIGINT FK
  - role_id: BIGINT FK
  - scope_type: ENUM('global', 'merchant', 'location', 'vertical')
  - scope_id: BIGINT NULL -- merchant_id, location_id, etc.
  - expires_at: TIMESTAMP NULL
  - assigned_by: BIGINT FK (users)
  - assigned_at: TIMESTAMP
  - revoked_at: TIMESTAMP NULL
  - revoked_by: BIGINT NULL FK
  - UNIQUE (user_id, role_id, scope_type, scope_id)

-- Direct user permissions (overrides)
user_permissions:
  - id: BIGINT UNSIGNED PK
  - user_id: BIGINT FK
  - permission_id: BIGINT FK
  - type: ENUM('grant', 'deny') -- Can explicitly deny
  - scope_type: ENUM('global', 'merchant', 'location', 'vertical')
  - scope_id: BIGINT NULL
  - granted_by: BIGINT FK
  - expires_at: TIMESTAMP NULL
  - created_at: TIMESTAMP

-- Permission audit log
permission_audit_logs:
  - id: BIGINT UNSIGNED PK
  - user_id: BIGINT FK -- User affected
  - actor_id: BIGINT FK -- Who made the change
  - action: ENUM('role_assigned', 'role_removed', 'permission_granted',
                 'permission_denied', 'role_created', 'role_updated',
                 'role_deleted', 'permission_expired')
  - target_type: ENUM('role', 'permission')
  - target_id: BIGINT
  - old_value: JSON NULL
  - new_value: JSON NULL
  - reason: TEXT NULL
  - ip_address: VARCHAR(45)
  - user_agent: TEXT
  - created_at: TIMESTAMP

-- Role templates (for quick setup)
role_templates:
  - id: BIGINT UNSIGNED PK
  - name: VARCHAR(100)
  - description: TEXT NULL
  - level: ENUM('platform', 'merchant', 'provider')
  - vertical: VARCHAR(50) NULL
  - permissions: JSON -- Array of permission slugs
  - is_active: BOOLEAN DEFAULT TRUE
  - created_at: TIMESTAMP
```

---

## Database Architecture

### Multi-Tenant with Verticals

```
Database Strategy:
├── Shared Tables (Core)
│   ├── users
│   ├── merchants (with vertical_types JSON)
│   ├── addresses
│   ├── payments
│   ├── wallets
│   ├── loyalty_points
│   ├── reviews
│   ├── notifications
│   ├── support_tickets
│   └── ...
│
├── Vertical-Specific Tables
│   ├── water_* (water station tables)
│   ├── flower_* (flower store tables)
│   ├── laundry_* (laundry tables)
│   ├── pharmacy_* (pharmacy tables)
│   ├── pet_* (pet services tables)
│   └── ...
│
└── Polymorphic Relationships
    ├── orders → orderable (water_order, flower_order, etc.)
    ├── products → productable
    ├── subscriptions → subscribable
    └── ...
```

### Key Shared Tables

```sql
-- Users with role support
users:
  - id
  - uuid
  - email
  - password
  - name
  - phone
  - status: ENUM ('active', 'inactive', 'suspended')
  - user_type: ENUM ('customer', 'merchant_staff', 'driver', 'admin')
  - email_verified_at
  - ...

-- Roles for custom role management
roles:
  - id
  - uuid
  - name
  - slug (unique identifier)
  - description
  - level: ENUM ('platform', 'merchant', 'provider')
  - is_system: BOOLEAN (system roles can't be deleted)
  - parent_role_id: FK (for inheritance)
  - merchant_id: FK NULL (NULL for platform-level roles)
  - ...

-- Granular permissions
permissions:
  - id
  - name
  - slug: VARCHAR (e.g., 'orders.view', 'users.create')
  - category: VARCHAR (e.g., 'orders', 'users', 'inventory')
  - vertical: VARCHAR NULL (NULL for core, 'water', 'flower', etc.)
  - is_sensitive: BOOLEAN
  - ...

-- Role-Permission assignment
role_permissions:
  - role_id: FK
  - permission_id: FK
  - granted_by: FK (users)

-- User-Role assignment with scoping
user_roles:
  - user_id: FK
  - role_id: FK
  - scope_type: ENUM ('global', 'merchant', 'location', 'vertical')
  - scope_id: BIGINT NULL (merchant_id, location_id, etc.)
  - expires_at: TIMESTAMP NULL (for temporary roles)
  - assigned_by: FK (users)

-- Merchants can have multiple verticals
merchants:
  - id
  - uuid
  - name
  - slug
  - enabled_verticals: JSON ['water', 'pharmacy', 'pet']
  - primary_vertical: ENUM
  - ...

-- Unified orders with vertical reference
orders:
  - id
  - uuid
  - order_number
  - customer_id
  - merchant_id
  - vertical: ENUM ('water', 'flower', 'laundry', ...)
  - vertical_order_id: FK to vertical-specific order
  - ...

-- Products with vertical type
products:
  - id
  - merchant_id
  - vertical: ENUM
  - product_type: VARCHAR (vertical-specific)
  - ...

-- Universal subscriptions
subscriptions:
  - id
  - customer_id
  - subscription_type: ENUM ('single', 'bundle')
  - verticals: JSON (for bundles)
  - ...
```

---

## Customer App Experience

### Home Screen

```
┌─────────────────────────────────────────────────────────────┐
│  📍 Home • BGC, Taguig                    🔔 💬 👤         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Good morning, Juan! ☀️                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Search for services, products, or merchants...   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  YOUR SERVICES                                              │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │
│  │  💧   │ │  🧺   │ │  🍱   │ │  🐕   │ │  ➕   │       │
│  │ Water │ │Laundry│ │ Meals │ │  Pet  │ │ More  │       │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘       │
│                                                             │
│  ACTIVE SUBSCRIPTIONS                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💧 Water Refill          Next: Tomorrow, 2-4 PM     │   │
│  │ 🧺 Laundry Pickup        Next: Friday, 9 AM         │   │
│  │ 🍱 Meal Plan             Next: Daily delivery       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  RECENT ORDERS                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💐 Flower delivery       Delivered ✓    [Reorder]   │   │
│  │ 🚗 Car wash              Completed ✓    [Book]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  RECOMMENDED FOR YOU                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
│  │ 🧹      │ │ 💊      │ │ ⛽      │                      │
│  │ Home    │ │ Order   │ │ Fuel    │                      │
│  │ Clean   │ │ Meds    │ │ Delivery│                      │
│  │ 20% off │ │ Refill  │ │ New!    │                      │
│  └─────────┘ └─────────┘ └─────────┘                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🏠 Home    📋 Orders    💳 Wallet    ⭐ Rewards    👤 Me  │
└─────────────────────────────────────────────────────────────┘
```

### Unified Cart (Cross-Vertical)

```
┌─────────────────────────────────────────────────────────────┐
│  🛒 Your Cart                                    [Clear]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💧 WATER STATION - Aqua Pure                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3x 5-Gallon Purified Water           ₱120          │   │
│  │ Container deposit                     ₱0 (exchange) │   │
│  │ Delivery: Tomorrow 2-4 PM                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💐 FLOWERS - Petals & Blooms                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 12 Red Roses Bouquet                  ₱1,200       │   │
│  │ Add-on: Chocolates                    ₱250         │   │
│  │ 📍 Deliver to: Mom (Different address)             │   │
│  │ 📅 Delivery: Feb 14, 10 AM (Valentine's)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🧺 LAUNDRY - Fresh & Clean                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pickup: ~5kg mixed laundry            ₱250         │   │
│  │ Service: Wash + Fold                               │   │
│  │ Pickup: Tomorrow 9 AM                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  💡 BUNDLE DELIVERY AVAILABLE!                             │
│  Water + Laundry pickup same trip: Save ₱30                │
│  [Apply Bundle]                                             │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  Subtotal                                ₱1,820            │
│  Delivery (3 services)                   ₱90               │
│  Bundle Discount                         -₱30              │
│  ─────────────────────────────────────────────────────     │
│  TOTAL                                   ₱1,880            │
│                                                             │
│  [💳 Pay with Wallet: ₱2,500 balance]                      │
│                                                             │
│  [Place Order]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Unified Order Tracking

```
┌─────────────────────────────────────────────────────────────┐
│  📋 My Orders                               [Filter ▼]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TODAY                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💧 Water Refill              Out for Delivery 🚚    │   │
│  │ Order #WS-12345 • Aqua Pure                         │   │
│  │ ETA: 15 minutes                    [Track]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🧺 Laundry Pickup            Driver Assigned 👤     │   │
│  │ Order #LN-12346 • Fresh & Clean                     │   │
│  │ Pickup: 9:00 AM                    [Track]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  UPCOMING                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💐 Flower Delivery           Scheduled 📅           │   │
│  │ Order #FL-12347 • Feb 14, 10 AM                     │   │
│  │ To: Mom (Makati)                   [View]           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  PAST ORDERS                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🚗 Car Wash                  Completed ✓            │   │
│  │ 🍱 Meal Delivery             Completed ✓            │   │
│  │ 💊 Medicine Order            Completed ✓            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Merchant Dashboard

### Multi-Vertical Merchant View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏪 Juan's Convenience Hub                    [Switch Vertical ▼]       │
│  Verticals: 💧 Water | 💊 Pharmacy | 🐕 Pet Supplies                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TODAY'S OVERVIEW (All Verticals)                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ ₱12,450     │ │ 45          │ │ 3           │ │ 4.8 ⭐      │       │
│  │ Revenue     │ │ Orders      │ │ Pending     │ │ Rating      │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                                         │
│  REVENUE BY VERTICAL                                                    │
│  💧 Water:    ₱5,200 (42%)  ████████████░░░░░░░░░░                     │
│  💊 Pharmacy: ₱4,800 (38%)  ██████████░░░░░░░░░░░░                     │
│  🐕 Pet:      ₱2,450 (20%)  █████░░░░░░░░░░░░░░░░░                     │
│                                                                         │
│  PENDING ORDERS                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💧 #WS-123  3x 5-Gal Water     Juan D.    BGC        [Accept]   │   │
│  │ 💊 #PH-456  Paracetamol 500mg  Maria S.   Makati     [Accept]   │   │
│  │ 🐕 #PT-789  Dog Food 10kg      Pedro R.   Taguig     [Accept]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  QUICK ACTIONS                                                          │
│  [+ Add Product]  [📦 Inventory]  [📊 Reports]  [⚙️ Settings]          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Revenue Model

### Platform Revenue Streams

| Stream | Description | Rate |
|--------|-------------|------|
| **Commission** | Per transaction | 10-20% by vertical |
| **Subscription** | Merchant monthly fee | ₱500-5,000/month |
| **Delivery Fee** | Platform delivery | ₱20-100 per order |
| **Advertising** | Featured listings, banners | CPC/CPM |
| **Premium Features** | Analytics, priority support | ₱1,000+/month |
| **Payment Processing** | Transaction fees | 1-2% |
| **Corporate Services** | B2B accounts | Custom pricing |

### Commission by Vertical

| Vertical | Commission | Rationale |
|----------|------------|-----------|
| Water Station | 10% | Low margin, high volume |
| Flowers | 15% | Higher margin, occasion-based |
| Laundry | 15% | Service-based, recurring |
| Pharmacy | 8% | Regulated, low margin |
| Pet Services | 18% | Premium service, emotional |
| Meal Prep | 15% | Food service standard |
| Car Wash | 15% | Service-based |
| Home Cleaning | 20% | High value services |
| Fuel Delivery | 5% | Very low margin, convenience |
| Home Repair | 20% | High value, skilled service |

---

## Technical Architecture

### Microservices Approach

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│                    (Authentication, Rate Limiting)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│ User Service  │           │ Order Service │           │Payment Service│
│               │           │               │           │               │
│ - Auth        │           │ - Order mgmt  │           │ - Wallet      │
│ - Profiles    │           │ - Cart        │           │ - Transactions│
│ - Addresses   │           │ - History     │           │ - Payouts     │
└───────────────┘           └───────────────┘           └───────────────┘
        │                           │                           │
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│Delivery Svc   │           │ Merchant Svc  │           │Notification   │
│               │           │               │           │Service        │
│ - Fleet mgmt  │           │ - Profiles    │           │ - Push        │
│ - Tracking    │           │ - Products    │           │ - SMS         │
│ - Assignment  │           │ - Inventory   │           │ - Email       │
└───────────────┘           └───────────────┘           └───────────────┘
        │                           │                           │
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        VERTICAL SERVICES                               │
├───────────┬───────────┬───────────┬───────────┬───────────┬──────────┤
│  Water    │  Flower   │  Laundry  │ Pharmacy  │   Pet     │   ...    │
│  Service  │  Service  │  Service  │  Service  │  Service  │          │
└───────────┴───────────┴───────────┴───────────┴───────────┴──────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHARED DATABASES                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Users   │  │ Orders  │  │Payments │  │Merchants│  │ Cache   │      │
│  │ (MySQL) │  │ (MySQL) │  │ (MySQL) │  │ (MySQL) │  │ (Redis) │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend API** | Laravel 12 (monolith initially, microservices later) |
| **Frontend Web** | Next.js 16 |
| **Mobile** | React Native (or Flutter) |
| **Database** | MySQL 8 (primary), Redis (cache), Elasticsearch (search) |
| **Queue** | RabbitMQ / Laravel Horizon |
| **Storage** | S3-compatible (images, documents) |
| **Maps** | Google Maps / Mapbox |
| **Payments** | PayMongo, GCash, Maya APIs |
| **SMS** | Semaphore, Twilio |
| **Push** | Firebase Cloud Messaging |
| **Analytics** | Custom + Google Analytics |
| **Monitoring** | Laravel Telescope, Sentry |

---

## Implementation Phases

### Phase 1: Foundation (Months 1-3)

```
Core Platform:
├── [ ] User management (customers, merchants, admins)
├── [ ] Authentication (multi-role)
├── [ ] Universal address book
├── [ ] Basic payment processing
├── [ ] Notification system
├── [ ] Basic delivery management
└── [ ] Admin dashboard

First Vertical - Water Station:
├── [ ] Port existing water station module
├── [ ] Merchant onboarding
├── [ ] Product management
├── [ ] Order flow
├── [ ] Subscriptions
└── [ ] QR codes
```

### Phase 2: Second Vertical (Months 4-5)

```
Add Flower Store:
├── [ ] Port existing flower store module
├── [ ] Gift/recipient system
├── [ ] Occasion management
├── [ ] 3D visualization
└── [ ] Wedding services

Platform Enhancements:
├── [ ] Universal wallet
├── [ ] Loyalty program
├── [ ] Review system
└── [ ] Basic analytics
```

### Phase 3: Third Vertical (Months 6-7)

```
Add Laundry Vertical:
├── [ ] Laundry-specific features
├── [ ] Weight-based pricing
├── [ ] Pickup scheduling
├── [ ] Item tracking
└── [ ] Subscription plans

Platform Enhancements:
├── [ ] Cross-vertical cart
├── [ ] Bundle delivery
├── [ ] SMS ordering
└── [ ] Corporate accounts
```

### Phase 4: Growth (Months 8-12)

```
Add More Verticals:
├── [ ] Pharmacy
├── [ ] Pet Services
├── [ ] Meal Prep

Platform Scaling:
├── [ ] Mobile apps (iOS/Android)
├── [ ] Advanced analytics
├── [ ] Advertising system
├── [ ] API for third parties
└── [ ] Multi-city expansion
```

### Phase 5: Expansion (Year 2)

```
Additional Verticals:
├── [ ] Car Wash
├── [ ] Home Cleaning
├── [ ] Fuel Delivery
├── [ ] Home Repair

Advanced Features:
├── [ ] AI recommendations
├── [ ] Predictive ordering
├── [ ] Voice ordering
├── [ ] International expansion
```

---

## MVP Feature List

### Must Have (MVP)

| Feature | Priority |
|---------|----------|
| Customer registration/login | P0 |
| Merchant registration/onboarding | P0 |
| Product catalog | P0 |
| Basic ordering | P0 |
| Payment (COD + 1 e-wallet) | P0 |
| Delivery assignment | P0 |
| Order tracking | P0 |
| Basic notifications | P0 |
| 1-2 verticals working | P0 |

### Should Have (Post-MVP)

| Feature | Priority |
|---------|----------|
| Universal wallet | P1 |
| Subscriptions | P1 |
| Loyalty program | P1 |
| Reviews | P1 |
| Cross-vertical cart | P1 |
| SMS ordering | P1 |
| Mobile apps | P1 |

### Nice to Have (Future)

| Feature | Priority |
|---------|----------|
| 3D visualization | P2 |
| AI recommendations | P2 |
| Voice ordering | P2 |
| AR features | P2 |
| Social features | P2 |

---

## Success Metrics

### Platform KPIs

| Metric | Target (Year 1) |
|--------|-----------------|
| Registered Customers | 50,000+ |
| Active Merchants | 500+ |
| Monthly Orders | 100,000+ |
| GMV (Gross Merchandise Value) | ₱50M+/month |
| Customer Retention | 40%+ |
| Merchant Retention | 80%+ |
| Average Order Value | ₱500+ |
| Orders per Customer/Month | 3+ |

### Vertical KPIs

| Vertical | Orders/Month Target |
|----------|---------------------|
| Water | 30,000 |
| Flowers | 10,000 |
| Laundry | 20,000 |
| Pharmacy | 15,000 |
| Pet | 8,000 |
| Others | 17,000 |

---

## Competitive Advantage

| Advantage | Description |
|-----------|-------------|
| **All-in-One** | No need for 10 different apps |
| **Universal Loyalty** | Points work everywhere |
| **Bundle Savings** | Discounts for multi-service |
| **Single Wallet** | One balance for all |
| **Smart Delivery** | Efficient multi-stop routes |
| **Unified Support** | One place for all issues |
| **Data Synergy** | Better recommendations |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Complexity | Start with 2-3 verticals, add gradually |
| Merchant adoption | Strong onboarding, low initial fees |
| Customer confusion | Clear UI/UX, service categories |
| Delivery logistics | Partner with existing fleets initially |
| Cash flow | Commission-based model, quick settlements |
| Competition | Focus on integration, not single vertical |

---

## Naming Suggestions

| Name | Tagline |
|------|---------|
| **ServeAll** | "Everything you need, delivered" |
| **OneStop** | "Your life, simplified" |
| **HubLife** | "All services, one hub" |
| **EasyGo** | "Go easy on life" |
| **AllServe** | "We serve all" |
| **LifeHub** | "Your daily life hub" |
| **QuickAll** | "Quick everything" |

---

*Document created: January 2026*
*Platform Type: Multi-Vertical Service Marketplace*
*Estimated MVP Timeline: 3-4 months*
*Estimated Full Platform: 12-18 months*
