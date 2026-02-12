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
        public string|Optional $service_type = new Optional(),
        // sellable fields
        public string|null|Optional $sku = new Optional(),
        public int|null|Optional $stock_quantity = new Optional(),
        public bool|Optional $track_stock = new Optional(),
        // bookable fields
        public int|null|Optional $duration = new Optional(),
        public int|Optional $max_capacity = new Optional(),
        public bool|Optional $requires_confirmation = new Optional(),
        // reservation fields
        public float|null|Optional $price_per_night = new Optional(),
        public string|null|Optional $floor = new Optional(),
        public string|Optional $unit_status = new Optional(),
        public array|null|Optional $amenities = new Optional(),
        // custom fields
        public array|null|Optional $custom_fields = new Optional(),
    ) {}
}
