<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class BookingData extends Data
{
    public function __construct(
        public int|Optional $service_id = new Optional(),
        public string|Optional $booking_date = new Optional(),
        public string|Optional $start_time = new Optional(),
        public int|Optional $party_size = new Optional(),
        public string|null|Optional $notes = new Optional(),
    ) {}
}
