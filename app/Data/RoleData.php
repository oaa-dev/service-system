<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class RoleData extends Data
{
    public function __construct(
        public string|Optional $name = new Optional(),
        public array|Optional $permissions = new Optional(),
    ) {}
}
