<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\LoyaltyCard;
use App\Models\LoyaltyReward;
use App\Models\LoyaltyStampQrCode;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface LoyaltyServiceInterface
{
    public function generateStampQR(int $merchantId, string $mode, int $createdBy): LoyaltyStampQrCode;

    public function scanStampQR(string $token, int $userId): array;

    public function awardBonusStamp(int $cardId, int $merchantId, ?string $notes, int $awardedBy): array;

    public function getMerchantLoyaltyCards(int $merchantId, Request $request): LengthAwarePaginator;

    public function getMerchantLoyaltyCard(int $merchantId, int $cardId): LoyaltyCard;

    public function getMyLoyaltyCards(int $userId, Request $request): LengthAwarePaginator;

    public function getMyLoyaltyCard(int $userId, int $cardId): LoyaltyCard;

    public function getMyAvailableRewards(int $userId): \Illuminate\Database\Eloquent\Collection;

    public function redeemReward(int $rewardId, int $userId): LoyaltyReward;

    public function markRewardRedeemed(int $rewardId, string $redeemableType, int $redeemableId): void;

    public function calculateRewardDiscount(LoyaltyReward $reward, float $subtotal): float;
}
