<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'otp' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'otp.size' => 'The verification code must be exactly 6 digits.',
            'otp.regex' => 'The verification code must contain only digits.',
        ];
    }
}
