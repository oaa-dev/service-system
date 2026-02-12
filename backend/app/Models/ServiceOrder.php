<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'service_id',
        'customer_id',
        'order_number',
        'quantity',
        'unit_label',
        'unit_price',
        'total_price',
        'fee_rate',
        'fee_amount',
        'total_amount',
        'status',
        'notes',
        'estimated_completion',
        'received_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $attributes = [
        'status' => 'pending',
        'fee_rate' => 0,
        'fee_amount' => 0,
        'total_amount' => 0,
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'fee_rate' => 'decimal:2',
            'fee_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'estimated_completion' => 'datetime',
            'received_at' => 'datetime',
            'completed_at' => 'datetime',
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
}
