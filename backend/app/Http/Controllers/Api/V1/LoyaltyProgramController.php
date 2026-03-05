<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Data\LoyaltyProgramData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Loyalty\CreateLoyaltyProgramRequest;
use App\Http\Requests\Api\V1\Loyalty\UpdateLoyaltyProgramRequest;
use App\Http\Resources\Api\V1\LoyaltyProgramResource;
use App\Services\Contracts\LoyaltyProgramServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyProgramController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected LoyaltyProgramServiceInterface $loyaltyProgramService
    ) {}

    private function getMerchantId(Request $request): int
    {
        return $request->user()->merchant->id;
    }

    /**
     * GET /auth/merchant/loyalty-program
     */
    public function show(Request $request): JsonResponse
    {
        $program = $this->loyaltyProgramService->getMyLoyaltyProgram($this->getMerchantId($request));

        if (! $program) {
            return $this->successResponse(null, 'No active loyalty program.');
        }

        return $this->successResponse(
            new LoyaltyProgramResource($program),
            'Loyalty program retrieved.'
        );
    }

    /**
     * POST /auth/merchant/loyalty-program
     */
    public function store(CreateLoyaltyProgramRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $tiers = $validated['tiers'] ?? [];

        $data = LoyaltyProgramData::from(collect($validated)->except('tiers')->toArray());
        $program = $this->loyaltyProgramService->createOrUpdateLoyaltyProgram(
            $this->getMerchantId($request),
            $data,
            $tiers
        );

        return $this->createdResponse(
            new LoyaltyProgramResource($program),
            'Loyalty program saved.'
        );
    }

    /**
     * DELETE /auth/merchant/loyalty-program
     */
    public function destroy(Request $request): JsonResponse
    {
        $this->loyaltyProgramService->deactivateLoyaltyProgram($this->getMerchantId($request));

        return $this->noContentResponse();
    }

    /**
     * GET /merchants/{merchant}/loyalty-program
     */
    public function adminShow(int $merchantId): JsonResponse
    {
        $program = $this->loyaltyProgramService->getAdminLoyaltyProgram($merchantId);

        if (! $program) {
            return $this->successResponse(null, 'No active loyalty program.');
        }

        return $this->successResponse(
            new LoyaltyProgramResource($program),
            'Loyalty program retrieved.'
        );
    }

    /**
     * PUT /merchants/{merchant}/loyalty-program
     */
    public function adminUpdate(UpdateLoyaltyProgramRequest $request, int $merchantId): JsonResponse
    {
        $validated = $request->validated();
        $tiers = $validated['tiers'] ?? [];

        $data = LoyaltyProgramData::from(collect($validated)->except('tiers')->toArray());
        $program = $this->loyaltyProgramService->updateAdminLoyaltyProgram($merchantId, $data, $tiers);

        return $this->successResponse(
            new LoyaltyProgramResource($program),
            'Loyalty program updated.'
        );
    }
}
