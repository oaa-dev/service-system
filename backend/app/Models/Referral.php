<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Referral extends Model
{
    use HasFactory;

    protected $fillable = [
        'referral_code_id',
        'referral_program_id',
        'referrer_customer_id',
        'referee_customer_id',
        'status',
        'completed_at',
        'qualifying_type',
        'qualifying_id',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    public function referralCode(): BelongsTo
    {
        return $this->belongsTo(ReferralCode::class);
    }

    public function referralProgram(): BelongsTo
    {
        return $this->belongsTo(ReferralProgram::class);
    }

    public function referrerCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'referrer_customer_id');
    }

    public function refereeCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'referee_customer_id');
    }

    public function qualifyingTransaction(): MorphTo
    {
        return $this->morphTo('qualifying');
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(ReferralReward::class);
    }
}
