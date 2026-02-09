<?php

namespace App\Services\Contracts;

use App\Data\SocialPlatformData;
use App\Models\SocialPlatform;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface SocialPlatformServiceInterface
{
    public function getAllSocialPlatforms(array $filters = []): LengthAwarePaginator;

    public function getAllSocialPlatformsWithoutPagination(): Collection;

    public function getActiveSocialPlatforms(): Collection;

    public function getSocialPlatformById(int $id): SocialPlatform;

    public function createSocialPlatform(SocialPlatformData $data): SocialPlatform;

    public function updateSocialPlatform(int $id, SocialPlatformData $data): SocialPlatform;

    public function deleteSocialPlatform(int $id): bool;
}
