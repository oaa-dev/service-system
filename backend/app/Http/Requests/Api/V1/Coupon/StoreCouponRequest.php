<?php

namespace App\Http\Requests\Api\V1\Coupon;

use Illuminate\Foundation\Http\FormRequest;

class StoreCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['nullable', 'string', 'max:20', 'alpha_num', 'unique:coupons,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'discount_type' => ['required', 'in:percentage,fixed,free_product'],
            'discount_value' => ['required_unless:discount_type,free_product', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'max_uses_per_customer' => ['nullable', 'integer', 'min:1'],
            'reset_period' => ['nullable', 'in:daily,weekly,monthly,yearly'],
            'applicable_to' => ['nullable', 'array'],
            'applicable_to.*' => ['in:booking,reservation,sell_product'],
            'starts_at' => ['required', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
            'is_public' => ['sometimes', 'boolean'],
            'is_claimable' => ['sometimes', 'boolean'],
            'claim_validity_hours' => ['nullable', 'integer', 'min:1'],
            'valid_schedule' => ['nullable', 'array'],
            'valid_schedule.days' => ['required_with:valid_schedule', 'array', 'min:1'],
            'valid_schedule.days.*' => ['integer', 'min:0', 'max:6'],
            'valid_schedule.start_time' => ['nullable', 'date_format:H:i'],
            'valid_schedule.end_time' => ['nullable', 'date_format:H:i', 'after:valid_schedule.start_time'],
            'target_merchant_id' => ['nullable', 'integer', 'exists:merchants,id'],
        ];
    }
}
