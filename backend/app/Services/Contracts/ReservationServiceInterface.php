<?php

namespace App\Services\Contracts;

use App\Data\ReservationData;
use App\Models\Reservation;
use Illuminate\Pagination\LengthAwarePaginator;

interface ReservationServiceInterface
{
    public function getMerchantReservations(int $merchantId, array $filters = []): LengthAwarePaginator;

    public function getMerchantReservationById(int $merchantId, int $reservationId): Reservation;

    public function createReservation(int $merchantId, ReservationData $data): Reservation;

    public function updateReservationStatus(int $merchantId, int $reservationId, string $status): Reservation;
}
