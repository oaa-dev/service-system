<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessTypeFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_type_id' => $this->business_type_id,
            'field_id' => $this->field_id,
            'is_required' => $this->is_required,
            'sort_order' => $this->sort_order,
            'field' => new FieldResource($this->whenLoaded('field')),
        ];
    }
}
