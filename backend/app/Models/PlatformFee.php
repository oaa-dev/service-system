<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PlatformFee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'transaction_type',
        'rate_percentage',
        'is_active',
        'sort_order',
    ];

    protected $attributes = [
        'is_active' => true,
        'sort_order' => 0,
        'rate_percentage' => 0,
    ];

    protected function casts(): array
    {
        return [
            'rate_percentage' => 'decimal:2',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (PlatformFee $platformFee) {
            if (empty($platformFee->slug)) {
                $platformFee->slug = Str::slug($platformFee->name);
            }
        });

        static::updating(function (PlatformFee $platformFee) {
            if ($platformFee->isDirty('name') && ! $platformFee->isDirty('slug')) {
                $platformFee->slug = Str::slug($platformFee->name);
            }
        });
    }
}
