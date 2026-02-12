<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\BookingData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Booking\CreateBookingRequest;
use App\Http\Requests\Api\V1\Booking\UpdateBookingStatusRequest;
use App\Http\Resources\Api\V1\BookingResource;
use App\Services\Contracts\BookingServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected BookingServiceInterface $bookingService
    ) {}

    public function index(Request $request, int $merchantId): JsonResponse
    {
        $bookings = $this->bookingService->getMerchantBookings($merchantId, [
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($bookings, BookingResource::class);
    }

    public function store(CreateBookingRequest $request, int $merchantId): JsonResponse
    {
        $data = BookingData::from($request->validated());
        $booking = $this->bookingService->createBooking($merchantId, $data);

        return $this->createdResponse(
            new BookingResource($booking),
            'Booking created successfully'
        );
    }

    public function show(int $merchantId, int $bookingId): JsonResponse
    {
        $booking = $this->bookingService->getMerchantBookingById($merchantId, $bookingId);

        return $this->successResponse(
            new BookingResource($booking),
            'Booking retrieved successfully'
        );
    }

    public function updateStatus(UpdateBookingStatusRequest $request, int $merchantId, int $bookingId): JsonResponse
    {
        $booking = $this->bookingService->updateBookingStatus(
            $merchantId,
            $bookingId,
            $request->validated('status')
        );

        return $this->successResponse(
            new BookingResource($booking),
            'Booking status updated successfully'
        );
    }
}
