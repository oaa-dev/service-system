<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Customer;
use App\Models\LoyaltyCard;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramTier;
use App\Models\LoyaltyReward;
use App\Models\LoyaltyStamp;
use App\Models\LoyaltyStampQrCode;
use App\Models\LoyaltyStampQrScan;
use App\Models\Merchant;
use App\Repositories\Contracts\LoyaltyCardRepositoryInterface;
use App\Repositories\Contracts\LoyaltyProgramRepositoryInterface;
use App\Repositories\Contracts\LoyaltyRewardRepositoryInterface;
use App\Services\Contracts\LoyaltyServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class LoyaltyService implements LoyaltyServiceInterface
{
    public function __construct(
        protected LoyaltyProgramRepositoryInterface $loyaltyProgramRepository,
        protected LoyaltyCardRepositoryInterface $loyaltyCardRepository,
        protected LoyaltyRewardRepositoryInterface $loyaltyRewardRepository
    ) {}

    public function generateStampQR(int $merchantId, string $mode, int $createdBy): LoyaltyStampQrCode
    {
        $merchant = Merchant::findOrFail($merchantId);
        $programMerchantId = $merchant->parent_id ?? $merchantId;

        $program = LoyaltyProgram::where('merchant_id', $programMerchantId)
            ->where('is_active', true)
            ->firstOrFail();

        $expiresAt = $mode === 'single_use'
            ? now()->addMinutes(2)
            : now()->endOfDay();

        return LoyaltyStampQrCode::create([
            'merchant_id' => $merchantId,
            'loyalty_program_id' => $program->id,
            'token' => Str::random(64),
            'mode' => $mode,
            'expires_at' => $expiresAt,
            'created_by' => $createdBy,
            'created_at' => now(),
        ]);
    }

    public function scanStampQR(string $token, int $userId): array
    {
        return DB::transaction(function () use ($token, $userId) {
            // 1. Find QR by token
            $qrCode = LoyaltyStampQrCode::where('token', $token)->first();
            if (! $qrCode) {
                throw new ApiException('QR code not found.', 404);
            }

            // 2. Check expiry
            if ($qrCode->expires_at->isPast()) {
                throw new ApiException('QR code has expired.', 410);
            }

            // 3. Verify active program
            $program = LoyaltyProgram::where('id', $qrCode->loyalty_program_id)
                ->where('is_active', true)
                ->first();

            if (! $program) {
                throw new ApiException('Loyalty program is no longer active.', 404);
            }

            // 4. Resolve Customer record (FK to customers table, NOT users table)
            $customer = Customer::where('user_id', $userId)->firstOrFail();

            // 5. Mode-specific validation
            if ($qrCode->mode === 'single_use') {
                $affected = LoyaltyStampQrCode::where('id', $qrCode->id)
                    ->where('is_used', false)
                    ->update([
                        'is_used' => true,
                        'scanned_by' => $customer->id,
                        'scanned_at' => now(),
                    ]);

                if ($affected === 0) {
                    throw new ApiException('QR code has already been used.', 409);
                }
            } else {
                // Daily mode: check if customer already earned a stamp from this merchant today
                $alreadyEarnedToday = LoyaltyStamp::whereHas('loyaltyCard', function ($q) use ($qrCode) {
                    $q->where('merchant_id', $qrCode->merchant_id);
                })
                    ->where('source', 'qr_scan')
                    ->whereDate('earned_at', today())
                    ->whereHas('loyaltyCard', function ($q) use ($customer) {
                        $q->where('customer_id', $customer->id);
                    })
                    ->exists();

                if ($alreadyEarnedToday) {
                    throw new ApiException('You already earned a stamp from this merchant today.', 409);
                }

                // Record scan for tracking
                LoyaltyStampQrScan::create([
                    'qr_code_id' => $qrCode->id,
                    'customer_id' => $customer->id,
                    'scanned_at' => now(),
                ]);

                $qrCode->increment('scan_count');
            }

            // 6. Get or create loyalty card
            $card = LoyaltyCard::firstOrCreate(
                ['customer_id' => $customer->id, 'merchant_id' => $qrCode->merchant_id],
                ['loyalty_program_id' => $program->id]
            );

            // 7. Create stamp
            $stampExpiresAt = $program->stamp_expiry_days
                ? now()->addDays($program->stamp_expiry_days)
                : null;

            $stamp = LoyaltyStamp::create([
                'loyalty_card_id' => $card->id,
                'qr_code_id' => $qrCode->id,
                'source' => 'qr_scan',
                'earned_at' => now(),
                'expires_at' => $stampExpiresAt,
            ]);

            // 8. Increment counters
            $card->increment('current_stamps');
            $card->increment('total_stamps_earned');
            $card->update(['last_stamp_at' => now()]);

            // 9. Check tier thresholds for reward unlocks
            $card->refresh();
            $rewardsUnlocked = $this->checkAndUnlockTierRewards($card, $program);

            return [
                'stamp' => $stamp,
                'card' => $card->fresh()->load(['loyaltyProgram', 'merchant']),
                'reward_unlocked' => $rewardsUnlocked[0] ?? null,
                'rewards_unlocked' => $rewardsUnlocked,
            ];
        });
    }

    public function awardBonusStamp(int $cardId, int $merchantId, ?string $notes, int $awardedBy): array
    {
        return DB::transaction(function () use ($cardId, $merchantId, $notes, $awardedBy) {
            $merchant = Merchant::findOrFail($merchantId);
            $accessibleIds = $merchant->getAccessibleMerchantIds();

            $card = LoyaltyCard::where('id', $cardId)
                ->whereIn('merchant_id', $accessibleIds)
                ->firstOrFail();

            $program = LoyaltyProgram::where('id', $card->loyalty_program_id)
                ->where('is_active', true)
                ->first();

            if (! $program) {
                throw new ApiException('Loyalty program is no longer active.', 404);
            }

            $stampExpiresAt = $program->stamp_expiry_days
                ? now()->addDays($program->stamp_expiry_days)
                : null;

            $stamp = LoyaltyStamp::create([
                'loyalty_card_id' => $card->id,
                'qr_code_id' => null,
                'source' => 'bonus',
                'notes' => $notes,
                'awarded_by' => $awardedBy,
                'earned_at' => now(),
                'expires_at' => $stampExpiresAt,
            ]);

            $card->increment('current_stamps');
            $card->increment('total_stamps_earned');
            $card->update(['last_stamp_at' => now()]);

            $card->refresh();
            $rewardsUnlocked = $this->checkAndUnlockTierRewards($card, $program);

            return [
                'stamp' => $stamp,
                'card' => $card->fresh()->load(['loyaltyProgram', 'customer.user']),
                'reward_unlocked' => $rewardsUnlocked[0] ?? null,
                'rewards_unlocked' => $rewardsUnlocked,
            ];
        });
    }

    public function getMerchantLoyaltyCards(int $merchantId, Request $request): LengthAwarePaginator
    {
        $merchant = Merchant::findOrFail($merchantId);
        $accessibleIds = $merchant->getAccessibleMerchantIds();

        return QueryBuilder::for(LoyaltyCard::whereIn('merchant_id', $accessibleIds))
            ->allowedFilters([
                AllowedFilter::callback('search', function ($query, $value) {
                    $query->whereHas('customer.user', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('branch_id', 'merchant_id'),
            ])
            ->allowedSorts(['current_stamps', 'total_stamps_earned', 'created_at', 'last_stamp_at'])
            ->defaultSort('-last_stamp_at')
            ->with(['customer.user', 'loyaltyProgram', 'merchant'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getMerchantLoyaltyCard(int $merchantId, int $cardId): LoyaltyCard
    {
        $merchant = Merchant::findOrFail($merchantId);
        $accessibleIds = $merchant->getAccessibleMerchantIds();

        return LoyaltyCard::where('id', $cardId)
            ->whereIn('merchant_id', $accessibleIds)
            ->with([
                'customer.user',
                'loyaltyProgram',
                'merchant',
                'stamps' => fn ($q) => $q->orderBy('earned_at', 'desc'),
                'stamps.awardedByUser',
                'rewards' => fn ($q) => $q->orderBy('earned_at', 'desc'),
            ])
            ->firstOrFail();
    }

    public function getMyLoyaltyCards(int $userId, Request $request): LengthAwarePaginator
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        return QueryBuilder::for(LoyaltyCard::where('customer_id', $customer->id))
            ->defaultSort('-last_stamp_at')
            ->with(['merchant', 'loyaltyProgram'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getMyLoyaltyCard(int $userId, int $cardId): LoyaltyCard
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        return LoyaltyCard::where('id', $cardId)
            ->where('customer_id', $customer->id)
            ->with([
                'merchant',
                'loyaltyProgram',
                'stamps' => fn ($q) => $q->orderBy('earned_at', 'desc'),
                'rewards' => fn ($q) => $q->orderBy('earned_at', 'desc'),
            ])
            ->firstOrFail();
    }

    public function getMyAvailableRewards(int $userId): Collection
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        return LoyaltyReward::where('status', 'available')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->whereHas('loyaltyCard', function ($q) use ($customer) {
                $q->where('customer_id', $customer->id);
            })
            ->with(['loyaltyCard.merchant', 'rewardProduct'])
            ->orderBy('earned_at', 'desc')
            ->get();
    }

    public function redeemReward(int $rewardId, int $userId): LoyaltyReward
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        $reward = LoyaltyReward::where('id', $rewardId)
            ->whereHas('loyaltyCard', function ($q) use ($customer) {
                $q->where('customer_id', $customer->id);
            })
            ->firstOrFail();

        if (! $reward->isAvailable()) {
            throw new ApiException('This reward is no longer available.', 409);
        }

        return $reward;
    }

    public function calculateRewardDiscount(LoyaltyReward $reward, float $subtotal): float
    {
        return match ($reward->reward_type) {
            'discount_percentage' => round($subtotal * ((float) $reward->reward_value / 100), 2),
            'discount_fixed' => round(min((float) $reward->reward_value, $subtotal), 2),
            default => 0.0,
        };
    }

    public function markRewardRedeemed(int $rewardId, string $redeemableType, int $redeemableId): void
    {
        $reward = LoyaltyReward::findOrFail($rewardId);

        $reward->update([
            'status' => 'redeemed',
            'redeemed_at' => now(),
            'redeemed_on_type' => $redeemableType,
            'redeemed_on_id' => $redeemableId,
        ]);

        $reward->loyaltyCard->increment('total_rewards_redeemed');
    }

    /**
     * Check all tier thresholds and unlock any earned rewards.
     * Resets stamps and increments cycle when required_stamps reached.
     *
     * @return LoyaltyReward[]
     */
    private function checkAndUnlockTierRewards(LoyaltyCard $card, LoyaltyProgram $program): array
    {
        $tiers = $program->tiers()->orderBy('required_stamps')->get();
        $rewardsUnlocked = [];

        foreach ($tiers as $tier) {
            if ($card->current_stamps >= $tier->required_stamps) {
                // Check if this tier was already earned in the current cycle
                $alreadyEarned = LoyaltyReward::where('loyalty_card_id', $card->id)
                    ->where('loyalty_program_tier_id', $tier->id)
                    ->where('cycle_number', $card->cycle_number)
                    ->exists();

                if (! $alreadyEarned) {
                    $rewardsUnlocked[] = $this->unlockTierReward($card, $program, $tier);
                }
            }
        }

        // Check if cycle is complete (reached program's required_stamps)
        if ($card->current_stamps >= $program->required_stamps) {
            $card->update([
                'current_stamps' => 0,
                'cycle_number' => $card->cycle_number + 1,
            ]);
        }

        return $rewardsUnlocked;
    }

    private function unlockTierReward(LoyaltyCard $card, LoyaltyProgram $program, LoyaltyProgramTier $tier): LoyaltyReward
    {
        $rewardExpiresAt = $program->reward_expiry_days
            ? now()->addDays($program->reward_expiry_days)
            : null;

        $reward = LoyaltyReward::create([
            'loyalty_card_id' => $card->id,
            'loyalty_program_id' => $program->id,
            'loyalty_program_tier_id' => $tier->id,
            'cycle_number' => $card->cycle_number,
            'reward_type' => $tier->reward_type,
            'reward_value' => $tier->reward_value,
            'reward_product_id' => $tier->reward_product_id,
            'reward_description' => $tier->reward_description,
            'status' => 'available',
            'earned_at' => now(),
            'expires_at' => $rewardExpiresAt,
        ]);

        $card->increment('total_rewards_earned');

        return $reward;
    }
}
