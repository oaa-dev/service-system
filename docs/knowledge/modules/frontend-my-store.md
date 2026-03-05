# Frontend My Store Module

## Overview
Self-service merchant dashboard at `/my-store/`. Merchants manage their own store data, bookings, reservations, orders, gallery, and settings. Built under `frontend/app/(system)/(my-store)/`.

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(my-store)/my-store/page.tsx` | Page | Dashboard — shows ActiveDashboard or OnboardingDashboard based on merchant status |
| `frontend/app/(system)/(my-store)/my-store/active-dashboard.tsx` | Client Component | Stats + recent activity for active/approved merchants |
| `frontend/app/(system)/(my-store)/my-store/onboarding-dashboard.tsx` | Client Component | Onboarding checklist for pending merchants |
| `frontend/app/(system)/(my-store)/my-store/bookings/page.tsx` | Page | Booking list with List/Calendar toggle, status actions, create dialog |
| `frontend/app/(system)/(my-store)/my-store/bookings/bookings-calendar-view.tsx` | Client Component | Month grid calendar for bookings (color-coded by capacity %; shows slot breakdown when has_slots=true) |
| `frontend/app/(system)/(my-store)/my-store/reservations/page.tsx` | Page | Reservation list with List/Calendar toggle, status actions, create dialog |
| `frontend/app/(system)/(my-store)/my-store/reservations/reservations-calendar-view.tsx` | Client Component | Month grid calendar for reservations (color-coded by unit availability %) |
| `frontend/app/(system)/(my-store)/my-store/orders/page.tsx` | Page | Service orders management |
| `frontend/app/(system)/(my-store)/my-store/services/page.tsx` | Page | Merchant's own services list |
| `frontend/app/(system)/(my-store)/my-store/categories/page.tsx` | Page | Service categories management |
| `frontend/app/(system)/(my-store)/my-store/categories/create-service-category-dialog.tsx` | Client Component | Create category dialog |
| `frontend/app/(system)/(my-store)/my-store/categories/edit-service-category-dialog.tsx` | Client Component | Edit category dialog |
| `frontend/app/(system)/(my-store)/my-store/gallery/page.tsx` | Page | Gallery management (requires merchant.active middleware) |
| `frontend/app/(system)/(my-store)/my-store/branches/page.tsx` | Page | Branch management for organization merchants |
| `frontend/app/(system)/(my-store)/my-store/application-log/page.tsx` | Page | Merchant application status history |
| `frontend/app/(system)/(my-store)/my-store/settings/page.tsx` | Page | Settings tabbed interface (Details, Business Hours, Payment Methods, Social Links, Documents, Booking Slots) |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-details-tab.tsx` | Client Component | Name, description, contact, address |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-business-hours-tab.tsx` | Client Component | 7-day business hours upsert |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-payment-methods-tab.tsx` | Client Component | Payment method sync |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-social-links-tab.tsx` | Client Component | Social links sync |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-documents-tab.tsx` | Client Component | Document uploads |
| `frontend/app/(system)/(my-store)/my-store/settings/my-store-booking-slots-tab.tsx` | Client Component | Booking slot CRUD — only shown when merchant.can_take_bookings=true |
| `frontend/app/(system)/(my-store)/my-store/reviews/page.tsx` | Page | Merchant self-service reviews — view received reviews, add/update/delete replies |

## Key Patterns

### Merchant Resolution
All my-store pages resolve merchant from auth state — no URL merchantId needed:
```typescript
const { user } = useAuthStore();
const merchantId = user?.merchant?.id;
```

### Shared Admin Hooks
My-store pages reuse the same admin hooks, passing the authenticated merchant's ID:
```typescript
useBookings(merchantId!, queryParams)    // same hook as admin merchant bookings
useReservations(merchantId!, queryParams) // same hook as admin merchant reservations
useBookingSlots()                          // no merchantId = uses self-service endpoint
```

### Calendar Views
Both bookings and reservations pages have a List/Calendar toggle:
- **List** (default): existing paginated table with status filters
- **Calendar**: custom 7-column month grid with color-coded daily cells
- Click a calendar day → sets date filter and switches to list view
- Month navigation: prev/next controls in calendar header

**Bookings color coding** (by `total_booked/total_capacity` ratio):
- `is_closed` or no data → gray/muted
- < 50% → green
- 50–90% → amber
- >= 90% → red/destructive

**Reservations color coding** (by `available_units/total_units` ratio):
- `is_closed` or no data → gray/muted
- > 50% available → green
- 1–50% available → amber
- 0 available → red

### Capability Gates
Each page checks capability flags before rendering:
```typescript
if (!user?.merchant?.can_take_bookings) → show "not enabled" block
if (!user?.merchant?.can_rent_units) → show "not enabled" block
```

Settings page also gates the Booking Slots tab:
```tsx
{merchant.can_take_bookings && (
  <TabsTrigger value="booking-slots">Booking Slots</TabsTrigger>
)}
```

### Create Dialogs — Shared with Admin
My-store pages import create dialogs from the admin merchants module:
```typescript
import { CreateBookingDialog } from '@/app/(system)/(merchants)/merchants/[id]/bookings/create-booking-dialog';
// Pass serviceMerchantId={user?.merchant?.parent_id ?? undefined} for branch merchants
```

### Booking Slots Tab
`MyStoreBookingSlotsTab` in `my-store-booking-slots-tab.tsx`:
- Groups slots by day of week, displayed Mon–Sun (DAY_ORDER = [1,2,3,4,5,6,0])
- Shows time range (start_time–end_time), capacity label, Active/Inactive badge
- Inline edit (key-remounted dialog per slot to force fresh form defaults) + delete with AlertDialog confirmation
- Uses `react-hook-form` + `zodResolver(createBookingSlotSchema)` from `lib/validations.ts`
- `formatTime()` utility converts 24h `HH:MM` to 12h AM/PM display

## Connected Files (Hooks + Services)
| Category | File | Notes |
|----------|------|-------|
| Hook | `frontend/hooks/useBookings.ts` | useBookings, useBookingCalendar, useUpdateBookingStatus |
| Hook | `frontend/hooks/useReservations.ts` | useReservations, useReservationCalendar, useUpdateReservationStatus |
| Hook | `frontend/hooks/useMyMerchant.ts` | useMyMerchant, useMyMerchantStats, useUpdateMyMerchant, etc. |
| Hook | `frontend/hooks/useBookingSlots.ts` | useBookingSlots(merchantId?), useCreateBookingSlot, useUpdateBookingSlot, useDeleteBookingSlot — query key: ['booking-slots', merchantId \| 'my'] |
| Hook | `frontend/hooks/index.ts` | barrel re-export of all hooks |
| Service | `frontend/services/bookingService.ts` | getAll, getCalendar, create, updateStatus |
| Service | `frontend/services/reservationService.ts` | getAll, getCalendar, create, updateStatus |
| Service | `frontend/services/bookingSlotService.ts` | getAll(merchantId?), getById, create, update, delete — dual URL: self-service `/auth/merchant/booking-slots` vs admin `/merchants/{id}/booking-slots` |
| Types | `frontend/types/api.ts` | BookingCalendarDay (has_slots, slots[BookingCalendarSlot]), BookingCalendarSlot, MerchantBookingSlot, Booking, Reservation |
| Auth Store | `frontend/stores/authStore.ts` | provides user.merchant.id, capability flags (can_take_bookings) |
| Validations | `frontend/lib/validations.ts` | Zod schemas for booking/reservation/booking-slot forms (createBookingSlotSchema: day_of_week int, start_time string, end_time nullable string, max_capacity nullable int, is_active bool, sort_order int) |
