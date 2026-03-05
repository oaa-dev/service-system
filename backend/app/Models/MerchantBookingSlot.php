<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MerchantBookingSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'day_of_week',
        'start_time',
        'end_time',
        'max_capacity',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'max_capacity' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'is_active' => true,
        'sort_order' => 0,
    ];

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'booking_slot_id');
    }
}
