<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class ImageRule implements ValidationRule
{
    protected array $config;

    protected array $errors = [];

    public function __construct(protected string $type = 'avatar')
    {
        $this->config = config("images.{$type}", []);
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('The :attribute must be a file.');

            return;
        }

        $this->validateIsImage($value, $fail);
        $this->validateMimeType($value, $fail);
        $this->validateFileSize($value, $fail);
        $this->validateDimensions($value, $fail);
    }

    protected function validateIsImage(UploadedFile $file, Closure $fail): void
    {
        if (! str_starts_with($file->getMimeType(), 'image/')) {
            $fail('The :attribute must be an image.');
        }
    }

    protected function validateMimeType(UploadedFile $file, Closure $fail): void
    {
        $mimes = $this->config['mimes'] ?? [];

        if (empty($mimes)) {
            return;
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();

        // Map extensions to mime types
        $mimeMap = [
            'jpeg' => ['image/jpeg'],
            'jpg' => ['image/jpeg'],
            'png' => ['image/png'],
            'webp' => ['image/webp'],
            'gif' => ['image/gif'],
        ];

        $allowedMimes = [];
        foreach ($mimes as $mime) {
            $allowedMimes = array_merge($allowedMimes, $mimeMap[$mime] ?? ["image/{$mime}"]);
        }

        if (! in_array($mimeType, $allowedMimes) && ! in_array($extension, $mimes)) {
            $fail('The :attribute must be a file of type: ' . implode(', ', $mimes) . '.');
        }
    }

    protected function validateFileSize(UploadedFile $file, Closure $fail): void
    {
        $maxSize = $this->config['max_size'] ?? null;

        if ($maxSize === null) {
            return;
        }

        $fileSizeKb = $file->getSize() / 1024;

        if ($fileSizeKb > $maxSize) {
            $maxSizeMb = $maxSize / 1024;
            $fail("The :attribute must not be greater than {$maxSizeMb}MB.");
        }
    }

    protected function validateDimensions(UploadedFile $file, Closure $fail): void
    {
        $dimensions = @getimagesize($file->getRealPath());

        if ($dimensions === false) {
            $fail('The :attribute must be a valid image.');

            return;
        }

        [$width, $height] = $dimensions;

        $minWidth = $this->config['min_width'] ?? null;
        $minHeight = $this->config['min_height'] ?? null;
        $maxWidth = $this->config['max_width'] ?? null;
        $maxHeight = $this->config['max_height'] ?? null;

        if ($minWidth !== null && $width < $minWidth) {
            $fail("The :attribute must be at least {$minWidth} pixels wide.");
        }

        if ($minHeight !== null && $height < $minHeight) {
            $fail("The :attribute must be at least {$minHeight} pixels tall.");
        }

        if ($maxWidth !== null && $width > $maxWidth) {
            $fail("The :attribute must not be greater than {$maxWidth} pixels wide.");
        }

        if ($maxHeight !== null && $height > $maxHeight) {
            $fail("The :attribute must not be greater than {$maxHeight} pixels tall.");
        }
    }

    public static function avatar(): self
    {
        return new self('avatar');
    }

    public static function document(): self
    {
        return new self('document');
    }

    public static function merchantLogo(): self
    {
        return new self('merchant_logo');
    }

    public static function merchantDocument(): self
    {
        return new self('merchant_document');
    }

    public static function merchantGallery(): self
    {
        return new self('merchant_gallery');
    }

    public static function serviceImage(): self
    {
        return new self('service_image');
    }

    public static function referenceIcon(): self
    {
        return new self('reference_icon');
    }
}
