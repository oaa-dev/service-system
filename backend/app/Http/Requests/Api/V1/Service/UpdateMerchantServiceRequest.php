<?php

namespace App\Http\Requests\Api\V1\Service;

use App\Models\BusinessTypeField;
use App\Models\Merchant;
use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMerchantServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $merchantId = $this->route('merchant');
        $serviceId = $this->route('service');
        $merchant = Merchant::find($merchantId);
        $service = Service::find($serviceId);

        $rules = [
            'name' => ['sometimes', 'string', 'max:255'],
            'service_category_id' => ['nullable', 'integer', 'exists:service_categories,id'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];

        // Use the existing service_type (not changeable on update)
        $serviceType = $service?->service_type;

        // Sellable fields
        if ($serviceType === 'sellable' && $merchant?->can_sell_products) {
            $rules['sku'] = ['nullable', 'string', 'max:100', Rule::unique('services')->where('merchant_id', $merchantId)->ignore($serviceId)];
            $rules['stock_quantity'] = ['nullable', 'integer', 'min:0'];
            $rules['track_stock'] = ['sometimes', 'boolean'];
        }

        // Bookable fields
        if ($serviceType === 'bookable' && $merchant?->can_take_bookings) {
            $rules['duration'] = ['nullable', 'integer', 'min:5', 'max:1440'];
            $rules['max_capacity'] = ['sometimes', 'integer', 'min:1'];
            $rules['requires_confirmation'] = ['sometimes', 'boolean'];
        }

        // Reservation fields
        if ($serviceType === 'reservation' && $merchant?->can_rent_units) {
            $rules['price_per_night'] = ['nullable', 'numeric', 'min:0'];
            $rules['floor'] = ['nullable', 'string', 'max:50'];
            $rules['unit_status'] = ['sometimes', 'in:available,occupied,maintenance'];
            $rules['amenities'] = ['nullable', 'array'];
            $rules['amenities.*'] = ['string', 'max:255'];
        }

        // Custom fields validation
        if ($merchant?->business_type_id) {
            $rules['custom_fields'] = ['sometimes', 'array'];

            $btFields = BusinessTypeField::where('business_type_id', $merchant->business_type_id)
                ->with('field')
                ->get();

            foreach ($btFields as $btField) {
                $key = "custom_fields.{$btField->id}";
                $fieldRules = ['nullable'];

                match ($btField->field->type) {
                    'input' => $fieldRules[] = 'string',
                    'select', 'radio' => $fieldRules[] = 'integer',
                    'checkbox' => $fieldRules[] = 'array',
                };

                if (in_array($btField->field->type, ['select', 'radio'])) {
                    $fieldRules[] = 'exists:field_values,id';
                }

                if ($btField->field->type === 'checkbox') {
                    $rules["{$key}.*"] = ['integer', 'exists:field_values,id'];
                }

                $rules[$key] = $fieldRules;
            }
        }

        return $rules;
    }
}
