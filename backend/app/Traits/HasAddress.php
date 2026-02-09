<?php

namespace App\Traits;

use App\Models\Address;
use App\Models\City;
use App\Models\Province;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait HasAddress
{
    public function address(): MorphOne
    {
        return $this->morphOne(Address::class, 'addressable');
    }

    public function updateOrCreateAddress(array $data): Address
    {
        if (array_key_exists('region_id', $data) && $data['region_id']) {
            $data['country'] = 'Philippines';
        }

        if (array_key_exists('province_id', $data) && $data['province_id']) {
            $province = Province::find($data['province_id']);
            if ($province) {
                $data['state'] = $province->name;
            }
        }

        if (array_key_exists('city_id', $data) && $data['city_id']) {
            $city = City::find($data['city_id']);
            if ($city) {
                $data['city'] = $city->name;
            }
        }

        return $this->address()->updateOrCreate([], $data);
    }

    public function deleteAddress(): bool
    {
        return (bool) $this->address()?->delete();
    }

    public function hasAddress(): bool
    {
        return $this->address()->exists();
    }
}
