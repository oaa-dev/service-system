<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Avatar Configuration
    |--------------------------------------------------------------------------
    */
    'avatar' => [
        'mimes' => ['jpeg', 'png', 'webp'],
        'max_size' => 5120, // KB (5MB)
        'min_width' => 100,
        'min_height' => 100,
        'max_width' => 4000,
        'max_height' => 4000,
        'recommendation' => 'Upload a square image (e.g., 400x400) in JPEG, PNG, or WebP format. Minimum 100x100 pixels, maximum 4000x4000 pixels. Max file size: 5MB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Configuration
    |--------------------------------------------------------------------------
    */
    'document' => [
        'mimes' => ['pdf', 'doc', 'docx'],
        'max_size' => 10240, // KB (10MB)
        'recommendation' => 'Upload documents in PDF, DOC, or DOCX format. Max file size: 10MB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Merchant Logo Configuration
    |--------------------------------------------------------------------------
    */
    'merchant_logo' => [
        'mimes' => ['jpeg', 'png', 'webp'],
        'max_size' => 5120, // KB (5MB)
        'min_width' => 100,
        'min_height' => 100,
        'max_width' => 4000,
        'max_height' => 4000,
        'recommendation' => 'Upload a square logo (e.g., 400x400) in JPEG, PNG, or WebP format. Minimum 100x100 pixels, maximum 4000x4000 pixels. Max file size: 5MB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Merchant Document Configuration
    |--------------------------------------------------------------------------
    */
    'merchant_document' => [
        'mimes' => ['pdf', 'doc', 'docx', 'jpeg', 'png'],
        'max_size' => 10240, // KB (10MB)
        'recommendation' => 'Upload documents in PDF, DOC, DOCX, JPEG, or PNG format. Max file size: 10MB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Merchant Gallery Configuration
    |--------------------------------------------------------------------------
    */
    'merchant_gallery' => [
        'mimes' => ['jpeg', 'png', 'webp'],
        'max_size' => 10240, // KB (10MB)
        'min_width' => 200,
        'min_height' => 200,
        'max_width' => 6000,
        'max_height' => 6000,
        'recommendation' => 'Upload images in JPEG, PNG, or WebP format. Minimum 200x200 pixels, maximum 6000x6000 pixels. Max file size: 10MB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Customer Document Configuration
    |--------------------------------------------------------------------------
    */
    'customer_document' => [
        'mimes' => ['pdf', 'doc', 'docx', 'jpeg', 'png'],
        'max_size' => 10240, // KB (10MB)
        'recommendation' => 'Upload documents in PDF, DOC, DOCX, JPEG, or PNG format. Max file size: 10MB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Service Image Configuration
    |--------------------------------------------------------------------------
    */
    'service_image' => [
        'mimes' => ['jpeg', 'png', 'webp'],
        'max_size' => 5120, // KB (5MB)
        'min_width' => 200,
        'min_height' => 200,
        'max_width' => 4000,
        'max_height' => 4000,
        'recommendation' => 'Upload a service image in JPEG, PNG, or WebP format. Minimum 200x200 pixels, maximum 4000x4000 pixels. Max file size: 5MB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Reference Data Icon Configuration
    |--------------------------------------------------------------------------
    */
    'reference_icon' => [
        'mimes' => ['jpeg', 'png', 'webp', 'svg'],
        'max_size' => 2048, // KB (2MB)
        'min_width' => 32,
        'min_height' => 32,
        'max_width' => 512,
        'max_height' => 512,
        'recommendation' => 'Upload a square icon (e.g., 64x64) in JPEG, PNG, WebP, or SVG format. Minimum 32x32 pixels, maximum 512x512 pixels. Max file size: 2MB.',
    ],
];
