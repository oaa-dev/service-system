# Reviews Module

## Overview
Customer review system for merchants. Customers who have completed a transaction (booking, reservation, or service order) can leave a rating and optional comment. Ratings are denormalized to the `merchants` table for fast display. Merchants can reply to reviews. Admins can moderate (toggle publish, add notes).

## Model
- **Path**: `backend/app/Models/Review.php`
- **Table**: `reviews`
- **Fillable**: `merchant_id`, `customer_id`, `rating`, `title`, `comment`, `is_verified`, `is_published`, `merchant_reply`, `merchant_replied_at`, `admin_notes`
- **Defaults** (`$attributes`): `is_verified=true`, `is_published=true`
- **Casts**: `is_verified` -> boolean, `is_published` -> boolean, `merchant_replied_at` -> datetime, `rating` -> integer
- **Relationships**:
  - `merchant()` -> BelongsTo -> `Merchant`
  - `customer()` -> BelongsTo -> `Customer` (FK: customer_id → customers table, NOT users table)
- **Scopes**:
  - `scopePublished($query)` — filters `is_published = true`
- **Traits**: HasFactory

## CRITICAL: customer_id FK Distinction
The `Review.customer_id` is a FK to the `customers` table (not `users`). But:
- `Booking.customer_id` = User.id (FK to users)
- `Reservation.customer_id` = User.id (FK to users)
- `ServiceOrder.customer_id` = User.id (FK to users)

This means `ReviewService::createReview()` first looks up `Customer::where('user_id', $userId)` to get the Customer record, then uses `customer->id` for the review. Verified purchase check uses `Booking/Reservation/ServiceOrder::where('customer_id', $userId)` (the User.id), not Customer.id.

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller (admin moderation) | `backend/app/Http/Controllers/Api/V1/ReviewController.php` | index (all reviews, filterable), togglePublish, updateNotes |
| Controller (merchant self-service) | `backend/app/Http/Controllers/Api/V1/MerchantReviewController.php` | index (own merchant's reviews), reply, updateReply, deleteReply |
| Controller (customer portal) | `backend/app/Http/Controllers/Api/V1/CustomerReviewController.php` | store, update, destroy, myReviews |
| Service | `backend/app/Services/ReviewService.php` | All business logic: create (with verified purchase gate), update/delete ownership check, reply, toggle publish, updateNotes, recalculateMerchantRating() |
| Service Interface | `backend/app/Services/Contracts/ReviewServiceInterface.php` | — |
| Repository | `backend/app/Repositories/ReviewRepository.php` | Extends BaseRepository |
| Repository Interface | `backend/app/Repositories/Contracts/ReviewRepositoryInterface.php` | — |
| DTO | `backend/app/Data/ReviewData.php` | rating, title (Optional), comment (Optional) |
| FormRequest (create) | `backend/app/Http/Requests/Api/V1/Review/CreateReviewRequest.php` | rating 1-5 integer required |
| FormRequest (update) | `backend/app/Http/Requests/Api/V1/Review/UpdateReviewRequest.php` | Optional fields |
| FormRequest (reply) | `backend/app/Http/Requests/Api/V1/Review/ReplyToReviewRequest.php` | reply string required |
| FormRequest (admin notes) | `backend/app/Http/Requests/Api/V1/Review/UpdateAdminNotesRequest.php` | admin_notes string required |
| Resource | `backend/app/Http/Resources/Api/V1/ReviewResource.php` | Includes customer.user (name, avatar), merchant (name, slug, logo), rating, title, comment, is_verified, is_published, merchant_reply, merchant_replied_at, admin_notes |
| Merchant model | `backend/app/Models/Merchant.php` | Denormalized fields: average_rating (decimal 3,2), review_count |
| Provider Binding | `backend/app/Providers/RepositoryServiceProvider.php` | ReviewRepositoryInterface → ReviewRepository; ReviewServiceInterface → ReviewService |

## Routes
| Method | URI | Action | Auth / Permission |
|--------|-----|--------|-------------------|
| GET | `storefront/merchants/{slug}/reviews` | public review list (published only) | public |
| POST | `customer/merchants/{merchantId}/reviews` | create review | auth + customer_portal.review |
| PUT | `customer/reviews/{review}` | update own review | auth + customer_portal.review |
| DELETE | `customer/reviews/{review}` | delete own review | auth + customer_portal.review |
| GET | `customer/reviews` | my reviews list | auth + customer_portal.view_own |
| GET | `auth/merchant/reviews` | merchant's received reviews | auth (self-service, no permission) |
| POST | `auth/merchant/reviews/{review}/reply` | add reply | auth (self-service) |
| PUT | `auth/merchant/reviews/{review}/reply` | update reply | auth (self-service) |
| DELETE | `auth/merchant/reviews/{review}/reply` | delete reply | auth (self-service) |
| GET | `reviews` | all reviews (admin) | auth + reviews.view |
| PATCH | `reviews/{review}/toggle-publish` | toggle publish | auth + reviews.moderate |
| PUT | `reviews/{review}/notes` | update admin notes | auth + reviews.moderate |

## Business Rules
- **Verified purchase gate**: Customer must have a completed Booking (status='completed'), checked-out Reservation (status='checked_out'), or completed ServiceOrder (status='completed') for the merchant. Throws 403 otherwise.
- **Duplicate check**: One review per customer per merchant; throws 409 Conflict on duplicate.
- **Ownership enforcement**: `updateReview` and `deleteReview` check `review.customer.user_id === $userId` — ownership by user ID, not Customer ID.
- **Reply ownership**: `replyToReview`, `updateReply`, `deleteReply` check `review.merchant_id === $merchantId`.
- **Rating denormalization**: `recalculateMerchantRating()` is called on every write (create, update if rating changed, delete, togglePublish). It uses `AVG(rating)` filtered by `is_published=true` and updates `merchants.average_rating` and `merchants.review_count` directly.
- **is_published default**: true (reviews are visible by default; admin can hide via togglePublish).

## Database
| Type | File |
|------|------|
| Migration (create reviews table) | `backend/database/migrations/2026_03_02_100000_create_reviews_table.php` |
| Migration (rating columns on merchants) | `backend/database/migrations/2026_03_02_100100_add_rating_columns_to_merchants_table.php` |
| Factory | `backend/database/factories/ReviewFactory.php` |

## Admin Frontend
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend/services/reviewService.ts` | getReviews(params), togglePublish(id), updateNotes(id, notes), getMyMerchantReviews(params), replyToReview(id, reply), updateReply(id, reply), deleteReply(id) |
| Hook | `frontend/hooks/useReviews.ts` | useReviews, useToggleReviewPublish, useUpdateReviewNotes (admin); useMyMerchantReviews, useReplyToReview, useUpdateReply, useDeleteReply (merchant self-service) |
| Types | `frontend/types/api.ts` | Review, ReviewQueryParams, MerchantReviewQueryParams |
| Admin Page | `frontend/app/(system)/reviews/page.tsx` | Admin moderation list: toggle publish, add internal notes, star display, pagination |
| My-Store Page | `frontend/app/(system)/(my-store)/my-store/reviews/page.tsx` | Merchant self-service: view own reviews, add/update/delete reply via dialog |

## Customer Portal Frontend
| Category | File | Notes |
|----------|------|-------|
| Service | `frontend-customer-portal/services/reviewService.ts` | getPublicReviews(slug), getMyReviews(), createReview(merchantId, data), updateReview(id, data), deleteReview(id) |
| Hook | `frontend-customer-portal/hooks/useReviews.ts` | usePublicReviews(slug, params), useMyReviews(params), useCreateReview(merchantId, slug), useUpdateReview(slug), useDeleteReview(slug) |
| Component | `frontend-customer-portal/components/reviews/star-rating.tsx` | Interactive (for create/edit forms) and display modes |
| Component | `frontend-customer-portal/components/reviews/review-form.tsx` | Create/edit review form with star picker, title, comment |
| Component | `frontend-customer-portal/components/reviews/review-list.tsx` | Paginated review list with merchant reply display |
| Component | `frontend-customer-portal/components/reviews/review-summary.tsx` | Average rating + distribution breakdown |
| Page | `frontend-customer-portal/app/(customer)/reviews/page.tsx` | My reviews list (edit/delete own reviews) |
| Storefront integration | `frontend-customer-portal/app/(storefront)/merchants/[slug]/page.tsx` | Reviews section: public list + create form (auth-gated) |
| Card badge | `frontend-customer-portal/components/storefront/merchant-card.tsx` | Star rating badge with average_rating + review_count |

## Tests
| Type | File |
|------|------|
| Feature (all review operations) | `backend/tests/Feature/Api/V1/ReviewTest.php` |

## Notes
- Admin query key: `['reviews', params]`; merchant self-service query key: `['merchant-reviews', params]`; customer portal query keys: `['storefront', 'merchants', slug, 'reviews']` (public) and `['customer', 'reviews']` (my reviews)
- `recalculateMerchantRating` only counts `is_published=true` reviews for the average; unpublished reviews don't factor into the displayed rating
- Merchant sidebar has a permission-gated "Reviews" link using `requiresActiveMerchant`; admin sidebar uses `reviews.view` permission
- The `admin_notes` field is internal-only (not exposed in storefront or customer portal responses)
