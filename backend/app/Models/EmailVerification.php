<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailVerification extends Model
{
    protected $fillable = [
        'user_id',
        'otp_hash',
        'expires_at',
        'attempted_count',
        'locked_until',
        'last_resent_at',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'locked_until' => 'datetime',
            'last_resent_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }
}
