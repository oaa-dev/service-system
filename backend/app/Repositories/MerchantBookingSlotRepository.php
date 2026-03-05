<?php

namespace App\Repositories;

use App\Models\MerchantBookingSlot;
use App\Repositories\Contracts\MerchantBookingSlotRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class MerchantBookingSlotRepository extends BaseRepository implements MerchantBookingSlotRepositoryInterface
{
    public function __construct(MerchantBookingSlot $model)
    {
        parent::__construct($model);
    }

    public function getAllForMerchant(int $merchantId): Collection
    {
        return $this->model->newQuery()
            ->where('merchant_id', $merchantId)
            ->orderBy('day_of_week')
            ->orderBy('sort_order')
            ->orderBy('start_time')
            ->get();
    }

    public function findForMerchant(int $merchantId, int $slotId): ?MerchantBookingSlot
    {
        return $this->model->newQuery()
            ->where('merchant_id', $merchantId)
            ->where('id', $slotId)
            ->first();
    }

    public function findOrFailForMerchant(int $merchantId, int $slotId): MerchantBookingSlot
    {
        return $this->model->newQuery()
            ->where('merchant_id', $merchantId)
            ->where('id', $slotId)
            ->firstOrFail();
    }

    public function create(array $data): MerchantBookingSlot
    {
        return $this->model->newQuery()->create($data);
    }

    public function updateSlot(MerchantBookingSlot $slot, array $data): MerchantBookingSlot
    {
        $slot->update($data);

        return $slot->fresh();
    }

    public function deleteSlot(MerchantBookingSlot $slot): bool
    {
        return $slot->delete();
    }

    public function getActiveByDow(int $merchantId, int $dayOfWeek): Collection
    {
        return $this->model->newQuery()
            ->where('merchant_id', $merchantId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('start_time')
            ->get();
    }

    public function hasActiveSlots(int $merchantId): bool
    {
        return $this->model->newQuery()
            ->where('merchant_id', $merchantId)
            ->where('is_active', true)
            ->exists();
    }
}
