<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DocumentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_required',
        'level',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (DocumentType $documentType) {
            if (empty($documentType->slug)) {
                $documentType->slug = Str::slug($documentType->name);
            }
        });

        static::updating(function (DocumentType $documentType) {
            if ($documentType->isDirty('name') && ! $documentType->isDirty('slug')) {
                $documentType->slug = Str::slug($documentType->name);
            }
        });
    }
}
