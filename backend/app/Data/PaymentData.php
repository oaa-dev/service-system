<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class PaymentData extends Data
{
    public function __construct(
        public string|Optional $payment_action = new Optional,
    ) {}
}
