<?php

namespace App\Services\Contracts;

use App\Data\MerchantBookingSlotData;
use App\Models\MerchantBookingSlot;
use Illuminate\Database\Eloquent\Collection;

interface MerchantBookingSlotServiceInterface
{
    public function getMerchantSlots(int $merchantId): Collection;

    public function getMerchantSlotById(int $merchantId, int $slotId): MerchantBookingSlot;

    public function createSlot(int $merchantId, MerchantBookingSlotData $data): MerchantBookingSlot;

    public function updateSlot(int $merchantId, int $slotId, MerchantBookingSlotData $data): MerchantBookingSlot;

    public function deleteSlot(int $merchantId, int $slotId): void;

    public function getMerchantActiveSlotsByDow(int $merchantId, int $dayOfWeek): Collection;

    public function merchantHasActiveSlots(int $merchantId): bool;
}
