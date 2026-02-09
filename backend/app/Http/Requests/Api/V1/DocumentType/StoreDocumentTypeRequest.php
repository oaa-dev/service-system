<?php

namespace App\Http\Requests\Api\V1\DocumentType;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:document_types,name'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:document_types,slug'],
            'description' => ['nullable', 'string'],
            'is_required' => ['sometimes', 'boolean'],
            'level' => ['sometimes', 'string', 'in:organization,branch,both'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
