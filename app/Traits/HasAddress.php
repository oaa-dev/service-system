<?php

namespace App\Traits;

use App\Models\Address;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait HasAddress
{
    public function address(): MorphOne
    {
        return $this->morphOne(Address::class, 'addressable');
    }

    public function updateOrCreateAddress(array $data): Address
    {
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
