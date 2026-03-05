<?php

namespace App\Repositories;

use App\Models\ReferralReward;
use App\Repositories\Contracts\ReferralRewardRepositoryInterface;

class ReferralRewardRepository extends BaseRepository implements ReferralRewardRepositoryInterface
{
    public function __construct(ReferralReward $model)
    {
        parent::__construct($model);
    }
}
