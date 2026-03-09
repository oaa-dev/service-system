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
use App\Http\Resources\Api\V1\MerchantResource;
use App\Http\Resources\Api\V1\PaymentMethodResource;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Http\Resources\Api\V1\ReservationResource;
use App\Http\Resources\Api\V1\ServiceOrderResource;
use App\Http\Resources\Api\V1\CouponResource;
use App\Services\Contracts\CouponServiceInterface;
use App\Services\Contracts\CustomerPortalServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class CustomerPortalController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerPortalServiceInterface $customerPortalService,
        protected CouponServiceInterface $couponService
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

    public function myReservation(int $reservation): JsonResponse
    {
        $reservationModel = $this->customerPortalService->getMyReservation($reservation);

        return $this->successResponse(
            new ReservationResource($reservationModel),
            'Reservation retrieved successfully'
        );
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

    public function myOrder(int $order): JsonResponse
    {
        $orderModel = $this->customerPortalService->getMyOrder($order);

        return $this->successResponse(
            new ServiceOrderResource($orderModel),
            'Order retrieved successfully'
        );
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

    public function getPaymentMethods(): JsonResponse
    {
        $customerId = auth()->id();
        $result = $this->customerPortalService->getAvailablePaymentMethods($customerId);

        return $this->successResponse([
            'methods' => PaymentMethodResource::collection($result['methods']),
            'preferred' => $result['preferred'],
        ], 'Payment methods retrieved successfully');
    }

    public function updatePaymentPreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'preferred_payment_method' => ['nullable', 'string', 'max:100'],
        ]);

        $customerId = auth()->id();
        $result = $this->customerPortalService->updatePaymentPreferences(
            $customerId,
            $validated['preferred_payment_method'] ?? null
        );

        return $this->successResponse($result, 'Payment preferences updated successfully');
    }

    public function myStats(): JsonResponse
    {
        $stats = $this->customerPortalService->getMyStats();

        return $this->successResponse($stats, 'Dashboard stats retrieved successfully');
    }

    public function toggleFavoriteMerchant(int $merchant): JsonResponse
    {
        $isFavorited = $this->customerPortalService->toggleFavoriteMerchant($merchant);

        return $this->successResponse(
            ['is_favorited' => $isFavorited],
            $isFavorited ? 'Merchant added to favorites' : 'Merchant removed from favorites'
        );
    }

    public function myFavoriteMerchants(Request $request): JsonResponse
    {
        $merchants = $this->customerPortalService->getMyFavoriteMerchants($request);

        return $this->paginatedResponse($merchants, MerchantResource::class);
    }

    public function uploadIdentityDocument(Request $request): JsonResponse
    {
        $request->validate([
            'document' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $result = $this->customerPortalService->uploadIdentityDocument(
            auth()->id(),
            $request->file('document')
        );

        return $this->successResponse($result, 'Identity document uploaded successfully');
    }

    public function myCoupons(Request $request): JsonResponse
    {
        $items = $this->couponService->getMyCoupons(auth()->id(), $request->status);

        return $this->successResponse($items, 'My coupons retrieved successfully');
    }

    public function claimCoupon(int $coupon): JsonResponse
    {
        $claim = $this->couponService->claimCoupon($coupon, auth()->id());

        return $this->successResponse([
            'claimed_at' => $claim->claimed_at->toISOString(),
            'expires_at' => $claim->expires_at->toISOString(),
        ], 'Coupon claimed successfully');
    }

    public function checkMyPaymentStatus(int $payment): JsonResponse
    {
        $paymentModel = $this->customerPortalService->checkMyPaymentStatus($payment);

        return $this->successResponse(
            new PaymentResource($paymentModel),
            'Payment status checked successfully'
        );
    }

    public function claimedCoupons(): JsonResponse
    {
        $claims = $this->couponService->getClaimedCoupons(auth()->id());

        // Load claims relation on each coupon scoped to this user so CouponResource can render claim data
        $coupons = $claims->pluck('coupon')->each(function ($coupon) use ($claims) {
            $coupon->setRelation('claims', $claims->where('coupon_id', $coupon->id)->values());
        });

        return $this->successResponse(
            CouponResource::collection($coupons),
            'Claimed coupons retrieved'
        );
    }
}
