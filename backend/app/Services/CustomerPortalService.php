<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\BookingData;
use App\Data\ReservationData;
use App\Data\ServiceOrderData;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Reservation;
use App\Models\ServiceOrder;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Repositories\Contracts\PaymentMethodRepositoryInterface;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\CustomerPortalServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Contracts\ReservationServiceInterface;
use App\Services\Contracts\ServiceOrderServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CustomerPortalService implements CustomerPortalServiceInterface
{
    public function __construct(
        protected MerchantRepositoryInterface $merchantRepository,
        protected PaymentMethodRepositoryInterface $paymentMethodRepository,
        protected BookingServiceInterface $bookingService,
        protected ReservationServiceInterface $reservationService,
        protected ServiceOrderServiceInterface $serviceOrderService,
        protected PaymentServiceInterface $paymentService
    ) {}

    public function createBooking(string $slug, BookingData $data): Booking
    {
        $merchant = $this->resolveActiveMerchant($slug);

        $booking = $this->bookingService->createBooking($merchant->id, $data);

        $this->createPaymentAndCheckout($booking);

        return $booking->load('payment');
    }

    public function createReservation(string $slug, ReservationData $data): Reservation
    {
        $merchant = $this->resolveActiveMerchant($slug);

        $reservation = $this->reservationService->createReservation($merchant->id, $data);

        $this->createPaymentAndCheckout($reservation);

        return $reservation->load('payment');
    }

    public function createOrder(string $slug, ServiceOrderData $data): ServiceOrder
    {
        $merchant = $this->resolveActiveMerchant($slug);

        $order = $this->serviceOrderService->createServiceOrder($merchant->id, $data);

        $this->createPaymentAndCheckout($order);

        return $order->load('payment');
    }

    /**
     * Create a payment record and request an online PayMongo checkout session for the given transaction.
     */
    private function createPaymentAndCheckout(Model $payable): void
    {
        $payment = $this->paymentService->createPaymentForTransaction($payable, 'online');
        $this->paymentService->requestOnlinePayment($payment);
        $payable->refresh();
    }

    public function getMyBookings(Request $request): LengthAwarePaginator
    {
        $customerId = auth()->id();

        return QueryBuilder::for(Booking::class)
            ->where('customer_id', $customerId)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::callback('date_from', function ($query, $value) {
                    $query->where('booking_date', '>=', $value);
                }),
                AllowedFilter::callback('date_to', function ($query, $value) {
                    $query->where('booking_date', '<=', $value);
                }),
            ])
            ->allowedSorts(['booking_date', 'created_at', 'status'])
            ->defaultSort('-created_at')
            ->with(['service', 'service.media'])
            ->paginate($request->per_page ?? 15)
            ->appends(request()->query());
    }

    public function getMyBooking(int $bookingId): Booking
    {
        $customerId = auth()->id();

        $booking = Booking::where('customer_id', $customerId)
            ->with(['service', 'service.media', 'service.serviceCategory', 'merchant', 'merchant.address', 'coupon'])
            ->findOrFail($bookingId);

        return $booking;
    }

    public function cancelMyBooking(int $bookingId): Booking
    {
        $customerId = auth()->id();

        $booking = Booking::where('customer_id', $customerId)->findOrFail($bookingId);

        if (! in_array($booking->status, ['pending', 'confirmed'])) {
            throw new InvalidArgumentException('Only pending or confirmed bookings can be cancelled.');
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return $booking->fresh()->load(['service', 'service.media']);
    }

    public function getMyReservations(Request $request): LengthAwarePaginator
    {
        $customerId = auth()->id();

        return QueryBuilder::for(Reservation::class)
            ->where('customer_id', $customerId)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::callback('date_from', function ($query, $value) {
                    $query->where('check_in', '>=', $value);
                }),
                AllowedFilter::callback('date_to', function ($query, $value) {
                    $query->where('check_out', '<=', $value);
                }),
            ])
            ->allowedSorts(['check_in', 'created_at', 'status'])
            ->defaultSort('-created_at')
            ->with(['service', 'service.media'])
            ->paginate($request->per_page ?? 15)
            ->appends(request()->query());
    }

    public function getMyReservation(int $reservationId): Reservation
    {
        $customerId = auth()->id();

        $reservation = Reservation::where('customer_id', $customerId)
            ->with(['service', 'service.media', 'service.serviceCategory', 'merchant', 'merchant.address', 'coupon'])
            ->findOrFail($reservationId);

        return $reservation;
    }

    public function cancelMyReservation(int $reservationId): Reservation
    {
        $customerId = auth()->id();

        $reservation = Reservation::where('customer_id', $customerId)->findOrFail($reservationId);

        if (! in_array($reservation->status, ['pending', 'confirmed'])) {
            throw new InvalidArgumentException('Only pending or confirmed reservations can be cancelled.');
        }

        $reservation->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return $reservation->fresh()->load(['service', 'service.media']);
    }

    public function getMyOrders(Request $request): LengthAwarePaginator
    {
        $customerId = auth()->id();

        return QueryBuilder::for(ServiceOrder::class)
            ->where('customer_id', $customerId)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::callback('date_from', function ($query, $value) {
                    $query->where('created_at', '>=', $value);
                }),
                AllowedFilter::callback('date_to', function ($query, $value) {
                    $query->where('created_at', '<=', $value);
                }),
                AllowedFilter::partial('search', 'order_number'),
            ])
            ->allowedSorts(['created_at', 'status', 'order_number'])
            ->defaultSort('-created_at')
            ->with(['service', 'service.media'])
            ->paginate($request->per_page ?? 15)
            ->appends(request()->query());
    }

    public function getMyOrder(int $orderId): ServiceOrder
    {
        $customerId = auth()->id();

        $order = ServiceOrder::where('customer_id', $customerId)
            ->with(['service', 'service.media', 'service.serviceCategory', 'merchant', 'merchant.address', 'coupon'])
            ->findOrFail($orderId);

        return $order;
    }

    public function cancelMyOrder(int $orderId): ServiceOrder
    {
        $customerId = auth()->id();

        $order = ServiceOrder::where('customer_id', $customerId)->findOrFail($orderId);

        if ($order->status !== 'pending') {
            throw new InvalidArgumentException('Only pending orders can be cancelled.');
        }

        $order->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return $order->fresh()->load(['service', 'service.media']);
    }

    public function getMyStats(): array
    {
        $customerId = auth()->id();

        return [
            'bookings' => [
                'total' => Booking::where('customer_id', $customerId)->count(),
                'upcoming' => Booking::where('customer_id', $customerId)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where('booking_date', '>=', now()->toDateString())
                    ->count(),
            ],
            'reservations' => [
                'total' => Reservation::where('customer_id', $customerId)->count(),
                'active' => Reservation::where('customer_id', $customerId)
                    ->whereIn('status', ['confirmed', 'checked_in'])
                    ->count(),
            ],
            'orders' => [
                'total' => ServiceOrder::where('customer_id', $customerId)->count(),
                'active' => ServiceOrder::where('customer_id', $customerId)
                    ->whereNotIn('status', ['completed', 'cancelled'])
                    ->count(),
            ],
        ];
    }

    public function getAvailablePaymentMethods(int $customerId): array
    {
        $methods = $this->paymentMethodRepository->getActive();
        $customer = Customer::where('user_id', $customerId)->firstOrFail();

        return [
            'methods' => $methods,
            'preferred' => $customer->preferred_payment_method,
        ];
    }

    public function updatePaymentPreferences(int $customerId, ?string $preferredMethod): array
    {
        $customer = Customer::where('user_id', $customerId)->firstOrFail();
        $customer->update(['preferred_payment_method' => $preferredMethod]);

        return [
            'preferred_payment_method' => $customer->fresh()->preferred_payment_method,
        ];
    }

    public function uploadIdentityDocument(int $userId, \Illuminate\Http\UploadedFile $file): array
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        $customer->addMedia($file)->toMediaCollection('identity_document');
        $customer->update(['identity_document_status' => 'pending']);

        $customer->refresh();

        return [
            'identity_document_status' => $customer->identity_document_status,
            'identity_document_url' => $customer->getFirstMediaUrl('identity_document') ?: null,
        ];
    }

    public function toggleFavoriteMerchant(int $merchantId): bool
    {
        $customer = Customer::where('user_id', auth()->id())->firstOrFail();

        Merchant::where('status', 'active')->findOrFail($merchantId);

        $result = $customer->favoriteMerchants()->toggle([$merchantId]);

        return ! empty($result['attached']);
    }

    public function getMyFavoriteMerchants(Request $request): LengthAwarePaginator
    {
        $customer = Customer::where('user_id', auth()->id())->firstOrFail();

        $favoriteIds = $customer->favoriteMerchants()->pluck('merchants.id');

        return QueryBuilder::for(
            Merchant::whereIn('id', $favoriteIds)->where('status', 'active')
        )
            ->allowedFilters([
                AllowedFilter::partial('search', 'name'),
            ])
            ->allowedSorts(['name', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['businessType', 'media', 'address'])
            ->paginate($request->per_page ?? 15)
            ->appends(request()->query());
    }

    /**
     * Look up a merchant by slug and ensure it is active.
     *
     * @throws ModelNotFoundException
     */
    private function resolveActiveMerchant(string $slug): Merchant
    {
        $merchant = $this->merchantRepository->findBySlug($slug);

        if (! $merchant || $merchant->status !== 'active') {
            throw new ModelNotFoundException('Merchant not found or not active.');
        }

        return $merchant;
    }
}
