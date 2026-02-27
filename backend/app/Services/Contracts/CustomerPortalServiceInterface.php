<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Data\BookingData;
use App\Data\ReservationData;
use App\Data\ServiceOrderData;
use App\Models\Booking;
use App\Models\Reservation;
use App\Models\ServiceOrder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

interface CustomerPortalServiceInterface
{
    public function createBooking(string $slug, BookingData $data): Booking;

    public function createReservation(string $slug, ReservationData $data): Reservation;

    public function createOrder(string $slug, ServiceOrderData $data): ServiceOrder;

    public function getMyBookings(Request $request): LengthAwarePaginator;

    public function getMyBooking(int $bookingId): Booking;

    public function cancelMyBooking(int $bookingId): Booking;

    public function getMyReservations(Request $request): LengthAwarePaginator;

    public function cancelMyReservation(int $reservationId): Reservation;

    public function getMyOrders(Request $request): LengthAwarePaginator;

    public function cancelMyOrder(int $orderId): ServiceOrder;

    public function getMyStats(): array;
}
