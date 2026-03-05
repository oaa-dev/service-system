<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\LoyaltyProgramData;
use App\Exceptions\ApiException;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramTier;
use App\Models\Merchant;
use App\Repositories\Contracts\LoyaltyProgramRepositoryInterface;
use App\Services\Contracts\LoyaltyProgramServiceInterface;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelData\Optional;

class LoyaltyProgramService implements LoyaltyProgramServiceInterface
{
    public function __construct(
        protected LoyaltyProgramRepositoryInterface $loyaltyProgramRepository
    ) {}

    public function getMyLoyaltyProgram(int $merchantId): ?LoyaltyProgram
    {
        $merchant = Merchant::findOrFail($merchantId);

        // Branch merchants inherit the organization's program
        $programMerchantId = $merchant->parent_id ?? $merchantId;

        $program = LoyaltyProgram::where('merchant_id', $programMerchantId)
            ->where('is_active', true)
            ->with(['tiers.rewardProduct'])
            ->first();

        if ($program && $merchant->parent_id) {
            $program->setAttribute('is_inherited', true);
        }

        return $program;
    }

    public function createOrUpdateLoyaltyProgram(int $merchantId, LoyaltyProgramData $data, array $tiers = []): LoyaltyProgram
    {
        $merchant = Merchant::findOrFail($merchantId);

        if ($merchant->parent_id) {
            throw new ApiException('Branch merchants cannot manage loyalty programs. The program is managed by your organization.', 403);
        }

        return DB::transaction(function () use ($merchantId, $data, $tiers) {
            $existing = LoyaltyProgram::where('merchant_id', $merchantId)
                ->where('is_active', true)
                ->first();

            $programData = collect($data->toArray())
                ->reject(fn ($v) => $v instanceof Optional)
                ->toArray();

            if ($existing) {
                $existing->update($programData);
                $program = $existing;
            } else {
                $programData['merchant_id'] = $merchantId;
                $programData['is_active'] = true;
                $program = LoyaltyProgram::create($programData);
            }

            // Sync tiers if provided
            if (! empty($tiers)) {
                $this->syncTiers($program, $tiers);
            }

            return $program->fresh()->load(['tiers.rewardProduct']);
        });
    }

    public function deactivateLoyaltyProgram(int $merchantId): void
    {
        $merchant = Merchant::findOrFail($merchantId);

        if ($merchant->parent_id) {
            throw new ApiException('Branch merchants cannot manage loyalty programs. The program is managed by your organization.', 403);
        }

        $program = LoyaltyProgram::where('merchant_id', $merchantId)
            ->where('is_active', true)
            ->firstOrFail();

        $program->update(['is_active' => false]);

        // Invalidate all unexpired QR codes for this program
        $program->qrCodes()
            ->where('expires_at', '>', now())
            ->update(['expires_at' => now()]);
    }

    public function getAdminLoyaltyProgram(int $merchantId): ?LoyaltyProgram
    {
        return LoyaltyProgram::where('merchant_id', $merchantId)
            ->where('is_active', true)
            ->with(['tiers.rewardProduct', 'merchant'])
            ->withCount('loyaltyCards')
            ->first();
    }

    public function updateAdminLoyaltyProgram(int $merchantId, LoyaltyProgramData $data, array $tiers = []): LoyaltyProgram
    {
        return DB::transaction(function () use ($merchantId, $data, $tiers) {
            $program = LoyaltyProgram::where('merchant_id', $merchantId)
                ->where('is_active', true)
                ->firstOrFail();

            $updateData = collect($data->toArray())
                ->reject(fn ($v) => $v instanceof Optional)
                ->toArray();

            $program->update($updateData);

            if (! empty($tiers)) {
                $this->syncTiers($program, $tiers);
            }

            return $program->fresh()->load(['tiers.rewardProduct', 'merchant']);
        });
    }

    private function syncTiers(LoyaltyProgram $program, array $tiers): void
    {
        // Delete existing tiers and recreate
        $program->tiers()->delete();

        foreach ($tiers as $index => $tierData) {
            LoyaltyProgramTier::create([
                'loyalty_program_id' => $program->id,
                'required_stamps' => $tierData['required_stamps'],
                'reward_type' => $tierData['reward_type'],
                'reward_value' => $tierData['reward_value'] ?? null,
                'reward_product_id' => $tierData['reward_product_id'] ?? null,
                'reward_description' => $tierData['reward_description'] ?? null,
                'sort_order' => $index,
            ]);
        }
    }
}
