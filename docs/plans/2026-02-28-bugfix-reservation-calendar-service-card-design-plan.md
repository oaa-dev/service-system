# Plan: Reservation Calendar & Service Card Design Fix

**Date:** 2026-02-28
**Type:** bugfix
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- [CSS `background` shorthand overrides Tailwind `bg-*`](../knowledge/solutions/styling-issues/css-background-shorthand-overrides-tailwind-bg-utility-20260227.md): Use `background-image:` instead of `background:` shorthand for gradient overlays. For service cards, we'll use Tailwind's built-in gradient classes (`bg-gradient-to-t`) which compile to `background-image`, avoiding this pitfall entirely.

### Known Gotchas
- **CSS `background` shorthand**: The brainstorm explicitly calls this out. Plan avoids it by using only Tailwind gradient utility classes (`bg-gradient-to-t from-black/80 via-black/40 to-transparent`) which compile to `background-image` — safe.
- **No-image fallback**: Service cards without images need a colored gradient background so the white overlay text remains readable. Current fallback is `bg-gradient-to-br from-primary/10 via-warm-100 to-accent/10` which is too light for white text overlay — needs a darker fallback.

### Critical Patterns Applied
- Tailwind-only gradient approach (no custom CSS `background:` shorthand)
- Existing `SERVICE_TYPE_CONFIG` pattern preserved for badge/icon/action mapping

## Overview

Fix visual issues on 3 components in the customer portal:
1. **Booking calendar** — wrap in contained card with proper padding
2. **Reservation calendar** — same contained card treatment
3. **Service cards** — redesign from image-on-top/info-below to full-bleed image with gradient overlay

## Implementation Steps

### Step 1: Fix Booking Calendar Layout (`booking-calendar.tsx`)
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/book/booking-calendar.tsx`
- **Details:**
  - Wrap the entire calendar content (DayPicker + legend + inline styles) in a `rounded-lg border bg-card p-4` container
  - Add `space-y-4` inside the container for consistent internal spacing (currently `space-y-3` on root)
  - Ensure weekday headers are center-aligned (add `text-center` to weekday classNames if not present)
  - The `<style>` block stays inside the component (scoped styles for dot indicators)
- **Knowledge note:** No gradient work here, purely structural padding fix

### Step 2: Fix Reservation Calendar Layout (`reservation-calendar.tsx`)
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/reserve/reservation-calendar.tsx`
- **Details:**
  - Same card wrapper treatment: `rounded-lg border bg-card p-4` around DayPicker + legend + price calculation
  - The price calculation block already has its own border/bg styling (`border-primary/20 bg-primary/5 p-3`) — it can stay nested inside the card wrapper for visual containment
  - Add `space-y-4` for internal spacing consistency
  - Keep the `<style>` block for reserved day styling
- **Knowledge note:** No gradient work here, purely structural padding fix

### Step 3: Redesign Service Card (`service-card.tsx`)
- **Files:** `frontend-customer-portal/components/storefront/service-card.tsx`
- **Details:**

  **Structure change** — from two-section (image + info) to single full-bleed image with overlay:

  ```
  CURRENT:                          NEW:
  ┌─────────────┐                   ┌─────────────┐
  │   IMAGE      │ aspect-[4/3]     │   IMAGE      │
  │             │                   │  (full card) │ aspect-[3/4]
  ├─────────────┤                   │             │
  │  Name       │ p-3              │  ┌─badge──┐  │ top-right
  │  Category   │                   │             │
  │  Duration   │                   │  gradient   │
  │  ₱Price     │                   │  ──────────│
  │  [Button]   │                   │  Name      │ white, bold
  └─────────────┘                   │  ₱Price    │ white, large
                                    │  [Button]  │ white outline
                                    └─────────────┘
  ```

  **Specific changes:**
  1. Change card root to remove padding, keep `overflow-hidden group cursor-pointer`
  2. Change image container from `aspect-[4/3]` to `aspect-[3/4]` for taller cards
  3. Remove the separate info `div.p-3.space-y-1` section entirely
  4. Add absolute-positioned gradient overlay at bottom of image: `absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent`
  5. Place service name, price, and action button inside the gradient overlay div
  6. Text styling: name → `text-white font-semibold text-sm line-clamp-1`, price → `text-white text-lg font-bold`
  7. Action button: `border border-white/60 text-white hover:bg-white/20 rounded-lg text-xs px-3 py-1.5`
  8. Keep type badge in top-right with existing backdrop-blur styling
  9. Hover: keep existing `group-hover:scale-105` on image
  10. **No-image fallback**: Replace the light gradient with a darker one suitable for white text overlay: `bg-gradient-to-br from-primary/80 via-primary/60 to-accent/70` with centered type icon at larger size (`h-12 w-12 text-white/40`)

- **Knowledge note:** Using Tailwind gradient classes (`bg-gradient-to-t from-black/80`) compiles to `background-image`, avoiding the documented CSS specificity pitfall.

### Step 4: Verify and Test
- **Files:** All three modified files
- **Details:**
  - Run `npm run build` in `frontend-customer-portal/` to verify TypeScript + build passes
  - Visually verify in browser at different viewport widths (especially mobile 375px)
  - Check text contrast on gradient overlay — white text on `from-black/80` gradient should pass WCAG AA

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| White text unreadable on bright images | Medium | `from-black/80` provides strong contrast floor; gradient covers bottom 40-50% of card |
| Taller aspect ratio (`3/4`) may not work well in `grid-cols-3` on small screens | Low | Grid is `grid-cols-2 sm:grid-cols-3 gap-3` — 2 cols on mobile gives adequate width |
| No-image fallback contrast with white text | Low | Using darker primary-based gradient instead of current light gradient |
| Calendar card wrapper adds unexpected scroll or overflow | Low | `overflow-hidden` on card root + DayPicker already uses `w-full` |

## Testing Strategy

- [ ] Build passes: `docker compose exec nextjs-customer npm run build` (or `npm run build` from `frontend-customer-portal/`)
- [ ] Booking calendar: card border visible, padding consistent, legend properly spaced
- [ ] Reservation calendar: card border visible, price calculation contained within card
- [ ] Service card with image: gradient visible, text readable, badge in top-right
- [ ] Service card without image: fallback gradient dark enough, icon visible, text readable
- [ ] Mobile viewport (375px): 2-col grid renders without overflow
- [ ] Hover effects: image scale-up works, button color change works

## Open Questions

- None — brainstorm decisions are clear and all approaches are selected.
