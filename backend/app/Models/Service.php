<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Service extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;

    protected $fillable = [
        'merchant_id',
        'service_category_id',
        'name',
        'slug',
        'description',
        'price',
        'is_active',
        'service_type',
        // sellable fields
        'sku',
        'stock_quantity',
        'track_stock',
        // bookable fields
        'duration',
        'max_capacity',
        'requires_confirmation',
        // reservation fields
        'price_per_night',
        'floor',
        'unit_status',
        'amenities',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
            'track_stock' => 'boolean',
            'stock_quantity' => 'integer',
            'duration' => 'integer',
            'max_capacity' => 'integer',
            'requires_confirmation' => 'boolean',
            'price_per_night' => 'decimal:2',
            'amenities' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Service $service) {
            if (empty($service->slug)) {
                $service->slug = Str::slug($service->name);
            }
        });

        static::updating(function (Service $service) {
            if ($service->isDirty('name') && ! $service->isDirty('slug')) {
                $service->slug = Str::slug($service->name);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('image')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(200)
            ->height(200)
            ->sharpen(10)
            ->performOnCollections('image');

        $this->addMediaConversion('preview')
            ->width(600)
            ->height(400)
            ->sharpen(10)
            ->performOnCollections('image');
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(ServiceSchedule::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function serviceOrders(): HasMany
    {
        return $this->hasMany(ServiceOrder::class);
    }

    public function customFieldValues(): HasMany
    {
        return $this->hasMany(BusinessTypeFieldValue::class);
    }
}
