<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Referral\AcceptReferralRequest;
use App\Http\Resources\Api\V1\ReferralCodeResource;
use App\Http\Resources\Api\V1\ReferralResource;
use App\Http\Resources\Api\V1\ReferralRewardResource;
use App\Services\Contracts\ReferralServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerReferralController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ReferralServiceInterface $referralService
    ) {}

    /**
     * POST /customer/referrals/generate/{merchant}
     */
    public function generateCode(int $merchantId): JsonResponse
    {
        $code = $this->referralService->generateReferralCode(auth()->id(), $merchantId);

        return $this->successResponse(
            new ReferralCodeResource($code),
            'Referral code generated.'
        );
    }

    /**
     * GET /customer/referral-codes
     */
    public function myCodes(): JsonResponse
    {
        $codes = $this->referralService->getMyReferralCodes(auth()->id());

        return $this->successResponse(
            ReferralCodeResource::collection($codes),
            'Referral codes retrieved.'
        );
    }

    /**
     * GET /customer/referrals
     */
    public function myReferrals(): JsonResponse
    {
        $referrals = $this->referralService->getMyReferrals(auth()->id());

        return $this->successResponse(
            ReferralResource::collection($referrals),
            'Referrals retrieved.'
        );
    }

    /**
     * GET /customer/referral-rewards
     */
    public function myRewards(Request $request): JsonResponse
    {
        $rewards = $this->referralService->getMyReferralRewards(auth()->id(), $request->all());

        return $this->paginatedResponse($rewards, ReferralRewardResource::class);
    }

    /**
     * POST /customer/referrals/accept
     */
    public function accept(AcceptReferralRequest $request): JsonResponse
    {
        $referral = $this->referralService->acceptReferral(
            auth()->id(),
            $request->validated('code')
        );

        return $this->createdResponse(
            new ReferralResource($referral),
            'Referral accepted.'
        );
    }

    /**
     * GET /storefront/referral/{code}
     */
    public function validateCode(string $code): JsonResponse
    {
        $result = $this->referralService->validateReferralCode($code);

        return $this->successResponse($result, 'Referral code is valid.');
    }
}
