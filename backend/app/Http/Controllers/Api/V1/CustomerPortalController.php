<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Data\BookingData;
use App\Data\ReservationData;
use App\Data\ServiceOrderData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CustomerPortal\CreateCustomerBookingRequest;
use App\Http\Requests\Api\V1\CustomerPortal\CreateCustomerOrderRequest;
use App\Http\Requests\Api\V1\CustomerPortal\CreateCustomerReservationRequest;
use App\Http\Resources\Api\V1\BookingResource;
use App\Http\Resources\Api\V1\ReservationResource;
use App\Http\Resources\Api\V1\ServiceOrderResource;
use App\Services\Contracts\CustomerPortalServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class CustomerPortalController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerPortalServiceInterface $customerPortalService
    ) {}

    public function createBooking(CreateCustomerBookingRequest $request, string $slug): JsonResponse
    {
        $data = BookingData::from($request->validated());
        $booking = $this->customerPortalService->createBooking($slug, $data);

        return $this->createdResponse(
            new BookingResource($booking),
            'Booking created successfully'
        );
    }

    public function createReservation(CreateCustomerReservationRequest $request, string $slug): JsonResponse
    {
        $data = ReservationData::from($request->validated());
        $reservation = $this->customerPortalService->createReservation($slug, $data);

        return $this->createdResponse(
            new ReservationResource($reservation),
            'Reservation created successfully'
        );
    }

    public function createOrder(CreateCustomerOrderRequest $request, string $slug): JsonResponse
    {
        $data = ServiceOrderData::from($request->validated());
        $order = $this->customerPortalService->createOrder($slug, $data);

        return $this->createdResponse(
            new ServiceOrderResource($order),
            'Order created successfully'
        );
    }

    public function myBookings(Request $request): JsonResponse
    {
        $bookings = $this->customerPortalService->getMyBookings($request);

        return $this->paginatedResponse($bookings, BookingResource::class);
    }

    public function myBooking(int $booking): JsonResponse
    {
        $bookingModel = $this->customerPortalService->getMyBooking($booking);

        return $this->successResponse(
            new BookingResource($bookingModel),
            'Booking retrieved successfully'
        );
    }

    public function cancelMyBooking(int $booking): JsonResponse
    {
        try {
            $bookingModel = $this->customerPortalService->cancelMyBooking($booking);

            return $this->successResponse(
                new BookingResource($bookingModel),
                'Booking cancelled successfully'
            );
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function myReservations(Request $request): JsonResponse
    {
        $reservations = $this->customerPortalService->getMyReservations($request);

        return $this->paginatedResponse($reservations, ReservationResource::class);
    }

    public function cancelMyReservation(int $reservation): JsonResponse
    {
        try {
            $reservationModel = $this->customerPortalService->cancelMyReservation($reservation);

            return $this->successResponse(
                new ReservationResource($reservationModel),
                'Reservation cancelled successfully'
            );
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function myOrders(Request $request): JsonResponse
    {
        $orders = $this->customerPortalService->getMyOrders($request);

        return $this->paginatedResponse($orders, ServiceOrderResource::class);
    }

    public function cancelMyOrder(int $order): JsonResponse
    {
        try {
            $orderModel = $this->customerPortalService->cancelMyOrder($order);

            return $this->successResponse(
                new ServiceOrderResource($orderModel),
                'Order cancelled successfully'
            );
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function myStats(): JsonResponse
    {
        $stats = $this->customerPortalService->getMyStats();

        return $this->successResponse($stats, 'Dashboard stats retrieved successfully');
    }
}
