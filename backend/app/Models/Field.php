<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Field extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'name',
        'type',
        'config',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Field $field) {
            if (empty($field->name)) {
                $field->name = Str::slug($field->label, '_');
            }
        });

        static::updating(function (Field $field) {
            if ($field->isDirty('label') && ! $field->isDirty('name')) {
                $field->name = Str::slug($field->label, '_');
            }
        });
    }

    public function fieldValues(): HasMany
    {
        return $this->hasMany(FieldValue::class)->orderBy('sort_order');
    }
}
