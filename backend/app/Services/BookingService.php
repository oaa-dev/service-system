<?php

namespace App\Services;

use App\Data\BookingData;
use App\Models\Booking;
use App\Models\MerchantBusinessHour;
use App\Models\Service;
use App\Models\ServiceSchedule;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\LoyaltyServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Contracts\PlatformFeeServiceInterface;
use App\Services\Contracts\ReferralServiceInterface;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
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
        protected PlatformFeeServiceInterface $platformFeeService,
        protected LoyaltyServiceInterface $loyaltyService,
        protected ReferralServiceInterface $referralService,
        protected PaymentServiceInterface $paymentService
    ) {}

    public function getMerchantBookings(int $merchantId, array $filters = []): LengthAwarePaginator
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);
        $merchantIds = $merchant->getAccessibleMerchantIds();

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Booking::whereIn('merchant_id', $merchantIds))
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('service_id'),
                AllowedFilter::exact('customer_id'),
                AllowedFilter::exact('booking_date'),
                AllowedFilter::exact('booking_slot_id'),
                AllowedFilter::callback('date_from', fn ($query, $value) => $query->where('booking_date', '>=', $value)),
                AllowedFilter::callback('date_to', fn ($query, $value) => $query->where('booking_date', '<=', $value)),
                AllowedFilter::callback('search', fn ($query, $value) => $query->whereHas('customer', fn ($q) => $q->where('name', 'like', "%{$value}%")->orWhere('email', 'like', "%{$value}%"))),
            ])
            ->allowedSorts(['id', 'booking_date', 'start_time', 'status', 'created_at'])
            ->defaultSort('-booking_date')
            ->with(['service', 'customer', 'bookingSlot', 'merchant:id,name'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getMerchantBookingById(int $merchantId, int $bookingId): Booking
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);
        $merchantIds = $merchant->getAccessibleMerchantIds();

        return Booking::whereIn('merchant_id', $merchantIds)
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

        // Branch merchants use parent organization's services
        $serviceMerchantId = $merchant->parent_id ?? $merchantId;

        $service = Service::where('merchant_id', $serviceMerchantId)
            ->where('service_type', 'bookable')
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
        $startTime = $data->start_time instanceof Optional ? null : $data->start_time;
        $scheduleStart = substr($schedule->start_time, 0, 5);
        $scheduleEnd = substr($schedule->end_time, 0, 5);

        if ($startTime !== null && ($startTime < $scheduleStart || $startTime >= $scheduleEnd)) {
            throw ValidationException::withMessages([
                'start_time' => ["Start time must be between {$scheduleStart} and {$scheduleEnd}."],
            ]);
        }

        // Calculate end_time from service duration (may be overridden by slot below)
        $endTime = $startTime !== null
            ? Carbon::createFromFormat('H:i', $startTime)->addMinutes($service->duration)->format('H:i')
            : null;

        // Resolve party size early (needed for slot + service capacity checks)
        $partySize = $data->party_size instanceof Optional ? 1 : $data->party_size;

        // If booking_slot_id is provided, validate the slot and override times
        $bookingSlotId = ($data->booking_slot_id instanceof Optional) ? null : $data->booking_slot_id;
        if ($bookingSlotId !== null) {
            $slot = \App\Models\MerchantBookingSlot::where('merchant_id', $serviceMerchantId)
                ->where('is_active', true)
                ->findOrFail($bookingSlotId);

            // Override start/end time from slot
            $startTime = substr($slot->start_time, 0, 5);
            $endTime = $slot->end_time ? substr($slot->end_time, 0, 5) : null;

            // Check slot capacity using sum of party sizes
            if ($slot->max_capacity !== null) {
                $slotBooked = (int) Booking::where('booking_slot_id', $slot->id)
                    ->where('booking_date', $data->booking_date)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->sum('party_size');
                if (($slotBooked + $partySize) > $slot->max_capacity) {
                    throw ValidationException::withMessages([
                        'booking_slot_id' => ['This time slot does not have enough capacity.'],
                    ]);
                }
            }
        }

        // Check service-level capacity (only when not using a slot with its own capacity)
        if ($bookingSlotId === null) {
            $existingBookings = Booking::where('service_id', $service->id)
                ->where('booking_date', $data->booking_date)
                ->where('start_time', $startTime.':00')
                ->whereIn('status', ['pending', 'confirmed'])
                ->sum('party_size');

            if (($existingBookings + $partySize) > $service->max_capacity) {
                throw ValidationException::withMessages([
                    'start_time' => ['This time slot is fully booked.'],
                ]);
            }
        }

        // Determine initial status
        $status = $service->requires_confirmation ? 'pending' : 'confirmed';

        // Calculate subtotal (price * party_size)
        $servicePrice = (float) $service->price;
        $subtotal = $servicePrice * $partySize;

        // Validate loyalty reward and calculate discount if provided
        $loyaltyRewardId = ($data->loyalty_reward_id instanceof Optional) ? null : $data->loyalty_reward_id;
        $discountAmount = 0;
        if ($loyaltyRewardId !== null) {
            $reward = $this->loyaltyService->redeemReward($loyaltyRewardId, auth()->id());
            $discountAmount = $this->loyaltyService->calculateRewardDiscount($reward, $subtotal);
        }
        $discountedSubtotal = max(0, $subtotal - $discountAmount);

        // Calculate platform fee on discounted subtotal
        $feeData = $this->platformFeeService->calculateFee('booking', $discountedSubtotal);

        $booking = Booking::create([
            'merchant_id' => $merchantId,
            'service_id' => $service->id,
            'booking_slot_id' => $bookingSlotId,
            'customer_id' => auth()->id(),
            'booking_date' => $data->booking_date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'party_size' => $partySize,
            'service_price' => $servicePrice,
            'discount_amount' => $discountAmount,
            'fee_rate' => $feeData['fee_rate'],
            'fee_amount' => $feeData['fee_amount'],
            'total_amount' => $feeData['total_amount'],
            'status' => $status,
            'notes' => $data->notes instanceof Optional ? null : $data->notes,
            'confirmed_at' => $status === 'confirmed' ? now() : null,
        ]);

        // Mark loyalty reward as redeemed against this booking
        if ($loyaltyRewardId !== null) {
            $this->loyaltyService->markRewardRedeemed($loyaltyRewardId, 'booking', $booking->id);
        }

        return $booking->load(['service', 'customer']);
    }

    public function updateBookingStatus(int $merchantId, int $bookingId, string $status, ?string $paymentAction = null): Booking
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);
        $merchantIds = $merchant->getAccessibleMerchantIds();

        $booking = Booking::whereIn('merchant_id', $merchantIds)->findOrFail($bookingId);

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

        // Handle payment action on confirmation
        if ($status === 'confirmed' && $paymentAction !== null) {
            $payment = $this->paymentService->createPaymentForTransaction($booking, $paymentAction === 'request_payment' ? 'online' : 'cash');

            if ($paymentAction === 'request_payment') {
                $this->paymentService->requestOnlinePayment($payment);
            } else {
                $this->paymentService->markAsCash($payment);
            }
        }

        // Check and complete referral when booking is completed
        if ($status === 'completed') {
            $this->referralService->checkAndCompleteReferral(
                $booking->customer_id,
                $booking->merchant_id,
                'booking',
                $booking->id
            );
        }

        return $booking->load(['service', 'customer']);
    }

    public function getBookingCalendar(int $merchantId, string $month): array
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);
        $merchantIds = $merchant->getAccessibleMerchantIds();

        $start = Carbon::parse($month.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        // Aggregate bookings per day, excluding cancelled and no_show
        $bookings = Booking::whereIn('merchant_id', $merchantIds)
            ->whereBetween('booking_date', [$start->toDateString(), $end->toDateString()])
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->select('booking_date', DB::raw('COUNT(*) as booking_count'), DB::raw('SUM(party_size) as total_booked'))
            ->groupBy('booking_date')
            ->get()
            ->keyBy(fn ($row) => $row->booking_date instanceof Carbon
                ? $row->booking_date->toDateString()
                : (string) $row->booking_date
            );

        // Get capacity from ServiceSchedule grouped by day_of_week for this merchant's bookable services
        $schedules = ServiceSchedule::whereHas(
            'service',
            fn ($q) => $q->whereIn('merchant_id', $merchantIds)
                ->where('service_type', 'bookable')
                ->where('is_active', true)
        )
            ->with('service:id,max_capacity')
            ->get()
            ->groupBy('day_of_week');

        // Compute total capacity per day_of_week (sum of max_capacity for available schedules)
        $capacityByDow = [];
        foreach ($schedules as $dow => $daySchedules) {
            $capacityByDow[$dow] = $daySchedules
                ->filter(fn ($s) => $s->is_available)
                ->sum(fn ($s) => $s->service->max_capacity ?? 0);
        }

        // Check if merchant has active slots
        $slots = \App\Models\MerchantBookingSlot::whereIn('merchant_id', $merchantIds)
            ->where('is_active', true)
            ->get()
            ->groupBy('day_of_week');

        $hasSlots = $slots->isNotEmpty();

        // If has slots: compute per-slot bookings per date in range
        $slotBookingsByDate = collect();
        if ($hasSlots) {
            $slotBookings = Booking::whereIn('merchant_id', $merchantIds)
                ->whereBetween('booking_date', [$start->toDateString(), $end->toDateString()])
                ->whereNotNull('booking_slot_id')
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->select('booking_date', 'booking_slot_id', DB::raw('COALESCE(SUM(party_size), 0) as booked'))
                ->groupBy('booking_date', 'booking_slot_id')
                ->get()
                ->groupBy(fn ($b) => $b->booking_date instanceof Carbon
                    ? $b->booking_date->toDateString()
                    : (string) $b->booking_date
                );
            $slotBookingsByDate = $slotBookings;
        }

        // Get business hours: day_of_week → is_closed (use org merchant's hours)
        $hours = MerchantBusinessHour::where('merchant_id', $merchantId)
            ->get()
            ->keyBy('day_of_week');

        $result = [];
        $current = $start->copy();

        while ($current->lte($end)) {
            $dateStr = $current->toDateString();
            $dow = $current->dayOfWeek; // 0=Sunday, 6=Saturday

            $dayBooking = $bookings->get($dateStr);
            $businessHour = $hours->get($dow);

            $totalCapacity = $capacityByDow[$dow] ?? 0;

            $hasSlotsForDay = $hasSlots && $slots->has($dow);
            $daySlots = [];

            if ($hasSlotsForDay) {
                $daySlotBookings = $slotBookingsByDate->get($dateStr, collect())
                    ->keyBy('booking_slot_id');

                foreach ($slots->get($dow) as $slot) {
                    $booked = $daySlotBookings->has($slot->id) ? (int) $daySlotBookings->get($slot->id)->booked : 0;
                    $isFull = $slot->max_capacity !== null && $booked >= $slot->max_capacity;
                    $daySlots[] = [
                        'slot_id' => $slot->id,
                        'start_time' => substr($slot->start_time, 0, 5),
                        'end_time' => $slot->end_time ? substr($slot->end_time, 0, 5) : null,
                        'booked' => $booked,
                        'max_capacity' => $slot->max_capacity,
                        'is_full' => $isFull,
                    ];
                }

                // When has_slots, total_capacity comes from slot max_capacity sum (nulls = unlimited contribute 0)
                $slotCapacity = $slots->get($dow)->whereNotNull('max_capacity')->sum('max_capacity');
                $totalCapacity = $slotCapacity ?: null; // null if all slots are unlimited
            }

            $result[] = [
                'date' => $dateStr,
                'booking_count' => $dayBooking ? (int) $dayBooking->booking_count : 0,
                'total_booked' => $dayBooking ? (int) $dayBooking->total_booked : 0,
                'total_capacity' => $totalCapacity,
                'is_closed' => $businessHour ? (bool) $businessHour->is_closed : true,
                'has_slots' => $hasSlotsForDay,
                'slots' => $hasSlotsForDay ? $daySlots : [],
            ];

            $current->addDay();
        }

        return $result;
    }
}
