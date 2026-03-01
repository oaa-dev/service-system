# Plan: Minimalist Service Card Redesign

**Date:** 2026-02-28
**Type:** refactor
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- [CSS `background` shorthand overrides Tailwind `bg-*`](../knowledge/solutions/styling-issues/css-background-shorthand-overrides-tailwind-bg-utility-20260227.md): Not directly applicable since we're removing gradients, but if any fallback backgrounds are needed, use Tailwind utility classes only.

### Known Gotchas
- None directly applicable — this change removes gradient complexity rather than adding it.

### Critical Patterns Applied
- Preserve `SERVICE_TYPE_CONFIG` pattern for badge/icon/action mapping
- Keep existing Link routing and `e.stopPropagation()` behavior

## Overview

Redesign the service card from the current full-bleed gradient overlay approach to a clean minimalist layout:
- Image on top (no overlay, no gradient)
- Name + price in a clean white section below
- Action button appears centered over the image **on hover** with a semi-transparent backdrop
- Type badge stays in top-right corner

## Implementation Steps

### Step 1: Redesign Service Card (`service-card.tsx`)
- **Files:** `frontend-customer-portal/components/storefront/service-card.tsx`
- **Details:**

  **Structure change** — from gradient overlay to clean two-section with hover button:

  ```
  CURRENT:                          NEW:
  ┌─────────────────┐               ┌─────────────────┐
  │   IMAGE (3/4)   │               │   IMAGE (4/3)   │
  │                 │               │                 │
  │  ┌─badge──┐    │               │  ┌─badge──┐    │
  │                 │               │                 │
  │  gradient       │               │  [hover shows:  │
  │  ──────────    │               │   semi-opaque   │
  │  Name          │               │   action btn    │
  │  ₱Price        │               │   centered]     │
  │  [Button]      │               │                 │
  └─────────────────┘               ├─────────────────┤
                                    │  Service Name   │ p-3
                                    │  ₱1,200         │
                                    └─────────────────┘
  ```

  **Specific changes:**
  1. Keep `p-0` on Card root, keep `overflow-hidden group cursor-pointer`
  2. Change image container aspect from `aspect-[3/4]` back to `aspect-[4/3]` (shorter, balanced with info below)
  3. **Remove** the gradient overlay div entirely (the `absolute inset-x-0 bottom-0 bg-gradient-to-t` div)
  4. **No-image fallback**: Use a neutral/minimalist background instead of dark gradient — `bg-muted` with muted icon (`text-muted-foreground/30`)
  5. Keep type badge in top-right corner as-is
  6. **Add hover action overlay**: An absolute-positioned div covering the entire image area, hidden by default, shown on `group-hover`:
     - `absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300`
     - Contains the action Link button styled with white/semi-transparent: `rounded-lg bg-white/90 text-foreground font-medium text-sm px-4 py-2 shadow-sm hover:bg-white transition-colors`
  7. **Add info section below image**: A new `div.p-3` containing:
     - Service name: `font-semibold text-sm text-foreground line-clamp-1`
     - Price: `text-base font-bold text-primary` (reservation: append ` / night` in `text-xs font-normal text-muted-foreground`)
  8. Keep `group-hover:scale-105` on the img element for subtle zoom

### Step 2: Verify Build
- **Files:** All changed files
- **Details:** Run TypeScript check to verify no type errors

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Hover-only button not discoverable on touch/mobile | Medium | Cards are clickable (onClick prop), and the Link is in the DOM (just visually hidden). Touch devices can still tap the card. Consider adding `@media (hover: none)` to always show the button on touch devices. |
| Aspect ratio change affects grid layout | Low | `aspect-[4/3]` was the original ratio before the gradient redesign — proven to work in the grid |

## Testing Strategy

- [ ] TypeScript check passes
- [ ] Service card with image: clean image, no overlay at rest, hover shows centered button with opacity
- [ ] Service card without image: neutral muted background, centered icon
- [ ] Name and price visible below image
- [ ] Type badge visible in top-right corner
- [ ] Hover zoom effect on image still works

## Open Questions

- None
