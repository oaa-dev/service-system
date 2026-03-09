<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class AdvertisementData extends Data
{
    public function __construct(
        public string|Optional $title = new Optional,
        public string|null|Optional $description = new Optional,
        public string|Optional $type = new Optional,
        public string|Optional $placement = new Optional,
        public string|Optional $target_audience = new Optional,
        public string|null|Optional $link_url = new Optional,
        public string|null|Optional $link_text = new Optional,
        public bool|Optional $is_active = new Optional,
        public string|Optional $starts_at = new Optional,
        public string|null|Optional $expires_at = new Optional,
        public int|Optional $sort_order = new Optional,
        public int|null|Optional $merchant_id = new Optional,
    ) {}
}
