<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Data\ReviewData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Review\CreateReviewRequest;
use App\Http\Requests\Api\V1\Review\UpdateReviewRequest;
use App\Http\Resources\Api\V1\ReviewResource;
use App\Services\Contracts\ReviewServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerReviewController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ReviewServiceInterface $reviewService
    ) {}

    /**
     * POST /customer/merchants/{merchantId}/reviews
     */
    public function store(CreateReviewRequest $request, int $merchantId): JsonResponse
    {
        $data = ReviewData::from($request->validated());
        $review = $this->reviewService->createReview($merchantId, auth()->id(), $data);

        return $this->createdResponse(
            new ReviewResource($review),
            'Review created successfully.'
        );
    }

    /**
     * PUT /customer/reviews/{review}
     */
    public function update(UpdateReviewRequest $request, int $reviewId): JsonResponse
    {
        $data = ReviewData::from($request->validated());
        $review = $this->reviewService->updateReview($reviewId, auth()->id(), $data);

        return $this->successResponse(
            new ReviewResource($review),
            'Review updated successfully.'
        );
    }

    /**
     * DELETE /customer/reviews/{review}
     */
    public function destroy(int $reviewId): JsonResponse
    {
        $this->reviewService->deleteReview($reviewId, auth()->id());

        return $this->noContentResponse();
    }

    /**
     * GET /customer/reviews
     */
    public function myReviews(Request $request): JsonResponse
    {
        $reviews = $this->reviewService->getMyReviews(auth()->id(), $request);

        return $this->paginatedResponse($reviews, ReviewResource::class);
    }
}
