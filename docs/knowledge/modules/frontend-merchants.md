# Frontend Merchants Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(merchants)/merchants/page.tsx` | Page | Merchant list with status filters, search, pagination, CRUD actions |
| `frontend/app/(system)/(merchants)/merchants/create-merchant-dialog.tsx` | Component | Create merchant dialog (name, type, business type, user account fields) |
| `frontend/app/(system)/(merchants)/merchants/update-status-dialog.tsx` | Component | Status transition dialog with valid transitions enforcement |
| `frontend/app/(system)/(merchants)/merchants/[id]/page.tsx` | Page | Merchant detail view with info cards, status timeline, nav to sub-entities |
| `frontend/app/(system)/(merchants)/merchants/[id]/edit/page.tsx` | Page | Tabbed edit page: Details, Payment Methods, Social Links, Documents, Account |
| `frontend/app/(system)/(merchants)/merchants/[id]/edit/merchant-details-tab.tsx` | Component | Edit merchant name, type, business type, description, contact, address, logo |
| `frontend/app/(system)/(merchants)/merchants/[id]/edit/merchant-account-tab.tsx` | Component | Edit merchant owner email/password |
| `frontend/app/(system)/(merchants)/merchants/[id]/edit/merchant-payment-methods-tab.tsx` | Component | Checkbox sync of accepted payment methods |
| `frontend/app/(system)/(merchants)/merchants/[id]/edit/merchant-social-links-tab.tsx` | Component | Add/remove social platform links |
| `frontend/app/(system)/(merchants)/merchants/[id]/edit/merchant-documents-tab.tsx` | Component | Upload/delete merchant documents by document type |
| `frontend/app/(system)/(merchants)/merchants/[id]/services/page.tsx` | Page | Service list for merchant with create/edit/delete, image management |
| `frontend/app/(system)/(merchants)/merchants/[id]/services/create-service-dialog.tsx` | Component | Create service with image crop, custom fields, capability flags |
| `frontend/app/(system)/(merchants)/merchants/[id]/services/edit-service-dialog.tsx` | Component | Edit service with image crop, capability toggles |
| `frontend/app/(system)/(merchants)/merchants/[id]/services/service-schedule-dialog.tsx` | Component | 7-day weekly schedule editor for bookable services |
| `frontend/app/(system)/(merchants)/merchants/[id]/services/custom-fields-renderer.tsx` | Component | Dynamic form fields based on business type EAV configuration |
| `frontend/app/(system)/(merchants)/merchants/[id]/service-categories/page.tsx` | Page | Per-merchant service category CRUD |
| `frontend/app/(system)/(merchants)/merchants/[id]/service-categories/create-service-category-dialog.tsx` | Component | Create category dialog |
| `frontend/app/(system)/(merchants)/merchants/[id]/service-categories/edit-service-category-dialog.tsx` | Component | Edit category dialog |
| `frontend/app/(system)/(merchants)/merchants/[id]/bookings/page.tsx` | Page | Booking list with status management (confirm, complete, no-show, cancel) |
| `frontend/app/(system)/(merchants)/merchants/[id]/bookings/create-booking-dialog.tsx` | Component | Create booking with service selection, date/time, customer info |
| `frontend/app/(system)/(merchants)/merchants/[id]/orders/page.tsx` | Page | Service order list with status workflow management |
| `frontend/app/(system)/(merchants)/merchants/[id]/orders/create-order-dialog.tsx` | Component | Create order with service, quantity, customer info |
| `frontend/app/(system)/(merchants)/merchants/[id]/reservations/page.tsx` | Page | Reservation list with status management (confirm, check-in/out, cancel) |
| `frontend/app/(system)/(merchants)/merchants/[id]/reservations/create-reservation-dialog.tsx` | Component | Create reservation with service, dates, customer info |
| `frontend/app/(system)/(merchants)/merchants/[id]/gallery/page.tsx` | Page | Tabbed gallery (photos, interiors, exteriors, feature) |
| `frontend/app/(system)/(merchants)/merchants/[id]/gallery/gallery-tab.tsx` | Component | Image upload with crop, delete, per-collection management |
| `frontend/app/(system)/(merchants)/merchants/[id]/branches/page.tsx` | Page | Branch list for organization-type merchants |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/merchantService.ts` | Full CRUD, status update, logo, payment methods sync, social links sync, documents, services, gallery, branches |
| Service | `services/bookingService.ts` | CRUD + status update for bookings |
| Service | `services/reservationService.ts` | CRUD + status update for reservations |
| Service | `services/serviceOrderService.ts` | CRUD + status update for service orders |
| Service | `services/serviceCategoryService.ts` | CRUD for per-merchant service categories |
| Hook | `hooks/useMerchants.ts` | useMerchants, useMerchant, useCreateMerchant, useUpdateMerchant, useDeleteMerchant, useUpdateMerchantStatus, useUploadMerchantLogo, useDeleteMerchantLogo, useSyncMerchantPaymentMethods, useSyncMerchantSocialLinks, useUploadMerchantDocument, useDeleteMerchantDocument, useMerchantServices, useCreateMerchantService, useUpdateMerchantService, useDeleteMerchantService, useUploadServiceImage, useDeleteServiceImage, useServiceSchedules, useUpdateServiceSchedules, useAllMerchants, useMerchantGallery, useUploadGalleryImage, useDeleteGalleryImage, useMerchantBranches, useUpdateMerchantAccount, useMerchantStatusLogs |
| Hook | `hooks/useBookings.ts` | useBookings, useCreateBooking, useUpdateBookingStatus |
| Hook | `hooks/useReservations.ts` | useReservations, useCreateReservation, useUpdateReservationStatus |
| Hook | `hooks/useServiceOrders.ts` | useServiceOrders, useCreateServiceOrder, useUpdateServiceOrderStatus |
| Hook | `hooks/useServiceCategories.ts` | useServiceCategories, useCreateServiceCategory, useUpdateServiceCategory, useDeleteServiceCategory, useActiveServiceCategories |
| Hook | `hooks/useBusinessTypes.ts` | useActiveBusinessTypes, useBusinessTypeFields (for custom fields renderer) |
| Hook | `hooks/usePaymentMethods.ts` | useActivePaymentMethods (for payment methods tab) |
| Hook | `hooks/useSocialPlatforms.ts` | useActiveSocialPlatforms (for social links tab) |
| Hook | `hooks/useDocumentTypes.ts` | useActiveDocumentTypes (for documents tab) |
| Type | `types/api.ts` | Merchant, MerchantStatus, MerchantQueryParams, Service, ServiceType, ServiceQueryParams, ServiceSchedule, Booking, BookingStatus, BookingQueryParams, Reservation, ReservationStatus, ReservationQueryParams, ServiceOrder, ServiceOrderStatus, ServiceOrderQueryParams, ServiceCategory, ServiceCategoryQueryParams, GalleryImage, GalleryCollection, BranchQueryParams, BusinessTypeField, merchantStatusLabels, AddressInput |
| Validation | `lib/validations.ts` | createMerchantSchema, updateMerchantSchema, updateMerchantStatusSchema, createServiceSchema, updateServiceSchema, createServiceCategorySchema, updateServiceCategorySchema, createBookingSchema, createReservationSchema, createServiceOrderSchema |
| Component | `components/permission-gate.tsx` | Permission-based conditional rendering for CRUD actions |
| Component | `components/address-form-fields.tsx` | Cascading geographic dropdown (Region/Province/City/Barangay) |
| Component | `components/avatar-crop-dialog.tsx` | Image crop dialog (used for logo and service images) |
| Component | `components/merchant-status-timeline.tsx` | Status change history timeline |
| Component | `components/ui/data-table-filters.tsx` | Reusable filter bar for data tables |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- Merchant detail page conditionally shows nav buttons based on capability flags (can_take_bookings, can_sell_products, can_rent_units) and type (organization hides operational pages)
- Edit page uses tabbed layout for non-branch merchants; branch merchants only see the details tab
- Service create/edit dialogs support image cropping via AvatarCropDialog with cropShape="rect"
- Custom fields renderer dynamically renders form fields (input, select, checkbox, radio) based on business type EAV configuration
- Bookings/Orders/Reservations pages share similar patterns: table with status filters, status transition actions via AlertDialog confirmation
- Gallery page has 4 collections: photos (multiple), interiors (multiple), exteriors (multiple), feature (single)
- Branch page only appears for organization-type merchants
