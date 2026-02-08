<?php

namespace App\Data;

use Carbon\Carbon;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class ProfileData extends Data
{
    public function __construct(
        public string|Optional|null $bio = new Optional(),
        public string|Optional|null $phone = new Optional(),
        #[WithCast(DateTimeInterfaceCast::class, format: 'Y-m-d')]
        public Carbon|Optional|null $date_of_birth = new Optional(),
        public string|Optional|null $gender = new Optional(),
        public AddressData|Optional|null $address = new Optional(),
    ) {}
}
