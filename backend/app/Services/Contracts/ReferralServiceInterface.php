<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\Referral;
use App\Models\ReferralCode;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface ReferralServiceInterface
{
    public function generateReferralCode(int $userId, int $merchantId): ReferralCode;

    public function validateReferralCode(string $code): array;

    public function acceptReferral(int $userId, string $code): Referral;

    public function checkAndCompleteReferral(int $userId, int $merchantId, string $transactionType, int $transactionId): void;

    public function getMyReferralCodes(int $userId): Collection;

    public function getMyReferrals(int $userId): Collection;

    public function getMyReferralRewards(int $userId, array $filters = []): LengthAwarePaginator;
}
