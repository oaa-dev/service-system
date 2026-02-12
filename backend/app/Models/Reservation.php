<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'service_id',
        'customer_id',
        'check_in',
        'check_out',
        'guest_count',
        'nights',
        'price_per_night',
        'total_price',
        'fee_rate',
        'fee_amount',
        'total_amount',
        'status',
        'notes',
        'special_requests',
        'confirmed_at',
        'cancelled_at',
        'checked_in_at',
        'checked_out_at',
    ];

    protected $attributes = [
        'guest_count' => 1,
        'status' => 'pending',
        'fee_rate' => 0,
        'fee_amount' => 0,
        'total_amount' => 0,
    ];

    protected function casts(): array
    {
        return [
            'check_in' => 'date',
            'check_out' => 'date',
            'guest_count' => 'integer',
            'nights' => 'integer',
            'price_per_night' => 'decimal:2',
            'total_price' => 'decimal:2',
            'fee_rate' => 'decimal:2',
            'fee_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
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
}
