<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class UserData extends Data
{
    public function __construct(
        public string|Optional $name = new Optional(),
        public string|Optional $email = new Optional(),
        public string|Optional $password = new Optional(),
        public array|Optional $roles = new Optional(),
    ) {}
}
