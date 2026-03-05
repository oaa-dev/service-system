<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class ReviewData extends Data
{
    public function __construct(
        public int|Optional $rating = new Optional(),
        public string|null|Optional $title = new Optional(),
        public string|null|Optional $comment = new Optional(),
    ) {}
}
