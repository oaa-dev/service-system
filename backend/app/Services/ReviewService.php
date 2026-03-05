<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\ReviewData;
use App\Exceptions\ApiException;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\ServiceOrder;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Repositories\Contracts\ReviewRepositoryInterface;
use App\Services\Contracts\ReviewServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ReviewService implements ReviewServiceInterface
{
    public function __construct(
        protected ReviewRepositoryInterface $reviewRepository,
        protected MerchantRepositoryInterface $merchantRepository
    ) {}

    public function getPublicReviews(int $merchantId, Request $request): LengthAwarePaginator
    {
        return QueryBuilder::for(Review::where('merchant_id', $merchantId)->where('is_published', true))
            ->defaultSort('-created_at')
            ->with(['customer.user'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getMerchantReviews(int $merchantId, Request $request): LengthAwarePaginator
    {
        return QueryBuilder::for(Review::where('merchant_id', $merchantId))
            ->allowedFilters([
                AllowedFilter::exact('is_published'),
                AllowedFilter::exact('rating'),
            ])
            ->defaultSort('-created_at')
            ->with(['customer.user'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getAllReviews(Request $request): LengthAwarePaginator
    {
        return QueryBuilder::for(Review::class)
            ->allowedFilters([
                AllowedFilter::exact('merchant_id'),
                AllowedFilter::exact('rating'),
                AllowedFilter::exact('is_published'),
            ])
            ->defaultSort('-created_at')
            ->with(['customer.user', 'merchant'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getMyReviews(int $userId, Request $request): LengthAwarePaginator
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        return QueryBuilder::for(Review::where('customer_id', $customer->id))
            ->defaultSort('-created_at')
            ->with(['merchant'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function createReview(int $merchantId, int $userId, ReviewData $data): Review
    {
        // Step 1: Get the Customer record (FK to customers table)
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        // Step 2: Check for duplicate review (one review per customer per merchant)
        if (Review::where('customer_id', $customer->id)->where('merchant_id', $merchantId)->exists()) {
            throw new ApiException('You have already reviewed this merchant.', 409);
        }

        // Step 3: Verify purchase — Booking/Reservation/ServiceOrder use user_id as customer_id, NOT Customer.id
        $hasCompletedBooking = Booking::where('customer_id', $userId)
            ->where('merchant_id', $merchantId)
            ->where('status', 'completed')
            ->exists();

        $hasCompletedReservation = Reservation::where('customer_id', $userId)
            ->where('merchant_id', $merchantId)
            ->where('status', 'checked_out')
            ->exists();

        $hasCompletedOrder = ServiceOrder::where('customer_id', $userId)
            ->where('merchant_id', $merchantId)
            ->where('status', 'completed')
            ->exists();

        if (! $hasCompletedBooking && ! $hasCompletedReservation && ! $hasCompletedOrder) {
            throw new ApiException('You must have a completed transaction to review this merchant.', 403);
        }

        // Step 4: Create review
        $review = Review::create([
            'merchant_id' => $merchantId,
            'customer_id' => $customer->id,
            'rating' => $data->rating,
            'title' => $data->title instanceof Optional ? null : $data->title,
            'comment' => $data->comment instanceof Optional ? null : $data->comment,
            'is_verified' => true,
            'is_published' => true,
        ]);

        // Step 5: Update merchant denormalized rating
        $this->recalculateMerchantRating($merchantId);

        return $review->load(['customer.user', 'merchant']);
    }

    public function updateReview(int $reviewId, int $userId, ReviewData $data): Review
    {
        $review = Review::findOrFail($reviewId);

        // Verify ownership: review.customer.user_id must match userId
        if ($review->customer->user_id !== $userId) {
            throw new ApiException('You are not authorized to update this review.', 403);
        }

        $oldRating = $review->rating;

        $updateData = collect($data->toArray())
            ->reject(fn ($v) => $v instanceof Optional)
            ->toArray();

        $review->update($updateData);

        // Recalculate if rating changed
        if (isset($updateData['rating']) && $updateData['rating'] !== $oldRating) {
            $this->recalculateMerchantRating($review->merchant_id);
        }

        return $review->fresh()->load(['customer.user', 'merchant']);
    }

    public function deleteReview(int $reviewId, int $userId): void
    {
        $review = Review::findOrFail($reviewId);

        // Verify ownership: review.customer.user_id must match userId
        if ($review->customer->user_id !== $userId) {
            throw new ApiException('You are not authorized to delete this review.', 403);
        }

        $merchantId = $review->merchant_id;
        $review->delete();

        $this->recalculateMerchantRating($merchantId);
    }

    public function replyToReview(int $reviewId, int $merchantId, string $reply): Review
    {
        $review = Review::findOrFail($reviewId);

        if ($review->merchant_id !== $merchantId) {
            throw new ApiException('You are not authorized to reply to this review.', 403);
        }

        $review->update([
            'merchant_reply' => $reply,
            'merchant_replied_at' => now(),
        ]);

        return $review->fresh();
    }

    public function updateReply(int $reviewId, int $merchantId, string $reply): Review
    {
        $review = Review::findOrFail($reviewId);

        if ($review->merchant_id !== $merchantId) {
            throw new ApiException('You are not authorized to update this reply.', 403);
        }

        $review->update([
            'merchant_reply' => $reply,
            'merchant_replied_at' => now(),
        ]);

        return $review->fresh();
    }

    public function deleteReply(int $reviewId, int $merchantId): Review
    {
        $review = Review::findOrFail($reviewId);

        if ($review->merchant_id !== $merchantId) {
            throw new ApiException('You are not authorized to delete this reply.', 403);
        }

        $review->update([
            'merchant_reply' => null,
            'merchant_replied_at' => null,
        ]);

        return $review->fresh();
    }

    public function togglePublished(int $reviewId): Review
    {
        $review = Review::findOrFail($reviewId);

        $review->update(['is_published' => ! $review->is_published]);

        $this->recalculateMerchantRating($review->merchant_id);

        return $review->fresh();
    }

    public function updateAdminNotes(int $reviewId, string $notes): Review
    {
        $review = Review::findOrFail($reviewId);

        $review->update(['admin_notes' => $notes]);

        return $review->fresh();
    }

    private function recalculateMerchantRating(int $merchantId): void
    {
        $stats = Review::where('merchant_id', $merchantId)
            ->where('is_published', true)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as review_count')
            ->first();

        Merchant::where('id', $merchantId)->update([
            'average_rating' => $stats->avg_rating ? round((float) $stats->avg_rating, 2) : null,
            'review_count' => (int) $stats->review_count,
        ]);
    }
}
