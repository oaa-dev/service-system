<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Data\CouponData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Coupon\StoreCouponRequest;
use App\Http\Requests\Api\V1\Coupon\UpdateCouponRequest;
use App\Http\Requests\Api\V1\Coupon\ValidateCouponRequest;
use App\Http\Resources\Api\V1\CouponResource;
use App\Models\Merchant;
use App\Services\Contracts\CouponServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CouponServiceInterface $couponService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $coupons = $this->couponService->getAllCoupons($request);

        return $this->paginatedResponse($coupons, CouponResource::class);
    }

    public function store(StoreCouponRequest $request): JsonResponse
    {
        $data = CouponData::from($request->validated());
        $coupon = $this->couponService->createCoupon($data, null, $request->user()->id);

        return $this->createdResponse(
            new CouponResource($coupon),
            'Coupon created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $coupon = $this->couponService->getCouponById($id);

        return $this->successResponse(
            new CouponResource($coupon),
            'Coupon retrieved successfully'
        );
    }

    public function update(UpdateCouponRequest $request, int $id): JsonResponse
    {
        $data = CouponData::from($request->validated());
        $coupon = $this->couponService->updateCoupon($id, $data);

        return $this->successResponse(
            new CouponResource($coupon),
            'Coupon updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->couponService->deleteCoupon($id);

            return $this->successResponse(null, 'Coupon deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function validate(ValidateCouponRequest $request): JsonResponse
    {
        $merchant = Merchant::where('slug', $request->merchant_slug)->firstOrFail();

        // Resolve customer_id from customers table (not user ID) for per-customer limit checks
        $customerId = null;
        if ($request->user()) {
            $customer = \App\Models\Customer::where('user_id', $request->user()->id)->first();
            $customerId = $customer?->id;
        }

        $result = $this->couponService->validateCoupon(
            $request->code,
            $merchant->id,
            $request->transaction_type,
            (float) $request->subtotal,
            $customerId
        );

        return $this->successResponse([
            'coupon' => new CouponResource($result['coupon']),
            'discount_amount' => $result['discount_amount'],
        ], 'Coupon is valid');
    }
}
