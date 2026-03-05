# Brainstorm: Merchant Toggle for Loyalty & Referral Programs

**Date:** 2026-03-04
**Status:** Draft

## Knowledge Context

- Merchant model already uses boolean capability flags (`can_sell_products`, `can_take_bookings`, `can_rent_units`) to gate feature availability
- Loyalty and referral programs have their own `is_active` flags on program models
- Programs use upsert pattern — creating enables, deactivating sets `is_active=false`
- Existing capability toggles live in "Store Capabilities" section of `my-store-details-tab.tsx`
- `Merchant->loyaltyProgram()` and `Merchant->referralProgram()` are HasOne scoped to `where('is_active', true)`

## Problem / Goal

Add merchant-level toggle switches to enable/disable Loyalty Program and Referral Program features. Currently there's no merchant-level gate — programs are either created or not. Need a simple on/off mechanism that:
1. Controls feature visibility in sidebar, settings, and storefront
2. Preserves program data when toggled off (unlike deactivation which expires QR codes)
3. Follows the established capability flags pattern

## Approaches Considered

### Approach A: Merchant-level boolean flags (Selected)
- **Description:** Add `enable_loyalty_program` and `enable_referral_program` boolean columns to merchants table. Same pattern as existing capability flags. Toggle in Store Capabilities section.
- **Pros:** Consistent with existing pattern. Two-level control (merchant toggle + program is_active). Data preserved when toggled off. Simple UI. Future platform-level gating possible.
- **Cons:** Extra migration. Two levels of "enabled" to reason about.

### Approach B: Program existence as toggle
- **Description:** No new columns. Creating a program = enabling, deactivating = disabling.
- **Pros:** No migration. Already have endpoints.
- **Cons:** Couples feature visibility to program state. Toggle ON needs default values. Can't hide feature before configuration.

### Approach C: BusinessType-level capability flags
- **Description:** Add flags to both BusinessType and Merchant (like existing capabilities with copy-on-create).
- **Pros:** Platform-level control per business type.
- **Cons:** Over-engineered for current needs. Can add BusinessType flags later if needed.

## Decision

**Approach A: Merchant-level boolean flags** — Add two boolean columns to merchants table, display in Store Capabilities section alongside existing checkboxes.

### UI Placement
Toggles appear in the existing "Store Capabilities" section of the Details tab in My Store Settings, alongside can_sell_products, can_take_bookings, can_rent_units.

## Implementation Summary

### Backend
- Migration: add `enable_loyalty_program` (default false) and `enable_referral_program` (default false) to merchants table
- Merchant model: add to $fillable, $attributes defaults, casts
- MerchantData DTO: add two Optional boolean fields
- UpdateMyMerchantRequest + UpdateMerchantRequest: add boolean validation rules
- MerchantResource: include the two new fields
- Sidebar gating: loyalty/referral pages check the merchant toggle before showing

### Frontend Admin
- my-store-details-tab.tsx: add two checkboxes in Store Capabilities section
- app-sidebar.tsx: gate Loyalty and Referral sidebar items on merchant flags
- TypeScript types: add two boolean fields to Merchant interface
- Zod schema: add two boolean fields to updateMerchantSchema

### Customer Portal
- Hide loyalty card and referral sections on merchant detail page when merchant toggle is off

### Storefront API
- MerchantResource already exposes loyalty/referral program via whenLoaded
- Toggles control whether programs are loaded/visible

## Open Questions

- Should the toggle cascade to deactivate active programs when turned off, or just hide them?
  - Decision: Just hide. Toggling off = feature hidden but program data intact. Toggling on = feature visible again with existing program data.

## Next Steps

- [ ] `/plan` to create step-by-step implementation plan
