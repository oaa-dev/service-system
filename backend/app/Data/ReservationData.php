<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class ReservationData extends Data
{
    public function __construct(
        public int|Optional $service_id = new Optional(),
        public string|Optional $check_in = new Optional(),
        public string|Optional $check_out = new Optional(),
        public int|Optional $guest_count = new Optional(),
        public string|null|Optional $notes = new Optional(),
        public string|null|Optional $special_requests = new Optional(),
    ) {}
}
