<?php

namespace App\Services;

use App\Data\CustomerData;
use App\Data\ProfileData;
use App\Models\Customer;
use App\Models\UserProfile;
use App\Repositories\Contracts\ProfileRepositoryInterface;
use App\Services\Contracts\ProfileServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Optional;

class ProfileService implements ProfileServiceInterface
{
    public function __construct(
        protected ProfileRepositoryInterface $profileRepository
    ) {}

    public function getProfileByUserId(int $userId): UserProfile
    {
        $profile = $this->profileRepository->findByUserId($userId);

        if (!$profile) {
            throw new ModelNotFoundException('Profile not found');
        }

        return $profile;
    }

    public function updateProfile(int $userId, ProfileData $data): UserProfile
    {
        $profile = $this->getProfileByUserId($userId);

        $addressData = $data->address;

        $profileData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('address')
            ->toArray();

        $profile->update($profileData);

        if (! $addressData instanceof Optional && $addressData !== null) {
            $profile->updateOrCreateAddress($addressData->toArray());
        }

        return $profile->fresh(['address.region', 'address.province', 'address.geoCity', 'address.barangay', 'media']);
    }

    public function uploadAvatar(int $userId, UploadedFile $file): UserProfile
    {
        $profile = $this->getProfileByUserId($userId);
        $profile->addMedia($file)->toMediaCollection('avatar');

        return $profile->fresh(['address.region', 'address.province', 'address.geoCity', 'address.barangay', 'media']);
    }

    public function deleteAvatar(int $userId): UserProfile
    {
        $profile = $this->getProfileByUserId($userId);
        $profile->clearMediaCollection('avatar');

        return $profile;
    }

    public function getCustomerByUserId(int $userId): Customer
    {
        $customer = Customer::where('user_id', $userId)->with('tags')->first();

        if (! $customer) {
            throw new ModelNotFoundException('Customer profile not found');
        }

        return $customer;
    }

    public function updateCustomerPreferences(int $userId, CustomerData $data): Customer
    {
        $customer = $this->getCustomerByUserId($userId);

        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->only(['preferred_payment_method', 'communication_preference'])
            ->toArray();

        $customer->update($updateData);

        return $customer->fresh(['tags']);
    }
}
