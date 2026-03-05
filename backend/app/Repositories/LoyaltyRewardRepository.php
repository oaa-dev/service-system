<?php

namespace App\Repositories;

use App\Models\LoyaltyReward;
use App\Repositories\Contracts\LoyaltyRewardRepositoryInterface;

class LoyaltyRewardRepository extends BaseRepository implements LoyaltyRewardRepositoryInterface
{
    public function __construct(LoyaltyReward $model)
    {
        parent::__construct($model);
    }
}
