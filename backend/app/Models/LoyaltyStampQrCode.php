<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyStampQrCode extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'merchant_id',
        'loyalty_program_id',
        'token',
        'mode',
        'expires_at',
        'is_used',
        'scanned_by',
        'scanned_at',
        'scan_count',
        'created_by',
    ];

    protected $attributes = [
        'is_used' => false,
        'scan_count' => 0,
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_used' => 'boolean',
            'scanned_at' => 'datetime',
            'scan_count' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function loyaltyProgram(): BelongsTo
    {
        return $this->belongsTo(LoyaltyProgram::class);
    }

    public function scannedByCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'scanned_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scans(): HasMany
    {
        return $this->hasMany(LoyaltyStampQrScan::class, 'qr_code_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
