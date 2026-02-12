<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class FieldData extends Data
{
    public function __construct(
        public string|Optional $label = new Optional(),
        public string|Optional $name = new Optional(),
        public string|Optional $type = new Optional(),
        public array|null|Optional $config = new Optional(),
        public bool|Optional $is_active = new Optional(),
        public int|Optional $sort_order = new Optional(),
        public array|Optional $values = new Optional(),
    ) {}
}
