<?php

namespace App\Http\Requests\Api\V1\Merchant;

use App\Rules\ImageRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadMerchantGalleryImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', ImageRule::merchantGallery()],
        ];
    }
}
