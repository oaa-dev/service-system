<?php

namespace App\Http\Requests\Api\V1\BusinessType;

use Illuminate\Foundation\Http\FormRequest;

class SyncBusinessTypeFieldsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fields' => ['required', 'array'],
            'fields.*.field_id' => ['required', 'integer', 'exists:fields,id'],
            'fields.*.is_required' => ['sometimes', 'boolean'],
            'fields.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
