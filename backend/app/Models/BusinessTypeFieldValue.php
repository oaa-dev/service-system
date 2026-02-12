<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessTypeFieldValue extends Model
{
    protected $fillable = [
        'service_id',
        'business_type_field_id',
        'field_value_id',
        'value',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function businessTypeField(): BelongsTo
    {
        return $this->belongsTo(BusinessTypeField::class);
    }

    public function fieldValue(): BelongsTo
    {
        return $this->belongsTo(FieldValue::class);
    }
}
