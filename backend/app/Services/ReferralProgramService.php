<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\ReferralProgramData;
use App\Exceptions\ApiException;
use App\Models\Merchant;
use App\Models\Referral;
use App\Models\ReferralProgram;
use App\Repositories\Contracts\ReferralProgramRepositoryInterface;
use App\Services\Contracts\ReferralProgramServiceInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ReferralProgramService implements ReferralProgramServiceInterface
{
    public function __construct(
        protected ReferralProgramRepositoryInterface $referralProgramRepository
    ) {}

    public function getMyReferralProgram(int $merchantId): ?ReferralProgram
    {
        $merchant = Merchant::findOrFail($merchantId);

        // Branch merchants inherit the organization's program
        $programMerchantId = $merchant->parent_id ?? $merchantId;

        $program = ReferralProgram::where('merchant_id', $programMerchantId)
            ->where('is_active', true)
            ->first();

        if ($program && $merchant->parent_id) {
            $program->setAttribute('is_inherited', true);
        }

        return $program;
    }

    public function createOrUpdateReferralProgram(int $merchantId, ReferralProgramData $data): ReferralProgram
    {
        $merchant = Merchant::findOrFail($merchantId);

        if ($merchant->parent_id) {
            throw new ApiException('Branch merchants cannot manage referral programs. The program is managed by your organization.', 403);
        }

        return DB::transaction(function () use ($merchantId, $data) {
            $existing = ReferralProgram::where('merchant_id', $merchantId)
                ->where('is_active', true)
                ->first();

            $programData = collect($data->toArray())
                ->reject(fn ($v) => $v instanceof Optional)
                ->toArray();

            if ($existing) {
                $existing->update($programData);

                return $existing->fresh();
            }

            $programData['merchant_id'] = $merchantId;
            $programData['is_active'] = true;

            return ReferralProgram::create($programData);
        });
    }

    public function deactivateReferralProgram(int $merchantId): void
    {
        $merchant = Merchant::findOrFail($merchantId);

        if ($merchant->parent_id) {
            throw new ApiException('Branch merchants cannot manage referral programs. The program is managed by your organization.', 403);
        }

        $program = ReferralProgram::where('merchant_id', $merchantId)
            ->where('is_active', true)
            ->firstOrFail();

        $program->update(['is_active' => false]);

        // Deactivate all active referral codes for this program
        $program->referralCodes()
            ->where('is_active', true)
            ->update(['is_active' => false]);
    }

    public function getAdminReferralProgram(int $merchantId): ?ReferralProgram
    {
        return ReferralProgram::where('merchant_id', $merchantId)
            ->where('is_active', true)
            ->with('merchant')
            ->withCount('referrals')
            ->first();
    }

    public function updateAdminReferralProgram(int $merchantId, ReferralProgramData $data): ReferralProgram
    {
        return DB::transaction(function () use ($merchantId, $data) {
            $program = ReferralProgram::where('merchant_id', $merchantId)
                ->where('is_active', true)
                ->firstOrFail();

            $updateData = collect($data->toArray())
                ->reject(fn ($v) => $v instanceof Optional)
                ->toArray();

            $program->update($updateData);

            return $program->fresh()->load('merchant');
        });
    }

    public function getMerchantReferrals(int $merchantId, array $filters = []): LengthAwarePaginator
    {
        $merchant = Merchant::findOrFail($merchantId);
        $merchantIds = $merchant->getAccessibleMerchantIds();

        $programIds = ReferralProgram::whereIn('merchant_id', $merchantIds)->pluck('id');

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Referral::whereIn('referral_program_id', $programIds))
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::callback('date_from', fn ($query, $value) => $query->where('created_at', '>=', $value)),
                AllowedFilter::callback('date_to', fn ($query, $value) => $query->where('created_at', '<=', $value)),
            ])
            ->allowedSorts(['created_at', 'status', 'completed_at'])
            ->defaultSort('-created_at')
            ->with(['referrerCustomer.user', 'refereeCustomer.user', 'rewards'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getReferralStats(int $merchantId): array
    {
        $merchant = Merchant::findOrFail($merchantId);
        $merchantIds = $merchant->getAccessibleMerchantIds();

        $programIds = ReferralProgram::whereIn('merchant_id', $merchantIds)->pluck('id');

        $total = Referral::whereIn('referral_program_id', $programIds)->count();
        $completed = Referral::whereIn('referral_program_id', $programIds)->where('status', 'completed')->count();
        $pending = Referral::whereIn('referral_program_id', $programIds)->where('status', 'pending')->count();

        $topReferrers = Referral::whereIn('referral_program_id', $programIds)
            ->where('status', 'completed')
            ->selectRaw('referrer_customer_id, count(*) as referral_count')
            ->groupBy('referrer_customer_id')
            ->orderByDesc('referral_count')
            ->limit(10)
            ->with('referrerCustomer.user')
            ->get()
            ->map(fn ($r) => [
                'customer' => $r->referrerCustomer ? [
                    'id' => $r->referrerCustomer->id,
                    'name' => $r->referrerCustomer->user?->name,
                ] : null,
                'count' => $r->referral_count,
            ]);

        return [
            'total_referrals' => $total,
            'completed_referrals' => $completed,
            'pending_referrals' => $pending,
            'conversion_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
            'top_referrers' => $topReferrers,
        ];
    }
}
