<?php

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;

class SyncSocialLinksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'social_links' => ['required', 'array'],
            'social_links.*.social_platform_id' => ['required', 'integer', 'exists:social_platforms,id'],
            'social_links.*.url' => ['required', 'url', 'max:255'],
        ];
    }
}
