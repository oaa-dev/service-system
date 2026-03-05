<?php

namespace App\Services;

use App\Data\MerchantBookingSlotData;
use App\Models\MerchantBookingSlot;
use App\Repositories\Contracts\MerchantBookingSlotRepositoryInterface;
use App\Services\Contracts\MerchantBookingSlotServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;

class MerchantBookingSlotService implements MerchantBookingSlotServiceInterface
{
    public function __construct(
        private readonly MerchantBookingSlotRepositoryInterface $repository,
    ) {}

    public function getMerchantSlots(int $merchantId): Collection
    {
        return $this->repository->getAllForMerchant($merchantId);
    }

    public function getMerchantSlotById(int $merchantId, int $slotId): MerchantBookingSlot
    {
        return $this->repository->findOrFailForMerchant($merchantId, $slotId);
    }

    public function createSlot(int $merchantId, MerchantBookingSlotData $data): MerchantBookingSlot
    {
        $attributes = collect($data->toArray())
            ->reject(fn ($v) => $v instanceof Optional)
            ->toArray();

        $attributes['merchant_id'] = $merchantId;

        $this->assertUniqueSlot($merchantId, $attributes['day_of_week'], $attributes['start_time']);

        return $this->repository->create($attributes);
    }

    public function updateSlot(int $merchantId, int $slotId, MerchantBookingSlotData $data): MerchantBookingSlot
    {
        $slot = $this->repository->findOrFailForMerchant($merchantId, $slotId);

        $attributes = collect($data->toArray())
            ->reject(fn ($v) => $v instanceof Optional)
            ->toArray();

        if (isset($attributes['day_of_week']) || isset($attributes['start_time'])) {
            $dayOfWeek = $attributes['day_of_week'] ?? $slot->day_of_week;
            $startTime = $attributes['start_time'] ?? $slot->start_time;
            $this->assertUniqueSlot($merchantId, $dayOfWeek, $startTime, $slotId);
        }

        return $this->repository->updateSlot($slot, $attributes);
    }

    public function deleteSlot(int $merchantId, int $slotId): void
    {
        $slot = $this->repository->findOrFailForMerchant($merchantId, $slotId);
        $this->repository->deleteSlot($slot);
    }

    public function getMerchantActiveSlotsByDow(int $merchantId, int $dayOfWeek): Collection
    {
        return $this->repository->getActiveByDow($merchantId, $dayOfWeek);
    }

    public function merchantHasActiveSlots(int $merchantId): bool
    {
        return $this->repository->hasActiveSlots($merchantId);
    }

    private function assertUniqueSlot(int $merchantId, int $dayOfWeek, string $startTime, ?int $excludeId = null): void
    {
        $query = MerchantBookingSlot::where('merchant_id', $merchantId)
            ->where('day_of_week', $dayOfWeek)
            ->where('start_time', $startTime);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'start_time' => ['A slot with this day and start time already exists for this merchant.'],
            ]);
        }
    }
}
