<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Data\LoyaltyProgramData;
use App\Models\LoyaltyProgram;

interface LoyaltyProgramServiceInterface
{
    public function getMyLoyaltyProgram(int $merchantId): ?LoyaltyProgram;

    public function createOrUpdateLoyaltyProgram(int $merchantId, LoyaltyProgramData $data, array $tiers = []): LoyaltyProgram;

    public function deactivateLoyaltyProgram(int $merchantId): void;

    public function getAdminLoyaltyProgram(int $merchantId): ?LoyaltyProgram;

    public function updateAdminLoyaltyProgram(int $merchantId, LoyaltyProgramData $data, array $tiers = []): LoyaltyProgram;
}
