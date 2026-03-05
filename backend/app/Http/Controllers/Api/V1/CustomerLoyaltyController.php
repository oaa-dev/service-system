<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Loyalty\ScanQrCodeRequest;
use App\Http\Resources\Api\V1\LoyaltyCardResource;
use App\Http\Resources\Api\V1\LoyaltyRewardResource;
use App\Http\Resources\Api\V1\LoyaltyStampResource;
use App\Services\Contracts\LoyaltyServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerLoyaltyController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected LoyaltyServiceInterface $loyaltyService
    ) {}

    /**
     * POST /customer/loyalty/scan
     */
    public function scan(ScanQrCodeRequest $request): JsonResponse
    {
        $result = $this->loyaltyService->scanStampQR(
            $request->validated('token'),
            auth()->id()
        );

        return $this->successResponse([
            'stamp' => new LoyaltyStampResource($result['stamp']),
            'card' => new LoyaltyCardResource($result['card']),
            'reward_unlocked' => $result['reward_unlocked'],
            'rewards_unlocked' => $result['rewards_unlocked'],
        ], 'Stamp earned!');
    }

    /**
     * GET /customer/loyalty-cards
     */
    public function cards(Request $request): JsonResponse
    {
        $cards = $this->loyaltyService->getMyLoyaltyCards(auth()->id(), $request);

        return $this->paginatedResponse($cards, LoyaltyCardResource::class);
    }

    /**
     * GET /customer/loyalty-cards/{id}
     */
    public function cardDetail(int $id): JsonResponse
    {
        $card = $this->loyaltyService->getMyLoyaltyCard(auth()->id(), $id);

        return $this->successResponse(
            new LoyaltyCardResource($card),
            'Loyalty card retrieved.'
        );
    }

    /**
     * GET /customer/loyalty-rewards
     */
    public function rewards(): JsonResponse
    {
        $rewards = $this->loyaltyService->getMyAvailableRewards(auth()->id());

        return $this->successResponse(
            LoyaltyRewardResource::collection($rewards),
            'Available rewards retrieved.'
        );
    }
}
