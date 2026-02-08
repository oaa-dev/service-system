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
];
