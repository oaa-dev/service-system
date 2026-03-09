<?php

namespace App\Http\Requests\Api\V1\Advertisement;

use App\Rules\ImageRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAdvertisementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:banner,featured_merchant,promotional_card,popup'],
            'placement' => ['required', 'string', 'in:homepage_hero,homepage_sidebar,merchant_listing,merchant_detail,dashboard_banner,storefront_banner'],
            'target_audience' => ['required', 'string', 'in:customer,merchant,all'],
            'link_url' => ['nullable', 'string', 'url', 'max:2048'],
            'link_text' => ['nullable', 'string', 'max:100'],
            'merchant_id' => ['nullable', 'integer', 'exists:merchants,id'],
            'is_active' => ['sometimes', 'boolean'],
            'starts_at' => ['required', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'image' => ['nullable', ImageRule::adImage()],
        ];
    }
}
