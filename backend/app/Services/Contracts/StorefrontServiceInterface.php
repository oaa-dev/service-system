<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use Illuminate\Http\Request;

interface StorefrontServiceInterface
{
    public function getActiveMerchants(Request $request);

    public function getMerchantBySlug(string $slug);

    public function getMerchantServices(string $slug, Request $request);

    public function getActiveBusinessTypes();

    public function getActivePaymentMethods();

    public function getServiceDetail(string $slug, int $serviceId);

    public function getAllActiveMerchants();

    public function getNearbyMerchants(float $lat, float $lng, float $radiusKm);

    public function getBookingAvailability(string $slug, int $serviceId, string $month): array;

    public function getReservationAvailability(string $slug, int $serviceId, string $month): array;
}
