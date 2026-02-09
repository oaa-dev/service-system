<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class City extends Model
{
    protected $fillable = [
        'province_id',
        'region_id',
        'code',
        'name',
        'old_name',
        'is_capital',
        'is_city',
        'is_municipality',
        'island_group_code',
        'psgc_10_digit_code',
    ];

    protected function casts(): array
    {
        return [
            'is_capital' => 'boolean',
            'is_city' => 'boolean',
            'is_municipality' => 'boolean',
        ];
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function barangays(): HasMany
    {
        return $this->hasMany(Barangay::class);
    }
}
