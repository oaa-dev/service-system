<?php

namespace App\Services;

use App\Data\ReservationData;
use App\Models\Reservation;
use App\Models\Service;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Services\Contracts\PlatformFeeServiceInterface;
use App\Services\Contracts\ReservationServiceInterface;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ReservationService implements ReservationServiceInterface
{
    private const VALID_TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['checked_in', 'cancelled'],
        'checked_in' => ['checked_out'],
    ];

    public function __construct(
        protected MerchantRepositoryInterface $merchantRepository,
        protected PlatformFeeServiceInterface $platformFeeService
    ) {}

    public function getMerchantReservations(int $merchantId, array $filters = []): LengthAwarePaginator
    {
        $this->merchantRepository->findOrFail($merchantId);

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Reservation::where('merchant_id', $merchantId))
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('service_id'),
                AllowedFilter::exact('customer_id'),
                AllowedFilter::callback('date_from', fn ($query, $value) => $query->where('check_in', '>=', $value)),
                AllowedFilter::callback('date_to', fn ($query, $value) => $query->where('check_out', '<=', $value)),
                AllowedFilter::callback('search', fn ($query, $value) => $query->whereHas('customer', fn ($q) => $q->where('name', 'like', "%{$value}%")->orWhere('email', 'like', "%{$value}%"))),
            ])
            ->allowedSorts(['id', 'check_in', 'check_out', 'status', 'total_price', 'created_at'])
            ->defaultSort('-check_in')
            ->with(['service.serviceCategory', 'customer'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getMerchantReservationById(int $merchantId, int $reservationId): Reservation
    {
        $this->merchantRepository->findOrFail($merchantId);

        return Reservation::where('merchant_id', $merchantId)
            ->with(['service.serviceCategory', 'customer'])
            ->findOrFail($reservationId);
    }

    public function createReservation(int $merchantId, ReservationData $data): Reservation
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        if (! $merchant->can_rent_units) {
            throw ValidationException::withMessages([
                'merchant' => ['This merchant does not support unit rentals.'],
            ]);
        }

        // Branch merchants use parent organization's services
        $serviceMerchantId = $merchant->parent_id ?? $merchantId;

        $service = Service::where('merchant_id', $serviceMerchantId)
            ->where('service_type', 'reservation')
            ->where('is_active', true)
            ->where('unit_status', 'available')
            ->findOrFail($data->service_id);

        $checkIn = Carbon::parse($data->check_in);
        $checkOut = Carbon::parse($data->check_out);
        $nights = $checkIn->diffInDays($checkOut);

        if ($nights < 1) {
            throw ValidationException::withMessages([
                'check_out' => ['Check-out must be at least 1 day after check-in.'],
            ]);
        }

        // Check for overlapping confirmed/checked_in reservations
        $hasOverlap = Reservation::where('service_id', $service->id)
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->where('check_in', '<', $data->check_out)
            ->where('check_out', '>', $data->check_in)
            ->exists();

        if ($hasOverlap) {
            throw ValidationException::withMessages([
                'service_id' => ['This service is already reserved for the selected dates.'],
            ]);
        }

        // Validate guest count against max_capacity
        $guestCount = $data->guest_count instanceof Optional ? 1 : $data->guest_count;
        if ($guestCount > $service->max_capacity) {
            throw ValidationException::withMessages([
                'guest_count' => ["Guest count exceeds maximum capacity of {$service->max_capacity}."],
            ]);
        }

        // Calculate pricing
        $pricePerNight = $service->price_per_night ?? $service->price;
        $totalPrice = $nights * $pricePerNight;

        // Calculate platform fee
        $feeData = $this->platformFeeService->calculateFee('reservation', $totalPrice);

        $reservation = Reservation::create([
            'merchant_id' => $merchantId,
            'service_id' => $service->id,
            'customer_id' => auth()->id(),
            'check_in' => $data->check_in,
            'check_out' => $data->check_out,
            'guest_count' => $guestCount,
            'nights' => $nights,
            'price_per_night' => $pricePerNight,
            'total_price' => $totalPrice,
            'fee_rate' => $feeData['fee_rate'],
            'fee_amount' => $feeData['fee_amount'],
            'total_amount' => $feeData['total_amount'],
            'status' => 'pending',
            'notes' => $data->notes instanceof Optional ? null : $data->notes,
            'special_requests' => $data->special_requests instanceof Optional ? null : $data->special_requests,
        ]);

        return $reservation->load(['service.serviceCategory', 'customer']);
    }

    public function updateReservationStatus(int $merchantId, int $reservationId, string $status): Reservation
    {
        $this->merchantRepository->findOrFail($merchantId);

        $reservation = Reservation::where('merchant_id', $merchantId)->findOrFail($reservationId);

        $allowedTransitions = self::VALID_TRANSITIONS[$reservation->status] ?? [];

        if (! in_array($status, $allowedTransitions)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition from '{$reservation->status}' to '{$status}'."],
            ]);
        }

        $updateData = ['status' => $status];

        if ($status === 'confirmed') {
            $updateData['confirmed_at'] = now();
        }
        if ($status === 'cancelled') {
            $updateData['cancelled_at'] = now();
        }
        if ($status === 'checked_in') {
            $updateData['checked_in_at'] = now();
        }
        if ($status === 'checked_out') {
            $updateData['checked_out_at'] = now();
        }

        $reservation->update($updateData);

        return $reservation->load(['service.serviceCategory', 'customer']);
    }
}
