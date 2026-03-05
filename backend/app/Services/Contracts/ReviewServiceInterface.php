<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Data\ReviewData;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface ReviewServiceInterface
{
    public function getPublicReviews(int $merchantId, Request $request): LengthAwarePaginator;

    public function getMerchantReviews(int $merchantId, Request $request): LengthAwarePaginator;

    public function getAllReviews(Request $request): LengthAwarePaginator;

    public function getMyReviews(int $userId, Request $request): LengthAwarePaginator;

    public function createReview(int $merchantId, int $userId, ReviewData $data): Review;

    public function updateReview(int $reviewId, int $userId, ReviewData $data): Review;

    public function deleteReview(int $reviewId, int $userId): void;

    public function replyToReview(int $reviewId, int $merchantId, string $reply): Review;

    public function updateReply(int $reviewId, int $merchantId, string $reply): Review;

    public function deleteReply(int $reviewId, int $merchantId): Review;

    public function togglePublished(int $reviewId): Review;

    public function updateAdminNotes(int $reviewId, string $notes): Review;
}
