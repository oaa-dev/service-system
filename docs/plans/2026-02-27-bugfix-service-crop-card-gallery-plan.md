# Plan: Fix Service Image Crop + Service Cards + Gallery Horizontal Scroll

**Date:** 2026-02-27
**Type:** bugfix + feature
**Status:** Draft

## Knowledge Context

### Relevant Learnings
- No prior learnings on react-easy-crop or horizontal scroll exist in the knowledge base — document after.
- **CSS `background` shorthand overrides Tailwind `bg-*`**: If adding gradient overlays to gallery, use `background-image:` not `background:` shorthand.

### Known Gotchas
- **`cleanup` in useEffect deps causes re-execution on state change**: When a `useCallback` function wraps state values in its deps, its reference changes whenever those state values change. If that callback is in a `useEffect` dep array, the effect re-runs unexpectedly. This is the root cause of the image crop bug.
- **`aspect={1}` hardcoded in AvatarCropDialog**: The crop aspect ratio is always 1:1, which is wrong for service images (which display at 3:2 in cards). Fix by adding an `aspect` prop.

### Critical Patterns Applied
- Minimal fix: Only change what's needed. Don't refactor other parts of the file.
- Use `useRef` pattern to give `cleanup` a stable reference if needed, but the simplest fix is to remove the `cleanup()` call from the item/open effect entirely.

---

## Overview

Three separate issues to fix across admin frontend and customer portal frontend:

1. **[BUG] Image crop in edit service dialog doesn't open properly** — `cleanup` function is listed as a `useEffect` dependency; when a file is selected, `rawImageSrc` changes → `cleanup` gets a new reference → `useEffect` re-fires with `item && open` still true → `cleanup()` clears `rawImageSrc` → the crop dialog's image is nulled out.

2. **[FEATURE] Make service cards smaller** on the customer portal merchant page — switch service grid from 2 columns to 3+ columns and reduce card padding/font sizes.

3. **[FEATURE] Gallery: 1 row with horizontal scroll** — replace the current 2-3 column grid with a single horizontal scrollable row with left/right nav buttons.

---

## Implementation Steps

### Step 1: Fix image crop bug in edit-service-dialog.tsx

- **File:** `frontend/app/(system)/(merchants)/merchants/[id]/services/edit-service-dialog.tsx`
- **Root cause:** Lines 62–108. The `useEffect` has `cleanup` in its deps array. When user selects a file, `rawImageSrc` changes → `cleanup` (which depends on `rawImageSrc` via useCallback) gets a new reference → the `useEffect` re-fires → it sees `item && open` as true → calls `cleanup()` → clears `rawImageSrc` → crop dialog gets `imageSrc={null}` → crop doesn't render.
- **Fix:** Remove the `cleanup()` call from inside the `useEffect` body and remove `cleanup` from the deps array. Cleanup on dialog open is unnecessary because the `onOpenChange` handler already calls `cleanup()` when the dialog closes.

```tsx
// BEFORE:
useEffect(() => {
  if (item && open) {
    form.reset({...});
    cleanup();  // ← remove this
    // Initialize custom fields...
  }
}, [item, open, form, cleanup]);  // ← remove cleanup from deps

// AFTER:
useEffect(() => {
  if (item && open) {
    form.reset({...});
    // Initialize custom fields...
  }
}, [item, open, form]);
```

- **Knowledge note:** Classic "stale closure in useEffect deps" pattern. The `cleanup` useCallback depends on `rawImageSrc` and `croppedPreviewUrl`; adding it to `useEffect` deps causes unintended re-runs.

---

### Step 2: Add `aspect` prop to AvatarCropDialog for correct service image crop ratio

- **File:** `frontend/components/avatar-crop-dialog.tsx`
- **Issue:** `aspect={1}` is hardcoded in the Cropper component (line 255). Service images display at `aspect-[3/2]` in service cards, but the crop dialog produces square (1:1) images.
- **Fix:** Add an optional `aspect?: number` prop with default `1`. Pass it to `<Cropper aspect={aspect} />`.
- Also update the preview description text to not say "avatar" when cropShape is "rect".

```tsx
// In AvatarCropDialogProps:
aspect?: number;

// In function signature (default 1):
aspect = 1,

// In Cropper:
aspect={aspect}
```

- **Files that pass this prop:**
  - `frontend/app/(system)/(merchants)/merchants/[id]/services/create-service-dialog.tsx` → pass `aspect={3/2}`
  - `frontend/app/(system)/(merchants)/merchants/[id]/services/edit-service-dialog.tsx` → pass `aspect={3/2}`

---

### Step 3: Make service cards smaller in customer portal

- **Files:**
  - `frontend-customer-portal/components/storefront/service-card.tsx` — reduce card density
  - `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx` — increase grid columns

**In `service-card.tsx`:**
- Change image aspect from `aspect-[3/2]` to `aspect-[4/3]` (taller relative to width = smaller card footprint)
- Reduce padding: `p-3 space-y-1` → `p-2.5 space-y-0.5`
- Reduce price font: `text-lg font-bold` → `text-base font-bold`
- Reduce icon in empty state: `h-10 w-10` → `h-8 w-8`
- Action button padding: `py-1.5` → `py-1`

**In `page.tsx` (services grid):**
- Change `grid-cols-1 sm:grid-cols-2` → `grid-cols-2 sm:grid-cols-3` (more cards per row)
- Update loading skeleton grid to match: same change
- Keep `gap-4` → reduce to `gap-3` for tighter layout

---

### Step 4: Gallery — 1 row horizontal scroll

- **File:** `frontend-customer-portal/components/storefront/merchant-gallery.tsx`
- **Current:** Multi-column grid (`grid grid-cols-2 sm:grid-cols-3 gap-3`) with lightbox
- **Target:** Single horizontal scrollable row with left/right scroll arrow buttons. Keep the tab filter system. Keep the lightbox.

**Implementation:**
- Add `useRef<HTMLDivElement>(null)` for the scroll container
- Replace the `<div className="grid ...">` with `<div className="relative">` wrapper containing:
  - Left scroll button (absolutely positioned, ChevronLeft icon, only shown when can scroll left)
  - Scroll container: `flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2` with `scrollbar-hide` utility
  - Right scroll button (absolutely positioned, ChevronRight icon)
- Each image item: `flex-shrink-0 w-48 aspect-[4/3]` (fixed width so they line up in a row)
- Scroll buttons call `scrollContainer.current.scrollBy({ left: ±300, behavior: 'smooth' })`
- Track scroll position with `onScroll` handler to show/hide arrows
- Keep lightbox overlay as-is

**Scrollbar hide:** Add to global CSS or use inline style `msOverflowStyle: 'none', scrollbarWidth: 'none'` with pseudo-element handled via a `[&::-webkit-scrollbar]:hidden` Tailwind v4 utility.

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Removing `cleanup` from useEffect deps causes lint warning | Medium | Add `// eslint-disable-next-line react-hooks/exhaustive-deps` comment if needed |
| Gallery scroll buttons overlap images on very narrow screens | Low | Show buttons only on hover / hide on small screens (`hidden md:flex`) |
| `scrollbar-hide` Tailwind v4 utility may not exist | Medium | Use inline style `[&::-webkit-scrollbar]:hidden` or add to `globals.css` |
| Changing service card grid to 3 cols might be too cramped on small screens | Low | `grid-cols-2 sm:grid-cols-3` keeps 2 cols on mobile |

---

## Testing Strategy

- [ ] **Crop bug**: Open edit service dialog → click Upload → select image → crop dialog should open with image visible (not blank)
- [ ] **Crop aspect**: Crop dialog should show a landscape (wider than tall) crop area for service images
- [ ] **Service cards**: Merchant detail page should show 3 cards per row on desktop, cards should be visibly smaller
- [ ] **Gallery scroll**: If merchant has gallery images, they should appear in a single horizontal row with scroll buttons; clicking an image should open lightbox; tab filters should still work
- [ ] **TypeScript**: No new TS errors (`npm run build` in frontend/ and frontend-customer-portal/)

---

## Open Questions

- None — requirements are clear.

---

## Execution

Run with: `/work docs/plans/2026-02-27-bugfix-service-crop-card-gallery-plan.md`
