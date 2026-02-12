<?php

namespace App\Services;

use App\Data\BookingData;
use App\Models\Booking;
use App\Models\Service;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\PlatformFeeServiceInterface;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class BookingService implements BookingServiceInterface
{
    private const VALID_TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['completed', 'cancelled', 'no_show'],
    ];

    public function __construct(
        protected MerchantRepositoryInterface $merchantRepository,
        protected PlatformFeeServiceInterface $platformFeeService
    ) {}

    public function getMerchantBookings(int $merchantId, array $filters = []): LengthAwarePaginator
    {
        $this->merchantRepository->findOrFail($merchantId);

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Booking::where('merchant_id', $merchantId))
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('service_id'),
                AllowedFilter::exact('customer_id'),
                AllowedFilter::exact('booking_date'),
                AllowedFilter::callback('date_from', fn ($query, $value) => $query->where('booking_date', '>=', $value)),
                AllowedFilter::callback('date_to', fn ($query, $value) => $query->where('booking_date', '<=', $value)),
                AllowedFilter::callback('search', fn ($query, $value) => $query->whereHas('customer', fn ($q) => $q->where('name', 'like', "%{$value}%")->orWhere('email', 'like', "%{$value}%"))),
            ])
            ->allowedSorts(['id', 'booking_date', 'start_time', 'status', 'created_at'])
            ->defaultSort('-booking_date')
            ->with(['service', 'customer'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getMerchantBookingById(int $merchantId, int $bookingId): Booking
    {
        $this->merchantRepository->findOrFail($merchantId);

        return Booking::where('merchant_id', $merchantId)
            ->with(['service', 'customer'])
            ->findOrFail($bookingId);
    }

    public function createBooking(int $merchantId, BookingData $data): Booking
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        if (! $merchant->can_take_bookings) {
            throw ValidationException::withMessages([
                'merchant' => ['This merchant does not accept bookings.'],
            ]);
        }

        $service = Service::where('merchant_id', $merchantId)
            ->where('is_bookable', true)
            ->findOrFail($data->service_id);

        // Validate schedule availability
        $bookingDate = Carbon::parse($data->booking_date);
        $dayOfWeek = $bookingDate->dayOfWeek;

        $schedule = $service->schedules()->where('day_of_week', $dayOfWeek)->first();

        if (! $schedule || ! $schedule->is_available) {
            throw ValidationException::withMessages([
                'booking_date' => ['This service is not available on the selected day.'],
            ]);
        }

        // Validate time within schedule
        $startTime = $data->start_time;
        $scheduleStart = substr($schedule->start_time, 0, 5);
        $scheduleEnd = substr($schedule->end_time, 0, 5);

        if ($startTime < $scheduleStart || $startTime >= $scheduleEnd) {
            throw ValidationException::withMessages([
                'start_time' => ["Start time must be between {$scheduleStart} and {$scheduleEnd}."],
            ]);
        }

        // Calculate end_time from service duration
        $endTime = Carbon::createFromFormat('H:i', $startTime)
            ->addMinutes($service->duration)
            ->format('H:i');

        // Check capacity (count existing confirmed/pending bookings for this slot)
        $partySize = $data->party_size instanceof Optional ? 1 : $data->party_size;
        $existingBookings = Booking::where('service_id', $service->id)
            ->where('booking_date', $data->booking_date)
            ->where('start_time', $startTime . ':00')
            ->whereIn('status', ['pending', 'confirmed'])
            ->sum('party_size');

        if (($existingBookings + $partySize) > $service->max_capacity) {
            throw ValidationException::withMessages([
                'start_time' => ['This time slot is fully booked.'],
            ]);
        }

        // Determine initial status
        $status = $service->requires_confirmation ? 'pending' : 'confirmed';

        // Calculate platform fee
        $servicePrice = (float) $service->price;
        $feeData = $this->platformFeeService->calculateFee('booking', $servicePrice);

        $booking = Booking::create([
            'merchant_id' => $merchantId,
            'service_id' => $service->id,
            'customer_id' => auth()->id(),
            'booking_date' => $data->booking_date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'party_size' => $partySize,
            'service_price' => $servicePrice,
            'fee_rate' => $feeData['fee_rate'],
            'fee_amount' => $feeData['fee_amount'],
            'total_amount' => $feeData['total_amount'],
            'status' => $status,
            'notes' => $data->notes instanceof Optional ? null : $data->notes,
            'confirmed_at' => $status === 'confirmed' ? now() : null,
        ]);

        return $booking->load(['service', 'customer']);
    }

    public function updateBookingStatus(int $merchantId, int $bookingId, string $status): Booking
    {
        $this->merchantRepository->findOrFail($merchantId);

        $booking = Booking::where('merchant_id', $merchantId)->findOrFail($bookingId);

        $allowedTransitions = self::VALID_TRANSITIONS[$booking->status] ?? [];

        if (! in_array($status, $allowedTransitions)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition from '{$booking->status}' to '{$status}'."],
            ]);
        }

        $updateData = ['status' => $status];

        if ($status === 'confirmed') {
            $updateData['confirmed_at'] = now();
        }
        if ($status === 'cancelled') {
            $updateData['cancelled_at'] = now();
        }

        $booking->update($updateData);

        return $booking->load(['service', 'customer']);
    }
}
