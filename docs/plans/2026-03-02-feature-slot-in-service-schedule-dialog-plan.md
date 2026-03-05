# Plan: Booking Slots Panel in Service Schedule Dialog

**Date:** 2026-03-02
**Type:** feature
**Status:** Draft

---

## Knowledge Context

### Relevant Learnings
- `docs/knowledge/modules/booking.md`: `BookingService::getBookingCalendar()` already aggregates ServiceSchedule + MerchantBookingSlots by day_of_week — same grouping pattern needed here
- `docs/knowledge/modules/merchant.md`: `MerchantBookingSlot` indexed by `[merchant_id, day_of_week, start_time]`; admin endpoint requires `merchants.update` permission; self-service endpoint auto-resolves from auth
- `docs/knowledge/modules/frontend-my-store.md`: `MyStoreBookingSlotsTab` already groups slots by `DAY_ORDER = [1,2,3,4,5,6,0]` (Mon–Sun) and displays them as time+capacity chips — reuse this display pattern

### Known Gotchas
1. **Two booking-slot API endpoints with different auth**: Self-service `/auth/merchant/booking-slots` (merchant role) vs admin `/merchants/{id}/booking-slots` (requires `merchants.update`). The `useBookingSlots(merchantId?)` hook already handles both — pass `undefined` for self-service, pass `merchantId` for admin.
2. **ServiceScheduleDialog is shared**: Used in both admin (`merchants/[id]/services/`) and my-store (`my-store/services/`) — need to distinguish which endpoint to use via an `isAdmin` prop.
3. **Time format**: Backend returns `HH:MM:SS` from MySQL TIME columns; dialog already does `.substring(0, 5)` to get `HH:MM`. Slot display needs the same trim.
4. **Slots are merchant-level, not service-level**: Slots apply to all bookable services. Display them as reference-only (read-only) in the schedule dialog — link to Settings for editing.

### Critical Patterns Applied
- No new files needed — single dialog component modification + one prop addition at call site
- `useBookingSlots()` already exists with correct query key `['booking-slots', merchantId ?? 'my']`
- Active-only filter on slots: only `is_active === true` slots are meaningful to show

---

## Overview

Add a read-only booking slots panel below each day row in the `ServiceScheduleDialog`. When the merchant has configured booking slots for a day, the dialog shows them as compact chips — giving merchants a clear view of how their service schedule relates to their slot configuration. No new backend work; purely frontend.

**Before:** Each day row shows only: `Day | Start Time | End Time | Open/Closed toggle`

**After:** Each day row shows: `Day | Start Time | End Time | Open/Closed toggle` + below it (if slots exist): `● 9:00–10:00 · 5 seats  ● 10:00–11:00 · Unlimited  …`

---

## Implementation Steps

### Step 1: Update `ServiceScheduleDialog` to show booking slots

**File:** `frontend/app/(system)/(merchants)/merchants/[id]/services/service-schedule-dialog.tsx`

**Details:**
1. Add `isAdmin?: boolean` to the `Props` interface (default `false`)
2. Call `useBookingSlots(isAdmin ? merchantId : undefined)` to fetch slots
3. Compute `slotsByDay: Record<number, MerchantBookingSlot[]>` — group active slots by `day_of_week`
4. Import `MerchantBookingSlot` from `@/types/api` and `useBookingSlots` from `@/hooks`
5. In the render, below each schedule row, if `slotsByDay[row.day_of_week]` has entries, render a slot chips row
6. Each chip shows: `{start_time}–{end_time | ''}  ·  {max_capacity} seats` or `Unlimited`
7. Add a small muted footer note: "Slots are managed in Settings → Booking Slots"

**Chip display format:**
```tsx
// Below each schedule row (if slots exist for that day):
<div className="flex flex-wrap gap-1 pl-[5.5rem]">
  {slotsByDay[row.day_of_week]?.map((slot) => (
    <span key={slot.id} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
      {slot.start_time.substring(0, 5)}{slot.end_time ? `–${slot.end_time.substring(0, 5)}` : ''}
      {' · '}
      {slot.max_capacity ? `${slot.max_capacity} seats` : 'Unlimited'}
    </span>
  ))}
</div>
```

8. When `slotsData` is loading (and dialog is open), show nothing extra (don't block the schedule UI)
9. When merchant has NO slots at all, show nothing (no empty state — keep dialog clean)

### Step 2: Update admin services page call site

**File:** `frontend/app/(system)/(merchants)/merchants/[id]/services/page.tsx` (if it exists) or wherever `ServiceScheduleDialog` is rendered in the admin context

**Details:**
- Find the `<ServiceScheduleDialog>` usage and add `isAdmin={true}` prop

**Note:** The my-store services page (`frontend/app/(system)/(my-store)/my-store/services/page.tsx`) does NOT need `isAdmin={true}` — it defaults to `false` and uses the self-service endpoint.

### Step 3: Verify admin services page exists and uses ServiceScheduleDialog

**File:** `frontend/app/(system)/(merchants)/merchants/[id]/services/page.tsx`

**Details:**
- Check if the admin services page also renders `<ServiceScheduleDialog>`
- If yes, add `isAdmin={true}` there too

### Step 4: Lint check

**Command:**
```bash
cd frontend && npm run lint 2>&1 | head -50
```
Fix any errors before marking complete.

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Merchant user hits admin endpoint (403) | Medium | Use `isAdmin` prop to route to correct endpoint |
| Slot fetch adds delay to dialog open | Low | `useBookingSlots` is cached; slots render independently (no loading gate) |
| Dialog becomes too tall with many slots | Low | Chips wrap and are compact; limit display to `is_active` slots only |
| `start_time` returned as `HH:MM:SS` from DB | Medium | Use `.substring(0, 5)` — same pattern already used in the dialog for schedule times |

---

## Testing Strategy

- [ ] Open Schedule dialog on a bookable service — if merchant has booking slots, they appear as chips per day
- [ ] Days with no slots show no chip row (clean layout)
- [ ] Admin viewing another merchant's schedule dialog sees that merchant's slots
- [ ] My-store merchant viewing their own schedule dialog sees their own slots
- [ ] Inactive slots (`is_active = false`) do NOT appear in chips
- [ ] Dialog still saves schedule correctly (slot display is read-only)
- [ ] Lint passes with 0 new errors

---

## Open Questions

- None — scope is clear: read-only slot display as chips below each day row in the existing dialog.
