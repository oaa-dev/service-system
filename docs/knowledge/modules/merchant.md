# Merchant Module

## Model
- **Path**: `backend/app/Models/Merchant.php`
- **Table**: `merchants`
- **Fillable**: `user_id`, `parent_id`, `business_type_id`, `type`, `name`, `slug`, `description`, `contact_email`, `contact_phone`, `website`, `status`, `status_changed_at`, `status_reason`, `approved_at`, `submitted_at`, `accepted_terms_at`, `terms_version`, `can_sell_products`, `can_take_bookings`, `can_rent_units`, `allow_branch_self_edit`, `average_rating`, `review_count`
- **Defaults** (`$attributes`): type = 'individual', status = 'pending', allow_branch_self_edit = true
- **Casts**:
  - `status_changed_at` -> datetime
  - `approved_at` -> datetime
  - `submitted_at` -> datetime
  - `accepted_terms_at` -> datetime
  - `can_sell_products` -> boolean
  - `can_take_bookings` -> boolean
  - `can_rent_units` -> boolean
- **Relationships**:
  - `user()` -> BelongsTo -> `User`
  - `parent()` -> BelongsTo -> `Merchant` (self-referential, FK: parent_id)
  - `children()` -> HasMany -> `Merchant` (self-referential, FK: parent_id)
  - `businessType()` -> BelongsTo -> `BusinessType`
  - `businessHours()` -> HasMany -> `MerchantBusinessHour` (ordered by day_of_week)
  - `paymentMethods()` -> BelongsToMany -> `PaymentMethod` (pivot: merchant_payment_method, withTimestamps)
  - `socialLinks()` -> HasMany -> `MerchantSocialLink`
  - `documents()` -> HasMany -> `MerchantDocument`
  - `services()` -> HasMany -> `Service`
  - `serviceCategories()` -> HasMany -> `ServiceCategory`
  - `bookings()` -> HasMany -> `Booking`
  - `reservations()` -> HasMany -> `Reservation`
  - `serviceOrders()` -> HasMany -> `ServiceOrder`
  - `statusLogs()` -> HasMany -> `MerchantStatusLog` (ordered by created_at desc)
  - `bookingSlots()` -> HasMany -> `MerchantBookingSlot`
- **Traits**:
  - `HasAddress` (polymorphic address with updateOrCreateAddress())
  - `HasFactory`
  - `InteractsWithMedia` (Spatie Media Library)
- **Scopes**: None (filtering handled in MerchantService via Spatie QueryBuilder)
- **Implements**: `HasMedia` (Spatie)
- **Boot hooks**:
  - `creating`: auto-generates slug from name if empty
  - `updating`: auto-updates slug when name changes (unless slug also explicitly changed)
- **Media Collections** (Spatie Media Library):
  - `logo` -- singleFile, JPEG/PNG/WebP; conversions: thumb (100x100, sharpen 10), preview (400x400, sharpen 10)
  - `gallery_photos` -- multi-file, JPEG/PNG/WebP; conversions: thumb (200x200, sharpen 10), preview (800x600, sharpen 10)
  - `gallery_interiors` -- multi-file, JPEG/PNG/WebP; conversions: thumb (200x200, sharpen 10), preview (800x600, sharpen 10)
  - `gallery_exteriors` -- multi-file, JPEG/PNG/WebP; conversions: thumb (200x200, sharpen 10), preview (800x600, sharpen 10)
  - `gallery_feature` -- singleFile, JPEG/PNG/WebP; conversions: thumb (200x200, sharpen 10), preview (800x600, sharpen 10)
- **Constants**: `GALLERY_COLLECTIONS` -- maps keys (photos, interiors, exteriors, feature) to collection names (gallery_photos, gallery_interiors, gallery_exteriors, gallery_feature)

## Connected Files

| Category | File | Notes |
|----------|------|-------|
| Controller (admin) | `backend/app/Http/Controllers/Api/V1/MerchantController.php` | Full CRUD, logo/gallery/document/business-hours/payment-methods/social-links/account/status/branches |
| Controller (self-service) | `backend/app/Http/Controllers/Api/V1/MyMerchantController.php` | Merchant resolves from `$request->user()->merchant`; mirrors MerchantController actions plus onboarding-specific endpoints |
| Controller (booking slots) | `backend/app/Http/Controllers/Api/V1/MerchantBookingSlotController.php` | Dual-mode: self-service (no merchant param) + admin (with merchant param); index, store, show, update, destroy |
| Service Interface | `backend/app/Services/Contracts/MerchantServiceInterface.php` | Contract for all MerchantService methods |
| Service | `backend/app/Services/MerchantService.php` | All business logic: CRUD, status workflow (VALID_TRANSITIONS), onboarding checklist, stats, branches, business hours, payment methods sync, social links sync, documents, service CRUD, service schedules |
| Service (booking slots) | `backend/app/Services/MerchantBookingSlotService.php` | getMerchantSlots, getMerchantSlotById, createSlot (with unique constraint check), updateSlot, deleteSlot, getMerchantActiveSlotsByDow, merchantHasActiveSlots |
| Service Interface (booking slots) | `backend/app/Services/Contracts/MerchantBookingSlotServiceInterface.php` | — |
| Repository Interface | `backend/app/Repositories/Contracts/MerchantRepositoryInterface.php` | Extends BaseRepositoryInterface |
| Repository | `backend/app/Repositories/MerchantRepository.php` | Extends BaseRepository; adds findBySlug, findByUserId, getActive |
| Repository (booking slots) | `backend/app/Repositories/MerchantBookingSlotRepository.php` | getAllForMerchant (ordered day_of_week→sort_order→start_time), findOrFailForMerchant, getActiveByDow, hasActiveSlots |
| Repository Interface (booking slots) | `backend/app/Repositories/Contracts/MerchantBookingSlotRepositoryInterface.php` | — |
| DTO | `backend/app/Data/MerchantData.php` | Spatie Laravel Data; all fields Optional; includes nested AddressData, capability booleans |
| DTO (booking slots) | `backend/app/Data/MerchantBookingSlotData.php` | day_of_week, start_time, end_time (nullable), max_capacity (nullable), is_active, sort_order |
| Resource | `backend/app/Http/Resources/Api/V1/MerchantResource.php` | Full serializer with whenLoaded for all relations (user, businessType, address, parent, paymentMethods, socialLinks, documents, businessHours, children, statusLogs), logo URL generation, children_count, average_rating, review_count |
| Resource (booking slots) | `backend/app/Http/Resources/Api/V1/MerchantBookingSlotResource.php` | id, merchant_id, day_of_week, start_time, end_time, max_capacity, is_active, sort_order, timestamps |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/StoreMerchantRequest.php` | Admin create: user_first_name, user_last_name, user_email, user_password + merchant fields |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/UpdateMerchantRequest.php` | Admin update |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/UpdateMyMerchantRequest.php` | Self-service update (subset of fields) |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/UpdateMerchantStatusRequest.php` | Status transition: status, status_reason |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/UpdateMerchantAccountRequest.php` | Update merchant's linked user email/password |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/UploadMerchantLogoRequest.php` | Logo file upload |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/UploadMerchantGalleryImageRequest.php` | Gallery image upload |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/UploadMerchantDocumentRequest.php` | Document file upload |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/UpdateBusinessHoursRequest.php` | Bulk business hours upsert |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/SyncPaymentMethodsRequest.php` | Payment method ID array sync |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/SyncSocialLinksRequest.php` | Social links delete-and-recreate sync |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/StoreBranchRequest.php` | Create branch: user_name, user_email, user_password + merchant fields |
| FormRequest | `backend/app/Http/Requests/Api/V1/Merchant/UpdateBranchRequest.php` | Update branch |
| FormRequest (booking slots) | `backend/app/Http/Requests/Api/V1/BookingSlot/StoreMerchantBookingSlotRequest.php` | Create slot validation |
| FormRequest (booking slots) | `backend/app/Http/Requests/Api/V1/BookingSlot/UpdateMerchantBookingSlotRequest.php` | Update slot validation |
| Model (booking slots) | `backend/app/Models/MerchantBookingSlot.php` | merchant_id, day_of_week, start_time, end_time (nullable), max_capacity (nullable), is_active, sort_order; unique([merchant_id, day_of_week, start_time]); index([merchant_id, day_of_week, is_active]) |
| Middleware | `backend/app/Http/Middleware/EnsureActiveMerchant.php` | Blocks merchant/branch-merchant roles if status not active or approved; admin/super-admin bypass |
| Notification | `backend/app/Notifications/MerchantStatusChangedNotification.php` | DB + mail notification to merchant user on status change |
| Notification | `backend/app/Notifications/MerchantApplicationSubmittedNotification.php` | DB + mail notification to all admins on application submission |
| Trait | `backend/app/Traits/HasAddress.php` | Polymorphic address relationship; provides updateOrCreateAddress() |
| Provider Binding | `backend/app/Providers/RepositoryServiceProvider.php` | MerchantRepositoryInterface -> MerchantRepository; MerchantServiceInterface -> MerchantService; MerchantBookingSlotRepositoryInterface -> MerchantBookingSlotRepository; MerchantBookingSlotServiceInterface -> MerchantBookingSlotService |

## Routes

### Admin routes (prefix: `/api/v1`, auth + verified + onboarded)

| Method | URI | Action | Permission |
|--------|-----|--------|------------|
| GET | `merchants` | MerchantController@index | merchants.view |
| GET | `merchants/all` | MerchantController@all | -- (auth only) |
| GET | `merchants/{merchant}` | MerchantController@show | merchants.view |
| GET | `merchants/{merchant}/gallery` | MerchantController@getGallery | merchants.view |
| GET | `merchants/{merchant}/status-logs` | MerchantController@statusLogs | merchants.view |
| GET | `merchants/{merchant}/branches` | MerchantController@branches | merchants.view |
| GET | `merchants/{merchant}/branches/{branch}` | MerchantController@showBranch | merchants.view |
| POST | `merchants` | MerchantController@store | merchants.create |
| POST | `merchants/{merchant}/branches` | MerchantController@storeBranch | merchants.create |
| PUT | `merchants/{merchant}` | MerchantController@update | merchants.update |
| PUT | `merchants/{merchant}/account` | MerchantController@updateAccount | merchants.update |
| PUT | `merchants/{merchant}/branches/{branch}` | MerchantController@updateBranch | merchants.update |
| PUT | `merchants/{merchant}/business-hours` | MerchantController@updateBusinessHours | merchants.update |
| POST | `merchants/{merchant}/payment-methods` | MerchantController@syncPaymentMethods | merchants.update |
| POST | `merchants/{merchant}/social-links` | MerchantController@syncSocialLinks | merchants.update |
| POST | `merchants/{merchant}/documents` | MerchantController@uploadDocument | merchants.update |
| DELETE | `merchants/{merchant}/documents/{document}` | MerchantController@deleteDocument | merchants.update |
| POST | `merchants/{merchant}/logo` | MerchantController@uploadLogo | merchants.update |
| DELETE | `merchants/{merchant}/logo` | MerchantController@deleteLogo | merchants.update |
| POST | `merchants/{merchant}/gallery/{collection}` | MerchantController@uploadGalleryImage | merchants.update |
| DELETE | `merchants/{merchant}/gallery/{media}` | MerchantController@deleteGalleryImage | merchants.update |
| PATCH | `merchants/{merchant}/status` | MerchantController@updateStatus | merchants.update_status |
| DELETE | `merchants/{merchant}` | MerchantController@destroy | merchants.delete |
| DELETE | `merchants/{merchant}/branches/{branch}` | MerchantController@destroyBranch | merchants.delete |
| GET | `merchants/{merchant}/booking-slots` | MerchantBookingSlotController@index | merchants.update |
| POST | `merchants/{merchant}/booking-slots` | MerchantBookingSlotController@store | merchants.update |
| PUT | `merchants/{merchant}/booking-slots/{slot}` | MerchantBookingSlotController@update | merchants.update |
| DELETE | `merchants/{merchant}/booking-slots/{slot}` | MerchantBookingSlotController@destroy | merchants.update |

### Self-service routes (prefix: `/api/v1/auth/merchant`, auth + verified + onboarded)

| Method | URI | Action |
|--------|-----|--------|
| GET | `auth/merchant` | MyMerchantController@show |
| GET | `auth/merchant/stats` | MyMerchantController@stats |
| GET | `auth/merchant/onboarding-checklist` | MyMerchantController@onboardingChecklist |
| GET | `auth/merchant/status-logs` | MyMerchantController@statusLogs |
| POST | `auth/merchant/submit-application` | MyMerchantController@submitApplication |
| PUT | `auth/merchant` | MyMerchantController@update |
| POST | `auth/merchant/logo` | MyMerchantController@uploadLogo |
| DELETE | `auth/merchant/logo` | MyMerchantController@deleteLogo |
| PUT | `auth/merchant/business-hours` | MyMerchantController@updateBusinessHours |
| POST | `auth/merchant/payment-methods` | MyMerchantController@syncPaymentMethods |
| POST | `auth/merchant/social-links` | MyMerchantController@syncSocialLinks |
| POST | `auth/merchant/documents` | MyMerchantController@uploadDocument |
| DELETE | `auth/merchant/documents/{document}` | MyMerchantController@deleteDocument |
| GET | `auth/merchant/branches` | MyMerchantController@branches |
| POST | `auth/merchant/branches` | MyMerchantController@storeBranch |
| GET | `auth/merchant/branches/{branch}` | MyMerchantController@showBranch |
| PUT | `auth/merchant/branches/{branch}` | MyMerchantController@updateBranch |
| DELETE | `auth/merchant/branches/{branch}` | MyMerchantController@destroyBranch |
| GET | `auth/merchant/gallery` | MyMerchantController@getGallery (requires merchant.active) |
| POST | `auth/merchant/gallery/{collection}` | MyMerchantController@uploadGalleryImage (requires merchant.active) |
| DELETE | `auth/merchant/gallery/{media}` | MyMerchantController@deleteGalleryImage (requires merchant.active) |
| GET | `auth/merchant/booking-slots` | MerchantBookingSlotController@index |
| POST | `auth/merchant/booking-slots` | MerchantBookingSlotController@store |
| GET | `auth/merchant/booking-slots/{slot}` | MerchantBookingSlotController@show |
| PUT | `auth/merchant/booking-slots/{slot}` | MerchantBookingSlotController@update |
| DELETE | `auth/merchant/booking-slots/{slot}` | MerchantBookingSlotController@destroy |

### Public routes (Storefront)

| Method | URI | Action |
|--------|-----|--------|
| GET | `storefront/merchants` | StorefrontController@merchants |
| GET | `storefront/merchants/{slug}` | StorefrontController@merchantDetail |
| GET | `storefront/merchants/{slug}/services` | StorefrontController@merchantServices |
| GET | `storefront/merchants/{slug}/services/{service}` | StorefrontController@serviceDetail |
| GET | `storefront/merchants/{slug}/services/{service}/booking-availability?month=YYYY-MM` | StorefrontController@bookingAvailability (month-based) |
| GET | `storefront/merchants/{slug}/services/{service}/booking-availability?date=YYYY-MM-DD` | StorefrontController@bookingAvailability (date-based slot picker) |

## Status Workflow

Valid transitions defined in `MerchantService::VALID_TRANSITIONS`:
- pending -> submitted
- submitted -> approved | rejected
- approved -> active | suspended
- active -> suspended
- rejected -> pending
- suspended -> active

## Capability Flags

| Flag | Description |
|------|-------------|
| can_sell_products | Enables ServiceOrder (orders) sub-module |
| can_take_bookings | Enables Booking sub-module + Booking Slots tab in settings |
| can_rent_units | Enables Unit/Reservation sub-module |

Capabilities are copied from BusinessType on merchant creation or when business_type_id changes; they can be edited independently afterward.

## Booking Slots Sub-Module

`MerchantBookingSlot` model (table: `merchant_booking_slots`):
- **Purpose**: Named time slots merchants define per day-of-week (e.g., "Monday 9:00 AM slot"). Customers select a slot when booking instead of picking arbitrary times.
- **Unique constraint**: `[merchant_id, day_of_week, start_time]` — enforced at DB level and service level (ValidationException on duplicate)
- **Ordering**: getAllForMerchant orders by day_of_week → sort_order → start_time
- **Dual-mode controller**: `MerchantBookingSlotController::resolveMerchantId()` returns `$merchant->id` if admin route, else `$request->user()->merchant->id` for self-service
- **Calendar integration**: `BookingService::getBookingCalendar()` reads active slots, grouping by day_of_week; each calendar day shows `has_slots`, `slots[]` with per-slot booking counts
- **Customer booking**: `CreateBookingRequest` accepts optional `booking_slot_id`; `BookingService::createBooking()` validates slot belongs to merchant, is active, checks capacity, and overrides start/end time from slot

## Onboarding Checklist

`MerchantService::getOnboardingChecklist()` returns items:
1. account_created (always true)
2. email_verified (User.email_verified_at set)
3. business_type_selected (business_type_id not null)
4. capabilities_configured (at least one capability flag true)
5. business_details_completed (name, contact_email, description, address all present)
6. logo_uploaded (has media in logo collection)
7. documents_uploaded (has at least one MerchantDocument)
8. application_submitted (status in submitted/approved/active)
9. admin_approved (status in approved/active)

## Database

| Type | File |
|------|------|
| Migration (create) | `backend/database/migrations/2026_02_08_100001_create_merchants_table.php` |
| Migration (payment method pivot) | `backend/database/migrations/2026_02_08_100003_create_merchant_payment_method_table.php` |
| Migration (capabilities) | `backend/database/migrations/2026_02_10_200007_add_capabilities_to_merchants_table.php` |
| Migration (submitted_at) | `backend/database/migrations/2026_02_15_000002_add_submitted_at_to_merchants_table.php` |
| Migration (submitted status) | `backend/database/migrations/2026_02_15_000003_add_submitted_status_to_merchants_table.php` |
| Migration (user_id nullable) | `backend/database/migrations/2026_02_15_100001_make_merchant_user_id_nullable.php` |
| Migration (drop can_take_orders) | `backend/database/migrations/2026_02_12_100001_drop_can_take_orders_from_business_types_and_merchants.php` |
| Migration (booking slots table) | `backend/database/migrations/2026_03_02_200000_create_merchant_booking_slots_table.php` |
| Factory | `backend/database/factories/MerchantFactory.php` |
| Factory (booking slots) | `backend/database/factories/MerchantBookingSlotFactory.php` |
| Seeder | -- (no dedicated merchant seeder; UserSeeder creates demo users that can be associated) |

### Factory States
- `individual()` -- type = 'individual'
- `organization()` -- type = 'organization'
- `withStatus(string)` -- arbitrary status + status_changed_at
- `approved()` -- status = 'approved', approved_at set
- `active()` -- status = 'active', approved_at set
- `rejected()` -- status = 'rejected', status_reason set
- `suspended()` -- status = 'suspended', status_reason set
- `submitted()` -- submitted_at set
- `branchWithUser(int $parentId)` -- parent_id set, auto-active with user

## Tests

| Type | File |
|------|------|
| Feature -- Admin CRUD + sub-entities | `backend/tests/Feature/Api/V1/MerchantControllerTest.php` |
| Feature -- Self-service | `backend/tests/Feature/Api/V1/MyMerchantControllerTest.php` |
| Feature -- Branch management | `backend/tests/Feature/Api/V1/MyMerchantBranchTest.php` |
| Feature -- Gallery | `backend/tests/Feature/Api/V1/MerchantGalleryTest.php` |
| Feature -- Status logs | `backend/tests/Feature/Api/V1/MerchantStatusLogTest.php` |
| Feature -- Merchant type selection | `backend/tests/Feature/Api/V1/SelectMerchantTypeTest.php` |
| Feature -- Submit application | `backend/tests/Feature/Api/V1/SubmitApplicationTest.php` |
| Feature -- Onboarding checklist | `backend/tests/Feature/Api/V1/OnboardingChecklistTest.php` |
| Feature -- Storefront | `backend/tests/Feature/Api/V1/StorefrontControllerTest.php` |
| Feature -- Booking slots | `backend/tests/Feature/Api/V1/MerchantBookingSlotTest.php` |

## Notes
- Dual controller pattern: `MerchantController` (admin CRUD at `merchants/{merchant}/`) and `MyMerchantController` (self-service at `auth/merchant/`). Self-service auto-resolves merchant from `$request->user()->merchant`. Both share the same `MerchantService`.
- `MerchantController::store` creates the merchant inside a `DB::transaction` that also creates the user account, assigns 'merchant' role, and copies capability flags from BusinessType.
- Branch management: only `organization` type merchants can have branches. Branches inherit business_type_id and capability flags from parent. Branches created with a user account are auto-activated.
- `MerchantService::getMerchantById` eagerly loads all relations: user, businessType, address (with geo), paymentMethods, socialLinks.socialPlatform, documents.documentType, documents.media, businessHours, media.
- `MerchantService::getAllMerchants` filters: partial name, exact type/status/business_type_id/user_id, search (name+contact_email+contact_phone). Sorts: id, name, type, status, created_at.
- `destroy()` uses try-catch wrapping with 422 response on error (not 404).
- `deleteBranch` also cleans up the associated user account (deletes tokens and user).
- Storefront routes provide public read-only access to active merchants by slug.
- `MerchantBookingSlotController` is dual-mode: resolves merchant from route param (admin) or from `auth()->user()->merchant` (self-service); no separate controller needed.
