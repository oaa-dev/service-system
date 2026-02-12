<?php

namespace App\Http\Requests\Api\V1\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UploadCustomerDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $config = config('images.customer_document', []);
        $mimes = implode(',', $config['mimes'] ?? ['pdf', 'doc', 'docx', 'jpeg', 'png']);
        $maxSize = $config['max_size'] ?? 10240;

        return [
            'document_type_id' => ['required', 'integer', 'exists:document_types,id'],
            'document' => ['required', 'file', "mimes:{$mimes}", "max:{$maxSize}"],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
