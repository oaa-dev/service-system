<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\AdvertisementData;
use App\Models\Advertisement;
use App\Repositories\Contracts\AdvertisementRepositoryInterface;
use App\Services\Contracts\AdvertisementServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AdvertisementService implements AdvertisementServiceInterface
{
    public function __construct(
        protected AdvertisementRepositoryInterface $advertisementRepository
    ) {}

    public function getAdvertisements(Request $request): LengthAwarePaginator
    {
        return QueryBuilder::for(Advertisement::class)
            ->allowedFilters([
                AllowedFilter::partial('title'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('placement'),
                AllowedFilter::exact('target_audience'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('merchant_id'),
            ])
            ->allowedSorts(['title', 'created_at', 'sort_order', 'starts_at'])
            ->defaultSort('-created_at')
            ->with(['merchant', 'creator'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function getAdvertisementById(int $id): Advertisement
    {
        return $this->advertisementRepository->findOrFail($id)->load(['merchant', 'creator']);
    }

    public function createAdvertisement(AdvertisementData $data, int $createdBy): Advertisement
    {
        $attributes = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        $attributes['created_by'] = $createdBy;

        return $this->advertisementRepository->create($attributes);
    }

    public function updateAdvertisement(int $id, AdvertisementData $data): Advertisement
    {
        $attributes = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->advertisementRepository->update($id, $attributes);
    }

    public function deleteAdvertisement(int $id): void
    {
        $this->advertisementRepository->delete($id);
    }

    public function uploadImage(int $id, UploadedFile $file): Advertisement
    {
        $advertisement = $this->advertisementRepository->findOrFail($id);
        $advertisement->clearMediaCollection('ad_image');
        $advertisement->addMedia($file)->toMediaCollection('ad_image');

        return $advertisement->fresh();
    }

    public function deleteImage(int $id): Advertisement
    {
        $advertisement = $this->advertisementRepository->findOrFail($id);
        $advertisement->clearMediaCollection('ad_image');

        return $advertisement->fresh();
    }

    public function getActiveAds(Request $request): Collection
    {
        $placement = $request->query('placement');
        $audience = $request->query('audience', 'customer');
        $merchantId = $request->query('merchant_id');

        $query = Advertisement::valid()
            ->forPlacement($placement);

        if ($audience) {
            $query->forAudience($audience);
        }

        if ($merchantId) {
            $query->where(function ($q) use ($merchantId) {
                $q->where('merchant_id', $merchantId)
                    ->orWhereNull('merchant_id');
            });
        }

        return $query->orderBy('sort_order', 'asc')
            ->with('media')
            ->get();
    }

    public function getMerchantAds(int $merchantId, Request $request): LengthAwarePaginator
    {
        return QueryBuilder::for(
            Advertisement::where(function ($q) use ($merchantId) {
                $q->where('merchant_id', $merchantId)
                    ->orWhereNull('merchant_id');
            })->valid()
        )
            ->allowedFilters([
                AllowedFilter::partial('title'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('placement'),
            ])
            ->defaultSort('sort_order')
            ->with('media')
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());
    }

    public function trackImpression(int $id): void
    {
        Advertisement::where('id', $id)->increment('impressions');
    }

    public function trackClick(int $id): void
    {
        Advertisement::where('id', $id)->increment('clicks');
    }
}
