<?php

namespace App\Http\Requests\Api\V1\Field;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $fieldId = $this->route('field');

        $rules = [
            'label' => ['sometimes', 'string', 'max:255'],
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('fields', 'name')->ignore($fieldId)],
            'type' => ['sometimes', 'in:input,select,checkbox,radio'],
            'config' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];

        $type = $this->input('type', $this->route('field') ? \App\Models\Field::find($fieldId)?->type : null);

        if (in_array($type, ['select', 'checkbox', 'radio'])) {
            $rules['values'] = ['sometimes', 'array', 'min:1'];
            $rules['values.*.value'] = ['required', 'string', 'max:255'];
            $rules['values.*.sort_order'] = ['sometimes', 'integer', 'min:0'];
            $rules['config.default_value'] = $type === 'checkbox'
                ? ['sometimes', 'array']
                : ['sometimes', 'string', 'max:255'];
            if ($type === 'checkbox') {
                $rules['config.default_value.*'] = ['string', 'max:255'];
            }
        }

        if ($type === 'input') {
            $rules['config.is_number'] = ['sometimes', 'boolean'];
            $rules['config.placeholder'] = ['sometimes', 'string', 'max:255'];
            $rules['config.default_value'] = ['sometimes', 'string', 'max:1000'];
            $rules['config.min'] = ['sometimes', 'numeric'];
            $rules['config.max'] = ['sometimes', 'numeric'];
        }

        return $rules;
    }
}
