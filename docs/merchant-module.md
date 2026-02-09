# Merchant Management Module

## Overview

The Merchant Management module allows users to register as merchants (1:1 relationship with User). Merchants have basic details, contact info, address, social media links, business hours, payment methods (from admin-managed list), legal documents with approval workflow (file uploads by predefined type), and terms & conditions acceptance. Merchants go through an approval workflow.

## Modules

| Module | Purpose | Admin-Managed? |
|--------|---------|----------------|
| **Payment Methods** | Predefined list merchants select from | Yes |
| **Document Types** | Predefined legal document categories | Yes |
| **Business Types** | Predefined merchant categories | Yes |
| **Social Platforms** | Predefined social media platforms | Yes |
| **Merchants** | Core merchant entity with all features | No (user-owned) |

---

## Phase 1: Reference Data (Payment Methods + Document Types + Business Types + Social Platforms)

Four admin-managed CRUD modules following the existing `RoleController`/`RoleService` pattern.

### 1A. Payment Methods

**Database: `payment_methods`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | varchar(255) | |
| slug | varchar(255) | unique, auto-generated |
| description | text | nullable |
| is_active | boolean | default true |
| sort_order | int | default 0 |
| timestamps | | |

**Media:** Spatie Media Library `icon` collection (single file, optional)

**Files to create:**

```
app/Models/PaymentMethod.php
database/migrations/xxxx_create_payment_methods_table.php
database/factories/PaymentMethodFactory.php
app/Repositories/PaymentMethodRepository.php
app/Repositories/Contracts/PaymentMethodRepositoryInterface.php
app/Services/PaymentMethodService.php
app/Services/Contracts/PaymentMethodServiceInterface.php
app/Data/PaymentMethodData.php
app/Http/Controllers/Api/V1/PaymentMethodController.php
app/Http/Requests/Api/V1/PaymentMethod/StorePaymentMethodRequest.php
app/Http/Requests/Api/V1/PaymentMethod/UpdatePaymentMethodRequest.php
app/Http/Resources/Api/V1/PaymentMethodResource.php
database/seeders/PaymentMethodSeeder.php
tests/Feature/Api/V1/PaymentMethodControllerTest.php
```

**API Routes:**

```
GET    /api/v1/payment-methods/active              (public - for merchant forms)
GET    /api/v1/payment-methods                     (permission: payment_methods.view)
GET    /api/v1/payment-methods/all                 (permission: payment_methods.view)
GET    /api/v1/payment-methods/{paymentMethod}     (permission: payment_methods.view)
POST   /api/v1/payment-methods                     (permission: payment_methods.create)
PUT    /api/v1/payment-methods/{paymentMethod}     (permission: payment_methods.update)
DELETE /api/v1/payment-methods/{paymentMethod}     (permission: payment_methods.delete)
```

**Seed data:** Cash, Credit Card, Debit Card, GCash, Bank Transfer

### 1B. Document Types

**Database: `document_types`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | varchar(255) | |
| slug | varchar(255) | unique, auto-generated |
| description | text | nullable |
| is_required | boolean | default false |
| level | enum | `organization` / `branch` / `both`, default `both` |
| is_active | boolean | default true |
| sort_order | int | default 0 |
| timestamps | | |

The `level` field controls which merchant types can upload this document:
- `organization` — only organizations (org-level docs like SEC Registration)
- `branch` — only branches and individuals (location-level docs like Mayor's Permit)
- `both` — any merchant type

**Media:** None

**Files to create:** Same structure as Payment Methods (model, migration, factory, repo, service, DTO, controller, requests, resource, seeder, test).

**API Routes:** Same pattern as Payment Methods with `document_types.*` permissions.

**Seed data:**

| Document Type | Level |
|--------------|-------|
| SEC Registration | organization |
| DTI Certificate | organization |
| BIR Certificate | both |
| Business Permit | branch |
| Mayor's Permit | branch |
| Barangay Clearance | branch |

### 1C. Business Types

**Database: `business_types`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | varchar(255) | |
| slug | varchar(255) | unique, auto-generated |
| description | text | nullable |
| is_active | boolean | default true |
| sort_order | int | default 0 |
| timestamps | | |

**Media:** Spatie Media Library `icon` collection (single file, optional)

**Files to create:** Same structure as Payment Methods (model, migration, factory, repo, service, DTO, controller, requests, resource, seeder, test).

**API Routes:** Same pattern as Payment Methods with `business_types.*` permissions.

**Seed data:** Restaurant, Retail, Services, Wholesale, Manufacturing, Food & Beverage, Health & Beauty, Technology

**Merchant relationship:** `merchants.business_type_id` FK (each merchant belongs to one business type).

### 1D. Social Platforms

**Database: `social_platforms`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | varchar(255) | Facebook, Instagram, etc. |
| slug | varchar(255) | unique, auto-generated |
| base_url | varchar(255) | nullable, e.g. `https://facebook.com/` |
| is_active | boolean | default true |
| sort_order | int | default 0 |
| timestamps | | |

**Media:** Spatie Media Library `icon` collection (single file, optional)

**Files to create:** Same structure as Payment Methods (model, migration, factory, repo, service, DTO, controller, requests, resource, seeder, test).

**API Routes:** Same pattern as Payment Methods with `social_platforms.*` permissions.

**Seed data:** Facebook, Instagram, Twitter/X, TikTok, YouTube, LinkedIn, WhatsApp

### Phase 1 - Existing files to modify

- `app/Providers/RepositoryServiceProvider.php` - Add 8 new bindings (4 repos + 4 services)
- `database/seeders/RolePermissionSeeder.php` - Add `payment_methods.*`, `document_types.*`, `business_types.*`, and `social_platforms.*` permissions
- `routes/api.php` - Add payment method, document type, business type, and social platform routes
- `config/images.php` - Add `merchant_logo`, `merchant_document`, `reference_icon` entries
- `app/Rules/ImageRule.php` - Add `merchantLogo()`, `merchantDocument()`, `referenceIcon()` static methods

---

## Phase 2: Merchant Core (Model, Types, CRUD, Status Workflow)

### Design: Unified Permission-Based Endpoints

All merchant endpoints use the same permission-guarded pattern as Phase 1 modules. No separate "own" vs "admin" endpoint categories — the system is role-based, and permissions control access.

### Merchant Types (Current)

| Type | Purpose |
|------|---------|
| `individual` | Standalone merchant |
| `organization` | Container for future branches |

> **Note:** Branch type and field inheritance are planned for a future phase.

### Database: `merchants`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| user_id | bigint | unique FK to users, cascadeOnDelete |
| parent_id | bigint | nullable, self-referencing FK, cascadeOnDelete |
| business_type_id | bigint | nullable FK to business_types, nullOnDelete |
| type | enum | individual/organization, default individual |
| name | varchar(255) | |
| slug | varchar(255) | unique, auto-generated |
| description | text | nullable |
| contact_email | varchar(255) | nullable |
| contact_phone | varchar(20) | nullable |
| website | varchar(255) | nullable |
| status | enum | pending/approved/active/rejected/suspended, default pending |
| status_changed_at | timestamp | nullable |
| status_reason | text | nullable (reason for rejection/suspension) |
| approved_at | timestamp | nullable |
| accepted_terms_at | timestamp | nullable |
| terms_version | varchar(20) | nullable, e.g. "1.0", "2.0" |
| timestamps | | |

### Relationships

- **Parent/Children:** Self-referencing (`parent_id` FK for future branch support).
- **Address:** Reuses existing polymorphic `addresses` table via `HasAddress` trait.
- **Logo:** Spatie Media Library `logo` collection (single file, with thumb/preview conversions).
- **User:** One-to-one (User `hasOne` Merchant, Merchant `belongsTo` User).
- **Business Type:** Many-to-one (Merchant `belongsTo` BusinessType).

### Status Workflow

Applies to all merchant types independently.

```
pending   --> approved     (admin approves application)
pending   --> rejected     (admin rejects application)
approved  --> active       (admin activates merchant)
approved  --> suspended    (admin suspends before activation)
active    --> suspended    (admin suspends active merchant)
rejected  --> pending      (merchant re-submits application)
suspended --> active       (admin reactivates merchant)
```

```
          ┌──────────┐
          │ pending  │◄─────────────────┐
          └────┬─────┘                  │
               │                        │
        ┌──────┴──────┐           (re-submit)
        ▼             ▼                 │
  ┌──────────┐  ┌──────────┐           │
  │ approved │  │ rejected │───────────┘
  └────┬─────┘  └──────────┘
       │
  ┌────┴─────┐
  ▼          ▼
┌────────┐ ┌───────────┐
│ active │ │ suspended │
└───┬────┘ └─────┬─────┘
    │            │
    └────►◄──────┘
    (suspend/reactivate)
```

### Files to create

```
app/Models/Merchant.php
database/migrations/xxxx_create_merchants_table.php
database/factories/MerchantFactory.php
app/Repositories/MerchantRepository.php
app/Repositories/Contracts/MerchantRepositoryInterface.php
app/Services/MerchantService.php
app/Services/Contracts/MerchantServiceInterface.php
app/Data/MerchantData.php
app/Http/Controllers/Api/V1/MerchantController.php
app/Http/Requests/Api/V1/Merchant/StoreMerchantRequest.php
app/Http/Requests/Api/V1/Merchant/UpdateMerchantRequest.php
app/Http/Requests/Api/V1/Merchant/UpdateMerchantStatusRequest.php
app/Http/Requests/Api/V1/Merchant/UploadMerchantLogoRequest.php
app/Http/Resources/Api/V1/MerchantResource.php
tests/Feature/Api/V1/MerchantControllerTest.php
```

### Permissions

```
merchants.view           - View/list merchants
merchants.create         - Create merchants
merchants.update         - Update merchant details, upload/delete logo
merchants.delete         - Delete merchants
merchants.update_status  - Approve/reject/suspend merchants
```

### API Routes

```
GET    /api/v1/merchants                       (permission: merchants.view)
GET    /api/v1/merchants/all                   (auth only)
GET    /api/v1/merchants/{merchant}            (permission: merchants.view)
POST   /api/v1/merchants                       (permission: merchants.create)
PUT    /api/v1/merchants/{merchant}            (permission: merchants.update)
DELETE /api/v1/merchants/{merchant}            (permission: merchants.delete)
PATCH  /api/v1/merchants/{merchant}/status     (permission: merchants.update_status)
POST   /api/v1/merchants/{merchant}/logo       (permission: merchants.update)
DELETE /api/v1/merchants/{merchant}/logo       (permission: merchants.update)
```

### Existing files to modify

- `app/Models/User.php` - Add `merchant(): HasOne` relationship
- `app/Http/Resources/Api/V1/UserResource.php` - Add `merchant` whenLoaded
- `app/Providers/RepositoryServiceProvider.php` - Add 2 new bindings
- `database/seeders/RolePermissionSeeder.php` - Add `merchants.*` permissions
- `routes/api.php` - Add merchant routes

---

## Phase 3: Merchant Features (Business Hours, Payment Methods, Social Links, Documents)

All Phase 3 endpoints are under `permission: merchants.update`. Managed via `MerchantService` methods and `MerchantController` — no separate controllers needed.

### 3A. Business Hours

**Database: `merchant_business_hours`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| merchant_id | bigint FK | cascadeOnDelete |
| day_of_week | tinyint | 0=Sunday..6=Saturday |
| open_time | time | nullable |
| close_time | time | nullable |
| is_closed | boolean | default false |
| timestamps | | |
| | | unique(merchant_id, day_of_week) |

Managed via `MerchantService.updateBusinessHours()` — bulk upsert by day_of_week.

**Route:** `PUT /api/v1/merchants/{merchant}/business-hours`

### 3B. Payment Method Selection (Pivot)

**Database: `merchant_payment_method`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| merchant_id | bigint FK | cascadeOnDelete |
| payment_method_id | bigint FK | cascadeOnDelete |
| timestamps | | |
| | | unique(merchant_id, payment_method_id) |

Managed via `MerchantService.syncPaymentMethods()` using `belongsToMany->sync()`.

**Route:** `POST /api/v1/merchants/{merchant}/payment-methods`

### 3C. Social Links

**Database: `merchant_social_links`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| merchant_id | bigint FK | cascadeOnDelete |
| social_platform_id | bigint FK | cascadeOnDelete |
| url | varchar(255) | Full profile URL |
| timestamps | | |
| | | unique(merchant_id, social_platform_id) |

Managed via `MerchantService.syncSocialLinks()` — deletes existing and recreates.

**Route:** `POST /api/v1/merchants/{merchant}/social-links`

### 3D. Legal Documents

**Database: `merchant_documents`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| merchant_id | bigint FK | cascadeOnDelete |
| document_type_id | bigint FK | cascadeOnDelete |
| notes | text | nullable |
| timestamps | | |
| | | unique(merchant_id, document_type_id) |

File storage via Spatie Media Library `document` collection on `MerchantDocument` model. Uses standard file validation (not `ImageRule`) since documents accept PDFs.

**Routes:**

```
POST   /api/v1/merchants/{merchant}/documents                  (permission: merchants.update)
DELETE /api/v1/merchants/{merchant}/documents/{document}        (permission: merchants.update)
```

### Phase 3 Files

**New files:**

```
app/Models/MerchantBusinessHour.php
app/Models/MerchantSocialLink.php
app/Models/MerchantDocument.php
database/migrations/xxxx_create_merchant_business_hours_table.php
database/migrations/xxxx_create_merchant_payment_method_table.php
database/migrations/xxxx_create_merchant_social_links_table.php
database/migrations/xxxx_create_merchant_documents_table.php
app/Http/Resources/Api/V1/MerchantBusinessHourResource.php
app/Http/Resources/Api/V1/MerchantSocialLinkResource.php
app/Http/Resources/Api/V1/MerchantDocumentResource.php
app/Http/Requests/Api/V1/Merchant/UpdateBusinessHoursRequest.php
app/Http/Requests/Api/V1/Merchant/SyncPaymentMethodsRequest.php
app/Http/Requests/Api/V1/Merchant/SyncSocialLinksRequest.php
app/Http/Requests/Api/V1/Merchant/UploadMerchantDocumentRequest.php
```

**Modified files:**

```
app/Models/Merchant.php              — Added businessHours, paymentMethods, socialLinks, documents relationships
app/Services/MerchantService.php     — Added updateBusinessHours, syncPaymentMethods, syncSocialLinks, createDocument, deleteDocument
app/Services/Contracts/MerchantServiceInterface.php — Added Phase 3 method signatures
app/Http/Controllers/Api/V1/MerchantController.php — Added Phase 3 action methods
routes/api.php                       — Added Phase 3 routes under merchants.update
```

---

## Phase 4: Frontend

### Types, Services, Hooks

```
frontend/types/api.ts                          -- Add interfaces
frontend/services/merchantService.ts           -- Merchant API calls
frontend/services/paymentMethodService.ts      -- Payment Method API calls
frontend/services/documentTypeService.ts       -- Document Type API calls
frontend/services/businessTypeService.ts       -- Business Type API calls
frontend/services/socialPlatformService.ts     -- Social Platform API calls
frontend/hooks/useMerchants.ts                 -- React Query hooks
frontend/hooks/usePaymentMethods.ts            -- React Query hooks
frontend/hooks/useDocumentTypes.ts             -- React Query hooks
frontend/hooks/useBusinessTypes.ts             -- React Query hooks
frontend/hooks/useSocialPlatforms.ts           -- React Query hooks
frontend/lib/validations.ts                    -- Zod schemas
```

### Pages

```
app/(admin)/(settings)/payment-methods/page.tsx      -- Admin CRUD table
app/(admin)/(settings)/document-types/page.tsx       -- Admin CRUD table
app/(admin)/(settings)/business-types/page.tsx       -- Admin CRUD table
app/(admin)/(settings)/social-platforms/page.tsx     -- Admin CRUD table
app/(admin)/(merchants)/merchants/page.tsx           -- Admin merchant list
app/(admin)/(merchants)/merchants/[id]/page.tsx      -- Admin merchant detail (with document approval)
app/(admin)/(merchant-profile)/my-merchant/page.tsx  -- Own merchant management
```

### Sidebar Navigation

- **"Merchants"** under admin nav (permission: `merchants.view`)
- **"My Merchant"** for authenticated users
- **"Payment Methods"** + **"Document Types"** + **"Business Types"** + **"Social Platforms"** under Settings (admin permissions)

---

## Verification

### Backend

```bash
docker compose exec app php artisan migrate
docker compose exec app php artisan db:seed --class=PaymentMethodSeeder
docker compose exec app php artisan db:seed --class=DocumentTypeSeeder
docker compose exec app php artisan db:seed --class=BusinessTypeSeeder
docker compose exec app php artisan db:seed --class=SocialPlatformSeeder
docker compose exec app php artisan test --filter=PaymentMethodControllerTest
docker compose exec app php artisan test --filter=DocumentTypeControllerTest
docker compose exec app php artisan test --filter=BusinessTypeControllerTest
docker compose exec app php artisan test --filter=SocialPlatformControllerTest
docker compose exec app php artisan test --filter=MerchantControllerTest
```

### Frontend

```bash
cd frontend && npm run build && npm run lint
```

### Manual API Testing

1. Create merchant via `POST /api/v1/merchant` (with terms acceptance)
2. Upload logo, set business hours, sync payment methods, sync social links, upload documents
3. Admin reviews documents via `PATCH /api/v1/merchants/{id}/documents/{docId}` (approve/reject)
4. Admin approves merchant via `PATCH /api/v1/merchants/{id}/status`
5. Verify all CRUD operations for payment methods, document types, business types, and social platforms

---

## Complete File List

### New files (Phase 1-3 Backend)

| # | File | Phase |
|---|------|-------|
| 1 | `app/Models/PaymentMethod.php` | 1A |
| 2 | `database/migrations/xxxx_create_payment_methods_table.php` | 1A |
| 3 | `database/factories/PaymentMethodFactory.php` | 1A |
| 4 | `app/Repositories/Contracts/PaymentMethodRepositoryInterface.php` | 1A |
| 5 | `app/Repositories/PaymentMethodRepository.php` | 1A |
| 6 | `app/Services/Contracts/PaymentMethodServiceInterface.php` | 1A |
| 7 | `app/Services/PaymentMethodService.php` | 1A |
| 8 | `app/Data/PaymentMethodData.php` | 1A |
| 9 | `app/Http/Controllers/Api/V1/PaymentMethodController.php` | 1A |
| 10 | `app/Http/Requests/Api/V1/PaymentMethod/StorePaymentMethodRequest.php` | 1A |
| 11 | `app/Http/Requests/Api/V1/PaymentMethod/UpdatePaymentMethodRequest.php` | 1A |
| 12 | `app/Http/Resources/Api/V1/PaymentMethodResource.php` | 1A |
| 13 | `database/seeders/PaymentMethodSeeder.php` | 1A |
| 14 | `tests/Feature/Api/V1/PaymentMethodControllerTest.php` | 1A |
| 15 | `app/Models/DocumentType.php` | 1B |
| 16 | `database/migrations/xxxx_create_document_types_table.php` | 1B |
| 17 | `database/factories/DocumentTypeFactory.php` | 1B |
| 18 | `app/Repositories/Contracts/DocumentTypeRepositoryInterface.php` | 1B |
| 19 | `app/Repositories/DocumentTypeRepository.php` | 1B |
| 20 | `app/Services/Contracts/DocumentTypeServiceInterface.php` | 1B |
| 21 | `app/Services/DocumentTypeService.php` | 1B |
| 22 | `app/Data/DocumentTypeData.php` | 1B |
| 23 | `app/Http/Controllers/Api/V1/DocumentTypeController.php` | 1B |
| 24 | `app/Http/Requests/Api/V1/DocumentType/StoreDocumentTypeRequest.php` | 1B |
| 25 | `app/Http/Requests/Api/V1/DocumentType/UpdateDocumentTypeRequest.php` | 1B |
| 26 | `app/Http/Resources/Api/V1/DocumentTypeResource.php` | 1B |
| 27 | `database/seeders/DocumentTypeSeeder.php` | 1B |
| 28 | `tests/Feature/Api/V1/DocumentTypeControllerTest.php` | 1B |
| 29 | `app/Models/BusinessType.php` | 1C |
| 30 | `database/migrations/xxxx_create_business_types_table.php` | 1C |
| 31 | `database/factories/BusinessTypeFactory.php` | 1C |
| 32 | `app/Repositories/Contracts/BusinessTypeRepositoryInterface.php` | 1C |
| 33 | `app/Repositories/BusinessTypeRepository.php` | 1C |
| 34 | `app/Services/Contracts/BusinessTypeServiceInterface.php` | 1C |
| 35 | `app/Services/BusinessTypeService.php` | 1C |
| 36 | `app/Data/BusinessTypeData.php` | 1C |
| 37 | `app/Http/Controllers/Api/V1/BusinessTypeController.php` | 1C |
| 38 | `app/Http/Requests/Api/V1/BusinessType/StoreBusinessTypeRequest.php` | 1C |
| 39 | `app/Http/Requests/Api/V1/BusinessType/UpdateBusinessTypeRequest.php` | 1C |
| 40 | `app/Http/Resources/Api/V1/BusinessTypeResource.php` | 1C |
| 41 | `database/seeders/BusinessTypeSeeder.php` | 1C |
| 42 | `tests/Feature/Api/V1/BusinessTypeControllerTest.php` | 1C |
| 43 | `app/Models/SocialPlatform.php` | 1D |
| 44 | `database/migrations/xxxx_create_social_platforms_table.php` | 1D |
| 45 | `database/factories/SocialPlatformFactory.php` | 1D |
| 46 | `app/Repositories/Contracts/SocialPlatformRepositoryInterface.php` | 1D |
| 47 | `app/Repositories/SocialPlatformRepository.php` | 1D |
| 48 | `app/Services/Contracts/SocialPlatformServiceInterface.php` | 1D |
| 49 | `app/Services/SocialPlatformService.php` | 1D |
| 50 | `app/Data/SocialPlatformData.php` | 1D |
| 51 | `app/Http/Controllers/Api/V1/SocialPlatformController.php` | 1D |
| 52 | `app/Http/Requests/Api/V1/SocialPlatform/StoreSocialPlatformRequest.php` | 1D |
| 53 | `app/Http/Requests/Api/V1/SocialPlatform/UpdateSocialPlatformRequest.php` | 1D |
| 54 | `app/Http/Resources/Api/V1/SocialPlatformResource.php` | 1D |
| 55 | `database/seeders/SocialPlatformSeeder.php` | 1D |
| 56 | `tests/Feature/Api/V1/SocialPlatformControllerTest.php` | 1D |
| 57 | `app/Models/Merchant.php` | 2 |
| 58 | `database/migrations/xxxx_create_merchants_table.php` | 2 |
| 59 | `database/factories/MerchantFactory.php` | 2 |
| 60 | `app/Repositories/Contracts/MerchantRepositoryInterface.php` | 2 |
| 61 | `app/Repositories/MerchantRepository.php` | 2 |
| 62 | `app/Services/Contracts/MerchantServiceInterface.php` | 2 |
| 63 | `app/Services/MerchantService.php` | 2 |
| 64 | `app/Data/MerchantData.php` | 2 |
| 65 | `app/Http/Controllers/Api/V1/MerchantController.php` | 2 |
| 66 | `app/Http/Requests/Api/V1/Merchant/StoreMerchantRequest.php` | 2 |
| 67 | `app/Http/Requests/Api/V1/Merchant/UpdateMerchantRequest.php` | 2 |
| 68 | `app/Http/Requests/Api/V1/Merchant/UpdateMerchantStatusRequest.php` | 2 |
| 69 | `app/Http/Requests/Api/V1/Merchant/UploadMerchantLogoRequest.php` | 2 |
| 70 | `app/Http/Resources/Api/V1/MerchantResource.php` | 2 |
| 71 | `tests/Feature/Api/V1/MerchantControllerTest.php` | 2 |
| 72 | `app/Models/MerchantBusinessHour.php` | 3A |
| 73 | `database/migrations/xxxx_create_merchant_business_hours_table.php` | 3A |
| 74 | `app/Http/Resources/Api/V1/MerchantBusinessHourResource.php` | 3A |
| 75 | `app/Http/Requests/Api/V1/Merchant/UpdateBusinessHoursRequest.php` | 3A |
| 76 | `database/migrations/xxxx_create_merchant_payment_method_table.php` | 3B |
| 77 | `app/Http/Requests/Api/V1/Merchant/SyncPaymentMethodsRequest.php` | 3B |
| 78 | `app/Models/MerchantSocialLink.php` | 3C |
| 79 | `database/migrations/xxxx_create_merchant_social_links_table.php` | 3C |
| 80 | `app/Http/Resources/Api/V1/MerchantSocialLinkResource.php` | 3C |
| 81 | `app/Http/Requests/Api/V1/Merchant/SyncSocialLinksRequest.php` | 3C |
| 82 | `app/Models/MerchantDocument.php` | 3D |
| 83 | `database/migrations/xxxx_create_merchant_documents_table.php` | 3D |
| 84 | `app/Http/Resources/Api/V1/MerchantDocumentResource.php` | 3D |
| 85 | `app/Http/Requests/Api/V1/Merchant/UploadMerchantDocumentRequest.php` | 3D |

### Existing files to modify

| File | Changes |
|------|---------|
| `app/Providers/RepositoryServiceProvider.php` | Add 10 new bindings (PaymentMethod, DocumentType, BusinessType, SocialPlatform, Merchant repos + services) |
| `database/seeders/RolePermissionSeeder.php` | Add `payment_methods.*`, `document_types.*`, `business_types.*`, `social_platforms.*`, `merchants.*` permissions |
| `routes/api.php` | Add all new routes |
| `config/images.php` | Add `merchant_logo`, `merchant_document`, `reference_icon` entries |
| `app/Rules/ImageRule.php` | Add `merchantLogo()`, `merchantDocument()`, `referenceIcon()` static methods |
| `app/Models/User.php` | Add `merchant(): HasOne` relationship |
| `app/Http/Resources/Api/V1/UserResource.php` | Add `merchant` whenLoaded |
| `database/seeders/DatabaseSeeder.php` | Add new seeders |
