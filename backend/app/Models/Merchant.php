<?php

namespace App\Models;

use App\Traits\HasAddress;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Merchant extends Model implements HasMedia
{
    use HasAddress;
    use HasFactory;
    use InteractsWithMedia;

    protected $attributes = [
        'type' => 'individual',
        'status' => 'pending',
    ];

    protected $fillable = [
        'user_id',
        'parent_id',
        'business_type_id',
        'type',
        'name',
        'slug',
        'description',
        'contact_email',
        'contact_phone',
        'website',
        'status',
        'status_changed_at',
        'status_reason',
        'approved_at',
        'accepted_terms_at',
        'terms_version',
    ];

    protected function casts(): array
    {
        return [
            'status_changed_at' => 'datetime',
            'approved_at' => 'datetime',
            'accepted_terms_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Merchant $merchant) {
            if (empty($merchant->slug)) {
                $merchant->slug = Str::slug($merchant->name);
            }
        });

        static::updating(function (Merchant $merchant) {
            if ($merchant->isDirty('name') && ! $merchant->isDirty('slug')) {
                $merchant->slug = Str::slug($merchant->name);
            }
        });
    }

    public const GALLERY_COLLECTIONS = [
        'photos' => 'gallery_photos',
        'interiors' => 'gallery_interiors',
        'exteriors' => 'gallery_exteriors',
        'feature' => 'gallery_feature',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $galleryMimes = ['image/jpeg', 'image/png', 'image/webp'];

        $this->addMediaCollection('gallery_photos')
            ->acceptsMimeTypes($galleryMimes);

        $this->addMediaCollection('gallery_interiors')
            ->acceptsMimeTypes($galleryMimes);

        $this->addMediaCollection('gallery_exteriors')
            ->acceptsMimeTypes($galleryMimes);

        $this->addMediaCollection('gallery_feature')
            ->singleFile()
            ->acceptsMimeTypes($galleryMimes);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(100)
            ->height(100)
            ->sharpen(10)
            ->performOnCollections('logo');

        $this->addMediaConversion('preview')
            ->width(400)
            ->height(400)
            ->sharpen(10)
            ->performOnCollections('logo');

        $galleryCollections = array_values(self::GALLERY_COLLECTIONS);

        $this->addMediaConversion('thumb')
            ->width(200)
            ->height(200)
            ->sharpen(10)
            ->performOnCollections(...$galleryCollections);

        $this->addMediaConversion('preview')
            ->width(800)
            ->height(600)
            ->sharpen(10)
            ->performOnCollections(...$galleryCollections);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Merchant::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Merchant::class, 'parent_id');
    }

    public function businessType(): BelongsTo
    {
        return $this->belongsTo(BusinessType::class);
    }

    public function businessHours(): HasMany
    {
        return $this->hasMany(MerchantBusinessHour::class)->orderBy('day_of_week');
    }

    public function paymentMethods(): BelongsToMany
    {
        return $this->belongsToMany(PaymentMethod::class, 'merchant_payment_method')->withTimestamps();
    }

    public function socialLinks(): HasMany
    {
        return $this->hasMany(MerchantSocialLink::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(MerchantDocument::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function serviceCategories(): HasMany
    {
        return $this->hasMany(ServiceCategory::class);
    }
}
