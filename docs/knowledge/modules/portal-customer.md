# Portal Customer Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend-customer-portal/app/(customer)/layout.tsx` | Layout | Authenticated customer layout with sidebar nav, avatar dropdown, auth guard |
| `frontend-customer-portal/app/(customer)/dashboard/page.tsx` | Page | Customer dashboard with stats cards (bookings, reservations, orders) |
| `frontend-customer-portal/app/(customer)/bookings/page.tsx` | Page | My bookings list with status badges, cancel action, chat button |
| `frontend-customer-portal/app/(customer)/reservations/page.tsx` | Page | My reservations list with status badges, cancel action, chat button |
| `frontend-customer-portal/app/(customer)/orders/page.tsx` | Page | My orders list with status badges, cancel action, chat button |
| `frontend-customer-portal/app/(customer)/profile/page.tsx` | Page | Tabbed profile page: Personal Info / Account / Payment |
| `frontend-customer-portal/app/(customer)/profile/personal-info-tab.tsx` | Component | Edit profile (name, phone, DOB, gender, bio, address), avatar upload/crop/delete |
| `frontend-customer-portal/app/(customer)/profile/account-tab.tsx` | Component | Account status badge, identity verification upload, email display, change password form |
| `frontend-customer-portal/app/(customer)/profile/payment-tab.tsx` | Component | Preferred payment method selection (radio group); locked behind email verification |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/customerDashboardService.ts` | getMyStats, getMyBookings, getMyReservations, getMyOrders, cancelBooking, cancelReservation, cancelOrder |
| Service | `services/customerProfileService.ts` | getMyProfile, updateMyProfile, uploadAvatar, deleteAvatar, changePassword, getMyCustomerRecord, updateMyPreferences, getMyPaymentMethods, updateMyPaymentPreference, uploadIdentityDocument |
| Service | `services/conversationService.ts` | getMessages, sendMessage, markAsRead (scoped to transaction type + id) |
| Hook | `hooks/useCustomerDashboard.ts` | useMyStats, useMyBookings, useMyReservations, useMyOrders, useCancelBooking, useCancelReservation, useCancelOrder |
| Hook | `hooks/useCustomerProfile.ts` | useMyProfile, useMyCustomerRecord, useUpdateMyProfile, useUploadAvatar, useDeleteAvatar, useChangePassword, useUpdateMyPreferences, useMyPaymentMethods, useUpdateMyPaymentPreference, useUploadIdentityDocument |
| Hook | `hooks/useConversation.ts` | useMessages, useSendMessage, useMarkAsRead |
| Component | `components/chat/chat-panel.tsx` | Chat UI embedded in booking/reservation/order detail sheets |
| Type | `types/api.ts` | CustomerProfileData, CustomerRecord (includes identity_document_status, identity_verified_at, identity_document), PaymentMethod, Message, Conversation |
| Store | `stores/authStore.ts` | isAuthenticated, user (auth guard + profile display) |

## Backend API Endpoints (Customer Portal)
All under `auth:api + ensure.verified + onboarding` middleware at prefix `/api/v1/customer/my/`:

| Method | URI | Handler |
|--------|-----|---------|
| GET | /customer/my/bookings | CustomerPortalController@myBookings |
| GET | /customer/my/bookings/{id} | CustomerPortalController@myBooking |
| POST | /customer/my/bookings/{id}/cancel | CustomerPortalController@cancelMyBooking |
| GET | /customer/my/reservations | CustomerPortalController@myReservations |
| GET | /customer/my/reservations/{id} | CustomerPortalController@myReservation |
| POST | /customer/my/reservations/{id}/cancel | CustomerPortalController@cancelMyReservation |
| GET | /customer/my/orders | CustomerPortalController@myOrders |
| GET | /customer/my/orders/{id} | CustomerPortalController@myOrder |
| POST | /customer/my/orders/{id}/cancel | CustomerPortalController@cancelMyOrder |
| GET | /customer/my/stats | CustomerPortalController@myStats |
| GET | /customer/my/payment-methods | CustomerPortalController@getPaymentMethods |
| PUT | /customer/my/payment-preferences | CustomerPortalController@updatePaymentPreferences |
| POST | /customer/my/identity-document | CustomerPortalController@uploadIdentityDocument |
| GET | /customer/my/conversations/{type}/{id}/messages | ConversationController@messages |
| POST | /customer/my/conversations/{type}/{id}/messages | ConversationController@send |
| PATCH | /customer/my/conversations/{type}/{id}/read | ConversationController@markRead |

## Backend Service: CustomerPortalService
| Method | Description |
|--------|-------------|
| createBooking(slug, data) | Resolves active merchant by slug, delegates to BookingService |
| createReservation(slug, data) | Resolves active merchant by slug, delegates to ReservationService |
| createOrder(slug, data) | Resolves active merchant by slug, delegates to ServiceOrderService |
| getMyBookings(request) | Spatie QueryBuilder with customer_id scope; filters: status, date_from, date_to; sort: booking_date, created_at, status |
| getMyBooking(id) | Scope to customer_id, eager-load service, serviceCategory, merchant, address |
| cancelMyBooking(id) | Scope to customer_id; only pending/confirmed can be cancelled; sets status=cancelled, cancelled_at=now |
| getMyReservations(request) | Spatie QueryBuilder with customer_id scope; filters: status, date_from (check_in), date_to (check_out) |
| getMyReservation(id) | Scope to customer_id with full relations |
| cancelMyReservation(id) | Only pending/confirmed can be cancelled |
| getMyOrders(request) | Spatie QueryBuilder; partial search on order_number |
| getMyOrder(id) | Scope to customer_id with full relations |
| cancelMyOrder(id) | Only pending orders can be cancelled |
| getMyStats() | Returns counts: bookings (total, upcoming), reservations (total, active), orders (total, active) |
| getAvailablePaymentMethods(customerId) | Returns all active payment methods + customer's preferred_payment_method |
| updatePaymentPreferences(customerId, preferred) | Updates preferred_payment_method on Customer record |
| uploadIdentityDocument(userId, file) | Finds Customer by user_id, uploads to 'identity_document' media collection (singleFile), sets identity_document_status=pending |

## Profile Page Tabs
### Personal Info Tab
- Avatar upload via crop dialog (round crop, 1:1 aspect ratio)
- Fields: first_name, last_name, phone, date_of_birth (calendar picker), gender (select), bio (textarea)
- Address section uses AddressFormFields component (cascading Region→Province→City→Barangay)
- Saves to `PUT /api/v1/profile` (not the customer portal endpoint)
- Avatar uploads to `POST /api/v1/profile/avatar`; avatar delete via `DELETE /api/v1/profile/avatar`

### Account Tab
- Shows VerificationBadge: "Fully Verified" (identity_verified_at set), "Pending Review" (status=pending), "Email Verified" (email only), or "Unverified"
- Identity Verification section: displays current status badge; upload form visible when status is 'none' or 'rejected'; rejected state shows warning banner
- Document upload: accepts jpg, jpeg, png, pdf; max 5MB; uses `POST /api/v1/customer/my/identity-document`
- Email address: read-only display (no self-service email change)
- Change password form: current_password + new password + confirm; calls `PUT /api/v1/profile/password`

### Payment Tab
- Locked behind email verification (shows lock screen if email_verified_at is null)
- Fetches available methods from `GET /api/v1/customer/my/payment-methods`
- Radio group: "No preference" option + one item per active PaymentMethod (keyed by slug)
- Save button disabled until selection differs from server value
- Saves to `PUT /api/v1/customer/my/payment-preferences`

## Tests
| File | Type |
|------|------|
| tests/Feature/Api/V1/CustomerPortalControllerTest.php | Backend portal CRUD |
| tests/Feature/Api/V1/CustomerIdentityVerificationTest.php | Identity document upload + admin verify/reject |
| tests/Feature/Api/V1/CustomerPaymentPreferenceTest.php | Payment methods get + preferences update |
| tests/Feature/Api/V1/ConversationTest.php | Conversation and message endpoints |

## Notes
- All pages require authentication; layout redirects to `/login` if not authenticated
- Layout provides a horizontal nav bar with links: Dashboard, Bookings, Reservations, Orders, Profile
- Layout includes avatar dropdown with profile and logout options
- Dashboard shows aggregate counts of bookings, reservations, and orders with quick-action links
- Bookings/Reservations/Orders pages display paginated lists with status-colored badges and ChatPanel embedded in detail sheets
- Cancel action uses `window.confirm()` for confirmation (simpler than AlertDialog, appropriate for customer portal)
- Only pending/confirmed items can be cancelled (cancel button conditionally rendered)
- Error states show a destructive alert banner with error message
- All data queries include `sort` parameter (e.g., `-booking_date`, `-check_in`, `-created_at`) for reverse-chronological display
- `useCustomerRecord` query key: `['customer', 'record']`; invalidated on identity document upload and payment preference change
- `useMyProfile` query key: `['customer', 'profile']`; invalidated on profile update, avatar upload/delete, identity document upload
