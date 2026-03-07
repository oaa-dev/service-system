<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'service_id',
        'booking_slot_id',
        'customer_id',
        'booking_date',
        'start_time',
        'end_time',
        'party_size',
        'service_price',
        'fee_rate',
        'fee_amount',
        'total_amount',
        'discount_amount',
        'coupon_id',
        'payment_status',
        'status',
        'notes',
        'confirmed_at',
        'cancelled_at',
    ];

    protected $attributes = [
        'party_size' => 1,
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'service_price' => 0,
        'fee_rate' => 0,
        'fee_amount' => 0,
        'total_amount' => 0,
        'discount_amount' => 0,
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'party_size' => 'integer',
            'service_price' => 'decimal:2',
            'fee_rate' => 'decimal:2',
            'fee_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function bookingSlot(): BelongsTo
    {
        return $this->belongsTo(MerchantBookingSlot::class, 'booking_slot_id');
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function payment(): MorphOne
    {
        return $this->morphOne(\App\Models\Payment::class, 'payable');
    }
}
