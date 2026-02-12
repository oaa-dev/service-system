<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class CustomerData extends Data
{
    public function __construct(
        public string|Optional $user_name = new Optional(),
        public string|Optional $user_email = new Optional(),
        public string|Optional $user_password = new Optional(),
        public string|Optional $customer_type = new Optional(),
        public string|null|Optional $company_name = new Optional(),
        public string|null|Optional $customer_notes = new Optional(),
        public int|Optional $loyalty_points = new Optional(),
        public string|Optional $customer_tier = new Optional(),
        public string|null|Optional $preferred_payment_method = new Optional(),
        public string|Optional $communication_preference = new Optional(),
        public string|Optional $status = new Optional(),
    ) {}
}
