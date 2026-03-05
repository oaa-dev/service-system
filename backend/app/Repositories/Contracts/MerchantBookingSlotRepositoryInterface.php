<?php

namespace App\Repositories\Contracts;

use App\Models\MerchantBookingSlot;
use Illuminate\Database\Eloquent\Collection;

interface MerchantBookingSlotRepositoryInterface
{
    public function getAllForMerchant(int $merchantId): Collection;

    public function findForMerchant(int $merchantId, int $slotId): ?MerchantBookingSlot;

    public function findOrFailForMerchant(int $merchantId, int $slotId): MerchantBookingSlot;

    public function create(array $data): MerchantBookingSlot;

    public function updateSlot(MerchantBookingSlot $slot, array $data): MerchantBookingSlot;

    public function deleteSlot(MerchantBookingSlot $slot): bool;

    public function getActiveByDow(int $merchantId, int $dayOfWeek): Collection;

    public function hasActiveSlots(int $merchantId): bool;
}
