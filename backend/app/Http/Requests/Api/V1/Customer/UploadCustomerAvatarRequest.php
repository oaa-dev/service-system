<?php

namespace App\Http\Requests\Api\V1\Customer;

use App\Rules\ImageRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadCustomerAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'avatar' => ['required', ImageRule::avatar()],
        ];
    }
}
