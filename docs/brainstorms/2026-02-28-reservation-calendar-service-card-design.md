# Brainstorm: Reservation Calendar & Service Card Design Fix

**Date:** 2026-02-28
**Status:** Decided

## Knowledge Context

- **CSS `background` shorthand overrides Tailwind `bg-*`**: When creating gradient overlays for service cards, use `background-image:` instead of `background:` shorthand to avoid defeating Tailwind utilities.
- Service card component at `frontend-customer-portal/components/storefront/service-card.tsx`
- Reservation calendar at `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/reservation-calendar.tsx`
- Booking calendar at `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/booking-calendar.tsx`
- Merchant detail page shows service cards in a `grid-cols-2 sm:grid-cols-3 gap-3` grid

## Problem / Goal

1. **Reservation page** (`/reserve?service=X`): Calendar has padding/alignment issues — the DayPicker renders without a containing border, making it feel disconnected from the form card. Legend and price calculation lack visual containment.
2. **Booking page** (`/book?service=X`): Same calendar padding/alignment issues.
3. **Merchant detail page**: Service cards are functional but visually plain — standard image-on-top/info-below with small text. Needs more visual impact to attract clicks.

## Approaches Considered

### Calendar Layout

#### Approach A: Contained card layout — SELECTED
- **Description:** Wrap the calendar in a bordered card with inner padding, rounded corners, and subtle background. Gives the calendar visual weight and clear boundaries.
- **Pros:** Clean visual hierarchy, clear containment, consistent with form card styling
- **Cons:** Slightly more nested DOM

#### Approach B: Flush/inline layout
- **Description:** Calendar rendered directly in the form flow without extra wrapper.
- **Pros:** Simpler DOM
- **Cons:** Lacks visual separation, harder to scan

### Service Card Design

#### Approach A: Gradient overlay + bold price — SELECTED
- **Description:** Image fills the entire card. Dark gradient at bottom overlays service name, price, and action button directly on the image. Type badge stays top-right. More premium/eye-catching feel.
- **Pros:** More visually striking, image gets full focus, premium feel, Airbnb/booking-site-like UX
- **Cons:** Needs careful contrast handling, text readability depends on image brightness

#### Approach B: Enhanced current (image + info section)
- **Description:** Keep the existing structure but improve spacing, larger price, more prominent button.
- **Pros:** Safe improvement, familiar layout
- **Cons:** Still looks generic

#### Approach C: Horizontal card layout
- **Description:** Image on left, info on right.
- **Pros:** Better scanability, longer names
- **Cons:** Needs separate mobile layout, breaks grid consistency

## Decision

1. **Calendar**: Contained card layout — wrap DayPicker + legend + price in a bordered card with padding
2. **Service Card**: Gradient overlay — image fills card, gradient bottom with name + price + action button overlaid on image

## Implementation Notes

### Calendar Fix (both booking + reservation)
- Wrap `<DayPicker>` + legend + price calc in a `rounded-lg border bg-card p-4` container
- Ensure consistent text alignment for weekday headers (center-align)
- Add proper spacing between calendar grid and legend
- Ensure calendar cells have min touch target size (44px per WCAG)

### Service Card Redesign
- Remove separate info section below image
- Make image fill entire card with `aspect-[3/4]` or `aspect-[4/5]`
- Add gradient overlay at bottom: `bg-gradient-to-t from-black/80 via-black/40 to-transparent`
- Overlay text: service name (white, bold), price (white, large), action button (white outline or solid)
- Keep type badge in top-right corner with `backdrop-blur-sm`
- **Knowledge gotcha**: Use Tailwind gradient classes (not CSS `background:` shorthand) to avoid CSS specificity issues
- Hover effect: slight scale-up on image + button color change
- No-image fallback: show colored gradient background with type icon

## Next Steps

- [ ] Fix calendar padding/alignment in both `booking-calendar.tsx` and `reservation-calendar.tsx`
- [ ] Redesign `service-card.tsx` with gradient overlay approach
- [ ] Test on mobile viewport widths
- [ ] Verify text contrast on various image backgrounds
