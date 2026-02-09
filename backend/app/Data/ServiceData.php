<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class ServiceData extends Data
{
    public function __construct(
        public int|null|Optional $service_category_id = new Optional(),
        public string|Optional $name = new Optional(),
        public string|Optional $slug = new Optional(),
        public string|null|Optional $description = new Optional(),
        public float|Optional $price = new Optional(),
        public bool|Optional $is_active = new Optional(),
    ) {}
}
