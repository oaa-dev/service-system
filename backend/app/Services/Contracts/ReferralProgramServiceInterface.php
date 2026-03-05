<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Data\ReferralProgramData;
use App\Models\ReferralProgram;
use Illuminate\Pagination\LengthAwarePaginator;

interface ReferralProgramServiceInterface
{
    public function getMyReferralProgram(int $merchantId): ?ReferralProgram;

    public function createOrUpdateReferralProgram(int $merchantId, ReferralProgramData $data): ReferralProgram;

    public function deactivateReferralProgram(int $merchantId): void;

    public function getAdminReferralProgram(int $merchantId): ?ReferralProgram;

    public function updateAdminReferralProgram(int $merchantId, ReferralProgramData $data): ReferralProgram;

    public function getMerchantReferrals(int $merchantId, array $filters = []): LengthAwarePaginator;

    public function getReferralStats(int $merchantId): array;
}
