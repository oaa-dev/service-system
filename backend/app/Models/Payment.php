<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payable_type',
        'payable_id',
        'payment_method',
        'amount',
        'currency',
        'status',
        'refund_status',
        'gateway',
        'gateway_payment_id',
        'gateway_reference',
        'checkout_url',
        'paid_at',
        'refunded_at',
        'expires_at',
        'metadata',
    ];

    protected $attributes = [
        'amount' => 0,
        'currency' => 'PHP',
        'status' => 'unpaid',
        'gateway' => 'paymongo',
        'refund_status' => 'none',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'refunded_at' => 'datetime',
            'expires_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
