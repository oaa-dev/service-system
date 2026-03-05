<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyProgramTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'loyalty_program_id',
        'required_stamps',
        'reward_type',
        'reward_value',
        'reward_product_id',
        'reward_description',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'required_stamps' => 'integer',
            'reward_value' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    public function loyaltyProgram(): BelongsTo
    {
        return $this->belongsTo(LoyaltyProgram::class);
    }

    public function rewardProduct(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'reward_product_id');
    }
}
