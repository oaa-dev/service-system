# Plan: Merchant Toggle for Loyalty & Referral Programs

**Date:** 2026-03-04
**Type:** feature
**Status:** Draft
**Brainstorm:** `docs/brainstorms/2026-03-04-merchant-loyalty-referral-toggles.md`

## Knowledge Context

### Relevant Learnings
- Merchant model already uses boolean capability flags (`can_sell_products`, `can_take_bookings`, `can_rent_units`) — follow same pattern
- Model defaults use `$attributes` array (not DB defaults) since `Model::create()` doesn't pick up DB defaults
- DTO uses `string|Optional` pattern (Spatie Laravel Data)
- Sidebar gating uses `requiresActiveMerchant` flag — need new gating property for feature toggles
- Customer portal has separate `types/api.ts` that also needs updating

### Known Gotchas
- Use `z.boolean().optional()` in Zod schema (not `z.coerce.boolean()`) to match react-hook-form types
- MerchantResource already has `loyalty_program` and `referral_program` fields via `whenLoaded` — no change needed there
- Customer portal Merchant interface is a separate copy from admin frontend — must update both

## Overview

Add `enable_loyalty_program` and `enable_referral_program` boolean flags to the Merchant model. These control feature visibility in the admin sidebar, merchant settings, and customer portal. Programs retain their data when toggled off (hide-only, no cascade).

## Implementation Steps

### Step 1: Backend Migration
- **Files:** `backend/database/migrations/2026_03_04_XXXXXX_add_loyalty_referral_toggles_to_merchants_table.php`
- **Details:** Add two boolean columns with `default(false)`:
  ```php
  $table->boolean('enable_loyalty_program')->default(false)->after('can_rent_units');
  $table->boolean('enable_referral_program')->default(false)->after('enable_loyalty_program');
  ```

### Step 2: Merchant Model
- **Files:** `backend/app/Models/Merchant.php`
- **Details:**
  - Add `enable_loyalty_program` and `enable_referral_program` to `$fillable`
  - Add to `$attributes` with `false` defaults
  - Add boolean casts in `casts()` method

### Step 3: MerchantData DTO
- **Files:** `backend/app/Data/MerchantData.php`
- **Details:** Add two fields:
  ```php
  public bool|Optional $enable_loyalty_program = new Optional(),
  public bool|Optional $enable_referral_program = new Optional(),
  ```

### Step 4: Form Requests
- **Files:**
  - `backend/app/Http/Requests/Api/V1/Merchant/UpdateMerchantRequest.php`
  - `backend/app/Http/Requests/Api/V1/Merchant/UpdateMyMerchantRequest.php`
- **Details:** Add validation rules (same pattern as existing capabilities):
  ```php
  'enable_loyalty_program' => ['sometimes', 'boolean'],
  'enable_referral_program' => ['sometimes', 'boolean'],
  ```

### Step 5: MerchantResource
- **Files:** `backend/app/Http/Resources/Api/V1/MerchantResource.php`
- **Details:** Add to the returned array after `inherit_from_parent`:
  ```php
  'enable_loyalty_program' => $this->enable_loyalty_program,
  'enable_referral_program' => $this->enable_referral_program,
  ```

### Step 6: Run Migration
- **Command:** `docker compose exec app php artisan migrate`

### Step 7: Frontend Admin — TypeScript Types
- **Files:** `frontend/types/api.ts`
- **Details:** Add to `Merchant` interface after `can_rent_units`:
  ```typescript
  enable_loyalty_program: boolean;
  enable_referral_program: boolean;
  ```
  Also add to any update request interfaces (e.g., `UpdateMerchantRequest`, `CreateMerchantRequest`, `UpdateBranchRequest`) as optional booleans.

### Step 8: Frontend Admin — Zod Schema
- **Files:** `frontend/lib/validations.ts`
- **Details:** Add to `updateMerchantSchema` after `can_rent_units`:
  ```typescript
  enable_loyalty_program: z.boolean().optional(),
  enable_referral_program: z.boolean().optional(),
  ```

### Step 9: Frontend Admin — Details Tab UI
- **Files:** `frontend/app/(system)/(my-store)/my-store/settings/my-store-details-tab.tsx`
- **Details:** Add two checkboxes in the "Store Capabilities" section after the existing three:
  - "Loyalty Program" checkbox bound to `enable_loyalty_program`
  - "Referral Program" checkbox bound to `enable_referral_program`
  - Include in form `defaultValues` and `reset()` calls

### Step 10: Frontend Admin — Sidebar Gating
- **Files:** `frontend/components/layout/app-sidebar.tsx`
- **Details:** Add a new optional property to sidebar item type (e.g., `requiresFeature?: 'enable_loyalty_program' | 'enable_referral_program'`). Apply it to the Loyalty and Referrals items. In the filter logic, check `merchant?.[item.requiresFeature]` alongside existing `requiresActiveMerchant` check.

### Step 11: Customer Portal — TypeScript Types
- **Files:** `frontend-customer-portal/types/api.ts`
- **Details:** Add `enable_loyalty_program` and `enable_referral_program` to the `Merchant` interface (same as admin).

### Step 12: Customer Portal — Merchant Detail Page Gating
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx`
- **Details:** Conditionally render loyalty program card and referral code section based on `merchant.enable_loyalty_program` / `merchant.enable_referral_program` flags.

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Existing merchants have false by default — loyalty/referral hidden | Medium | Expected behavior. Merchants must opt-in. Could add a data migration to enable for merchants that already have active programs. |
| Two-level toggle confusion (merchant toggle + program is_active) | Low | Toggle controls visibility. Program is_active controls operational state. Clear separation. |

## Testing Strategy

- [ ] Verify migration runs cleanly
- [ ] Verify new fields appear in merchant API response
- [ ] Verify toggles save correctly via self-service update endpoint
- [ ] Verify toggles save correctly via admin update endpoint
- [ ] Verify sidebar hides Loyalty/Referrals when toggles are off
- [ ] Verify sidebar shows Loyalty/Referrals when toggles are on
- [ ] Verify customer portal hides loyalty/referral sections when off
- [ ] Build both frontends (`npm run build`) to confirm no TypeScript errors

## Open Questions

- Should existing merchants with active loyalty/referral programs be auto-enabled via data migration? (Suggested: yes, add `UPDATE merchants SET enable_loyalty_program = true WHERE id IN (SELECT merchant_id FROM loyalty_programs WHERE is_active = true)` in migration)
