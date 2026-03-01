---
title: "CSS `background` shorthand overrides Tailwind `bg-*` utility, causing lost background-color"
date: 2026-02-27
problem_type: styling_issue
component: component
module: frontend-customer-portal/app
severity: medium
resolution_type: code_fix
tags: [tailwind, css, background-shorthand, bg-primary, gradient, custom-css]
---

## Symptom

A UI panel that uses both a Tailwind background-color utility (`bg-primary`, `bg-card`, etc.) and a custom CSS class that applies gradient overlays (`gradient-mesh`) appears washed-out, transparent, or missing its background color.

In this case: the auth layout's left panel uses `bg-primary gradient-mesh grain`. The primary color was lost, making the panel look like a semi-transparent overlay rather than a solid colored panel.

## Root Cause

The CSS `background` shorthand property **resets all background sub-properties** — including `background-color` — when applied. If a custom CSS class uses `background:` (shorthand) to apply gradient layers, it implicitly sets `background-color: initial` (transparent), overriding any `background-color` set by a Tailwind utility like `bg-primary`.

```css
/* WRONG — shorthand resets background-color to transparent */
.gradient-mesh {
  background:
    radial-gradient(ellipse at 20% 50%, oklch(0.92 0.06 180 / 30%) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, oklch(0.92 0.08 80 / 25%) 0%, transparent 50%);
}
```

When both `bg-primary` (sets `background-color`) and `.gradient-mesh` (sets `background` shorthand) are applied to the same element, the one that wins depends on CSS cascade order. If `.gradient-mesh` wins, `background-color` becomes transparent and the gradient-only layer shows through to whatever is behind the element.

## Solution

Use `background-image` instead of `background` in the custom CSS class. This only adds gradient layers without touching `background-color`:

```css
/* CORRECT — background-image does not reset background-color */
.gradient-mesh {
  background-image:
    radial-gradient(ellipse at 20% 50%, oklch(0.92 0.06 180 / 30%) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, oklch(0.92 0.08 80 / 25%) 0%, transparent 50%);
}
```

With this fix:
- `bg-primary` applies `background-color: var(--primary)` ✓
- `.gradient-mesh` overlays gradient layers via `background-image` ✓
- Both coexist without conflict ✓

## Prevention

- **Never use `background:` shorthand in CSS utility classes that are meant to add visual overlays on top of an element's existing background color.** Use `background-image:` instead.
- This applies to any custom class that combines with Tailwind's `bg-*` utilities.
- The rule: `background` (shorthand) = replace everything. `background-image` = only add/replace gradient layers.

## Related Files

- `frontend-customer-portal/app/globals.css` — `.gradient-mesh` class definition
- `frontend-customer-portal/app/(auth)/layout.tsx` — uses `bg-primary gradient-mesh grain`
