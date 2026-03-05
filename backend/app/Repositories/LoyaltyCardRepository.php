<?php

namespace App\Repositories;

use App\Models\LoyaltyCard;
use App\Repositories\Contracts\LoyaltyCardRepositoryInterface;

class LoyaltyCardRepository extends BaseRepository implements LoyaltyCardRepositoryInterface
{
    public function __construct(LoyaltyCard $model)
    {
        parent::__construct($model);
    }
}
