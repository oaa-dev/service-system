# MerchantDocument Module

## Model
- **Path**: `app/Models/MerchantDocument.php`
- **Table**: `merchant_documents`
- **Fillable**: `merchant_id`, `document_type_id`, `notes`
- **Casts**: None
- **Relationships**:
  - `merchant()` -> BelongsTo -> `Merchant`
  - `documentType()` -> BelongsTo -> `DocumentType`
- **Traits**: `InteractsWithMedia` (Spatie Media Library)
- **Scopes**: None
- **Implements**: `HasMedia` (Spatie)
- **Media Collections**:
  - `document` -- singleFile; no MIME type restriction at collection level (PDFs + images accepted); validated in UploadMerchantDocumentRequest

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Parent model | `app/Models/Merchant.php` | documents() HasMany |
| Related model | `app/Models/DocumentType.php` | BelongsTo from MerchantDocument |
| Service | `app/Services/MerchantService.php` | createDocument() using updateOrCreate keyed on document_type_id; deleteDocument() clears media then deletes record |
| Resource | `app/Http/Resources/Api/V1/MerchantDocumentResource.php` | Returns id, document_type_id, notes, document_type (DocumentTypeResource whenLoaded), file (url, name, size, mime_type from media relation), timestamps |
| FormRequest | `app/Http/Requests/Api/V1/Merchant/UploadMerchantDocumentRequest.php` | Validates document (file, max 10MB, mimes: pdf/jpg/jpeg/png), document_type_id (exists in document_types), notes (nullable string) |
| Controller (admin) | `app/Http/Controllers/Api/V1/MerchantController.php` | uploadDocument(), deleteDocument() actions |
| Controller (self-service) | `app/Http/Controllers/Api/V1/MyMerchantController.php` | uploadDocument(), deleteDocument() actions |

## Routes

| Method | URI | Middleware | Action | Permission |
|--------|-----|------------|--------|------------|
| POST | `api/v1/merchants/{merchant}/documents` | auth:api, ensure.verified, onboarding | MerchantController@uploadDocument | merchants.update |
| DELETE | `api/v1/merchants/{merchant}/documents/{document}` | auth:api, ensure.verified, onboarding | MerchantController@deleteDocument | merchants.update |
| POST | `api/v1/auth/merchant/documents` | auth:api, ensure.verified, onboarding | MyMerchantController@uploadDocument | -- |
| DELETE | `api/v1/auth/merchant/documents/{document}` | auth:api, ensure.verified, onboarding | MyMerchantController@deleteDocument | -- |

## Database

| Type | File |
|------|------|
| Migration (create) | `database/migrations/2026_02_08_100005_create_merchant_documents_table.php` |
| Factory | -- (none) |
| Seeder | -- (none) |

## Tests

| Type | File |
|------|------|
| Feature (via MerchantControllerTest) | `tests/Feature/Api/V1/MerchantControllerTest.php` |
| Feature (via MyMerchantControllerTest) | `tests/Feature/Api/V1/MyMerchantControllerTest.php` |

## Notes
- Composite unique constraint on `[merchant_id, document_type_id]` -- one document record per document type per merchant.
- `MerchantService::createDocument()` uses `updateOrCreate` keyed on `document_type_id`, so re-uploading a document of the same type replaces the metadata record. The file itself is replaced because the `document` media collection uses `singleFile()`.
- `MerchantService::deleteDocument()` first calls `$document->clearMediaCollection('document')` to remove the file, then deletes the database record.
- Does **not** use `ImageRule`; accepts PDF + images validated in the request directly (standard Laravel file validation, not Spatie ImageRule).
- The upload flow is two-step in the controller: first `createDocument()` creates/updates the DB record, then `$document->addMediaFromRequest('document')->toMediaCollection('document')` attaches the file.
- After upload, the controller loads `documentType` and `media` relations before returning the response.
- No dedicated controller, repository, or service -- all operations go through `MerchantService` via `MerchantController` and `MyMerchantController`.
- The `MerchantResource` includes documents as a `whenLoaded` conditional relation using `MerchantDocumentResource::collection()`.
- `MerchantService::getMerchantById()` eagerly loads `documents.documentType` and `documents.media` as part of its standard relation set.
- The `MerchantDocumentResource` renders the file info (url, name, size, mime_type) by checking if the `media` relation is loaded and calling `getFirstMedia('document')`.
- The onboarding checklist (`MerchantService::getOnboardingChecklist`) checks `$merchant->documents->isNotEmpty()` as one of its completion criteria.
