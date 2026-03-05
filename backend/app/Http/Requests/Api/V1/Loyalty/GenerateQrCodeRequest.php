<?php

namespace App\Http\Requests\Api\V1\Loyalty;

use Illuminate\Foundation\Http\FormRequest;

class GenerateQrCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mode' => ['required', 'in:single_use,daily'],
        ];
    }
}
