# Customer Management Module - Implementation Plan

## Context

System-wide customer management for admins. Customers = registered users (must sign up, or admin creates on their behalf). Adds customer-specific fields (type, tier, loyalty, preferences), managed tags, and interaction history logging. Customers can also edit their own preferences via self-service endpoint.

---

## Database Schema

### Table: `customers`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | bigint PK | auto | |
| user_id | FK → users | | unique, cascadeOnDelete |
| customer_type | enum: individual/corporate | individual | |
| company_name | string(255) | null | for corporate customers |
| customer_notes | text | null | admin internal notes |
| loyalty_points | integer | 0 | accumulated balance |
| customer_tier | enum: regular/silver/gold/platinum | regular | manual (auto-rules later) |
| preferred_payment_method | enum: cash/e-wallet/card | null | |
| communication_preference | enum: sms/email/both | both | |
| status | enum: active/suspended/banned | active | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

### Table: `customer_tags` (reference data)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | bigint PK | auto | |
| name | string(255) | | |
| slug | string(255) | | unique |
| color | string(7) | null | hex color for UI badges |
| description | text | null | |
| is_active | boolean | true | |
| sort_order | integer | 0 | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

### Table: `customer_customer_tag` (pivot)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| customer_id | FK → customers | cascadeOnDelete |
| customer_tag_id | FK → customer_tags | cascadeOnDelete |
| created_at | timestamp | |
| updated_at | timestamp | |
| | | unique: [customer_id, customer_tag_id] |

### Table: `customer_interactions`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | bigint PK | auto | |
| customer_id | FK → customers | | cascadeOnDelete |
| type | enum: note/call/complaint/inquiry | | |
| description | text | | |
| logged_by | FK → users | | nullOnDelete |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

## Backend Changes

### B1. Models (3 new, 1 modified)

**`app/Models/Customer.php`**
- `user_id`, `customer_type`, `company_name`, `customer_notes`, `loyalty_points`, `customer_tier`, `preferred_payment_method`, `communication_preference`, `status`
- `$attributes` for defaults: type=individual, tier=regular, status=active, loyalty_points=0, communication_preference=both
- `$casts`: enums as strings
- Relationships: `user()` BelongsTo, `tags()` BelongsToMany, `interactions()` HasMany

**`app/Models/CustomerTag.php`**
- Standard reference data model (like PaymentMethod)
- Fields: name, slug, color, description, is_active, sort_order
- Auto-generates slug from name in `booted()`
- Relationship: `customers()` BelongsToMany

**`app/Models/CustomerInteraction.php`**
- Fields: customer_id, type, description, logged_by
- Relationships: `customer()` BelongsTo, `loggedByUser()` BelongsTo (User)

**`app/Models/User.php`** -- Add `customer()` HasOne relationship

### B2. Migrations (4 new)
1. `create_customer_tags_table` -- reference data
2. `create_customers_table` -- main customer table
3. `create_customer_customer_tag_table` -- pivot
4. `create_customer_interactions_table` -- interaction log

### B3. Factories (3 new)
- `CustomerFactory` -- generates customer with random type/tier/status
- `CustomerTagFactory` -- generates tag with name/slug/color
- `CustomerInteractionFactory` -- generates interaction with random type

### B4. Repositories

**CustomerTag** (reference data pattern):
- `CustomerTagRepository` extends BaseRepository
- `CustomerTagRepositoryInterface` extends BaseRepositoryInterface
- Methods: `findBySlug()`, `getActive()`

**Customer:**
- `CustomerRepository` extends BaseRepository
- `CustomerRepositoryInterface` extends BaseRepositoryInterface
- Methods: `findByUserId()`, `getWithRelations()`

### B5. Services

**CustomerTagService** (reference data pattern):
- Full CRUD: getAll (paginated), getAllWithoutPagination, getActive, getById, create, update, delete
- QueryBuilder filters: name (partial), is_active (exact), search (callback)

**CustomerService:**
- `getAllCustomers(filters)` -- paginated, QueryBuilder with filters: customer_type, customer_tier, status, search (user name/email), tag_id
- `getCustomerById(id)` -- eager loads user.profile, tags, recent interactions with loggedByUser
- `createCustomerForUser(CustomerData $data)` -- DB::transaction: create User (user_name, user_email, user_password), assign "customer" role, create Customer record. Same pattern as MerchantService::createMerchantForUser()
- `updateCustomer(id, CustomerData)` -- update customer-specific fields
- `updateCustomerStatus(id, status)` -- validate transitions
- `deactivateCustomer(id)` -- set status to banned, optionally revoke tokens
- `syncCustomerTags(id, tagIds[])` -- BelongsToMany sync
- `getCustomerInteractions(customerId, filters)` -- paginated list
- `createCustomerInteraction(customerId, data)` -- log new interaction
- `deleteCustomerInteraction(customerId, interactionId)` -- remove interaction

### B6. DTOs (3 new)

**`app/Data/CustomerTagData.php`**
```
name, slug, color, description, is_active, sort_order -- all Optional
```

**`app/Data/CustomerData.php`**
```
# For create (user account fields)
user_name, user_email, user_password -- all Optional
# Customer fields
customer_type, company_name, customer_notes, loyalty_points, customer_tier,
preferred_payment_method, communication_preference, status -- all Optional
```

**`app/Data/CustomerInteractionData.php`**
```
type, description -- all Optional
```

### B7. Controllers (2 new, 1 modified)

**`app/Http/Controllers/Api/V1/CustomerTagController.php`**
- Standard reference data controller (index, all, active, store, show, update, destroy)

**`app/Http/Controllers/Api/V1/CustomerController.php`**
- `index()` -- paginated list with filters
- `store()` -- create user account + customer (DB::transaction, assigns "customer" role)
- `show(id)` -- customer detail with relations
- `update(id)` -- update customer fields
- `updateStatus(id)` -- change status
- `destroy(id)` -- deactivate customer (set status=banned)
- `syncTags(id)` -- sync tag assignments
- `interactions(id)` -- list interactions (paginated)
- `storeInteraction(id)` -- log interaction
- `destroyInteraction(id, interactionId)` -- delete interaction

**`app/Http/Controllers/Api/V1/ProfileController.php`** -- Add showCustomer/updateCustomer for self-service

### B8. Form Requests (7 new)

**CustomerTag:**
- `StoreCustomerTagRequest` -- name required, unique slug
- `UpdateCustomerTagRequest` -- sometimes, unique slug ignoring self

**Customer:**
- `StoreCustomerRequest` -- user_name required, user_email required|unique:users,email, user_password required|min:8, customer_type sometimes (enum), company_name sometimes
- `UpdateCustomerRequest` -- sometimes fields, enum validation
- `UpdateCustomerStatusRequest` -- status required, in:active,suspended,banned
- `SyncCustomerTagsRequest` -- tag_ids array, each exists in customer_tags
- `StoreCustomerInteractionRequest` -- type required (enum), description required

**Self-service:**
- `UpdateCustomerPreferencesRequest` -- preferred_payment_method (enum), communication_preference (enum)

### B9. Resources (3 new)

**`CustomerTagResource`** -- id, name, slug, color, description, is_active, sort_order, timestamps

**`CustomerResource`**
```json
{
  "id": 1,
  "user": { "id": 1, "name": "...", "email": "..." },
  "customer_type": "individual",
  "company_name": null,
  "customer_notes": "VIP customer",
  "loyalty_points": 150,
  "customer_tier": "silver",
  "preferred_payment_method": "e-wallet",
  "communication_preference": "both",
  "status": "active",
  "tags": [{ "id": 1, "name": "VIP", "color": "#FFD700" }],
  "interactions_count": 5,
  "created_at": "...",
  "updated_at": "..."
}
```

**`CustomerInteractionResource`**
```json
{
  "id": 1,
  "type": "call",
  "description": "Follow-up about order #123",
  "logged_by": { "id": 2, "name": "Admin User" },
  "created_at": "...",
  "updated_at": "..."
}
```

### B10. Routes

```
# Customer Tags (reference data)
GET    /customer-tags/active                    -- public
GET    /customer-tags/all                       -- auth
GET    /customer-tags                           -- customer_tags.view
POST   /customer-tags                           -- customer_tags.create
GET    /customer-tags/{customerTag}             -- customer_tags.view
PUT    /customer-tags/{customerTag}             -- customer_tags.update
DELETE /customer-tags/{customerTag}             -- customer_tags.delete

# Customer Management (admin)
GET    /customers                               -- customers.view
POST   /customers                               -- customers.create
GET    /customers/{customer}                    -- customers.view
PUT    /customers/{customer}                    -- customers.update
DELETE /customers/{customer}                    -- customers.delete (deactivate)
PUT    /customers/{customer}/status             -- customers.update_status
POST   /customers/{customer}/tags               -- customers.update
GET    /customers/{customer}/interactions        -- customers.view
POST   /customers/{customer}/interactions        -- customers.update
DELETE /customers/{customer}/interactions/{interaction} -- customers.update

# Self-service (authenticated, no permission needed)
GET    /profile/customer                        -- own customer data
PUT    /profile/customer                        -- update own preferences
```

### B11. Permissions & Roles
```
customer_tags:  customer_tags.view, customer_tags.create, customer_tags.update, customer_tags.delete
customers:      customers.view, customers.create, customers.update, customers.delete, customers.update_status
```

**Roles:**
- `super-admin` -- bypasses all (existing)
- `admin` -- gets all customer + customer_tag permissions
- `manager` -- gets customers.view
- `customer` -- NEW role, gets: profile.view, profile.update (self-service only, no admin permissions)
- `user` -- existing, unchanged

### B12. Self-service (ProfileController extension)
- `showCustomer()` -- returns authenticated user's customer record with tags
- `updateCustomer(request)` -- allows updating: preferred_payment_method, communication_preference only

### B13. Status Transitions
```
VALID_TRANSITIONS = [
    'active'    => ['suspended', 'banned'],
    'suspended' => ['active', 'banned'],
    'banned'    => ['active'],
]
```

### B14. Seeders
- `CustomerTagSeeder` -- seed default tags: VIP, Wholesale, Frequent Buyer, New Customer, Corporate
- Update `RolePermissionSeeder` -- add customer permissions + "customer" role
- Update `DatabaseSeeder` -- call CustomerTagSeeder

---

## Backend Tests

### `CustomerTagControllerTest.php` (~10 tests)
- List tags (paginated, filtered)
- All tags (no pagination)
- Active tags (public)
- Create tag (success, validation, unique slug)
- Show tag
- Update tag (success, unique slug)
- Delete tag (success, 422)

### `CustomerControllerTest.php` (~18 tests)
- List customers (paginated, filtered by type/tier/status/search/tag)
- Create customer (success, creates user + customer, assigns "customer" role)
- Create customer (validation: duplicate email, missing required fields)
- Show customer (with relations)
- Update customer fields
- Update status (valid transition, invalid transition rejected)
- Deactivate customer (DELETE sets status=banned)
- Sync tags (assign, replace, clear)
- List interactions
- Create interaction (success, validation)
- Delete interaction (success, 422)
- Unauthorized access (no permission)

### `CustomerSelfServiceTest.php` (~6 tests)
- Get own customer profile
- Update own preferences (payment method, communication)
- Cannot update restricted fields (tier, status, notes) via self-service
- Unauthenticated rejected

---

## Frontend Changes

### F1. Types (`types/api.ts`)
```typescript
interface CustomerTag {
  id: number; name: string; slug: string; color: string | null;
  description: string | null; is_active: boolean; sort_order: number;
  created_at: string; updated_at: string;
}

interface Customer {
  id: number;
  user: { id: number; name: string; email: string; avatar?: {...} };
  customer_type: 'individual' | 'corporate';
  company_name: string | null;
  customer_notes: string | null;
  loyalty_points: number;
  customer_tier: 'regular' | 'silver' | 'gold' | 'platinum';
  preferred_payment_method: 'cash' | 'e-wallet' | 'card' | null;
  communication_preference: 'sms' | 'email' | 'both';
  status: 'active' | 'suspended' | 'banned';
  tags: CustomerTag[];
  interactions_count: number;
  created_at: string; updated_at: string;
}

interface CustomerInteraction {
  id: number; type: 'note' | 'call' | 'complaint' | 'inquiry';
  description: string;
  logged_by: { id: number; name: string };
  created_at: string; updated_at: string;
}
```

### F2. Services (2 new)
**`services/customerTagService.ts`** -- Standard reference data service (list, all, active, create, show, update, delete)

**`services/customerService.ts`** -- getAll, create, getById, update, updateStatus, deactivate, syncTags, getInteractions, createInteraction, deleteInteraction

### F3. Hooks (2 new)
**`hooks/useCustomerTags.ts`** -- Standard CRUD hooks + useActiveCustomerTags

**`hooks/useCustomers.ts`** -- useCustomers, useCustomer, useCreateCustomer, useUpdateCustomer, useUpdateCustomerStatus, useDeactivateCustomer, useSyncCustomerTags, useCustomerInteractions, useCreateCustomerInteraction, useDeleteCustomerInteraction

### F4. Validations (`lib/validations.ts`)
- `customerTagSchema` -- name required, slug optional
- `customerCreateSchema` -- user_name required, user_email required (email format), user_password required (min 8), customer_type optional, company_name optional
- `customerUpdateSchema` -- customer_type, company_name, customer_notes, loyalty_points, customer_tier, preferred_payment_method, communication_preference
- `customerStatusSchema` -- status enum
- `customerInteractionSchema` -- type enum, description required

### F5. Pages

**Customer Tags** -- `(system)/(settings)/customer-tags/page.tsx`
- Standard reference data page (like payment methods)
- Dialog-based create/edit with color picker for tag badge color
- Table: name, color badge, status, sort order, actions

**Customer List** -- `(system)/(customers)/customers/page.tsx`
- Table with columns: Name, Email, Type, Tier (badge), Status (badge), Tags (badge list), Points, Joined
- Filters: search, customer_type, customer_tier, status, tag
- "Create Customer" button → dialog with user account fields + customer type
- Click row → detail page

**Customer Detail** -- `(system)/(customers)/customers/[id]/page.tsx`
- Header: customer name, email, status badge, tier badge, deactivate button
- 3 tabs:
  - **Profile**: customer fields (type, company, notes, points, tier, preferences) with inline edit
  - **Tags**: assigned tags with add/remove, available tags list
  - **Interactions**: chronological log with type badges, add new interaction form, delete

### F6. Sidebar (`components/app-sidebar.tsx`)
- Main Menu: add "Customers" item (permission: customers.view)
- Settings: add "Customer Tags" item (permission: customer_tags.view)

### F7. Self-service (profile page extension)
- Add "Preferences" section to existing profile page
- Shows preferred payment method + communication preference
- Editable by the customer themselves

---

## File Summary

| # | File | Action |
|---|------|--------|
| **Backend - CustomerTag (reference data)** | | |
| 1 | `backend/app/Models/CustomerTag.php` | Create |
| 2 | `backend/database/migrations/..._create_customer_tags_table.php` | Create |
| 3 | `backend/database/factories/CustomerTagFactory.php` | Create |
| 4 | `backend/database/seeders/CustomerTagSeeder.php` | Create |
| 5 | `backend/app/Repositories/Contracts/CustomerTagRepositoryInterface.php` | Create |
| 6 | `backend/app/Repositories/CustomerTagRepository.php` | Create |
| 7 | `backend/app/Services/Contracts/CustomerTagServiceInterface.php` | Create |
| 8 | `backend/app/Services/CustomerTagService.php` | Create |
| 9 | `backend/app/Data/CustomerTagData.php` | Create |
| 10 | `backend/app/Http/Controllers/Api/V1/CustomerTagController.php` | Create |
| 11 | `backend/app/Http/Requests/Api/V1/CustomerTag/StoreCustomerTagRequest.php` | Create |
| 12 | `backend/app/Http/Requests/Api/V1/CustomerTag/UpdateCustomerTagRequest.php` | Create |
| 13 | `backend/app/Http/Resources/Api/V1/CustomerTagResource.php` | Create |
| 14 | `backend/tests/Feature/Api/V1/CustomerTagControllerTest.php` | Create |
| **Backend - Customer (main module)** | | |
| 15 | `backend/app/Models/Customer.php` | Create |
| 16 | `backend/app/Models/CustomerInteraction.php` | Create |
| 17 | `backend/database/migrations/..._create_customers_table.php` | Create |
| 18 | `backend/database/migrations/..._create_customer_customer_tag_table.php` | Create |
| 19 | `backend/database/migrations/..._create_customer_interactions_table.php` | Create |
| 20 | `backend/database/factories/CustomerFactory.php` | Create |
| 21 | `backend/database/factories/CustomerInteractionFactory.php` | Create |
| 22 | `backend/app/Repositories/Contracts/CustomerRepositoryInterface.php` | Create |
| 23 | `backend/app/Repositories/CustomerRepository.php` | Create |
| 24 | `backend/app/Services/Contracts/CustomerServiceInterface.php` | Create |
| 25 | `backend/app/Services/CustomerService.php` | Create |
| 26 | `backend/app/Data/CustomerData.php` | Create |
| 27 | `backend/app/Data/CustomerInteractionData.php` | Create |
| 28 | `backend/app/Http/Controllers/Api/V1/CustomerController.php` | Create |
| 29 | `backend/app/Http/Requests/Api/V1/Customer/StoreCustomerRequest.php` | Create |
| 30 | `backend/app/Http/Requests/Api/V1/Customer/UpdateCustomerRequest.php` | Create |
| 31 | `backend/app/Http/Requests/Api/V1/Customer/UpdateCustomerStatusRequest.php` | Create |
| 32 | `backend/app/Http/Requests/Api/V1/Customer/SyncCustomerTagsRequest.php` | Create |
| 33 | `backend/app/Http/Requests/Api/V1/Customer/StoreCustomerInteractionRequest.php` | Create |
| 34 | `backend/app/Http/Resources/Api/V1/CustomerResource.php` | Create |
| 35 | `backend/app/Http/Resources/Api/V1/CustomerInteractionResource.php` | Create |
| 36 | `backend/tests/Feature/Api/V1/CustomerControllerTest.php` | Create |
| **Backend - Self-service** | | |
| 37 | `backend/app/Http/Requests/Api/V1/Profile/UpdateCustomerPreferencesRequest.php` | Create |
| 38 | `backend/tests/Feature/Api/V1/CustomerSelfServiceTest.php` | Create |
| **Backend - Modified** | | |
| 39 | `backend/app/Models/User.php` | Modify (add customer() HasOne) |
| 40 | `backend/app/Http/Controllers/Api/V1/ProfileController.php` | Modify (add showCustomer/updateCustomer) |
| 41 | `backend/app/Services/ProfileService.php` | Modify (add customer preference methods) |
| 42 | `backend/app/Services/Contracts/ProfileServiceInterface.php` | Modify |
| 43 | `backend/app/Providers/RepositoryServiceProvider.php` | Modify (add bindings) |
| 44 | `backend/database/seeders/RolePermissionSeeder.php` | Modify (add permissions + "customer" role) |
| 45 | `backend/database/seeders/DatabaseSeeder.php` | Modify (add seeders) |
| 46 | `backend/routes/api.php` | Modify (add routes) |
| **Frontend - New** | | |
| 47 | `frontend/services/customerTagService.ts` | Create |
| 48 | `frontend/services/customerService.ts` | Create |
| 49 | `frontend/hooks/useCustomerTags.ts` | Create |
| 50 | `frontend/hooks/useCustomers.ts` | Create |
| 51 | `frontend/app/(system)/(settings)/customer-tags/page.tsx` | Create |
| 52 | `frontend/app/(system)/(customers)/customers/page.tsx` | Create |
| 53 | `frontend/app/(system)/(customers)/customers/[id]/page.tsx` | Create |
| **Frontend - Modified** | | |
| 54 | `frontend/types/api.ts` | Modify (add interfaces) |
| 55 | `frontend/lib/validations.ts` | Modify (add schemas) |
| 56 | `frontend/components/app-sidebar.tsx` | Modify (add menu items) |
| 57 | `frontend/app/(system)/(profile)/profile/page.tsx` | Modify (add preferences section) |

---

## API Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| **Customer Tags** | | | |
| GET | `/customer-tags/active` | public | Active tags |
| GET | `/customer-tags/all` | auth | All tags (no pagination) |
| GET | `/customer-tags` | customer_tags.view | Paginated list |
| POST | `/customer-tags` | customer_tags.create | Create tag |
| GET | `/customer-tags/{id}` | customer_tags.view | Show tag |
| PUT | `/customer-tags/{id}` | customer_tags.update | Update tag |
| DELETE | `/customer-tags/{id}` | customer_tags.delete | Delete tag |
| **Customers** | | | |
| GET | `/customers` | customers.view | Paginated list with filters |
| POST | `/customers` | customers.create | Create user + customer (assigns "customer" role) |
| GET | `/customers/{id}` | customers.view | Detail with relations |
| PUT | `/customers/{id}` | customers.update | Update fields |
| DELETE | `/customers/{id}` | customers.delete | Deactivate (status → banned) |
| PUT | `/customers/{id}/status` | customers.update_status | Change status |
| POST | `/customers/{id}/tags` | customers.update | Sync tags |
| GET | `/customers/{id}/interactions` | customers.view | List interactions |
| POST | `/customers/{id}/interactions` | customers.update | Log interaction |
| DELETE | `/customers/{id}/interactions/{id}` | customers.update | Delete interaction |
| **Self-service** | | | |
| GET | `/profile/customer` | auth (own) | Get own customer data |
| PUT | `/profile/customer` | auth (own) | Update own preferences |

---

## Key Design Decisions

1. **Customer = User + customer record** -- similar to Merchant pattern. Admin creates user account + customer in a DB::transaction, assigns "customer" role.
2. **"customer" role** -- new role distinct from "user". Gets profile.view + profile.update only (self-service).
3. **DELETE = deactivate** -- sets status to "banned", does not hard-delete the user or customer record.
4. **Managed tags** -- separate `customer_tags` reference table with full CRUD, assigned via pivot.
5. **Interaction history** -- admin-logged activity (note/call/complaint/inquiry), separate from future order/booking history.
6. **Self-service** -- customers can edit preferred_payment_method + communication_preference via `/profile/customer`. Admin-only fields (tier, status, notes, points) cannot be changed by the customer.
7. **Auto-creation on registration** -- when a user self-registers, a Customer record is auto-created (in User::booted or registration flow).

---

## Implementation Order

1. **Phase A**: CustomerTag reference data (model → migration → factory → seeder → repo → service → DTO → controller → requests → resource → routes → permissions → tests)
2. **Phase B**: Customer model + CRUD (model → migrations → factories → repo → service → DTO → controller → requests → resources → routes → permissions → tests)
3. **Phase C**: Customer interactions (model + migration + factory in Phase B, add service methods, controller methods, tests)
4. **Phase D**: Self-service (profile controller extension, request, tests)
5. **Phase E**: Frontend - types, services, hooks, validations
6. **Phase F**: Frontend - Customer Tags page (settings)
7. **Phase G**: Frontend - Customer list + detail pages
8. **Phase H**: Frontend - Profile preferences section + sidebar

---

## Verification

```bash
# Backend tests
docker compose exec app php artisan test --filter=CustomerTagControllerTest
docker compose exec app php artisan test --filter=CustomerControllerTest
docker compose exec app php artisan test --filter=CustomerSelfServiceTest

# Frontend
docker compose exec nextjs npx tsc --noEmit
docker compose exec nextjs npm run lint
```
