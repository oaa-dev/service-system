<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Booking;
use App\Models\BusinessType;
use App\Models\Customer;
use App\Models\Merchant;
use App\Models\MerchantBookingSlot;
use App\Models\PaymentMethod;
use App\Models\Reservation;
use App\Models\Service;
use App\Services\Contracts\StorefrontServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class StorefrontService implements StorefrontServiceInterface
{
    public function getActiveMerchants(Request $request)
    {
        $merchants = QueryBuilder::for(Merchant::where('status', 'active')->where('type', '!=', 'organization'))
            ->allowedFilters([
                AllowedFilter::partial('search', 'name'),
                AllowedFilter::exact('business_type_id'),
                AllowedFilter::exact('can_sell_products'),
                AllowedFilter::exact('can_take_bookings'),
                AllowedFilter::exact('can_rent_units'),
            ])
            ->allowedSorts(['name', 'created_at'])
            ->defaultSort('name')
            ->with(['businessType', 'media', 'address.geoCity', 'address.province', 'businessHours', 'paymentMethods', 'parent.media', 'parent.businessHours'])
            ->paginate($request->per_page ?? 15)
            ->appends(request()->query());

        $this->stampFavorites($merchants->getCollection());

        return $merchants;
    }

    public function getMerchantBySlug(string $slug)
    {
        $merchant = Merchant::where('slug', $slug)
            ->where('status', 'active')
            ->with([
                'businessType',
                'media',
                'address.region',
                'address.province',
                'address.geoCity',
                'address.barangay',
                'businessHours',
                'paymentMethods',
                'socialLinks.socialPlatform',
                'serviceCategories',
                'parent.media',
                'parent.address.region',
                'parent.address.province',
                'parent.address.geoCity',
                'parent.address.barangay',
                'parent.businessHours',
                'parent.socialLinks.socialPlatform',
                'parent.paymentMethods',
                'loyaltyProgram.tiers',
                'referralProgram',
                'parent.loyaltyProgram.tiers',
                'parent.referralProgram',
            ])
            ->firstOrFail();

        $this->stampFavorites(collect([$merchant]));

        return $merchant;
    }

    private function resolveServiceMerchantId(Merchant $merchant): int
    {
        if ($merchant->parent_id === null) {
            return $merchant->id;
        }

        if ($merchant->inherit_from_parent) {
            return $merchant->parent_id;
        }

        $hasOwnServices = Service::where('merchant_id', $merchant->id)
            ->where('is_active', true)
            ->exists();

        return $hasOwnServices ? $merchant->id : $merchant->parent_id;
    }

    public function getMerchantServices(string $slug, Request $request)
    {
        $merchant = Merchant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $serviceMerchantId = $this->resolveServiceMerchantId($merchant);

        return QueryBuilder::for(
            Service::where('merchant_id', $serviceMerchantId)->where('is_active', true)
        )
            ->allowedFilters([
                AllowedFilter::partial('search', 'name'),
                AllowedFilter::exact('service_category_id'),
                AllowedFilter::exact('is_bookable'),
                AllowedFilter::exact('is_sellable'),
            ])
            ->allowedSorts(['name', 'price', 'created_at'])
            ->defaultSort('name')
            ->with(['serviceCategory', 'media'])
            ->paginate($request->per_page ?? 15)
            ->appends(request()->query());
    }

    public function getActiveBusinessTypes()
    {
        return BusinessType::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);
    }

    public function getActivePaymentMethods()
    {
        return PaymentMethod::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);
    }

    public function getServiceDetail(string $slug, int $serviceId)
    {
        $merchant = Merchant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $serviceMerchantId = $this->resolveServiceMerchantId($merchant);

        return Service::where('merchant_id', $serviceMerchantId)
            ->where('is_active', true)
            ->with(['serviceCategory', 'media', 'schedules'])
            ->findOrFail($serviceId);
    }

    public function getAllActiveMerchants()
    {
        $merchants = Merchant::where('status', 'active')->where('type', '!=', 'organization')
            ->with(['businessType', 'media', 'address.geoCity', 'address.province', 'businessHours', 'parent.media', 'parent.businessHours'])
            ->orderBy('name')
            ->get();

        $this->stampFavorites($merchants);

        return $merchants;
    }

    public function getNearbyMerchants(float $lat, float $lng, float $radiusKm)
    {
        $haversine = '(6371 * acos(least(1.0, cos(radians(?)) * cos(radians(addresses.latitude)) * cos(radians(addresses.longitude) - radians(?)) + sin(radians(?)) * sin(radians(addresses.latitude)))))';

        $merchants = Merchant::query()
            ->where('merchants.status', 'active')
            ->where('merchants.type', '!=', 'organization')
            ->join('addresses', function ($join) {
                $join->on('addresses.addressable_id', '=', 'merchants.id')
                    ->where('addresses.addressable_type', '=', Merchant::class);
            })
            ->whereNotNull('addresses.latitude')
            ->whereNotNull('addresses.longitude')
            ->select('merchants.*')
            ->selectRaw("{$haversine} as distance", [$lat, $lng, $lat])
            ->having('distance', '<=', $radiusKm)
            ->orderBy('distance')
            ->with(['businessType', 'media', 'address.geoCity', 'address.province', 'businessHours', 'parent.media', 'parent.businessHours'])
            ->get();

        $this->stampFavorites($merchants);

        return $merchants;
    }

    public function getBookingAvailability(string $slug, int $serviceId, string $month): array
    {
        $merchant = Merchant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $serviceMerchantId = $this->resolveServiceMerchantId($merchant);

        $service = Service::where('merchant_id', $serviceMerchantId)
            ->where('is_active', true)
            ->where('service_type', 'bookable')
            ->with('schedules')
            ->findOrFail($serviceId);

        $monthStart = Carbon::parse($month.'-01')->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $bookedSlots = Booking::where('service_id', $serviceId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereBetween('booking_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->selectRaw('booking_date, start_time, SUM(party_size) as booked')
            ->groupBy('booking_date', 'start_time')
            ->get();

        $grouped = [];
        foreach ($bookedSlots as $slot) {
            $date = $slot->booking_date instanceof Carbon
                ? $slot->booking_date->toDateString()
                : (string) $slot->booking_date;
            $time = substr((string) $slot->start_time, 0, 5);
            $grouped[$date][] = [
                'time' => $time,
                'booked' => (int) $slot->booked,
            ];
        }

        return [
            'service' => [
                'id' => $service->id,
                'name' => $service->name,
                'duration' => $service->duration,
                'max_capacity' => $service->max_capacity,
                'price' => $service->price,
            ],
            'schedule' => $service->schedules->map(fn ($s) => [
                'day_of_week' => $s->day_of_week,
                'start_time' => substr($s->start_time, 0, 5),
                'end_time' => substr($s->end_time, 0, 5),
                'is_available' => $s->is_available,
            ])->values()->toArray(),
            'booked_slots' => $grouped,
        ];
    }

    public function getReservationAvailability(string $slug, int $serviceId, string $month): array
    {
        $merchant = Merchant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $serviceMerchantId = $this->resolveServiceMerchantId($merchant);

        $service = Service::where('merchant_id', $serviceMerchantId)
            ->where('is_active', true)
            ->where('service_type', 'reservation')
            ->findOrFail($serviceId);

        $monthStart = Carbon::parse($month.'-01')->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $reservations = Reservation::where('service_id', $serviceId)
            ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
            ->where('check_out', '>=', $monthStart->toDateString())
            ->where('check_in', '<=', $monthEnd->toDateString())
            ->select('check_in', 'check_out')
            ->get();

        return [
            'service' => [
                'id' => $service->id,
                'name' => $service->name,
                'price' => $service->price,
                'price_per_night' => $service->price_per_night,
                'max_capacity' => $service->max_capacity,
            ],
            'reserved_dates' => $reservations->map(fn ($r) => [
                'check_in' => $r->check_in instanceof Carbon
                    ? $r->check_in->toDateString()
                    : (string) $r->check_in,
                'check_out' => $r->check_out instanceof Carbon
                    ? $r->check_out->toDateString()
                    : (string) $r->check_out,
            ])->values()->toArray(),
        ];
    }

    public function getMerchantBranches(string $slug): \Illuminate\Pagination\LengthAwarePaginator
    {
        $parent = Merchant::where('slug', $slug)
            ->where('status', 'active')
            ->where('type', 'organization')
            ->firstOrFail();

        return Merchant::where('parent_id', $parent->id)
            ->where('status', 'active')
            ->with(['media', 'address.geoCity', 'address.province', 'businessHours'])
            ->paginate(request()->per_page ?? 15);
    }

    public function getBookingSlotAvailability(string $slug, int $serviceId, string $date): array
    {
        $merchant = Merchant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $serviceMerchantId = $this->resolveServiceMerchantId($merchant);

        $service = Service::where('merchant_id', $serviceMerchantId)
            ->where('is_active', true)
            ->findOrFail($serviceId);

        $parsedDate = Carbon::parse($date);
        $dayOfWeek = $parsedDate->dayOfWeek;

        $slots = MerchantBookingSlot::where('merchant_id', $serviceMerchantId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('start_time')
            ->get();

        // Fallback: if branch has no slots, try parent organization's slots
        if ($slots->isEmpty() && $merchant->parent_id !== null && $serviceMerchantId !== $merchant->parent_id) {
            $slots = MerchantBookingSlot::where('merchant_id', $merchant->parent_id)
                ->where('day_of_week', $dayOfWeek)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('start_time')
                ->get();

            if ($slots->isNotEmpty()) {
                $serviceMerchantId = $merchant->parent_id;
            }
        }

        if ($slots->isEmpty()) {
            return [
                'date' => $date,
                'has_slots' => false,
                'slots' => [],
            ];
        }

        // Count bookings across all merchants sharing these slots (org + branches)
        $serviceMerchant = Merchant::findOrFail($serviceMerchantId);
        $allMerchantIds = $serviceMerchant->getAccessibleMerchantIds();

        $slotBookingCounts = Booking::whereIn('merchant_id', $allMerchantIds)
            ->where('booking_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereNotNull('booking_slot_id')
            ->select('booking_slot_id', DB::raw('COALESCE(SUM(party_size), 0) as booked'))
            ->groupBy('booking_slot_id')
            ->pluck('booked', 'booking_slot_id');

        $slotList = $slots->map(function ($slot) use ($slotBookingCounts) {
            $booked = (int) $slotBookingCounts->get($slot->id, 0);
            $isFull = $slot->max_capacity !== null && $booked >= $slot->max_capacity;
            $available = $slot->max_capacity !== null ? max(0, $slot->max_capacity - $booked) : null;

            return [
                'slot_id' => $slot->id,
                'start_time' => substr($slot->start_time, 0, 5),
                'end_time' => $slot->end_time ? substr($slot->end_time, 0, 5) : null,
                'booked' => $booked,
                'available' => $available,
                'max_capacity' => $slot->max_capacity,
                'is_full' => $isFull,
            ];
        })->values()->toArray();

        return [
            'date' => $date,
            'has_slots' => true,
            'slots' => $slotList,
        ];
    }

    private function stampFavorites(Collection $merchants): void
    {
        if ($merchants->isEmpty() || ! auth('api')->check()) {
            return;
        }

        $customer = Customer::where('user_id', auth('api')->id())->first();

        if (! $customer) {
            return;
        }

        $favoritedIds = $customer->favoriteMerchants()
            ->whereIn('merchant_id', $merchants->pluck('id'))
            ->pluck('merchant_id');

        $merchants->each(fn ($m) => $m->is_favorited = $favoritedIds->contains($m->id));
    }
}
