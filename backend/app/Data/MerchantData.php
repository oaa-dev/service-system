<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class MerchantData extends Data
{
    public function __construct(
        public int|null|Optional $parent_id = new Optional(),
        public int|null|Optional $business_type_id = new Optional(),
        public string|Optional $type = new Optional(),
        public string|Optional $name = new Optional(),
        public string|Optional $slug = new Optional(),
        public string|null|Optional $description = new Optional(),
        public string|null|Optional $contact_email = new Optional(),
        public string|null|Optional $contact_phone = new Optional(),
        public AddressData|null|Optional $address = new Optional(),
        public bool|Optional $can_sell_products = new Optional(),
        public bool|Optional $can_take_bookings = new Optional(),
        public bool|Optional $can_rent_units = new Optional(),
        public bool|Optional $allow_branch_self_edit = new Optional(),
        public bool|Optional $allow_branch_coupon_management = new Optional(),
        public bool|Optional $inherit_from_parent = new Optional(),
        public bool|Optional $enable_loyalty_program = new Optional(),
        public bool|Optional $enable_referral_program = new Optional(),
    ) {}
}
