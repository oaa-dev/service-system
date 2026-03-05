<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Loyalty\AwardBonusStampRequest;
use App\Http\Requests\Api\V1\Loyalty\GenerateQrCodeRequest;
use App\Http\Resources\Api\V1\LoyaltyCardResource;
use App\Http\Resources\Api\V1\LoyaltyStampQrCodeResource;
use App\Http\Resources\Api\V1\LoyaltyStampResource;
use App\Services\Contracts\LoyaltyServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected LoyaltyServiceInterface $loyaltyService
    ) {}

    private function getMerchantId(Request $request): int
    {
        return $request->user()->merchant->id;
    }

    /**
     * POST /auth/merchant/loyalty/generate-qr
     */
    public function generateQr(GenerateQrCodeRequest $request): JsonResponse
    {
        $qrCode = $this->loyaltyService->generateStampQR(
            $this->getMerchantId($request),
            $request->validated('mode'),
            auth()->id()
        );

        return $this->createdResponse(
            new LoyaltyStampQrCodeResource($qrCode),
            'QR code generated.'
        );
    }

    /**
     * GET /auth/merchant/loyalty-cards
     */
    public function index(Request $request): JsonResponse
    {
        $cards = $this->loyaltyService->getMerchantLoyaltyCards(
            $this->getMerchantId($request),
            $request
        );

        return $this->paginatedResponse($cards, LoyaltyCardResource::class);
    }

    /**
     * GET /auth/merchant/loyalty-cards/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $card = $this->loyaltyService->getMerchantLoyaltyCard(
            $this->getMerchantId($request),
            $id
        );

        return $this->successResponse(
            new LoyaltyCardResource($card),
            'Loyalty card retrieved.'
        );
    }

    /**
     * POST /auth/merchant/loyalty-cards/{id}/stamp
     */
    public function awardStamp(AwardBonusStampRequest $request, int $id): JsonResponse
    {
        $result = $this->loyaltyService->awardBonusStamp(
            $id,
            $this->getMerchantId($request),
            $request->validated('notes'),
            auth()->id()
        );

        return $this->createdResponse([
            'stamp' => new LoyaltyStampResource($result['stamp']),
            'card' => new LoyaltyCardResource($result['card']),
            'reward_unlocked' => $result['reward_unlocked'],
            'rewards_unlocked' => $result['rewards_unlocked'],
        ], 'Bonus stamp awarded.');
    }
}
