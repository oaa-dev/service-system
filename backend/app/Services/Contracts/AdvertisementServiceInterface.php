<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Data\AdvertisementData;
use App\Models\Advertisement;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface AdvertisementServiceInterface
{
    public function getAdvertisements(Request $request): LengthAwarePaginator;

    public function getAdvertisementById(int $id): Advertisement;

    public function createAdvertisement(AdvertisementData $data, int $createdBy): Advertisement;

    public function updateAdvertisement(int $id, AdvertisementData $data): Advertisement;

    public function deleteAdvertisement(int $id): void;

    public function uploadImage(int $id, UploadedFile $file): Advertisement;

    public function deleteImage(int $id): Advertisement;

    public function getActiveAds(Request $request): Collection;

    public function getMerchantAds(int $merchantId, Request $request): LengthAwarePaginator;

    public function trackImpression(int $id): void;

    public function trackClick(int $id): void;
}
