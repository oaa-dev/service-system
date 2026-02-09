<?php

namespace App\Http\Requests\Api\V1\SocialPlatform;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSocialPlatformRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('social_platforms', 'name')->ignore($this->route('socialPlatform')),
            ],
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('social_platforms', 'slug')->ignore($this->route('socialPlatform')),
            ],
            'base_url' => ['nullable', 'string', 'max:255', 'url'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
