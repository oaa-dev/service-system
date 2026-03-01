# Service Module

## Model
- **Path**: app/Models/Service.php
- **Table**: services
- **Fillable**: merchant_id, service_category_id, name, slug, description, price, is_active, service_type, sku, stock_quantity, track_stock, duration, max_capacity, requires_confirmation, price_per_night, floor, unit_status, amenities
- **Casts**:
  - price -> decimal:2
  - is_active -> boolean
  - track_stock -> boolean
  - stock_quantity -> integer
  - duration -> integer
  - max_capacity -> integer
  - requires_confirmation -> boolean
  - price_per_night -> decimal:2
  - amenities -> array
- **Relationships**:
  - merchant -> BelongsTo -> Merchant
  - serviceCategory -> BelongsTo -> ServiceCategory
  - schedules -> HasMany -> ServiceSchedule
  - bookings -> HasMany -> Booking
  - reservations -> HasMany -> Reservation
  - serviceOrders -> HasMany -> ServiceOrder
  - customFieldValues -> HasMany -> BusinessTypeFieldValue
- **Traits**: HasFactory, InteractsWithMedia (Spatie Media Library)
- **Scopes**: none
- **Implements**: HasMedia (Spatie)
- **Boot hooks**:
  - creating: auto-generates slug from name if empty
  - updating: re-generates slug from name if name is dirty and slug is not

### Media Collections
- `image` -- single file, accepts jpeg/png/webp
  - Conversion `thumb`: 200x200, sharpened
  - Conversion `preview`: 600x400, sharpened

### service_type Enum
| Value | Merchant Capability Required | Extra Fields Used |
|-------|------------------------------|-------------------|
| sellable | can_sell_products | sku, stock_quantity, track_stock |
| bookable | can_take_bookings | duration, max_capacity, requires_confirmation |
| reservation | can_rent_units | price_per_night, floor, unit_status, amenities |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/MerchantServiceController.php | CRUD + image upload + schedule management |
| Service (business logic) | app/Services/MerchantService.php | Service CRUD methods live here alongside Merchant methods |
| Service interface | app/Services/Contracts/MerchantServiceInterface.php | getMerchantServices, createMerchantService, updateMerchantService, deleteMerchantService, getServiceSchedules, upsertServiceSchedules |
| DTO | app/Data/ServiceData.php | All fields optional (Spatie LaravelData); includes custom_fields array |
| Form Request (create) | app/Http/Requests/Api/V1/Service/StoreMerchantServiceRequest.php | Capability-gated field validation + custom fields from BusinessTypeField |
| Form Request (update) | app/Http/Requests/Api/V1/Service/UpdateMerchantServiceRequest.php | service_type not changeable on update; reads existing model's service_type for field rules |
| Form Request (image) | app/Http/Requests/Api/V1/Service/UploadServiceImageRequest.php | Uses ImageRule::serviceImage() |
| Form Request (schedules) | app/Http/Requests/Api/V1/Service/UpdateServiceScheduleRequest.php | Bulk schedule upsert validation (array max 7) |
| Resource | app/Http/Resources/Api/V1/ServiceResource.php | Includes whenLoaded serviceCategory, customFieldValues; media URLs (url, thumb, preview) |
| Image config | config/images.php | service_image config key |
| ServiceProvider | app/Providers/RepositoryServiceProvider.php | Binds MerchantServiceInterface (no separate ServiceRepository) |
| Related model | app/Models/ServiceSchedule.php | HasMany via schedules() |
| Related model | app/Models/Booking.php | HasMany via bookings() |
| Related model | app/Models/Reservation.php | HasMany via reservations() |
| Related model | app/Models/ServiceOrder.php | HasMany via serviceOrders() |
| Related model | app/Models/BusinessTypeFieldValue.php | HasMany via customFieldValues() |
| Storefront | app/Http/Controllers/Api/V1/StorefrontController.php | Public merchantServices + serviceDetail endpoints |
| Storefront service | app/Services/StorefrontService.php | Public browsing of active services with filters |
| Storefront interface | app/Services/Contracts/StorefrontServiceInterface.php | getMerchantServices, getServiceDetail |
| Customer portal | app/Http/Controllers/Api/V1/CustomerPortalController.php | createBooking, createReservation, createOrder |
| Customer portal service | app/Services/CustomerPortalService.php | Delegates to booking/reservation/order services |

## Routes
| Method | URI | Action | Middleware |
|--------|-----|--------|-----------|
| GET | /api/v1/merchants/{merchant}/services | index | auth:api, ensure.verified, onboarding, permission:services.view |
| GET | /api/v1/merchants/{merchant}/services/{service} | show | auth:api, ensure.verified, onboarding, permission:services.view |
| POST | /api/v1/merchants/{merchant}/services | store | auth:api, ensure.verified, onboarding, permission:services.create |
| PUT | /api/v1/merchants/{merchant}/services/{service} | update | auth:api, ensure.verified, onboarding, permission:services.update |
| DELETE | /api/v1/merchants/{merchant}/services/{service} | destroy | auth:api, ensure.verified, onboarding, permission:services.delete |
| POST | /api/v1/merchants/{merchant}/services/{service}/image | uploadImage | auth:api, ensure.verified, onboarding, permission:services.update |
| DELETE | /api/v1/merchants/{merchant}/services/{service}/image | deleteImage | auth:api, ensure.verified, onboarding, permission:services.update |
| GET | /api/v1/merchants/{merchant}/services/{service}/schedules | getSchedules | auth:api, ensure.verified, onboarding, permission:services.update |
| PUT | /api/v1/merchants/{merchant}/services/{service}/schedules | updateSchedules | auth:api, ensure.verified, onboarding, permission:services.update |
| GET | /api/v1/storefront/merchants/{slug}/services | merchantServices | public |
| GET | /api/v1/storefront/merchants/{slug}/services/{service} | serviceDetail | public |

## Database
| Type | File |
|------|------|
| Migration (create) | database/migrations/2026_02_09_100002_create_services_table.php |
| Migration (remove duration/sort_order) | database/migrations/2026_02_09_100003_remove_duration_and_sort_order_from_services_table.php |
| Migration (add capability fields) | database/migrations/2026_02_10_200008_add_capability_fields_to_services_table.php |
| Factory | database/factories/ServiceFactory.php |
| Seeder | none |

### Factory States
- `inactive()` -- sets is_active to false
- `sellable()` -- sets service_type to 'sellable'
- `bookable($duration)` -- sets service_type to 'bookable' with duration (default 60 min)
- `reservation($pricePerNight)` -- sets service_type to 'reservation' with floor, unit_status, amenities

## Tests
| Type | File |
|------|------|
| Feature (CRUD + schedules + image + scoping) | tests/Feature/Api/V1/MerchantServiceControllerTest.php |
| Feature (storefront public endpoints) | tests/Feature/Api/V1/StorefrontControllerTest.php |
| Feature (customer portal ordering) | tests/Feature/Api/V1/CustomerPortalControllerTest.php |

## Notes
- Service CRUD methods are implemented inside `MerchantService` / `MerchantServiceInterface`, not in a standalone `ServiceService`. There is no separate ServiceRepository.
- Validation rules in `StoreMerchantServiceRequest` dynamically gate capability-specific fields based on the merchant's `can_sell_products`, `can_take_bookings`, and `can_rent_units` flags.
- `service_type` is set on create and cannot be changed via update; the update request reads the existing model's `service_type` to determine which field rules to apply.
- Custom fields validation in FormRequests queries `BusinessTypeField` table for the merchant's business_type_id and validates accordingly (required/nullable based on `is_required`, type validation based on field type).
- Branch merchants use the parent organization's services when resolving service_id during booking/reservation/order creation (`$serviceMerchantId = $merchant->parent_id ?? $merchantId`).
- Slug is auto-generated from name on create; on update it is only regenerated if name changes but slug is not explicitly provided.
- Storefront service filters: search (name), service_category_id, is_bookable, is_sellable. Sorts: name, price, created_at. Default sort: name ASC.
- Storefront service detail loads: serviceCategory, media, schedules.
