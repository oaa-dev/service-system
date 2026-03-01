<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\MerchantResource;
use App\Http\Resources\Api\V1\ServiceResource;
use App\Services\Contracts\StorefrontServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StorefrontController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected StorefrontServiceInterface $storefrontService
    ) {}

    public function merchants(Request $request): JsonResponse
    {
        $merchants = $this->storefrontService->getActiveMerchants($request);

        return $this->paginatedResponse($merchants, MerchantResource::class);
    }

    public function merchantDetail(string $slug): JsonResponse
    {
        $merchant = $this->storefrontService->getMerchantBySlug($slug);

        return $this->successResponse(
            new MerchantResource($merchant),
            'Merchant retrieved successfully'
        );
    }

    public function merchantServices(string $slug, Request $request): JsonResponse
    {
        $services = $this->storefrontService->getMerchantServices($slug, $request);

        return $this->paginatedResponse($services, ServiceResource::class);
    }

    public function businessTypes(): JsonResponse
    {
        $businessTypes = $this->storefrontService->getActiveBusinessTypes();

        return $this->successResponse($businessTypes, 'Business types retrieved successfully');
    }

    public function paymentMethods(): JsonResponse
    {
        $paymentMethods = $this->storefrontService->getActivePaymentMethods();

        return $this->successResponse($paymentMethods, 'Payment methods retrieved successfully');
    }

    public function serviceDetail(string $slug, int $service): JsonResponse
    {
        $serviceModel = $this->storefrontService->getServiceDetail($slug, $service);

        return $this->successResponse(
            new ServiceResource($serviceModel),
            'Service retrieved successfully'
        );
    }

    public function bookingAvailability(string $slug, int $service, Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
        ]);

        $data = $this->storefrontService->getBookingAvailability($slug, $service, $request->month);

        return $this->successResponse($data, 'Booking availability retrieved successfully');
    }

    public function reservationAvailability(string $slug, int $service, Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
        ]);

        $data = $this->storefrontService->getReservationAvailability($slug, $service, $request->month);

        return $this->successResponse($data, 'Reservation availability retrieved successfully');
    }

    public function mapMerchants(Request $request): JsonResponse
    {
        $hasLocationParams = $request->filled(['lat', 'lng', 'radius']);

        if ($hasLocationParams) {
            $request->validate([
                'lat' => 'required|numeric|between:-90,90',
                'lng' => 'required|numeric|between:-180,180',
                'radius' => 'required|numeric|between:0.1,100',
            ]);

            $merchants = $this->storefrontService->getNearbyMerchants(
                (float) $request->lat,
                (float) $request->lng,
                (float) $request->radius,
            );
        } else {
            $merchants = $this->storefrontService->getAllActiveMerchants();
        }

        return $this->successResponse(
            MerchantResource::collection($merchants),
            'Map merchants retrieved successfully'
        );
    }
}
