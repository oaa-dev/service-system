# Brainstorm: Coupon Recurring Schedule

**Date:** 2026-03-07
**Status:** Decided

## Knowledge Context

- **MerchantBusinessHour** module uses `day_of_week` (0=Sun...6=Sat) + TIME columns for scheduling
- **ServiceSchedule** module uses similar pattern with `is_available` flag; `BookingService::createBooking()` validates day exists in schedule + time within range
- **Coupon module** currently has `starts_at`/`expires_at` for date-range validity but no day-of-week or time-of-day restrictions
- Validation happens in `CouponService::validateCoupon()` — schedule check would slot in after `starts_at`/`expires_at` checks

## Problem / Goal

Merchants want coupons that only work at specific times — e.g., "Weekday Lunch Special: 20% off Mon-Fri 11am-2pm" or "Weekend Deal: valid Sat-Sun only". Currently coupons are either always valid (within their date range) or not. There's no recurring time-based restriction.

## Approach: JSON Column on Coupons Table

Single `valid_schedule` JSON nullable column on the `coupons` table.

**Schema:**
```json
{
  "days": [1, 2, 3, 4, 5],
  "start_time": "09:00",
  "end_time": "17:00"
}
```

- `days`: array of integers (0=Sunday, 1=Monday...6=Saturday) — matches `day_of_week` convention in MerchantBusinessHour/ServiceSchedule
- `start_time` / `end_time`: "HH:MM" strings, optional within the JSON (if omitted, valid all day on selected days)
- `null` column = no schedule restriction (valid anytime, backwards-compatible)

**Pros:**
- Simple — single column, no joins, no extra table
- Backwards-compatible — null means "always valid" (existing coupons unchanged)
- Easy to query — JSON cast in Laravel, single validation check in service layer

**Cons:**
- Can't do different time windows per day (e.g., Mon 9-12, Fri 2-5) — single window applies to all selected days
- JSON not easily indexable (but schedule checks happen in-memory after fetch, not in WHERE clauses)

## Decisions

1. **Schedule type:** Days of week + single time window
2. **Storage:** JSON column `valid_schedule` on coupons table (nullable)
3. **Default:** Null = valid anytime (no migration backfill needed)
4. **Timezone:** Server timezone (Asia/Manila) — no per-merchant timezone

## Implementation Notes

### Backend
- Migration: Add `valid_schedule` JSON nullable column to coupons table
- Model: Cast `valid_schedule` to `array`, add to `$fillable`
- Validation in `CouponService::validateCoupon()`: After expires_at check, if `valid_schedule` is not null:
  - Check `now()->dayOfWeek` (Carbon: 0=Sun...6=Sat) is in `days` array
  - If `start_time`/`end_time` present, check `now()->format('H:i')` is within range
  - Throw 422 "This coupon is only valid on [days] between [start]-[end]"
- DTO: Add `valid_schedule` field
- FormRequests: Validate structure (days array of 0-6, optional start_time/end_time as H:i format)
- Resource: Include `valid_schedule` in response

### Frontend (Admin/Merchant Form)
- Day-of-week toggle buttons (Sun-Sat) in coupon form dialog
- Optional time range inputs (start/end) shown when any day is selected
- Display schedule summary on coupon list/detail (e.g., "Mon-Fri, 9:00 AM - 5:00 PM")

### Frontend (Customer Portal)
- Show schedule info on coupon cards (e.g., "Valid Mon-Fri 9am-5pm")
- Storefront coupon section shows schedule restriction

## Next Steps

- [ ] Create implementation plan with `/plan`
- [ ] Backend: migration, model, DTO, requests, service validation, resource, tests
- [ ] Frontend admin: form dialog schedule fields
- [ ] Frontend customer portal: display schedule info on coupon cards
