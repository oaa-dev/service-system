<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'customer_id',
        'rating',
        'title',
        'comment',
        'is_verified',
        'is_published',
        'merchant_reply',
        'merchant_replied_at',
        'admin_notes',
    ];

    protected $attributes = [
        'is_verified' => true,
        'is_published' => true,
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'is_published' => 'boolean',
            'merchant_replied_at' => 'datetime',
            'rating' => 'integer',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
