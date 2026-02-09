<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class ConversationData extends Data
{
    public function __construct(
        public int|Optional $recipient_id = new Optional(),
        public string|Optional $message = new Optional(),
    ) {}
}
