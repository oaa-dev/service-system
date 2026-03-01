# Customer Module

## Model
- **Path**: app/Models/Customer.php
- **Table**: customers
- **Fillable**: user_id, customer_type, company_name, customer_notes, loyalty_points, customer_tier, preferred_payment_method, communication_preference, status, identity_verified_at, identity_document_status
- **Casts**: loyalty_points -> integer, identity_verified_at -> datetime
- **Relationships**:
  - user() -> BelongsTo -> User
  - tags() -> BelongsToMany -> CustomerTag (pivot: customer_customer_tag, withTimestamps)
  - interactions() -> HasMany -> CustomerInteraction
  - documents() -> HasMany -> CustomerDocument
- **Traits**: HasFactory, InteractsWithMedia (implements HasMedia)
- **Scopes**: (none)
- **Default Attributes**: customer_type=individual, customer_tier=regular, loyalty_points=0, communication_preference=both, status=active, identity_document_status=none
- **Media Collections**:
  - `identity_document` — singleFile(); stores uploaded government ID or identity document

### Status Workflow
```
active   -> suspended, banned
suspended -> active, banned
banned   -> active
```
`destroy()` (DELETE /customers/{id}) sets status to `banned` (deactivation, not hard delete).

### Identity Document Status Flow
```
none -> pending     (customer uploads document via POST /customer/my/identity-document)
pending -> approved (admin approves via PATCH /customers/{id}/verify-identity)
pending -> rejected (admin rejects via PATCH /customers/{id}/reject-identity)
rejected -> pending (customer re-uploads; status reset to pending on upload)
```
`identity_verified_at` is set to `now()` on approval and cleared to `null` on rejection.

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/CustomerController.php | Full CRUD + avatar, documents, tags sync, interactions, profile/account update, verifyIdentity, rejectIdentity |
| Service | app/Services/CustomerService.php | Business logic; Spatie QueryBuilder; VALID_TRANSITIONS for status; 14 methods |
| Service Interface | app/Services/Contracts/CustomerServiceInterface.php | 14 method contract |
| Repository | app/Repositories/CustomerRepository.php | Extends BaseRepository; adds findByUserId() |
| Repository Interface | app/Repositories/Contracts/CustomerRepositoryInterface.php | Extends BaseRepositoryInterface; adds findByUserId() |
| DTO | app/Data/CustomerData.php | All fields Optional; includes user_name/user_email/user_password for creation |
| FormRequest | app/Http/Requests/Api/V1/Customer/StoreCustomerRequest.php | user_first_name, user_last_name, user_email, user_password required |
| FormRequest | app/Http/Requests/Api/V1/Customer/UpdateCustomerRequest.php | Optional customer fields |
| FormRequest | app/Http/Requests/Api/V1/Customer/UpdateCustomerStatusRequest.php | Validates status enum |
| FormRequest | app/Http/Requests/Api/V1/Customer/UpdateCustomerAccountRequest.php | Email/password update for linked User |
| FormRequest | app/Http/Requests/Api/V1/Customer/UpdateCustomerProfileRequest.php | Profile fields (delegates to ProfileData) |
| FormRequest | app/Http/Requests/Api/V1/Customer/UploadCustomerAvatarRequest.php | Avatar image validation |
| FormRequest | app/Http/Requests/Api/V1/Customer/UploadCustomerDocumentRequest.php | document_type_id + file |
| FormRequest | app/Http/Requests/Api/V1/Customer/SyncCustomerTagsRequest.php | tag_ids array |
| FormRequest | app/Http/Requests/Api/V1/Customer/StoreCustomerInteractionRequest.php | type + description |
| Resource | app/Http/Resources/Api/V1/CustomerResource.php | Includes whenLoaded: user (with profile), tags, documents; interactions_count; always includes identity_document_status, identity_verified_at, identity_document (URL from media) |

## Routes
| Method | URI | Action |
|--------|-----|--------|
| GET | api/v1/customers | CustomerController@index (permission:customers.view) |
| GET | api/v1/customers/{customer} | CustomerController@show (permission:customers.view) |
| POST | api/v1/customers | CustomerController@store (permission:customers.create) |
| PUT | api/v1/customers/{customer} | CustomerController@update (permission:customers.update) |
| PUT | api/v1/customers/{customer}/profile | CustomerController@updateProfile (permission:customers.update) |
| PUT | api/v1/customers/{customer}/account | CustomerController@updateAccount (permission:customers.update) |
| POST | api/v1/customers/{customer}/avatar | CustomerController@uploadAvatar (permission:customers.update) |
| DELETE | api/v1/customers/{customer}/avatar | CustomerController@deleteAvatar (permission:customers.update) |
| POST | api/v1/customers/{customer}/documents | CustomerController@uploadDocument (permission:customers.update) |
| DELETE | api/v1/customers/{customer}/documents/{document} | CustomerController@deleteDocument (permission:customers.update) |
| POST | api/v1/customers/{customer}/tags | CustomerController@syncTags (permission:customers.update) |
| GET | api/v1/customers/{customer}/interactions | CustomerController@interactions (permission:customers.view) |
| POST | api/v1/customers/{customer}/interactions | CustomerController@storeInteraction (permission:customers.update) |
| DELETE | api/v1/customers/{customer}/interactions/{interaction} | CustomerController@destroyInteraction (permission:customers.update) |
| PATCH | api/v1/customers/{customer}/verify-identity | CustomerController@verifyIdentity (permission:customers.update) |
| PATCH | api/v1/customers/{customer}/reject-identity | CustomerController@rejectIdentity (permission:customers.update) |
| PATCH | api/v1/customers/{customer}/status | CustomerController@updateStatus (permission:customers.update_status) |
| DELETE | api/v1/customers/{customer} | CustomerController@destroy (permission:customers.delete) |
| GET | api/v1/profile/customer | ProfileController@showCustomer (auth only) |
| PUT | api/v1/profile/customer | ProfileController@updateCustomer (auth only) |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_10_200002_create_customers_table.php |
| Migration (pivot) | database/migrations/2026_02_10_200003_create_customer_customer_tag_table.php |
| Migration (identity) | database/migrations/2026_02_28_220000_add_identity_verification_to_customers_table.php |
| Factory | database/factories/CustomerFactory.php |
| Seeder | (none -- created on register with customer role or via admin store) |

### Factory States
- `corporate()` -- sets customer_type=corporate with company_name
- `suspended()` -- sets status=suspended
- `banned()` -- sets status=banned

### Query Filters (CustomerService::getAllCustomers)
| Filter | Type | Description |
|--------|------|-------------|
| filter[customer_type] | exact | individual or corporate |
| filter[customer_tier] | exact | regular, silver, gold, platinum |
| filter[status] | exact | active, suspended, banned |
| filter[search] | callback | Matches user.name or user.email |
| filter[tag_id] | callback | Customers with given tag ID |
| sort | allowed | id, customer_type, customer_tier, status, loyalty_points, created_at (default: -created_at) |

## Admin Frontend
| Category | File | Notes |
|----------|------|-------|
| Hook | frontend/hooks/useCustomers.ts | useVerifyCustomerIdentity(id), useRejectCustomerIdentity({id, reason?}) -- invalidate ['customers', id] on success |
| Service | frontend/services/customerService.ts | verifyIdentity(id): PATCH /customers/{id}/verify-identity; rejectIdentity(id, reason?): PATCH /customers/{id}/reject-identity |
| Type | frontend/types/api.ts | Customer interface includes identity_document_status, identity_verified_at, identity_document |

## Tests
| Type | File |
|------|------|
| Feature (admin CRUD) | tests/Feature/Api/V1/CustomerControllerTest.php |
| Feature (self-service) | tests/Feature/Api/V1/CustomerSelfServiceTest.php |
| Feature (portal) | tests/Feature/Api/V1/CustomerPortalControllerTest.php |
| Feature (identity verification) | tests/Feature/Api/V1/CustomerIdentityVerificationTest.php |

### Identity Verification Test Coverage (CustomerIdentityVerificationTest.php)
- Upload identity document: 200, status set to pending, unauthenticated 401, missing permission 403, file required 422, invalid mime 422, PDF accepted, oversized file 422
- Admin verify identity: 200 with approved status and non-null identity_verified_at, 404 for non-existent, 403 without permission, 401 unauthenticated
- Admin reject identity: 200 with rejected status and null identity_verified_at, optional reason field, reason max 500 chars, 403 without permission, 401 unauthenticated

## Gotchas
- `verifyIdentity` and `rejectIdentity` are implemented directly in the controller (not delegated to CustomerService) since they are simple direct-update operations
- `rejectIdentity` accepts an optional `reason` field (max 500 chars) which is accepted in the request body but not currently persisted to the database (no rejection_reason column)
- Identity document upload sets status to `pending` unconditionally; re-uploading when status is `rejected` resets to `pending`
- `identity_document` in CustomerResource is returned via `whenLoaded('media', ...)` -- eager-load `media` to include the URL
