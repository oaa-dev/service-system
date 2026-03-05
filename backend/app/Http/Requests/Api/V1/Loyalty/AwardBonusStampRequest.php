<?php

namespace App\Http\Requests\Api\V1\Loyalty;

use Illuminate\Foundation\Http\FormRequest;

class AwardBonusStampRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
