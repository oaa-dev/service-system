<?php

namespace App\Repositories;

use App\Models\ReferralCode;
use App\Repositories\Contracts\ReferralCodeRepositoryInterface;

class ReferralCodeRepository extends BaseRepository implements ReferralCodeRepositoryInterface
{
    public function __construct(ReferralCode $model)
    {
        parent::__construct($model);
    }
}
