<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\BarangayResource;
use App\Http\Resources\Api\V1\CityResource;
use App\Http\Resources\Api\V1\ProvinceResource;
use App\Http\Resources\Api\V1\RegionResource;
use App\Models\Barangay;
use App\Models\City;
use App\Models\Province;
use App\Models\Region;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class GeographicController extends Controller
{
    use ApiResponse;

    public function regions(): JsonResponse
    {
        $regions = Region::orderBy('name')->get();

        return $this->successResponse(RegionResource::collection($regions));
    }

    public function provinces(int $region): JsonResponse
    {
        $provinces = Province::where('region_id', $region)->orderBy('name')->get();

        return $this->successResponse(ProvinceResource::collection($provinces));
    }

    public function cities(int $province): JsonResponse
    {
        $cities = City::where('province_id', $province)->orderBy('name')->get();

        return $this->successResponse(CityResource::collection($cities));
    }

    public function barangays(int $city): JsonResponse
    {
        $barangays = Barangay::where('city_id', $city)->orderBy('name')->get();

        return $this->successResponse(BarangayResource::collection($barangays));
    }
}
