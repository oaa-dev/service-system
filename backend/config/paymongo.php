<?php

return [
    'secret_key' => env('PAYMONGO_SECRET_KEY'),
    'public_key' => env('PAYMONGO_PUBLIC_KEY'),
    'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
    'mode' => env('PAYMONGO_MODE', 'test'),
    'success_url' => env('PAYMONGO_SUCCESS_URL', 'http://localhost:3001/payment/success'),
    'cancel_url' => env('PAYMONGO_CANCEL_URL', 'http://localhost:3001/payment/cancel'),
    'link_expiry_hours' => env('PAYMONGO_LINK_EXPIRY_HOURS', 24),
];
