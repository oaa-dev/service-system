<?php

namespace App\Http\Requests\Api\V1\Service;

use App\Rules\ImageRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadServiceImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', ImageRule::serviceImage()],
        ];
    }
}
