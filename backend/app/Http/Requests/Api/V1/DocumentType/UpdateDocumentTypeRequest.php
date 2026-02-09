<?php

namespace App\Http\Requests\Api\V1\DocumentType;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentTypeRequest extends FormRequest
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
                Rule::unique('document_types', 'name')->ignore($this->route('documentType')),
            ],
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('document_types', 'slug')->ignore($this->route('documentType')),
            ],
            'description' => ['nullable', 'string'],
            'is_required' => ['sometimes', 'boolean'],
            'level' => ['sometimes', 'string', 'in:organization,branch,both'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
