# Frontend My Store Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(my-store)/my-store/page.tsx` | Page | Conditional dashboard: ActiveDashboard (active/approved) or OnboardingDashboard |
| `frontend/app/(system)/(my-store)/my-store/active-dashboard.tsx` | Component | Active merchant dashboard with stats (bookings, reservations, orders, services) |
| `frontend/app/(system)/(my-store)/my-store/onboarding-dashboard.tsx` | Component | Onboarding checklist, progress bar, status banner, submit application button |
| `frontend/app/(system)/(my-store)/my-store/settings/page.tsx` | Page | Tabbed settings: Details, Business Hours, Payment Methods, Social Links, Documents |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-details-tab.tsx` | Component | Edit own merchant details, logo, address, capabilities |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-business-hours-tab.tsx` | Component | 7-day weekly business hours editor |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-payment-methods-tab.tsx` | Component | Checkbox sync of accepted payment methods |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-social-links-tab.tsx` | Component | Add/remove social platform links |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-documents-tab.tsx` | Component | Upload/delete merchant documents with download links |
| `frontend/app/(system)/(my-store)/my-store/categories/page.tsx` | Page | Service category CRUD for own merchant |
| `frontend/app/(system)/(my-store)/my-store/categories/create-service-category-dialog.tsx` | Component | Create category dialog |
| `frontend/app/(system)/(my-store)/my-store/categories/edit-service-category-dialog.tsx` | Component | Edit category dialog |
| `frontend/app/(system)/(my-store)/my-store/services/page.tsx` | Page | Service management for own merchant |
| `frontend/app/(system)/(my-store)/my-store/gallery/page.tsx` | Page | Gallery management (photos, interiors, exteriors, feature) |
| `frontend/app/(system)/(my-store)/my-store/bookings/page.tsx` | Page | Booking management for own merchant |
| `frontend/app/(system)/(my-store)/my-store/orders/page.tsx` | Page | Order management for own merchant |
| `frontend/app/(system)/(my-store)/my-store/reservations/page.tsx` | Page | Reservation management for own merchant |
| `frontend/app/(system)/(my-store)/my-store/branches/page.tsx` | Page | Branch management with create/edit dialogs, address form |
| `frontend/app/(system)/(my-store)/my-store/application-log/page.tsx` | Page | Application status history with timeline and status banner |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/myMerchantService.ts` | Self-service API calls (my merchant CRUD, gallery, branches, stats, checklist, submit) |
| Hook | `hooks/useMyMerchant.ts` | useMyMerchant, useUpdateMyMerchant, useUploadMyMerchantLogo, useDeleteMyMerchantLogo, useUpdateMyBusinessHours, useSyncMyPaymentMethods, useSyncMySocialLinks, useUploadMyDocument, useDeleteMyDocument, useMyMerchantGallery, useUploadMyGalleryImage, useDeleteMyGalleryImage, useMyBranches, useCreateMyBranch, useUpdateMyBranch, useDeleteMyBranch, useMyMerchantStats, useMyOnboardingChecklist, useSubmitMyApplication, useMyMerchantStatusLogs |
| Hook | `hooks/useBookings.ts` | useBookings, useUpdateBookingStatus (reused from merchants module) |
| Hook | `hooks/useReservations.ts` | useReservations, useUpdateReservationStatus (reused) |
| Hook | `hooks/useServiceOrders.ts` | useServiceOrders, useUpdateServiceOrderStatus (reused) |
| Hook | `hooks/useServiceCategories.ts` | useServiceCategories, useCreateServiceCategory, useUpdateServiceCategory, useDeleteServiceCategory |
| Hook | `hooks/useMerchants.ts` | useMerchantServices, useDeleteMerchantService (reused for service management) |
| Hook | `hooks/useBusinessTypes.ts` | useActiveBusinessTypes (for details tab business type selector) |
| Hook | `hooks/usePaymentMethods.ts` | useActivePaymentMethods (for payment methods tab) |
| Hook | `hooks/useSocialPlatforms.ts` | useActiveSocialPlatforms (for social links tab) |
| Hook | `hooks/useDocumentTypes.ts` | useActiveDocumentTypes (for documents tab) |
| Store | `stores/authStore.ts` | user.merchant (determines dashboard view, merchant ID for API calls) |
| Type | `types/api.ts` | Merchant, MerchantStatus, merchantStatusLabels, BranchQueryParams, StoreBranchRequest, UpdateBranchRequest, Booking, BookingStatus, Reservation, ReservationStatus, ServiceOrder, ServiceOrderStatus, ServiceCategory, GalleryImage |
| Validation | `lib/validations.ts` | updateMerchantSchema, createServiceCategorySchema, updateServiceCategorySchema, createBranchSchema, updateBranchSchema |
| Component | `components/address-form-fields.tsx` | Cascading geographic dropdown (used in details tab and branches) |
| Component | `components/merchant-status-banner.tsx` | Status-specific banner (pending, submitted, rejected, suspended) |
| Component | `components/merchant-status-timeline.tsx` | Status change history timeline |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- My-store auto-resolves merchant from `user.merchant` in authStore (no merchant ID in URL)
- Dashboard switches between ActiveDashboard and OnboardingDashboard based on merchant status
- OnboardingDashboard shows a checklist (account_created, email_verified, business_type_selected, capabilities_configured, business_details_completed, logo_uploaded, documents_uploaded, application_submitted) with progress bar
- Bookings/Orders/Reservations pages reuse CreateBookingDialog, CreateOrderDialog, CreateReservationDialog from the merchants module
- System layout restricts access to categories/services/gallery/bookings/reservations/orders for non-active/approved merchants
- Branch merchants are restricted from settings, gallery, application-log, categories, services, and branches pages
- Branches page includes inline create/edit dialogs (not separate pages) with address form fields
