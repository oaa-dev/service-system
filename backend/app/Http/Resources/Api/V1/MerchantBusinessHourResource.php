<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MerchantBusinessHourResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'day_of_week' => $this->day_of_week,
            'open_time' => $this->open_time ? \Carbon\Carbon::parse($this->open_time)->format('H:i') : null,
            'close_time' => $this->close_time ? \Carbon\Carbon::parse($this->close_time)->format('H:i') : null,
            'is_closed' => $this->is_closed,
        ];
    }
}
