# Frontend Customers Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(customers)/customers/page.tsx` | Page | Customer list with status filters, search, pagination, create/delete actions |
| `frontend/app/(system)/(customers)/customers/create-customer-dialog.tsx` | Component | Create customer dialog with user account fields and tier selection |
| `frontend/app/(system)/(customers)/customers/update-status-dialog.tsx` | Component | Update customer status dialog (active, suspended, banned) |
| `frontend/app/(system)/(customers)/customers/[id]/page.tsx` | Page | Customer detail with tabbed view: Details, Interactions, Account, Documents |
| `frontend/app/(system)/(customers)/customers/[id]/customer-details-tab.tsx` | Component | Edit customer profile, tags sync, avatar upload/crop |
| `frontend/app/(system)/(customers)/customers/[id]/customer-account-tab.tsx` | Component | Edit customer user email/password |
| `frontend/app/(system)/(customers)/customers/[id]/customer-interactions-tab.tsx` | Component | Customer interaction log with create/delete |
| `frontend/app/(system)/(customers)/customers/[id]/customer-documents-tab.tsx` | Component | Upload/delete customer documents by type |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/customerService.ts` | Full CRUD, status update, profile, tags sync, avatar, interactions, documents, account |
| Hook | `hooks/useCustomers.ts` | useCustomers, useCustomer, useCreateCustomer, useDeleteCustomer, useUpdateCustomer, useUpdateCustomerStatus, useUpdateCustomerProfile, useSyncCustomerTags, useUploadCustomerAvatar, useDeleteCustomerAvatar, useCustomerInteractions, useCreateCustomerInteraction, useDeleteCustomerInteraction, useUploadCustomerDocument, useDeleteCustomerDocument, useUpdateCustomerAccount, useCustomerProfile, useUpdateCustomerPreferences |
| Hook | `hooks/useCustomerTags.ts` | useActiveCustomerTags (for tag sync in details tab) |
| Hook | `hooks/useDocumentTypes.ts` | useActiveDocumentTypes (for documents tab) |
| Type | `types/api.ts` | Customer, CustomerStatus, CustomerQueryParams, CustomerInteractionQueryParams |
| Validation | `lib/validations.ts` | createCustomerSchema, updateCustomerSchema, updateCustomerProfileSchema, updateCustomerStatusSchema, createCustomerInteractionSchema, updateCustomerPreferencesSchema |
| Component | `components/permission-gate.tsx` | Permission-based conditional rendering |
| Component | `components/avatar-crop-dialog.tsx` | Image crop for customer avatar |
| Component | `components/ui/data-table-filters.tsx` | Reusable filter bar |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- Customer statuses: active, suspended, banned with color-coded badges
- Customer tiers: regular, silver, gold, platinum with color-coded badges
- Details tab combines customer profile editing with tag management (checkbox sync) and avatar upload
- Interactions tab provides a CRM-style log with type badges and timestamped entries
- Documents tab reuses the same pattern as merchant documents (select document type, upload file)
- Account tab follows the same pattern as merchant account tab (email + optional password reset)
