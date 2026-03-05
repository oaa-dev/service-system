<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Review\UpdateAdminNotesRequest;
use App\Http\Resources\Api\V1\ReviewResource;
use App\Services\Contracts\ReviewServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ReviewServiceInterface $reviewService
    ) {}

    /**
     * GET /reviews — admin list all reviews (filterable by merchant_id, rating, is_published)
     */
    public function index(Request $request): JsonResponse
    {
        $reviews = $this->reviewService->getAllReviews($request);

        return $this->paginatedResponse($reviews, ReviewResource::class);
    }

    /**
     * PATCH /reviews/{review}/toggle-publish
     */
    public function togglePublish(int $reviewId): JsonResponse
    {
        $review = $this->reviewService->togglePublished($reviewId);

        return $this->successResponse(
            new ReviewResource($review),
            $review->is_published ? 'Review published.' : 'Review unpublished.'
        );
    }

    /**
     * PUT /reviews/{review}/notes
     */
    public function updateNotes(UpdateAdminNotesRequest $request, int $reviewId): JsonResponse
    {
        $review = $this->reviewService->updateAdminNotes($reviewId, $request->validated('admin_notes'));

        return $this->successResponse(new ReviewResource($review), 'Admin notes updated.');
    }
}
