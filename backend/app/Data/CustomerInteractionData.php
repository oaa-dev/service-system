<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class CustomerInteractionData extends Data
{
    public function __construct(
        public string|Optional $type = new Optional(),
        public string|Optional $description = new Optional(),
    ) {}
}
