# Plan: Customer Reviews for Merchants

**Date:** 2026-03-02
**Type:** feature
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-03-01-customer-reviews.md](../brainstorms/2026-03-01-customer-reviews.md)

## Knowledge Context

### Relevant Learnings
- [Eager-loaded relation silently missing from API response](../knowledge/solutions/api-errors/eager-loaded-relation-missing-from-api-response-storefront-20260227.md): When adding `reviews` to MerchantResource, must add both `->with('reviews')` in service AND `whenLoaded('reviews')` in Resource — the atomic pair pattern.
- [morphMap not enforceMorphMap](../knowledge/solutions/runtime-errors/enforce-morph-map-breaks-existing-polymorphic-models-chat-20260228.md): Not directly needed (reviews aren't polymorphic), but important if we ever extend reviews to be polymorphic targets.
- [MySQL ENUM factory values truncated](../knowledge/solutions/test-failures/mysql-enum-factory-values-truncated-in-tests-customer-20260228.md): ReviewFactory must only use values that match the actual column constraints (boolean for is_published, tinyint 1-5 for rating).

### Known Gotchas
- `customer_id` on Booking/Reservation/ServiceOrder refers to `User.id`, NOT `Customer.id` — verification queries must use `auth()->id()` for transaction lookups, but `Customer.id` for the review FK
- Eager load + Resource = atomic pair — forgetting `whenLoaded()` silently omits data with no error
- Model `$attributes` array required for defaults (DB defaults don't propagate on `Model::create()`)
- `authorize(): true` on all FormRequests — permission checks live in route middleware

### Critical Patterns Applied
- Service-Repository pattern (matches Booking module structure)
- Denormalized `average_rating` + `review_count` on merchants table (write-time cache, cheap reads)
- Spatie QueryBuilder for filterable/sortable list endpoints
- DTO with `string|Optional` fields via Spatie Laravel Data

## Overview

Add a merchant review system where verified customers (with completed transactions) can rate and review merchants. Reviews auto-publish and display on the storefront. Merchants can reply. Admins can moderate (unpublish). Denormalized rating fields on merchants avoid runtime aggregation.

### User Decisions
| Decision | Choice |
|----------|--------|
| Review editing | Yes — unlimited edits |
| Sort options | Newest only (MVP) |
| Admin routes | Flat `/reviews` with merchant filter |
| Photo reviews | Deferred to post-MVP |
| Helpful votes | Deferred to post-MVP |

## Implementation Steps

### Phase 1: Backend — Database & Model Layer

#### Step 1.1: Migration — `reviews` table
- **Files:** `backend/database/migrations/YYYY_MM_DD_HHMMSS_create_reviews_table.php`
- **Details:**
  - Columns: `id`, `merchant_id` (FK→merchants), `customer_id` (FK→customers), `rating` (tinyInteger, 1-5), `title` (string nullable), `comment` (text nullable), `is_verified` (boolean default true), `is_published` (boolean default true), `merchant_reply` (text nullable), `merchant_replied_at` (timestamp nullable), `admin_notes` (text nullable), `timestamps`
  - Unique constraint: `[customer_id, merchant_id]`
  - Indexes: `merchant_id`, `customer_id`, `rating`

#### Step 1.2: Migration — Add rating columns to `merchants` table
- **Files:** `backend/database/migrations/YYYY_MM_DD_HHMMSS_add_rating_columns_to_merchants_table.php`
- **Details:**
  - Add `average_rating` (decimal 3,2 nullable) and `review_count` (integer default 0)
  - These are write-time cached values, updated by ReviewService on create/update/delete/toggle-publish

#### Step 1.3: Review Model
- **Files:** `backend/app/Models/Review.php`
- **Details:**
  - `$fillable`: all columns except id/timestamps
  - `$attributes`: `['is_verified' => true, 'is_published' => true, 'review_count' => 0]` (review_count on Merchant, not here — this model just needs `is_verified` and `is_published` defaults)
  - `$casts`: `is_verified` → boolean, `is_published` → boolean, `merchant_replied_at` → datetime, `rating` → integer
  - Relations: `merchant()` BelongsTo, `customer()` BelongsTo (Customer model), `reviewer()` BelongsTo User (via customer.user_id for display)
  - Scopes: `scopePublished($query)` → `where('is_published', true)`

#### Step 1.4: Update Merchant Model
- **Files:** `backend/app/Models/Merchant.php`
- **Details:**
  - Add `average_rating` and `review_count` to `$fillable`
  - Add `average_rating` → `decimal:2` to casts
  - Add `reviews()` HasMany relationship
  - Add `publishedReviews()` HasMany with `->where('is_published', true)`

#### Step 1.5: Update Customer Model
- **Files:** `backend/app/Models/Customer.php`
- **Details:**
  - Add `reviews()` HasMany relationship

#### Step 1.6: Review Factory
- **Files:** `backend/database/factories/ReviewFactory.php`
- **Details:**
  - `merchant_id` → Merchant::factory, `customer_id` → Customer::factory
  - `rating` → `fake()->numberBetween(1, 5)` (must be exact range, no out-of-bounds)
  - `title` → `fake()->optional(0.7)->sentence(4)`
  - `comment` → `fake()->optional(0.8)->paragraph()`
  - `is_verified` → true, `is_published` → true
  - States: `unpublished()`, `withReply()`, `withAdminNotes()`, `rating(int $stars)`

### Phase 2: Backend — Repository & Service Layer

#### Step 2.1: ReviewRepository + Interface
- **Files:** `backend/app/Repositories/Contracts/ReviewRepositoryInterface.php`, `backend/app/Repositories/ReviewRepository.php`
- **Details:**
  - Interface extends base with no extra methods (BaseRepository covers CRUD)
  - Repository extends `BaseRepository` with `Review` model

#### Step 2.2: ReviewService + Interface
- **Files:** `backend/app/Services/Contracts/ReviewServiceInterface.php`, `backend/app/Services/ReviewService.php`
- **Details:**
  - **Dependencies:** ReviewRepositoryInterface, MerchantRepositoryInterface
  - `getPublicReviews(int $merchantId, Request $request)` — QueryBuilder for published reviews, sorted newest, paginated. Eager loads `customer.user` (for display name/avatar)
  - `getMerchantReviews(int $merchantId, Request $request)` — QueryBuilder all reviews (merchant self-service). Eager loads `customer.user`
  - `getAllReviews(Request $request)` — QueryBuilder with merchant filter, rating filter, is_published filter (admin moderation). Eager loads `customer.user`, `merchant`
  - `getMyReviews(int $userId, Request $request)` — Customer's own reviews. Eager loads `merchant`
  - `createReview(int $merchantId, int $userId, ReviewData $data)`:
    1. `Customer::where('user_id', $userId)->firstOrFail()` → get customer record
    2. Check duplicate: `Review::where('customer_id', $customer->id)->where('merchant_id', $merchantId)->exists()` → throw ApiException(409)
    3. Verify purchase: check completed Booking/Reservation/ServiceOrder where `customer_id = $userId` and `merchant_id = $merchantId` → throw ApiException(403) if none
    4. Create review with `customer_id = $customer->id`, `merchant_id`, `is_verified = true`, `is_published = true`
    5. Call `recalculateMerchantRating($merchantId)`
    6. Return review with relations
  - `updateReview(int $reviewId, int $userId, ReviewData $data)`:
    1. Find review → verify ownership via customer.user_id === userId
    2. Update allowed fields (rating, title, comment)
    3. Recalculate if rating changed
    4. Return updated review
  - `deleteReview(int $reviewId, int $userId)`:
    1. Find review → verify ownership
    2. Delete + recalculate
  - `replyToReview(int $reviewId, int $merchantId, string $reply)`:
    1. Find review → verify `merchant_id === $merchantId`
    2. Update `merchant_reply` and `merchant_replied_at = now()`
  - `updateReply(int $reviewId, int $merchantId, string $reply)` — same as replyToReview (idempotent)
  - `deleteReply(int $reviewId, int $merchantId)`:
    1. Find review → verify merchant ownership
    2. Set `merchant_reply = null`, `merchant_replied_at = null`
  - `togglePublished(int $reviewId)`:
    1. Find review → toggle `is_published`
    2. Recalculate merchant rating
  - `updateAdminNotes(int $reviewId, string $notes)`:
    1. Find review → set `admin_notes`
  - `recalculateMerchantRating(int $merchantId)` (private):
    ```php
    $stats = Review::where('merchant_id', $merchantId)
        ->where('is_published', true)
        ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as review_count')
        ->first();
    Merchant::where('id', $merchantId)->update([
        'average_rating' => $stats->avg_rating ? round($stats->avg_rating, 2) : null,
        'review_count' => $stats->review_count,
    ]);
    ```
  - **Knowledge note:** Eager load + Resource atomic pair — every `->with()` here must have a matching `whenLoaded()` in ReviewResource

#### Step 2.3: Bind interfaces in RepositoryServiceProvider
- **Files:** `backend/app/Providers/RepositoryServiceProvider.php`
- **Details:** Add `ReviewRepositoryInterface → ReviewRepository` and `ReviewServiceInterface → ReviewService`

### Phase 3: Backend — API Layer (Controllers, Requests, DTO, Resource)

#### Step 3.1: ReviewData DTO
- **Files:** `backend/app/Data/ReviewData.php`
- **Details:**
  - Fields: `rating` (int|Optional), `title` (string|null|Optional), `comment` (string|null|Optional)
  - Minimal DTO — only customer-writable fields

#### Step 3.2: FormRequests
- **Files:** `backend/app/Http/Requests/Api/V1/Review/`
  - `CreateReviewRequest.php` — rating (required, integer, min:1, max:5), title (nullable, string, max:255), comment (nullable, string, max:5000)
  - `UpdateReviewRequest.php` — same rules but all optional
  - `ReplyToReviewRequest.php` — reply (required, string, max:5000)
  - `UpdateAdminNotesRequest.php` — admin_notes (required, string, max:5000)
- **Details:** All return `authorize(): true`

#### Step 3.3: ReviewResource
- **Files:** `backend/app/Http/Resources/Api/V1/ReviewResource.php`
- **Details:**
  ```php
  return [
      'id' => $this->id,
      'merchant_id' => $this->merchant_id,
      'customer_id' => $this->customer_id,
      'rating' => $this->rating,
      'title' => $this->title,
      'comment' => $this->comment,
      'is_verified' => $this->is_verified,
      'is_published' => $this->is_published,
      'merchant_reply' => $this->merchant_reply,
      'merchant_replied_at' => $this->merchant_replied_at?->toISOString(),
      'admin_notes' => $this->when(/* admin context */, $this->admin_notes),
      'customer' => $this->whenLoaded('customer', fn () => [
          'id' => $this->customer->id,
          'name' => $this->customer->user?->name,
          'avatar' => $this->customer->user?->getFirstMediaUrl('avatar', 'thumb') ?: null,
      ]),
      'merchant' => $this->whenLoaded('merchant', fn () => [
          'id' => $this->merchant->id,
          'name' => $this->merchant->name,
          'slug' => $this->merchant->slug,
      ]),
      'created_at' => $this->created_at?->toISOString(),
      'updated_at' => $this->updated_at?->toISOString(),
  ];
  ```
  - **Knowledge note:** `admin_notes` conditionally included (only for admin/merchant context, not public)

#### Step 3.4: Update MerchantResource
- **Files:** `backend/app/Http/Resources/Api/V1/MerchantResource.php`
- **Details:**
  - Add `'average_rating' => $this->average_rating`, `'review_count' => $this->review_count`
  - Add `'reviews' => $this->whenLoaded('reviews', fn () => ReviewResource::collection($this->reviews))`
  - **Knowledge note:** Atomic pair — only appears when reviews are eagerly loaded

#### Step 3.5: Controllers
- **Files:**
  - `backend/app/Http/Controllers/Api/V1/CustomerReviewController.php` — Customer CRUD on own reviews
  - `backend/app/Http/Controllers/Api/V1/MerchantReviewController.php` — Merchant views + replies (self-service via `auth/merchant/`)
  - `backend/app/Http/Controllers/Api/V1/ReviewController.php` — Admin moderation
  - Update `backend/app/Http/Controllers/Api/V1/StorefrontController.php` — add public reviews endpoint

- **CustomerReviewController:**
  - `store(CreateReviewRequest, int $merchantId)` → `reviewService->createReview($merchantId, auth()->id(), ReviewData::from(...))`
  - `update(UpdateReviewRequest, int $id)` → `reviewService->updateReview($id, auth()->id(), ReviewData::from(...))`
  - `destroy(int $id)` → `reviewService->deleteReview($id, auth()->id())`
  - `myReviews(Request)` → `reviewService->getMyReviews(auth()->id(), $request)` → paginatedResponse

- **MerchantReviewController:**
  - `index(Request)` → `reviewService->getMerchantReviews($merchant->id, $request)` → paginatedResponse
  - `reply(ReplyToReviewRequest, int $id)` → `reviewService->replyToReview($id, $merchant->id, $request->reply)`
  - `updateReply(ReplyToReviewRequest, int $id)` — same as reply (idempotent update)
  - `deleteReply(int $id)` → `reviewService->deleteReply($id, $merchant->id)`

- **ReviewController (Admin):**
  - `index(Request)` → `reviewService->getAllReviews($request)` → paginatedResponse
  - `togglePublish(int $id)` → `reviewService->togglePublished($id)`
  - `updateNotes(UpdateAdminNotesRequest, int $id)` → `reviewService->updateAdminNotes($id, $request->admin_notes)`

- **StorefrontController (add method):**
  - `merchantReviews(Request, string $slug)` → find merchant by slug → `reviewService->getPublicReviews($merchant->id, $request)` → paginatedResponse

### Phase 4: Backend — Routes & Permissions

#### Step 4.1: Add permissions to RolePermissionSeeder
- **Files:** `backend/database/seeders/RolePermissionSeeder.php`
- **Details:**
  - New permissions: `reviews.view`, `reviews.moderate`
  - Add `customer_portal.review` to customer permissions
  - Assign `reviews.view` and `reviews.moderate` to admin role
  - Assign `customer_portal.review` to customer role

#### Step 4.2: Routes
- **Files:** `backend/routes/api.php`
- **Details:**
  - **Public (storefront group):**
    ```
    GET /storefront/merchants/{slug}/reviews → StorefrontController@merchantReviews
    ```
  - **Customer portal (auth + customer middleware group):**
    ```
    POST   /customer/merchants/{merchantId}/reviews → CustomerReviewController@store
    PUT    /customer/reviews/{review}               → CustomerReviewController@update
    DELETE /customer/reviews/{review}               → CustomerReviewController@destroy
    GET    /customer/reviews                        → CustomerReviewController@myReviews
    ```
    Permission: `customer_portal.review`
  - **Merchant self-service (auth/merchant group):**
    ```
    GET    /auth/merchant/reviews                   → MerchantReviewController@index
    POST   /auth/merchant/reviews/{review}/reply    → MerchantReviewController@reply
    PUT    /auth/merchant/reviews/{review}/reply    → MerchantReviewController@updateReply
    DELETE /auth/merchant/reviews/{review}/reply    → MerchantReviewController@deleteReply
    ```
  - **Admin (auth + permission middleware):**
    ```
    GET    /reviews                                 → ReviewController@index        (permission: reviews.view)
    PATCH  /reviews/{review}/toggle-publish         → ReviewController@togglePublish (permission: reviews.moderate)
    PUT    /reviews/{review}/notes                  → ReviewController@updateNotes   (permission: reviews.moderate)
    ```

### Phase 5: Backend — Tests

#### Step 5.1: Feature tests
- **Files:** `backend/tests/Feature/Api/V1/ReviewTest.php`
- **Details:** Pest describe/it syntax. Test groups:
  - **Customer review CRUD:**
    - Can create review with completed booking → 201
    - Can create review with completed reservation → 201
    - Can create review with completed service order → 201
    - Cannot create review without completed transaction → 403
    - Cannot create duplicate review → 409
    - Can update own review → 200
    - Cannot update another customer's review → 403
    - Can delete own review → 204
    - Can list my reviews → 200
  - **Rating recalculation:**
    - Merchant average_rating and review_count update on create
    - Merchant average_rating and review_count update on delete
    - Merchant average_rating recalculates on toggle publish
  - **Merchant reply:**
    - Merchant can reply to review on own store → 200
    - Merchant cannot reply to review on another merchant → 403
    - Merchant can update reply → 200
    - Merchant can delete reply → 200
    - Merchant can list reviews for own store → 200
  - **Admin moderation:**
    - Admin can list all reviews with filters → 200
    - Admin can toggle publish → 200
    - Admin can add notes → 200
  - **Storefront (public):**
    - Public can view published reviews → 200
    - Unpublished reviews not shown in public list
  - **Validation:**
    - Rating required and must be 1-5
    - Title max 255 characters
    - Comment max 5000 characters
  - **Knowledge note:** Use `Passport::actingAs()` for auth, `RefreshDatabase` trait, seed `RolePermissionSeeder`

### Phase 6: Customer Portal Frontend

#### Step 6.1: TypeScript types
- **Files:** `frontend-customer-portal/types/api.ts`
- **Details:** Add `Review` interface matching ReviewResource output, update `Merchant` interface to include `average_rating` and `review_count`

#### Step 6.2: Review service
- **Files:** `frontend-customer-portal/services/reviewService.ts`
- **Details:**
  - `getPublicReviews(slug, params)` — GET `/storefront/merchants/${slug}/reviews`
  - `createReview(merchantId, data)` — POST `/customer/merchants/${merchantId}/reviews`
  - `updateReview(id, data)` — PUT `/customer/reviews/${id}`
  - `deleteReview(id)` — DELETE `/customer/reviews/${id}`
  - `getMyReviews(params)` — GET `/customer/reviews`

#### Step 6.3: Review hooks
- **Files:** `frontend-customer-portal/hooks/useReviews.ts`
- **Details:**
  - `usePublicReviews(slug)` — React Query for paginated public reviews
  - `useMyReviews()` — React Query for customer's own reviews
  - `useCreateReview()` — mutation, invalidates merchant + reviews queries
  - `useUpdateReview()` — mutation
  - `useDeleteReview()` — mutation, invalidates + recalculates

#### Step 6.4: Review components on merchant detail page
- **Files:**
  - `frontend-customer-portal/components/reviews/star-rating.tsx` — Reusable star display + input component
  - `frontend-customer-portal/components/reviews/review-form.tsx` — Create/edit review form (star selector + title + comment)
  - `frontend-customer-portal/components/reviews/review-list.tsx` — Paginated review list with merchant replies
  - `frontend-customer-portal/components/reviews/review-summary.tsx` — Average rating display + review count
- **Details:**
  - Review form only shows if: (a) customer is authenticated, (b) has no existing review for this merchant
  - If customer has existing review: show their review with edit/delete buttons
  - Review list: sorted newest first, shows star rating, title, comment, merchant reply, relative timestamps

#### Step 6.5: Integrate into merchant detail page
- **Files:** `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx`
- **Details:**
  - Add ReviewSummary component in merchant header area (average rating + count)
  - Add Reviews section below existing content (ReviewForm + ReviewList)

#### Step 6.6: My Reviews page
- **Files:** `frontend-customer-portal/app/(customer)/reviews/page.tsx`
- **Details:**
  - List of customer's own reviews across all merchants
  - Each review card shows merchant name, rating, comment, edit/delete actions
  - Add to customer dashboard nav

#### Step 6.7: Rating display on merchant cards
- **Files:** `frontend-customer-portal/components/storefront/merchant-card.tsx`
- **Details:** Add star rating + review count badge below merchant name

### Phase 7: Admin Frontend

#### Step 7.1: TypeScript types
- **Files:** `frontend/types/api.ts`
- **Details:** Add `Review` interface, update `Merchant` interface with `average_rating`, `review_count`

#### Step 7.2: Review service + hooks
- **Files:** `frontend/services/reviewService.ts`, `frontend/hooks/useReviews.ts`
- **Details:**
  - Admin: `getReviews(params)`, `togglePublish(id)`, `updateNotes(id, notes)`
  - Merchant self-service: `getMyMerchantReviews(params)`, `replyToReview(id, reply)`, `updateReply(id, reply)`, `deleteReply(id)`

#### Step 7.3: My-store reviews page (merchant self-service)
- **Files:** `frontend/app/(system)/(my-store)/my-store/reviews/page.tsx`
- **Details:**
  - Paginated list of reviews for merchant's store
  - Reply dialog/inline reply form per review
  - Shows customer name, rating, comment, timestamp
  - Merchant can write/edit/delete replies

#### Step 7.4: Admin review moderation page
- **Files:** `frontend/app/(system)/(settings)/reviews/page.tsx`
- **Details:**
  - Global review list with filters (merchant, rating, published status)
  - Toggle publish/unpublish button per review
  - Admin notes dialog/inline field
  - Permission-gated: `reviews.view` to see, `reviews.moderate` to act

#### Step 7.5: Sidebar entries
- **Files:** `frontend/components/layout/app-sidebar.tsx`
- **Details:**
  - Add "Reviews" under my-store section (for merchants)
  - Add "Reviews" under settings/moderation section (for admins, permission-gated)

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Customer.id vs User.id confusion in verification queries | High | Verification uses `auth()->id()` (User.id) for transaction lookups, `Customer.id` for review FK. Comment extensively. |
| Eager load missing from Resource (silent data loss) | Medium | Follow atomic pair pattern — add `whenLoaded()` for every `with()`. Knowledge base pattern. |
| Rating recalculation race condition on concurrent writes | Low | Single `selectRaw('AVG...')` query is atomic. If needed later, wrap in DB transaction. |
| Denormalized rating gets out of sync | Low | Every mutation path (create/update/delete/toggle) calls `recalculateMerchantRating()`. Full recalc, not incremental. |
| Factory values out of range for rating | Medium | Constrain to `numberBetween(1, 5)`. Knowledge base ENUM pattern applies to bounded integers too. |

## Testing Strategy

- [ ] Customer can create review with each transaction type (booking, reservation, service order)
- [ ] Duplicate review prevention (409 conflict)
- [ ] Verified purchase requirement (403 without completed transaction)
- [ ] Own-review isolation (cannot edit/delete others' reviews)
- [ ] Merchant reply scoped to own merchant
- [ ] Admin moderation (toggle publish, admin notes)
- [ ] Rating recalculation correctness (average + count update on every mutation)
- [ ] Public endpoint excludes unpublished reviews
- [ ] Storefront merchant response includes average_rating and review_count
- [ ] Validation rules (rating 1-5, max lengths)
- [ ] Frontend: TypeScript compiles, lint passes, build succeeds

## Open Questions

- None — all decisions resolved in brainstorm + user confirmation above.
