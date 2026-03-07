# Plan: Coupon Recurring Schedule

**Date:** 2026-03-07
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-03-07-coupon-recurring-schedule.md](../brainstorms/2026-03-07-coupon-recurring-schedule.md)

## Knowledge Context

### Relevant Learnings
- **MerchantBusinessHour** uses `day_of_week` 0-6 (0=Sun) with TIME columns — same convention we'll use for the `days` array
- **ServiceSchedule** validates day + time in `BookingService::createBooking()` — template for our validation logic
- **Coupon module** uses `applicable_to` JSON array cast — same pattern for `valid_schedule` JSON cast
- **DTO pattern**: all fields use `string|Optional` pattern with `new Optional` defaults
- **FormRequest pattern**: `authorize(): true`, validation rules only
- **Test pattern**: Pest describe/it with `Passport::actingAs()`, factory traits

### Known Gotchas
- Carbon `dayOfWeek` returns 0=Sunday, 6=Saturday — matches our convention
- JSON columns need explicit `'array'` cast in model `casts()` method
- Time comparison as strings works for "HH:MM" format (lexicographic order matches chronological)
- `claim_validity_hours` validation rule has `required_if:is_claimable,true` — remove since `is_claimable` is being removed from form

## Overview

Add a `valid_schedule` JSON column to coupons that restricts when a coupon can be redeemed to specific days of the week and/or a time window. Null = valid anytime (backwards-compatible). Validation in `CouponService::validateCoupon()`.

## Implementation Steps

### Step 1: Backend Migration
- **Files:** `backend/database/migrations/2026_03_07_1003xx_add_valid_schedule_to_coupons_table.php`
- **Details:**
  - Add `valid_schedule` JSON nullable column to `coupons` table
  - No backfill needed (null = always valid)

### Step 2: Backend Model
- **Files:** `backend/app/Models/Coupon.php`
- **Details:**
  - Add `'valid_schedule'` to `$fillable`
  - Add `'valid_schedule' => 'array'` to `casts()`
  - Add helper method `isWithinSchedule(): bool` that checks current day/time against `valid_schedule`

### Step 3: Backend DTO
- **Files:** `backend/app/Data/CouponData.php`
- **Details:**
  - Add `public array|null|Optional $valid_schedule = new Optional`

### Step 4: Backend FormRequests
- **Files:**
  - `backend/app/Http/Requests/Api/V1/Coupon/StoreCouponRequest.php`
  - `backend/app/Http/Requests/Api/V1/Coupon/UpdateCouponRequest.php`
- **Details:**
  - Add validation rules:
    ```php
    'valid_schedule' => ['nullable', 'array'],
    'valid_schedule.days' => ['required_with:valid_schedule', 'array', 'min:1'],
    'valid_schedule.days.*' => ['integer', 'min:0', 'max:6'],
    'valid_schedule.start_time' => ['nullable', 'date_format:H:i'],
    'valid_schedule.end_time' => ['nullable', 'date_format:H:i', 'after:valid_schedule.start_time'],
    ```
  - Also clean up: remove `is_claimable` rule and `required_if:is_claimable,true` from `claim_validity_hours`

### Step 5: Backend Resource
- **Files:** `backend/app/Http/Resources/Api/V1/CouponResource.php`
- **Details:**
  - Add `'valid_schedule' => $this->valid_schedule` to the response array
  - Update `is_valid` computed field to also check schedule via `$this->isWithinSchedule()` (or keep `is_valid` as date-only and let the frontend show schedule separately)

### Step 6: Backend Service Validation
- **Files:** `backend/app/Services/CouponService.php`
- **Details:**
  - In `validateCoupon()`, after the `expires_at` check (line ~157), add schedule validation:
    ```php
    if ($coupon->valid_schedule !== null) {
        $now = now();
        $schedule = $coupon->valid_schedule;

        if (!in_array($now->dayOfWeek, $schedule['days'] ?? [])) {
            throw new ApiException('This coupon is not valid today', 422);
        }

        if (isset($schedule['start_time'], $schedule['end_time'])) {
            $currentTime = $now->format('H:i');
            if ($currentTime < $schedule['start_time'] || $currentTime > $schedule['end_time']) {
                throw new ApiException(
                    'This coupon is only valid between ' . $schedule['start_time'] . ' and ' . $schedule['end_time'],
                    422
                );
            }
        }
    }
    ```

### Step 7: Backend Factory
- **Files:** `backend/database/factories/CouponFactory.php`
- **Details:**
  - Add `valid_schedule` to definition (default null)
  - Add factory state `->withSchedule(array $days, ?string $startTime, ?string $endTime)` for tests

### Step 8: Backend Tests
- **Files:** `backend/tests/Feature/Api/V1/CouponTest.php`
- **Details:**
  - Test: create coupon with `valid_schedule` JSON payload
  - Test: update coupon schedule
  - Test: validate coupon fails on wrong day (use `Carbon::setTestNow()` to control day)
  - Test: validate coupon fails outside time window
  - Test: validate coupon succeeds within schedule
  - Test: validate coupon with null schedule (always valid, backwards-compat)
  - Test: validate coupon with days-only (no time window)

### Step 9: Frontend Types
- **Files:**
  - `frontend/types/api.ts`
  - `frontend-customer-portal/types/api.ts`
- **Details:**
  - Add to `Coupon` interface:
    ```typescript
    valid_schedule: {
      days: number[];
      start_time?: string;
      end_time?: string;
    } | null;
    ```

### Step 10: Frontend Validation Schema
- **Files:** `frontend/lib/validations.ts`
- **Details:**
  - Add `valid_schedule` to `createCouponSchema`:
    ```typescript
    valid_schedule: z.object({
      days: z.array(z.number().min(0).max(6)).min(1),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
    }).optional().nullable(),
    ```

### Step 11: Frontend Coupon Form Dialog
- **Files:** `frontend/components/coupon-form-dialog.tsx`
- **Details:**
  - Add day-of-week toggle buttons (Sun-Sat) as a row of selectable chips/buttons
  - When any day is selected, show optional start_time and end_time inputs (type="time")
  - When no days selected, `valid_schedule` is null (always valid)
  - Use form watch to show/hide time inputs
  - Label: "Valid Schedule" with description "Restrict when this coupon can be used. Leave empty for no restriction."

### Step 12: Frontend Customer Portal Display
- **Files:**
  - `frontend-customer-portal/app/(customer)/coupons/page.tsx`
  - `frontend-customer-portal/components/storefront/coupons-section.tsx`
- **Details:**
  - Add schedule display helper: `formatSchedule(schedule)` → "Mon-Fri, 9:00 AM - 5:00 PM" or "Sat, Sun" (days only)
  - Show schedule info on active coupon cards as a metadata line with Clock icon
  - Show on storefront coupon cards as well

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Time comparison edge case (midnight crossing) | Low | Document that start_time must be < end_time (same day only). Overnight windows not supported in v1. |
| Timezone confusion for customers | Low | Use server timezone (Asia/Manila). All users in same timezone for now. |
| Existing tests break | Low | No schema changes to existing columns. Null schedule = backwards-compatible. |

## Testing Strategy

- [ ] Create coupon with valid_schedule via API
- [ ] Update coupon schedule via API
- [ ] Validate coupon rejected on wrong day of week
- [ ] Validate coupon rejected outside time window
- [ ] Validate coupon accepted within schedule
- [ ] Validate coupon with null schedule always works
- [ ] Validate coupon with days-only (no time) works all day on valid days
- [ ] Frontend form: toggle days, set time range, submit, verify payload
- [ ] Customer portal: schedule displays correctly on coupon cards
- [ ] Storefront: schedule displays on public coupon section

## Open Questions

- None — all decisions made in brainstorm.
