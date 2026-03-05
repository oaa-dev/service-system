<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Data\MerchantBookingSlotData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\BookingSlot\StoreMerchantBookingSlotRequest;
use App\Http\Requests\Api\V1\BookingSlot\UpdateMerchantBookingSlotRequest;
use App\Http\Resources\Api\V1\MerchantBookingSlotResource;
use App\Models\Merchant;
use App\Services\Contracts\MerchantBookingSlotServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MerchantBookingSlotController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MerchantBookingSlotServiceInterface $slotService,
    ) {}

    public function index(Request $request, ?Merchant $merchant = null): JsonResponse
    {
        $merchantId = $this->resolveMerchantId($request, $merchant);

        $slots = $this->slotService->getMerchantSlots($merchantId);

        return $this->successResponse(
            MerchantBookingSlotResource::collection($slots),
            'Booking slots retrieved successfully'
        );
    }

    public function store(StoreMerchantBookingSlotRequest $request, ?Merchant $merchant = null): JsonResponse
    {
        $merchantId = $this->resolveMerchantId($request, $merchant);

        $data = MerchantBookingSlotData::from($request->validated());
        $slot = $this->slotService->createSlot($merchantId, $data);

        return $this->createdResponse(
            new MerchantBookingSlotResource($slot),
            'Booking slot created successfully'
        );
    }

    public function show(Request $request, ?Merchant $merchant = null, int $slot = 0): JsonResponse
    {
        $merchantId = $this->resolveMerchantId($request, $merchant);

        $slotModel = $this->slotService->getMerchantSlotById($merchantId, $slot);

        return $this->successResponse(
            new MerchantBookingSlotResource($slotModel),
            'Booking slot retrieved successfully'
        );
    }

    public function update(UpdateMerchantBookingSlotRequest $request, ?Merchant $merchant = null, int $slot = 0): JsonResponse
    {
        $merchantId = $this->resolveMerchantId($request, $merchant);

        $data = MerchantBookingSlotData::from($request->validated());
        $slotModel = $this->slotService->updateSlot($merchantId, $slot, $data);

        return $this->successResponse(
            new MerchantBookingSlotResource($slotModel),
            'Booking slot updated successfully'
        );
    }

    public function destroy(Request $request, ?Merchant $merchant = null, int $slot = 0): JsonResponse
    {
        try {
            $merchantId = $this->resolveMerchantId($request, $merchant);
            $this->slotService->deleteSlot($merchantId, $slot);

            return $this->noContentResponse();
        } catch (ModelNotFoundException) {
            return $this->errorResponse('Booking slot not found', 422);
        }
    }

    private function resolveMerchantId(Request $request, ?Merchant $merchant): int
    {
        if ($merchant !== null) {
            return $merchant->id;
        }

        return $request->user()->merchant->id;
    }
}
