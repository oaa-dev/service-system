<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Review\ReplyToReviewRequest;
use App\Http\Resources\Api\V1\ReviewResource;
use App\Services\Contracts\ReviewServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MerchantReviewController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ReviewServiceInterface $reviewService
    ) {}

    private function getMerchantId(Request $request): int
    {
        return $request->user()->merchant->id;
    }

    /**
     * GET /auth/merchant/reviews
     */
    public function index(Request $request): JsonResponse
    {
        $merchantId = $this->getMerchantId($request);
        $reviews = $this->reviewService->getMerchantReviews($merchantId, $request);

        return $this->paginatedResponse($reviews, ReviewResource::class);
    }

    /**
     * POST /auth/merchant/reviews/{review}/reply
     */
    public function reply(ReplyToReviewRequest $request, int $reviewId): JsonResponse
    {
        $merchantId = $this->getMerchantId($request);
        $review = $this->reviewService->replyToReview($reviewId, $merchantId, $request->validated('reply'));

        return $this->successResponse(
            new ReviewResource($review),
            'Reply added successfully.'
        );
    }

    /**
     * PUT /auth/merchant/reviews/{review}/reply
     */
    public function updateReply(ReplyToReviewRequest $request, int $reviewId): JsonResponse
    {
        $merchantId = $this->getMerchantId($request);
        $review = $this->reviewService->updateReply($reviewId, $merchantId, $request->validated('reply'));

        return $this->successResponse(
            new ReviewResource($review),
            'Reply updated successfully.'
        );
    }

    /**
     * DELETE /auth/merchant/reviews/{review}/reply
     */
    public function deleteReply(Request $request, int $reviewId): JsonResponse
    {
        $merchantId = $this->getMerchantId($request);
        $this->reviewService->deleteReply($reviewId, $merchantId);

        return $this->noContentResponse();
    }
}
