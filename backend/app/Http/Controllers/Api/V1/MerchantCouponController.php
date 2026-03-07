<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Data\CouponData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Coupon\StoreCouponRequest;
use App\Http\Requests\Api\V1\Coupon\UpdateCouponRequest;
use App\Http\Resources\Api\V1\CouponResource;
use App\Models\Coupon;
use App\Models\Merchant;
use App\Services\Contracts\CouponServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MerchantCouponController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CouponServiceInterface $couponService
    ) {}

    private function getMerchant(Request $request): Merchant
    {
        return $request->user()->merchant;
    }

    private function isBranchMerchant(Merchant $merchant): bool
    {
        return $merchant->parent_id !== null;
    }

    private function branchCanManageCoupons(Merchant $branch): bool
    {
        if (! $this->isBranchMerchant($branch)) {
            return false;
        }

        return (bool) $branch->allow_branch_coupon_management;
    }

    private function verifyOwnership(int $couponId, Merchant $merchant): Coupon
    {
        $coupon = $this->couponService->getCouponById($couponId);

        if ($this->isBranchMerchant($merchant)) {
            // Branch owns this coupon directly
            if ($coupon->merchant_id === $merchant->id) {
                return $coupon;
            }

            // Branch can view inherited coupons (parent's org-wide or targeted to this branch)
            if ($coupon->merchant_id !== $merchant->parent_id) {
                abort(403, 'You do not have access to this coupon');
            }
            if ($coupon->target_merchant_id !== null && $coupon->target_merchant_id !== $merchant->id) {
                abort(403, 'You do not have access to this coupon');
            }
        } else {
            if ($coupon->merchant_id !== $merchant->id) {
                abort(403, 'You do not own this coupon');
            }
        }

        return $coupon;
    }

    public function index(Request $request): JsonResponse
    {
        $merchant = $this->getMerchant($request);

        if ($this->isBranchMerchant($merchant)) {
            $coupons = $this->couponService->getBranchInheritedCoupons(
                $merchant->parent_id,
                $merchant->id,
                $request
            );

            // Mark inherited coupons
            $coupons->getCollection()->each(function ($coupon) use ($merchant) {
                $coupon->is_inherited = $coupon->merchant_id !== $merchant->id;
            });

            // If branch can manage coupons, also include their own
            if ($this->branchCanManageCoupons($merchant)) {
                $ownCoupons = $this->couponService->getMerchantCoupons($merchant->id, $request);
                $ownCoupons->getCollection()->each(function ($coupon) {
                    $coupon->is_inherited = false;
                });

                // Merge own coupons into the inherited collection
                $merged = $coupons->getCollection()->merge($ownCoupons->getCollection());
                $coupons->setCollection($merged);
            }
        } else {
            $coupons = $this->couponService->getMerchantCoupons($merchant->id, $request);
        }

        return $this->paginatedResponse($coupons, CouponResource::class);
    }

    public function store(StoreCouponRequest $request): JsonResponse
    {
        $merchant = $this->getMerchant($request);

        if ($this->isBranchMerchant($merchant) && ! $this->branchCanManageCoupons($merchant)) {
            return $this->forbiddenResponse('Branch merchants cannot create coupons');
        }

        $data = CouponData::from($request->validated());

        // Branch merchants cannot set target_merchant_id (that's an org-level feature)
        $targetMerchantId = $this->isBranchMerchant($merchant)
            ? null
            : $request->validated('target_merchant_id');

        $coupon = $this->couponService->createCoupon(
            $data,
            $merchant->id,
            $request->user()->id,
            $targetMerchantId
        );

        return $this->createdResponse(
            new CouponResource($coupon),
            'Coupon created successfully'
        );
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $merchant = $this->getMerchant($request);
        $coupon = $this->verifyOwnership($id, $merchant);

        if ($this->isBranchMerchant($merchant)) {
            $coupon->is_inherited = $coupon->merchant_id !== $merchant->id;
        }

        return $this->successResponse(
            new CouponResource($coupon),
            'Coupon retrieved successfully'
        );
    }

    public function update(UpdateCouponRequest $request, int $id): JsonResponse
    {
        $merchant = $this->getMerchant($request);

        if ($this->isBranchMerchant($merchant)) {
            if (! $this->branchCanManageCoupons($merchant)) {
                return $this->forbiddenResponse('Branch merchants cannot update coupons');
            }

            // Branch can only update their own coupons, not inherited ones
            $coupon = $this->verifyOwnership($id, $merchant);
            if ($coupon->merchant_id !== $merchant->id) {
                return $this->forbiddenResponse('You cannot edit inherited coupons');
            }
        } else {
            $this->verifyOwnership($id, $merchant);
        }

        $data = CouponData::from($request->validated());
        $coupon = $this->couponService->updateCoupon($id, $data);

        return $this->successResponse(
            new CouponResource($coupon),
            'Coupon updated successfully'
        );
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $merchant = $this->getMerchant($request);

        if ($this->isBranchMerchant($merchant)) {
            if (! $this->branchCanManageCoupons($merchant)) {
                return $this->forbiddenResponse('Branch merchants cannot delete coupons');
            }

            // Branch can only delete their own coupons, not inherited ones
            $coupon = $this->verifyOwnership($id, $merchant);
            if ($coupon->merchant_id !== $merchant->id) {
                return $this->forbiddenResponse('You cannot delete inherited coupons');
            }
        } else {
            $this->verifyOwnership($id, $merchant);
        }

        try {
            $this->couponService->deleteCoupon($id);

            return $this->successResponse(null, 'Coupon deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
