<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Booking;
use App\Models\BusinessType;
use App\Models\Merchant;
use App\Models\PaymentMethod;
use App\Models\Reservation;
use App\Models\Service;
use App\Services\Contracts\StorefrontServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class StorefrontService implements StorefrontServiceInterface
{
    public function getActiveMerchants(Request $request)
    {
        return QueryBuilder::for(Merchant::where('status', 'active'))
            ->allowedFilters([
                AllowedFilter::partial('search', 'name'),
                AllowedFilter::exact('business_type_id'),
                AllowedFilter::exact('can_sell_products'),
                AllowedFilter::exact('can_take_bookings'),
                AllowedFilter::exact('can_rent_units'),
            ])
            ->allowedSorts(['name', 'created_at'])
            ->defaultSort('name')
            ->with(['businessType', 'media', 'address.geoCity', 'address.province', 'businessHours', 'paymentMethods'])
            ->paginate($request->per_page ?? 15)
            ->appends(request()->query());
    }

    public function getMerchantBySlug(string $slug)
    {
        return Merchant::where('slug', $slug)
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
            ])
            ->firstOrFail();
    }

    public function getMerchantServices(string $slug, Request $request)
    {
        $merchant = Merchant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        return QueryBuilder::for(
            Service::where('merchant_id', $merchant->id)->where('is_active', true)
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

        return Service::where('merchant_id', $merchant->id)
            ->where('is_active', true)
            ->with(['serviceCategory', 'media', 'schedules'])
            ->findOrFail($serviceId);
    }

    public function getAllActiveMerchants()
    {
        return Merchant::where('status', 'active')
            ->with(['businessType', 'media', 'address.geoCity', 'address.province', 'businessHours'])
            ->orderBy('name')
            ->get();
    }

    public function getNearbyMerchants(float $lat, float $lng, float $radiusKm)
    {
        $haversine = '(6371 * acos(least(1.0, cos(radians(?)) * cos(radians(addresses.latitude)) * cos(radians(addresses.longitude) - radians(?)) + sin(radians(?)) * sin(radians(addresses.latitude)))))';

        return Merchant::query()
            ->where('merchants.status', 'active')
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
            ->with(['businessType', 'media', 'address.geoCity', 'address.province', 'businessHours'])
            ->get();
    }

    public function getBookingAvailability(string $slug, int $serviceId, string $month): array
    {
        $merchant = Merchant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $service = Service::where('merchant_id', $merchant->id)
            ->where('is_active', true)
            ->where('service_type', 'bookable')
            ->with('schedules')
            ->findOrFail($serviceId);

        $monthStart = Carbon::parse($month . '-01')->startOfMonth();
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

        $service = Service::where('merchant_id', $merchant->id)
            ->where('is_active', true)
            ->where('service_type', 'reservation')
            ->findOrFail($serviceId);

        $monthStart = Carbon::parse($month . '-01')->startOfMonth();
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
}
