<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $attributes = [
        'customer_type' => 'individual',
        'customer_tier' => 'regular',
        'loyalty_points' => 0,
        'communication_preference' => 'both',
        'status' => 'active',
    ];

    protected $fillable = [
        'user_id',
        'customer_type',
        'company_name',
        'customer_notes',
        'loyalty_points',
        'customer_tier',
        'preferred_payment_method',
        'communication_preference',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'loyalty_points' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(CustomerTag::class, 'customer_customer_tag')
            ->withTimestamps();
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(CustomerInteraction::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CustomerDocument::class);
    }
}
