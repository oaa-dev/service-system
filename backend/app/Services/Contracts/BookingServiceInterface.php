<?php

namespace App\Services\Contracts;

use App\Data\BookingData;
use App\Models\Booking;
use Illuminate\Pagination\LengthAwarePaginator;

interface BookingServiceInterface
{
    public function getMerchantBookings(int $merchantId, array $filters = []): LengthAwarePaginator;

    public function getMerchantBookingById(int $merchantId, int $bookingId): Booking;

    public function createBooking(int $merchantId, BookingData $data): Booking;

    public function updateBookingStatus(int $merchantId, int $bookingId, string $status): Booking;
}
