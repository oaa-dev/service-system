<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ServiceCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'name',
        'slug',
        'description',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ServiceCategory $serviceCategory) {
            if (empty($serviceCategory->slug)) {
                $serviceCategory->slug = Str::slug($serviceCategory->name);
            }
        });

        static::updating(function (ServiceCategory $serviceCategory) {
            if ($serviceCategory->isDirty('name') && ! $serviceCategory->isDirty('slug')) {
                $serviceCategory->slug = Str::slug($serviceCategory->name);
            }
        });
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }
}
