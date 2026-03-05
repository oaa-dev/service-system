<?php

namespace App\Http\Requests\Api\V1\Loyalty;

use Illuminate\Foundation\Http\FormRequest;

class ScanQrCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'size:64'],
        ];
    }
}
