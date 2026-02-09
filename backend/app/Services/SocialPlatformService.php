<?php

namespace App\Services;

use App\Data\SocialPlatformData;
use App\Models\SocialPlatform;
use App\Repositories\Contracts\SocialPlatformRepositoryInterface;
use App\Services\Contracts\SocialPlatformServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SocialPlatformService implements SocialPlatformServiceInterface
{
    public function __construct(
        protected SocialPlatformRepositoryInterface $socialPlatformRepository
    ) {}

    public function getAllSocialPlatforms(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(SocialPlatform::class)
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where('name', 'like', "%{$value}%")),
            ])
            ->allowedSorts(['id', 'name', 'sort_order', 'is_active', 'created_at'])
            ->defaultSort('sort_order')
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getAllSocialPlatformsWithoutPagination(): Collection
    {
        return SocialPlatform::orderBy('sort_order')->get();
    }

    public function getActiveSocialPlatforms(): Collection
    {
        return $this->socialPlatformRepository->getActive();
    }

    public function getSocialPlatformById(int $id): SocialPlatform
    {
        return $this->socialPlatformRepository->findOrFail($id);
    }

    public function createSocialPlatform(SocialPlatformData $data): SocialPlatform
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->socialPlatformRepository->create($createData);
    }

    public function updateSocialPlatform(int $id, SocialPlatformData $data): SocialPlatform
    {
        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->socialPlatformRepository->update($id, $updateData);
    }

    public function deleteSocialPlatform(int $id): bool
    {
        return $this->socialPlatformRepository->delete($id);
    }
}
