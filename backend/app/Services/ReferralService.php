<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Referral;
use App\Models\ReferralCode;
use App\Models\ReferralProgram;
use App\Models\ReferralReward;
use App\Services\Contracts\ReferralServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ReferralService implements ReferralServiceInterface
{
    public function generateReferralCode(int $userId, int $merchantId): ReferralCode
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();
        $merchant = Merchant::findOrFail($merchantId);

        // Find active program (branch inherits from org)
        $programMerchantId = $merchant->parent_id ?? $merchantId;
        $program = ReferralProgram::where('merchant_id', $programMerchantId)
            ->where('is_active', true)
            ->firstOrFail();

        // Return existing code or create new one
        $existing = ReferralCode::where('referral_program_id', $program->id)
            ->where('customer_id', $customer->id)
            ->first();

        if ($existing) {
            return $existing->load('referralProgram.merchant');
        }

        $code = $this->generateUniqueCode();
        $expiresAt = $program->code_expiry_days
            ? now()->addDays($program->code_expiry_days)
            : null;

        return ReferralCode::create([
            'referral_program_id' => $program->id,
            'customer_id' => $customer->id,
            'code' => $code,
            'expires_at' => $expiresAt,
        ])->load('referralProgram.merchant');
    }

    public function validateReferralCode(string $code): array
    {
        $referralCode = ReferralCode::where('code', $code)
            ->with(['referralProgram.merchant', 'customer.user'])
            ->first();

        if (! $referralCode) {
            throw new ApiException('Referral code not found.', 404);
        }

        if (! $referralCode->isValid()) {
            throw new ApiException('Referral code is no longer valid.', 422);
        }

        if (! $referralCode->referralProgram || ! $referralCode->referralProgram->is_active) {
            throw new ApiException('Referral program is no longer active.', 422);
        }

        return [
            'code' => $referralCode->code,
            'referrer' => $referralCode->customer?->user?->name,
            'program' => [
                'name' => $referralCode->referralProgram->name,
                'description' => $referralCode->referralProgram->description,
                'referee_reward_type' => $referralCode->referralProgram->referee_reward_type,
                'referee_reward_value' => $referralCode->referralProgram->referee_reward_value,
            ],
            'merchant' => [
                'id' => $referralCode->referralProgram->merchant->id,
                'name' => $referralCode->referralProgram->merchant->name,
                'slug' => $referralCode->referralProgram->merchant->slug,
            ],
        ];
    }

    public function acceptReferral(int $userId, string $code): Referral
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        $referralCode = ReferralCode::where('code', $code)
            ->with('referralProgram')
            ->first();

        if (! $referralCode) {
            throw new ApiException('Referral code not found.', 404);
        }

        if (! $referralCode->isValid()) {
            throw new ApiException('Referral code is no longer valid.', 422);
        }

        if (! $referralCode->referralProgram || ! $referralCode->referralProgram->is_active) {
            throw new ApiException('Referral program is no longer active.', 422);
        }

        // Cannot accept own referral code
        if ($referralCode->customer_id === $customer->id) {
            throw new ApiException('You cannot use your own referral code.', 422);
        }

        // Check if already referred by this program
        $existingReferral = Referral::where('referral_program_id', $referralCode->referral_program_id)
            ->where('referee_customer_id', $customer->id)
            ->first();

        if ($existingReferral) {
            throw new ApiException('You have already been referred for this program.', 409);
        }

        // Check max referrals per customer
        $program = $referralCode->referralProgram;
        if ($program->max_referrals_per_customer !== null) {
            $referrerCount = Referral::where('referral_program_id', $program->id)
                ->where('referrer_customer_id', $referralCode->customer_id)
                ->count();

            if ($referrerCount >= $program->max_referrals_per_customer) {
                throw new ApiException('The referrer has reached the maximum number of referrals for this program.', 422);
            }
        }

        return DB::transaction(function () use ($referralCode, $customer) {
            $referral = Referral::create([
                'referral_code_id' => $referralCode->id,
                'referral_program_id' => $referralCode->referral_program_id,
                'referrer_customer_id' => $referralCode->customer_id,
                'referee_customer_id' => $customer->id,
            ]);

            $referralCode->increment('uses_count');

            return $referral->load(['referrerCustomer.user', 'refereeCustomer.user']);
        });
    }

    public function checkAndCompleteReferral(int $userId, int $merchantId, string $transactionType, int $transactionId): void
    {
        // Resolve Customer from User.id (Booking.customer_id = User.id, not Customer.id)
        $customer = Customer::where('user_id', $userId)->first();

        if (! $customer) {
            return;
        }

        $merchant = Merchant::find($merchantId);

        if (! $merchant) {
            return;
        }

        // Find active program for this merchant (or org)
        $programMerchantId = $merchant->parent_id ?? $merchantId;
        $programIds = ReferralProgram::where('merchant_id', $programMerchantId)
            ->pluck('id');

        if ($programIds->isEmpty()) {
            return;
        }

        // Find pending referral for this referee + merchant's program
        $referral = Referral::whereIn('referral_program_id', $programIds)
            ->where('referee_customer_id', $customer->id)
            ->where('status', 'pending')
            ->first();

        if (! $referral) {
            return;
        }

        $program = $referral->referralProgram;

        if (! $program) {
            return;
        }

        DB::transaction(function () use ($referral, $program, $transactionType, $transactionId) {
            // Mark referral as completed
            $referral->update([
                'status' => 'completed',
                'completed_at' => now(),
                'qualifying_type' => $transactionType,
                'qualifying_id' => $transactionId,
            ]);

            $rewardExpiresAt = $program->reward_expiry_days
                ? now()->addDays($program->reward_expiry_days)
                : null;

            // Create reward for referrer
            ReferralReward::create([
                'referral_id' => $referral->id,
                'customer_id' => $referral->referrer_customer_id,
                'reward_type' => $program->referrer_reward_type,
                'reward_value' => $program->referrer_reward_value,
                'role' => 'referrer',
                'status' => 'available',
                'expires_at' => $rewardExpiresAt,
            ]);

            // Create reward for referee
            ReferralReward::create([
                'referral_id' => $referral->id,
                'customer_id' => $referral->referee_customer_id,
                'reward_type' => $program->referee_reward_type,
                'reward_value' => $program->referee_reward_value,
                'role' => 'referee',
                'status' => 'available',
                'expires_at' => $rewardExpiresAt,
            ]);
        });
    }

    public function getMyReferralCodes(int $userId): Collection
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        return ReferralCode::where('customer_id', $customer->id)
            ->where('is_active', true)
            ->with(['referralProgram.merchant'])
            ->get();
    }

    public function getMyReferrals(int $userId): Collection
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        return Referral::where('referrer_customer_id', $customer->id)
            ->with(['refereeCustomer.user', 'referralProgram.merchant'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function getMyReferralRewards(int $userId, array $filters = []): LengthAwarePaginator
    {
        $customer = Customer::where('user_id', $userId)->firstOrFail();

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(ReferralReward::where('customer_id', $customer->id))
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('role'),
            ])
            ->allowedSorts(['created_at', 'status', 'expires_at'])
            ->defaultSort('-created_at')
            ->with(['referral.referralProgram.merchant'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (ReferralCode::where('code', $code)->exists());

        return $code;
    }
}
