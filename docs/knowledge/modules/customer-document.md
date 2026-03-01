# CustomerDocument Module

## Model
- **Path**: app/Models/CustomerDocument.php
- **Table**: customer_documents
- **Fillable**: customer_id, document_type_id, notes
- **Casts**: (none)
- **Relationships**:
  - customer() -> BelongsTo -> Customer
  - documentType() -> BelongsTo -> DocumentType
- **Traits**: InteractsWithMedia (Spatie Media Library)
- **Interfaces**: HasMedia (Spatie Media Library)
- **Scopes**: (none)

### Media Collections
| Collection | Config |
|------------|--------|
| document | singleFile() -- only one file per document record |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/CustomerController.php | uploadDocument(), deleteDocument() methods |
| Service | app/Services/CustomerService.php | createCustomerDocument() uses updateOrCreate scoped to customer; deleteCustomerDocument() clears media before delete |
| Service Interface | app/Services/Contracts/CustomerServiceInterface.php | createCustomerDocument(), deleteCustomerDocument() |
| FormRequest | app/Http/Requests/Api/V1/Customer/UploadCustomerDocumentRequest.php | document_type_id (required, exists:document_types,id) + document file |
| Resource | app/Http/Resources/Api/V1/CustomerDocumentResource.php | id, document_type_id, notes, document_type (whenLoaded), file (whenLoaded media: url, name, size, mime_type) |

### Notes
- No dedicated controller -- endpoints managed through CustomerController under `customers/{customer}/documents` nested routes
- `createCustomerDocument()` uses `updateOrCreate(['document_type_id' => $documentTypeId], ...)` so uploading for the same document type replaces the existing record
- File upload (`addMediaFromRequest`) happens in the controller, not inside the service
- No factory for CustomerDocument (tests create records directly)

## Routes
| Method | URI | Action |
|--------|-----|--------|
| POST | api/v1/customers/{customer}/documents | CustomerController@uploadDocument (permission:customers.update) |
| DELETE | api/v1/customers/{customer}/documents/{document} | CustomerController@deleteDocument (permission:customers.update) |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_10_200005_create_customer_documents_table.php |
| Factory | (none) |
| Seeder | (none) |

### Migration Schema
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| customer_id | FK | constrained, cascadeOnDelete |
| document_type_id | FK | constrained, cascadeOnDelete |
| notes | string(1000) nullable | |
| timestamps | | |

## Tests
| Type | File |
|------|------|
| Feature (via CustomerControllerTest) | tests/Feature/Api/V1/CustomerControllerTest.php |

### Test Coverage (within "Customer Documents" describe block)
- Can upload a document (creates customer_documents record + media)
- Can replace a document for the same type (updateOrCreate ensures one record per type per customer)
- Can delete a document (hard delete confirmed in DB)
- Returns 422 when deleting a non-existent document (customer_id scope check)
- Validates required fields for document upload (document_type_id, document)
- Documents returned in customer detail response (nested in GET /customers/{id})
