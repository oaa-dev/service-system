<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class BusinessTypeData extends Data
{
    public function __construct(
        public string|Optional $name = new Optional(),
        public string|Optional $slug = new Optional(),
        public string|null|Optional $description = new Optional(),
        public bool|Optional $is_active = new Optional(),
        public int|Optional $sort_order = new Optional(),
    ) {}
}
