<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class BusinessType extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'sort_order',
        'can_sell_products',
        'can_take_bookings',
        'can_rent_units',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'can_sell_products' => 'boolean',
            'can_take_bookings' => 'boolean',
            'can_rent_units' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (BusinessType $businessType) {
            if (empty($businessType->slug)) {
                $businessType->slug = Str::slug($businessType->name);
            }
        });

        static::updating(function (BusinessType $businessType) {
            if ($businessType->isDirty('name') && ! $businessType->isDirty('slug')) {
                $businessType->slug = Str::slug($businessType->name);
            }
        });
    }

    public function businessTypeFields(): HasMany
    {
        return $this->hasMany(BusinessTypeField::class)->orderBy('sort_order');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('icon')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(64)
            ->height(64)
            ->sharpen(10)
            ->performOnCollections('icon');
    }
}
