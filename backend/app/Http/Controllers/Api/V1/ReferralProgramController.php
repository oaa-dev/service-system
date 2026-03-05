<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Data\ReferralProgramData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Referral\CreateReferralProgramRequest;
use App\Http\Requests\Api\V1\Referral\UpdateReferralProgramRequest;
use App\Http\Resources\Api\V1\ReferralProgramResource;
use App\Http\Resources\Api\V1\ReferralResource;
use App\Services\Contracts\ReferralProgramServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralProgramController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ReferralProgramServiceInterface $referralProgramService
    ) {}

    private function getMerchantId(Request $request): int
    {
        return $request->user()->merchant->id;
    }

    /**
     * GET /auth/merchant/referral-program
     */
    public function show(Request $request): JsonResponse
    {
        $program = $this->referralProgramService->getMyReferralProgram($this->getMerchantId($request));

        if (! $program) {
            return $this->successResponse(null, 'No active referral program.');
        }

        return $this->successResponse(
            new ReferralProgramResource($program),
            'Referral program retrieved.'
        );
    }

    /**
     * POST /auth/merchant/referral-program
     */
    public function store(CreateReferralProgramRequest $request): JsonResponse
    {
        $data = ReferralProgramData::from($request->validated());
        $program = $this->referralProgramService->createOrUpdateReferralProgram(
            $this->getMerchantId($request),
            $data
        );

        return $this->createdResponse(
            new ReferralProgramResource($program),
            'Referral program saved.'
        );
    }

    /**
     * DELETE /auth/merchant/referral-program
     */
    public function destroy(Request $request): JsonResponse
    {
        $this->referralProgramService->deactivateReferralProgram($this->getMerchantId($request));

        return $this->noContentResponse();
    }

    /**
     * GET /auth/merchant/referrals
     */
    public function referrals(Request $request): JsonResponse
    {
        $referrals = $this->referralProgramService->getMerchantReferrals(
            $this->getMerchantId($request),
            $request->all()
        );

        return $this->paginatedResponse($referrals, ReferralResource::class);
    }

    /**
     * GET /auth/merchant/referral-stats
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = $this->referralProgramService->getReferralStats($this->getMerchantId($request));

        return $this->successResponse($stats, 'Referral stats retrieved.');
    }

    /**
     * GET /merchants/{merchant}/referral-program
     */
    public function adminShow(int $merchantId): JsonResponse
    {
        $program = $this->referralProgramService->getAdminReferralProgram($merchantId);

        if (! $program) {
            return $this->successResponse(null, 'No active referral program.');
        }

        return $this->successResponse(
            new ReferralProgramResource($program),
            'Referral program retrieved.'
        );
    }

    /**
     * PUT /merchants/{merchant}/referral-program
     */
    public function adminUpdate(UpdateReferralProgramRequest $request, int $merchantId): JsonResponse
    {
        $data = ReferralProgramData::from($request->validated());
        $program = $this->referralProgramService->updateAdminReferralProgram($merchantId, $data);

        return $this->successResponse(
            new ReferralProgramResource($program),
            'Referral program updated.'
        );
    }
}
