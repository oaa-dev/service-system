<?php

namespace App\Http\Requests\Api\V1\Coupon;

use Illuminate\Foundation\Http\FormRequest;

class ValidateCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string'],
            'merchant_slug' => ['required', 'string'],
            'transaction_type' => ['required', 'in:booking,reservation,sell_product'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ];
    }
}
