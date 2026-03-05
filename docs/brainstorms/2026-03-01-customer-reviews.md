# Brainstorm: Customer Reviews for Merchants

**Date:** 2026-03-01
**Status:** Ready for /plan

## Knowledge Context

- No existing review/rating system in the codebase
- Customer ↔ Merchant link is indirect: Customer → Booking/Reservation/ServiceOrder → Merchant
- `customer_id` on transactions points to `User.id`, NOT `Customer.id`
- Storefront publicly displays merchants via `StorefrontService` — reviews would integrate here
- Merchant detail page accessed by slug (`/storefront/merchants/{slug}`)
- Critical pattern: Eager load + Resource = atomic pair

## Problem / Goal

Add a merchant review system where verified customers (those with completed transactions) can rate and review merchants. Reviews display publicly on the storefront merchant detail page, providing social proof and helping customers make informed choices.

## User Decisions

| Decision | Choice |
|----------|--------|
| **Review target** | Merchant only (not per-service or per-transaction) |
| **Verification** | Verified purchase required — customer must have at least 1 completed transaction with the merchant |
| **Merchant response** | Yes — merchant can post a public reply to each review |
| **Moderation** | Auto-publish — reviews go live immediately, admin can flag/remove after |

## Data Model

### Table: `reviews`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| merchant_id | FK → merchants | Which merchant is being reviewed |
| customer_id | FK → customers | Who wrote the review |
| rating | tinyint | 1-5 star rating |
| title | string, nullable | Optional review title |
| comment | text, nullable | Review body (rating alone is valid) |
| is_verified | boolean, default true | Always true in our case (verified-only) |
| is_published | boolean, default true | Auto-published; admin can unpublish |
| merchant_reply | text, nullable | Merchant's response to the review |
| merchant_replied_at | timestamp, nullable | When merchant replied |
| admin_notes | text, nullable | Internal admin notes (not public) |
| created_at, updated_at | timestamps | |

**Unique constraint:** `[customer_id, merchant_id]` — one review per customer per merchant

**Indexes:** `merchant_id` (for listing), `customer_id` (for "my reviews"), `rating` (for filtering)

### Denormalized fields on `merchants` table (new migration)

| Column | Type | Notes |
|--------|------|-------|
| average_rating | decimal(3,2), nullable | Cached average (e.g., 4.50). Updated on review create/update/delete. |
| review_count | integer, default 0 | Cached count of published reviews |

**Why denormalize?** Merchant listing page shows rating for every merchant. Computing AVG() per merchant on every list request is expensive. Cache on write, read cheaply.

## Architecture

### Backend (Service-Repository Pattern)

```
Review:
  Route → ReviewController (customer creates/updates)
        → MerchantReviewController (merchant replies)
        → AdminReviewController (admin moderation)
  → FormRequest → ReviewData (DTO) → ReviewService → ReviewRepository → Model
```

### Verification Logic

**ReviewService::createReview(merchantId, customerId, data) flow:**
1. Get customer via `Customer::where('user_id', $customerId)->firstOrFail()`
2. Check existing review: `Review::where('customer_id', customer.id)->where('merchant_id', merchantId)->exists()` → 409 if duplicate
3. Verify purchase: Check if customer has at least 1 completed transaction with this merchant:
   ```
   Booking::where('customer_id', $userId)->where('merchant_id', $merchantId)->where('status', 'completed')->exists()
   OR Reservation::where(...)->where('status', 'checked_out')->exists()
   OR ServiceOrder::where(...)->where('status', 'completed')->exists()
   ```
   → 403 "You must have a completed transaction to review this merchant" if none
4. Create review (is_verified=true, is_published=true)
5. Update merchant's `average_rating` and `review_count` (recalculate from published reviews)
6. Return review

### Merchant Reply

**ReviewService::replyToReview(reviewId, merchantId, reply) flow:**
1. Find review → verify `review.merchant_id === merchantId`
2. Set `merchant_reply` and `merchant_replied_at`
3. Return updated review

### Admin Moderation

**ReviewService::togglePublished(reviewId) flow:**
1. Find review → toggle `is_published`
2. Recalculate merchant's `average_rating` and `review_count`
3. Return updated review

### Rating Recalculation

```php
private function recalculateMerchantRating(int $merchantId): void
{
    $stats = Review::where('merchant_id', $merchantId)
        ->where('is_published', true)
        ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as review_count')
        ->first();

    Merchant::where('id', $merchantId)->update([
        'average_rating' => $stats->avg_rating ? round($stats->avg_rating, 2) : null,
        'review_count' => $stats->review_count,
    ]);
}
```

Called after: create, update, delete, toggle publish.

### API Endpoints

**Customer Portal — Write reviews:**
```
POST   /customer/merchants/{merchantId}/reviews     → Create review (rating, title, comment)
PUT    /customer/reviews/{id}                       → Update own review
DELETE /customer/reviews/{id}                       → Delete own review
GET    /customer/reviews                            → My reviews across all merchants
```

**Merchant — Reply to reviews:**
```
GET    /auth/merchant/reviews                       → Reviews for my merchant (paginated)
POST   /auth/merchant/reviews/{id}/reply            → Reply to a review
PUT    /auth/merchant/reviews/{id}/reply            → Update reply
DELETE /auth/merchant/reviews/{id}/reply            → Delete reply
```

**Storefront (Public):**
```
GET    /storefront/merchants/{slug}/reviews         → Public reviews for merchant (paginated, sorted)
GET    /storefront/merchants/{slug}                 → Already exists; add average_rating + review_count to response
```

**Admin:**
```
GET    /admin/reviews                               → All reviews (filterable by merchant, rating, published status)
PATCH  /admin/reviews/{id}/toggle-publish           → Publish/unpublish a review
PUT    /admin/reviews/{id}/notes                    → Add admin notes
```

### Frontend

**Customer Portal (`frontend-customer-portal/`):**
- **Review form** on merchant detail page — star rating selector + optional title + comment. Only shows if customer has completed transaction and hasn't reviewed yet.
- **Edit/delete own review** on merchant detail page (if already reviewed)
- **My reviews page** (`/reviews`) — list of all reviews the customer has written
- **Review list** on merchant detail page — paginated, sorted by newest, shows star rating + comment + merchant reply

**Admin Frontend (`frontend/`):**
- **My-store reviews page** (`/my-store/reviews`) — merchant sees reviews, can reply
- **Admin reviews moderation** (`/reviews` or under settings) — super-admin can unpublish/flag reviews

**Storefront display:**
- Merchant card on listing page: star rating + review count badge
- Merchant detail page: review summary (avg rating, distribution bar chart) + review list

### Permissions

```
reviews.view              (admin views all reviews)
reviews.moderate          (admin publish/unpublish)
customer_portal.review    (customer writes reviews)
```

Merchant reply uses existing `merchant` role — no separate permission needed (merchants can only reply to reviews on their own store).

## Open Questions

1. **Review editing:** Should customers be allowed to edit their review after posting? Recommend: yes, unlimited edits (common practice). Updated review keeps same created_at, updates updated_at.
2. **Rating distribution display:** Show bar chart breakdown (5-star: 80%, 4-star: 15%, etc.) on merchant detail? Recommend: yes, calculate in frontend from review data or add a summary endpoint.
3. **Sort options:** Newest, highest rated, lowest rated, most helpful? For MVP: newest only.
4. **Photo reviews:** Should customers be able to attach photos? Recommend: defer to post-MVP. Would use Spatie Media Library `review_photo` collection.
5. **Helpful votes:** Should other customers be able to mark reviews as "helpful"? Recommend: defer to post-MVP.

### Resolved Questions
- ~~Fake review prevention~~ — Verified purchase required. Only customers with completed transactions can review.
- ~~Review spam~~ — One review per customer per merchant (unique constraint).
- ~~Biased moderation~~ — Auto-publish, admin-only moderation (not merchant-controlled).
- ~~Performance~~ — Denormalized `average_rating` and `review_count` on merchants table. No runtime aggregation on list queries.

## Next Steps

- [ ] Create implementation plan with `/plan`
- [ ] Phase 1: Backend — Migration (reviews table + merchant rating columns), Model, Factory, Repository, Service
- [ ] Phase 2: Backend — Controllers (Customer, Merchant reply, Admin moderation), FormRequests, DTO, Resource
- [ ] Phase 3: Backend — Routes, Permissions, Storefront integration (add rating to merchant response)
- [ ] Phase 4: Backend — Tests
- [ ] Phase 5: Customer Portal — Review form on merchant detail, my reviews page, review list display
- [ ] Phase 6: Admin Frontend — My-store reviews + reply UI, admin moderation page
- [ ] Phase 7: Storefront — Rating display on merchant cards and detail page
