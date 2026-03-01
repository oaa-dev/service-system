# Frontend Settings Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(settings)/payment-methods/page.tsx` | Page | Payment methods CRUD list |
| `frontend/app/(system)/(settings)/payment-methods/create-payment-method-dialog.tsx` | Component | Create payment method dialog |
| `frontend/app/(system)/(settings)/payment-methods/edit-payment-method-dialog.tsx` | Component | Edit payment method dialog |
| `frontend/app/(system)/(settings)/document-types/page.tsx` | Page | Document types CRUD list |
| `frontend/app/(system)/(settings)/document-types/create-document-type-dialog.tsx` | Component | Create document type dialog |
| `frontend/app/(system)/(settings)/document-types/edit-document-type-dialog.tsx` | Component | Edit document type dialog |
| `frontend/app/(system)/(settings)/business-types/page.tsx` | Page | Business types CRUD list |
| `frontend/app/(system)/(settings)/business-types/create-business-type-dialog.tsx` | Component | Create business type dialog with capability flags |
| `frontend/app/(system)/(settings)/business-types/edit-business-type-dialog.tsx` | Component | Edit business type dialog with field linker |
| `frontend/app/(system)/(settings)/business-types/field-linker.tsx` | Component | Link custom fields to business type (is_required, sort_order) |
| `frontend/app/(system)/(settings)/social-platforms/page.tsx` | Page | Social platforms CRUD list |
| `frontend/app/(system)/(settings)/social-platforms/create-social-platform-dialog.tsx` | Component | Create social platform dialog |
| `frontend/app/(system)/(settings)/social-platforms/edit-social-platform-dialog.tsx` | Component | Edit social platform dialog |
| `frontend/app/(system)/(settings)/customer-tags/page.tsx` | Page | Customer tags CRUD list |
| `frontend/app/(system)/(settings)/customer-tags/create-customer-tag-dialog.tsx` | Component | Create customer tag dialog |
| `frontend/app/(system)/(settings)/customer-tags/edit-customer-tag-dialog.tsx` | Component | Edit customer tag dialog |
| `frontend/app/(system)/(settings)/fields/page.tsx` | Page | Custom fields CRUD list |
| `frontend/app/(system)/(settings)/fields/create-field-dialog.tsx` | Component | Create field with type selection, values for select/radio/checkbox, default value |
| `frontend/app/(system)/(settings)/fields/edit-field-dialog.tsx` | Component | Edit field with type-specific value management |
| `frontend/app/(system)/(settings)/platform-fees/page.tsx` | Page | Platform fees CRUD list |
| `frontend/app/(system)/(settings)/platform-fees/create-platform-fee-dialog.tsx` | Component | Create platform fee with transaction type, fee type, amount |
| `frontend/app/(system)/(settings)/platform-fees/edit-platform-fee-dialog.tsx` | Component | Edit platform fee dialog |
| `frontend/app/(system)/(settings)/roles/page.tsx` | Page | Roles list with permission count |
| `frontend/app/(system)/(settings)/roles/create/page.tsx` | Page | Create role with grouped permissions checkboxes |
| `frontend/app/(system)/(settings)/roles/[id]/edit/page.tsx` | Page | Edit role with grouped permissions checkboxes |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/paymentMethodService.ts` | CRUD for payment methods |
| Service | `services/documentTypeService.ts` | CRUD for document types |
| Service | `services/businessTypeService.ts` | CRUD + field sync for business types |
| Service | `services/socialPlatformService.ts` | CRUD for social platforms |
| Service | `services/customerTagService.ts` | CRUD for customer tags |
| Service | `services/fieldService.ts` | CRUD for custom fields |
| Service | `services/platformFeeService.ts` | CRUD for platform fees |
| Service | `services/roleService.ts` | CRUD for roles + permissions list |
| Hook | `hooks/usePaymentMethods.ts` | usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod, useActivePaymentMethods |
| Hook | `hooks/useDocumentTypes.ts` | useDocumentTypes, useCreateDocumentType, useUpdateDocumentType, useDeleteDocumentType, useActiveDocumentTypes |
| Hook | `hooks/useBusinessTypes.ts` | useBusinessTypes, useCreateBusinessType, useUpdateBusinessType, useDeleteBusinessType, useActiveBusinessTypes, useSyncBusinessTypeFields, useBusinessTypeFields |
| Hook | `hooks/useSocialPlatforms.ts` | useSocialPlatforms, useCreateSocialPlatform, useUpdateSocialPlatform, useDeleteSocialPlatform, useActiveSocialPlatforms |
| Hook | `hooks/useCustomerTags.ts` | useCustomerTags, useCreateCustomerTag, useUpdateCustomerTag, useDeleteCustomerTag, useActiveCustomerTags |
| Hook | `hooks/useFields.ts` | useFields, useCreateField, useUpdateField, useDeleteField, useActiveFields |
| Hook | `hooks/usePlatformFees.ts` | usePlatformFees, useCreatePlatformFee, useUpdatePlatformFee, useDeletePlatformFee |
| Hook | `hooks/useRoles.ts` | useRoles, useRole, useCreateRole, useUpdateRole, useDeleteRole, useAllRoles, usePermissionsGrouped |
| Type | `types/api.ts` | PaymentMethod, PaymentMethodQueryParams, DocumentType, DocumentTypeQueryParams, BusinessType, BusinessTypeQueryParams, BusinessTypeField, SocialPlatform, SocialPlatformQueryParams, CustomerTag, CustomerTagQueryParams, Field, FieldQueryParams, CreateFieldRequest, UpdateFieldRequest, PlatformFee, PlatformFeeQueryParams, Role, RoleQueryParams |
| Validation | `lib/validations.ts` | createPaymentMethodSchema, updatePaymentMethodSchema, createDocumentTypeSchema, updateDocumentTypeSchema, createBusinessTypeSchema, updateBusinessTypeSchema, createSocialPlatformSchema, updateSocialPlatformSchema, createCustomerTagSchema, updateCustomerTagSchema, createFieldSchema, updateFieldSchema, createPlatformFeeSchema, updatePlatformFeeSchema, createRoleSchema, updateRoleSchema |
| Component | `components/permission-gate.tsx` | Permission-based conditional rendering |
| Component | `components/ui/data-table-filters.tsx` | Reusable filter bar |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- All 8 settings modules follow the same pattern: list page with table, create/edit dialogs, delete confirmation
- Business type edit dialog includes FieldLinker component for linking custom fields (saves with parent form, no separate save)
- Fields module supports 4 types: input, select, checkbox, radio; config JSON stores type-specific settings
- Field values (for select/radio/checkbox) have label auto-derived from value
- Platform fees have 3 transaction types: booking, reservation, sell_product; 2 fee types: percentage, fixed
- Roles module uses full-page create/edit (not dialogs) with grouped permissions checkboxes
- All list pages include DataTableFilters with search, pagination, and per-page selection
