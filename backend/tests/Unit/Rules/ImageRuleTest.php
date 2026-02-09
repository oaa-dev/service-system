<?php

use App\Rules\ImageRule;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;

describe('ImageRule', function () {
    describe('Validation', function () {
        it('fails for non-image file', function () {
            $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

            $validator = Validator::make(
                ['avatar' => $file],
                ['avatar' => [ImageRule::avatar()]]
            );

            expect($validator->fails())->toBeTrue();
            expect($validator->errors()->has('avatar'))->toBeTrue();
        });

        it('fails for non-file value', function () {
            $validator = Validator::make(
                ['avatar' => 'not-a-file'],
                ['avatar' => [ImageRule::avatar()]]
            );

            expect($validator->fails())->toBeTrue();
            expect($validator->errors()->first('avatar'))->toContain('file');
        });

        it('fails for null value', function () {
            $validator = Validator::make(
                ['avatar' => null],
                ['avatar' => [ImageRule::avatar()]]
            );

            expect($validator->fails())->toBeTrue();
        });

        it('fails for text file with image extension', function () {
            $file = UploadedFile::fake()->create('fake.jpg', 100, 'text/plain');

            $validator = Validator::make(
                ['avatar' => $file],
                ['avatar' => [ImageRule::avatar()]]
            );

            expect($validator->fails())->toBeTrue();
        });
    });

    describe('Static Factory Methods', function () {
        it('creates avatar rule instance', function () {
            $rule = ImageRule::avatar();

            expect($rule)->toBeInstanceOf(ImageRule::class);
        });

        it('creates document rule instance', function () {
            $rule = ImageRule::document();

            expect($rule)->toBeInstanceOf(ImageRule::class);
        });

        it('can be instantiated with custom type', function () {
            $rule = new ImageRule('avatar');

            expect($rule)->toBeInstanceOf(ImageRule::class);
        });
    });

    describe('Configuration', function () {
        it('uses avatar config for avatar rule', function () {
            $config = config('images.avatar');

            expect($config)->toHaveKey('mimes');
            expect($config)->toHaveKey('max_size');
            expect($config)->toHaveKey('min_width');
            expect($config)->toHaveKey('min_height');
            expect($config)->toHaveKey('max_width');
            expect($config)->toHaveKey('max_height');
            expect($config)->toHaveKey('recommendation');
        });

        it('uses document config for document rule', function () {
            $config = config('images.document');

            expect($config)->toHaveKey('mimes');
            expect($config)->toHaveKey('max_size');
            expect($config)->toHaveKey('recommendation');
        });

        it('avatar config has expected values', function () {
            $config = config('images.avatar');

            expect($config['mimes'])->toBe(['jpeg', 'png', 'webp']);
            expect($config['max_size'])->toBe(5120);
            expect($config['min_width'])->toBe(100);
            expect($config['min_height'])->toBe(100);
            expect($config['max_width'])->toBe(4000);
            expect($config['max_height'])->toBe(4000);
        });

        it('document config has expected values', function () {
            $config = config('images.document');

            expect($config['mimes'])->toBe(['pdf', 'doc', 'docx']);
            expect($config['max_size'])->toBe(10240);
        });
    });
});
