---
problem_type: api_error
module: storefront
component: resource
root_cause: missing_eager_load
severity: medium
resolution_type: code_fix
date: 2026-02-27
tags: [eloquent, resource, whenLoaded, eager-loading, api-response]
files:
  - backend/app/Http/Resources/Api/V1/MerchantResource.php
  - backend/app/Services/StorefrontService.php
---

# Eager-Loaded Relation Silently Missing from API Response

## Symptom

The `StorefrontService.getMerchantBySlug()` eager-loads `serviceCategories`, but the API response for `GET /storefront/merchants/{slug}` does not include `service_categories` in the JSON output. No error is thrown — the field is simply absent.

Frontend code accessing `merchant.service_categories` gets `undefined`.

## Investigation

1. Confirmed `StorefrontService.getMerchantBySlug()` includes `'serviceCategories'` in the `->with([...])` call
2. Confirmed the `Merchant` model has the `serviceCategories()` HasMany relationship
3. Checked `MerchantResource.toArray()` — **no `whenLoaded('serviceCategories', ...)` entry**

## Root Cause

Laravel's `JsonResource` requires an explicit `whenLoaded()` call for each relation you want in the API response. Eager-loading in the service/repository only prevents N+1 queries — it does NOT automatically include the relation in the serialized output.

The `MerchantResource` had `whenLoaded` entries for `user`, `businessType`, `address`, `paymentMethods`, `socialLinks`, `documents`, `businessHours`, `children`, `statusLogs` — but `serviceCategories` was never added when the storefront was built, because it wasn't needed at that time.

## Solution

Added the missing `whenLoaded` entry to `MerchantResource.php`:

```php
'service_categories' => $this->whenLoaded('serviceCategories', fn () => ServiceCategoryResource::collection($this->serviceCategories)),
```

Also added `service_categories?: ServiceCategory[]` to the frontend `Merchant` TypeScript interface.

## Checklist: Adding a New Relation to API Output

When a new relation needs to appear in an API response, **both** sides must be updated:

1. **Service/Repository**: Add to `->with([...])` eager load
2. **Resource**: Add `whenLoaded('relationName', ...)` to `toArray()`
3. **Frontend types**: Add the field to the TypeScript interface
4. **Frontend access**: Use optional chaining (`merchant.service_categories?.map(...)`)

Missing step 1 = N+1 query (performance issue, but data appears)
Missing step 2 = **data silently omitted** (this bug — hardest to catch)
Missing step 3 = TypeScript error (caught at compile time)

## Prevention

When adding a relation to a `->with()` eager load, always check the corresponding Resource class for a matching `whenLoaded()` entry. The pattern should be treated as atomic — eager load + Resource entry go together.

Key Resources to check:
- `MerchantResource` — `app/Http/Resources/Api/V1/MerchantResource.php`
- `ServiceResource` — `app/Http/Resources/Api/V1/ServiceResource.php`
- Any other Resource class for the model being modified
