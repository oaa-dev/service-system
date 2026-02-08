<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class AddressData extends Data
{
    public function __construct(
        public string|Optional|null $street = new Optional(),
        public string|Optional|null $city = new Optional(),
        public string|Optional|null $state = new Optional(),
        public string|Optional|null $postal_code = new Optional(),
        public string|Optional|null $country = new Optional(),
    ) {}
}
