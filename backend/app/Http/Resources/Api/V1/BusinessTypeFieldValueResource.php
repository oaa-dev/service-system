<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessTypeFieldValueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_id' => $this->service_id,
            'business_type_field_id' => $this->business_type_field_id,
            'field_value_id' => $this->field_value_id,
            'value' => $this->value,
            'field_value' => new FieldValueResource($this->whenLoaded('fieldValue')),
            'business_type_field' => new BusinessTypeFieldResource($this->whenLoaded('businessTypeField')),
        ];
    }
}
