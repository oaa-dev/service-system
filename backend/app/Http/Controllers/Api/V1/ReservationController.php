<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ReservationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Reservation\CreateReservationRequest;
use App\Http\Requests\Api\V1\Reservation\UpdateReservationStatusRequest;
use App\Http\Resources\Api\V1\ReservationResource;
use App\Services\Contracts\ReservationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ReservationServiceInterface $reservationService
    ) {}

    public function index(Request $request, int $merchantId): JsonResponse
    {
        $reservations = $this->reservationService->getMerchantReservations($merchantId, [
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($reservations, ReservationResource::class);
    }

    public function store(CreateReservationRequest $request, int $merchantId): JsonResponse
    {
        $data = ReservationData::from($request->validated());
        $reservation = $this->reservationService->createReservation($merchantId, $data);

        return $this->createdResponse(
            new ReservationResource($reservation),
            'Reservation created successfully'
        );
    }

    public function show(int $merchantId, int $reservationId): JsonResponse
    {
        $reservation = $this->reservationService->getMerchantReservationById($merchantId, $reservationId);

        return $this->successResponse(
            new ReservationResource($reservation),
            'Reservation retrieved successfully'
        );
    }

    public function updateStatus(UpdateReservationStatusRequest $request, int $merchantId, int $reservationId): JsonResponse
    {
        $reservation = $this->reservationService->updateReservationStatus(
            $merchantId,
            $reservationId,
            $request->validated('status')
        );

        return $this->successResponse(
            new ReservationResource($reservation),
            'Reservation status updated successfully'
        );
    }
}
